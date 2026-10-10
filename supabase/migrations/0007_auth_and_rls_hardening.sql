-- 0007 — Auth and RLS hardening. Safe to apply before or after the app deploy.
--
-- Fixes:
--   * Any account created through public sign-up became an ACTIVE staff
--     profile, and took its role from user_metadata (which the person signing
--     up controls), so `signUp({ data: { role: 'admin' } })` produced an admin.
--     New profiles are now inactive editors unless the server (service role)
--     sets app_metadata.staff / app_metadata.role, which users cannot edit.
--   * Any signed-in account could read every staff profile.
--   * is_staff() / is_admin() / handle_new_user() were SECURITY DEFINER
--     functions callable through the public REST API (/rest/v1/rpc/...).
--   * touch_updated_at() had a mutable search_path.
--   * Anyone could list every file in the media bucket; SVG uploads allowed.
--   * The media table (uploader ids, filenames) was publicly readable but the
--     site never reads it.
--
-- Note: until the matching app change ships, accounts created from the admin
-- panel start suspended. Activate them in Control Tower → Users.

-- 1. Role helpers move to a schema the Data API does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$fn$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $fn$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and role = 'admin'
  );
$fn$;

revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.is_staff() to anon, authenticated, service_role;
grant execute on function private.is_admin() to anon, authenticated, service_role;

-- 2. New accounts are never staff unless the server says so.
alter table public.profiles alter column is_active set default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  insert into public.profiles (id, name, email, role, is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'editor' end,
    coalesce(new.raw_app_meta_data ->> 'staff' = 'true', false)
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin, service_role;

-- 3. Pin search_path on the updated_at trigger.
alter function public.touch_updated_at() set search_path = '';

-- 4. Rebuild content policies. Public reads go to `anon` only; signed-in
--    accounts see content only through the staff policy, so a non-staff
--    account sees nothing at all.
do $do$
declare t text;
begin
  foreach t in array array[
    'announcements', 'events', 'achievements', 'projects', 'project_parts',
    'cohorts', 'cohort_members', 'sections', 'media', 'contact_messages'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_staff_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated '
      'using ((select private.is_staff())) with check ((select private.is_staff()))',
      t || '_staff_all', t
    );
  end loop;

  foreach t in array array['announcements', 'events', 'achievements', 'projects'] loop
    execute format('create policy %I on public.%I for select to anon using (published)', t || '_read', t);
  end loop;

  foreach t in array array['cohorts', 'cohort_members', 'sections'] loop
    execute format('create policy %I on public.%I for select to anon using (true)', t || '_read', t);
  end loop;
end
$do$;

create policy project_parts_read on public.project_parts
  for select to anon
  using (exists (
    select 1 from public.projects p
    where p.id = project_parts.project_id and p.published
  ));

drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_staff()));
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- 5. Storage: public URLs keep working (public bucket); listing is staff-only.
drop policy if exists media_objects_read on storage.objects;
drop policy if exists media_objects_write on storage.objects;
drop policy if exists media_objects_update on storage.objects;
drop policy if exists media_objects_delete on storage.objects;

create policy media_objects_read on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and (select private.is_staff()));
create policy media_objects_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (select private.is_staff()));
create policy media_objects_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (select private.is_staff()))
  with check (bucket_id = 'media' and (select private.is_staff()));
create policy media_objects_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (select private.is_staff()));

update storage.buckets
   set allowed_mime_types = array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif']
 where id = 'media';

-- 6. Nothing references the old public helpers any more.
drop function if exists public.is_staff();
drop function if exists public.is_admin();

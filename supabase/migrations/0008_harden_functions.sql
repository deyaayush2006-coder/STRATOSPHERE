-- Clears the Supabase security advisor warnings on functions.
--
--   1. touch_updated_at had a mutable search_path.
--   2. handle_new_user() (SECURITY DEFINER) was callable at /rest/v1/rpc.
--   3. is_staff() / is_admin() (SECURITY DEFINER) were callable at /rest/v1/rpc.
--
-- Apply after the PR that adds this file is merged. No app code calls these
-- functions directly; only RLS policies and the auth trigger use them.

-- 1 ------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $fn$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$fn$;

-- 2 ------------------------------------------------------------------------
-- Triggers fire whatever the EXECUTE grants say, so new sign-ups still get
-- a profile. Everything inside is already schema-qualified.

alter function public.handle_new_user() set search_path = '';

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 3 ------------------------------------------------------------------------
-- Revoking EXECUTE from anon would break every public page, because read
-- policies such as (published or is_staff()) run is_staff() as anon. Instead
-- the helpers move to a schema the Data API does not expose. Keep "private"
-- out of Project Settings → API → Exposed schemas.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

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

revoke execute on function private.is_staff(), private.is_admin() from public;
grant execute on function private.is_staff(), private.is_admin() to anon, authenticated;

-- Every policy that called the public helpers, taken from pg_policies.
-- ALTER POLICY swaps each expression in place, so no table is ever left
-- without its policy part-way through.

alter policy profiles_admin_all on public.profiles
  using (private.is_admin()) with check (private.is_admin());

alter policy media_staff_all on public.media
  using (private.is_staff()) with check (private.is_staff());

alter policy sections_staff_all on public.sections
  using (private.is_staff()) with check (private.is_staff());

alter policy announcements_read on public.announcements
  using (published or private.is_staff());
alter policy announcements_staff_all on public.announcements
  using (private.is_staff()) with check (private.is_staff());

alter policy events_read on public.events
  using (published or private.is_staff());
alter policy events_staff_all on public.events
  using (private.is_staff()) with check (private.is_staff());

alter policy achievements_read on public.achievements
  using (published or private.is_staff());
alter policy achievements_staff_all on public.achievements
  using (private.is_staff()) with check (private.is_staff());

alter policy projects_read on public.projects
  using (published or private.is_staff());
alter policy projects_staff_all on public.projects
  using (private.is_staff()) with check (private.is_staff());

alter policy project_parts_read on public.project_parts
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and (p.published or private.is_staff())
    )
  );
alter policy project_parts_staff_all on public.project_parts
  using (private.is_staff()) with check (private.is_staff());

alter policy cohorts_staff_all on public.cohorts
  using (private.is_staff()) with check (private.is_staff());

alter policy cohort_members_staff_all on public.cohort_members
  using (private.is_staff()) with check (private.is_staff());

alter policy contact_messages_staff_all on public.contact_messages
  using (private.is_staff()) with check (private.is_staff());

alter policy media_objects_write on storage.objects
  with check (bucket_id = 'media' and private.is_staff());

alter policy media_objects_update on storage.objects
  using (bucket_id = 'media' and private.is_staff());

alter policy media_objects_delete on storage.objects
  using (bucket_id = 'media' and private.is_staff());

-- No CASCADE on purpose: if any policy still points at the old helpers,
-- this fails and nothing above is kept.

drop function public.is_staff();
drop function public.is_admin();

-- handle_new_user() used to take the role from raw_user_meta_data, which the
-- person signing up controls: signUp({ options: { data: { role: "admin" } } })
-- with the public anon key produced an active admin profile whenever public
-- sign-ups were switched on in Supabase Auth.
--
-- Now the role comes from raw_app_meta_data, which only the service role can
-- set (the dashboard's createUser and npm run seed), and an account without
-- it gets an inactive editor profile: no staff access until an admin
-- activates it from the Accounts tab.
--
-- Apply after the code that sets app_metadata is deployed. That code also
-- writes role and is_active on the profile itself, so account creation works
-- both before and after this file is applied.

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
    coalesce(new.raw_user_meta_data ->> 'name', pg_catalog.split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin' else 'editor' end,
    coalesce(new.raw_app_meta_data ? 'role', false)
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

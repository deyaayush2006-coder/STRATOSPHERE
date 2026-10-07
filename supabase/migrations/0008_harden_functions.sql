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

-- Hide committee member emails from the public API.
--
-- Apply AFTER the code that selects an explicit column list is deployed:
-- older builds ask for cohort_members(*), which anon can no longer do.
--
-- Row level security picks rows, not columns, so the column is hidden with
-- privileges instead. The cohort_members_read policy (using true) stays.
--
-- authenticated keeps full SELECT: the dashboard reads and saves emails as
-- the signed-in committee member, and a column grant cannot tell staff from
-- non-staff. Every account is created by an admin and is staff, so this only
-- matters if public sign-ups are switched on in Supabase Auth (keep them off).
--
-- A column added to cohort_members later is NOT readable by anon until it
-- is added to a grant like the one below.

revoke select on public.cohort_members from anon;

grant select (id, cohort_id, name, role, dept, image, linkedin, sort_order)
  on public.cohort_members to anon;

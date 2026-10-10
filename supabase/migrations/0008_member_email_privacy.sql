-- 0008 — Hide member emails from the public API.
--
-- APPLY ONLY AFTER the app version that selects explicit cohort_members
-- columns is live. The old code selects cohort_members(*), which fails once
-- anon loses the email column, and the whole site falls back to defaults.
--
-- anon can still read every other column; staff read email through the
-- authenticated role and the staff policy.

revoke select on public.cohort_members from anon;
grant select (id, cohort_id, name, role, dept, image, linkedin, sort_order)
  on public.cohort_members to anon;

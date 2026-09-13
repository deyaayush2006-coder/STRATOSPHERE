-- Achievements: keep the record, show only the recent ones.
--
-- The same change 0002 made to announcements, applied to the results list, so
-- the two sections behave identically: everything stays on record with its
-- date, the committee sets how many reach the home page, and the rest fold
-- into an archive underneath rather than off the site.
--
-- Apply this to a project that already has 0001_init.sql. A fresh project does
-- not need it — 0001 now creates the column itself — and applying it there
-- anyway is harmless: every statement below is idempotent, and the backfill
-- only ever touches rows that have no date yet.

-- Nullable first, so the backfill has something to look for. The default and
-- the not-null constraint go on afterwards, once no row is missing one.
alter table public.achievements
  add column if not exists posted_at timestamptz;

/* created_at is when the row was first written, which is the closest thing to
   a record of when it happened. Every seeded row shares one created_at, so
   sort_order breaks the tie — index 0 is the most recent, which is the order
   the dashboard already lists them in. Anyone wanting the real dates can set
   them in the panel afterwards; the field is right there on each entry. */
update public.achievements
   set posted_at = coalesce(created_at, now()) - (sort_order * interval '1 second')
 where posted_at is null;

alter table public.achievements alter column posted_at set default now();
alter table public.achievements alter column posted_at set not null;

create index if not exists achievements_posted_idx
  on public.achievements (posted_at desc);

-- The display setting. Inserted only when missing, so re-running this never
-- overwrites a number the committee has since changed.
insert into public.sections (key, value)
values (
  'achievementSettings',
  '{"visibleCount": 4, "showArchive": true, "archiveLabel": "Earlier achievements"}'::jsonb
)
on conflict (key) do nothing;

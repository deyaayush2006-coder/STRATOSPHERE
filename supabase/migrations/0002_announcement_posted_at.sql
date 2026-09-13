-- Announcements: keep the archive, show only the recent ones.
--
-- Apply this to a project that already has 0001_init.sql. A fresh project does
-- not need it — 0001 now creates the column itself — and applying it there
-- anyway is harmless: every statement below is idempotent, and the backfill
-- only ever touches rows that have no timestamp yet.
--
-- Two things arrive together:
--
--   announcements.posted_at   the moment an announcement went up, to the
--                             minute. date_label stays what it was: free text
--                             the committee writes, often "Dates TBD" rather
--                             than a date at all. posted_at is the one that
--                             sorts, and it is what keeps an old announcement
--                             findable after it has left the front page.
--
--   sections.announcementSettings
--                             how many of the newest announcements the home
--                             page shows. Nothing is deleted when that number
--                             goes down; the rest fold into the archive.

-- Nullable first, so the backfill has something to look for. The default and
-- the not-null constraint go on afterwards, once no row is missing one.
alter table public.announcements
  add column if not exists posted_at timestamptz;

/* created_at is when the row was first written, which is the closest thing to
   a record of when it went up. Every seeded row shares one created_at, so
   sort_order breaks the tie — index 0 is the newest, which is the order the
   dashboard already lists them in. */
update public.announcements
   set posted_at = coalesce(created_at, now()) - (sort_order * interval '1 second')
 where posted_at is null;

alter table public.announcements alter column posted_at set default now();
alter table public.announcements alter column posted_at set not null;

create index if not exists announcements_posted_idx
  on public.announcements (posted_at desc);

-- The display setting. Inserted only when missing, so re-running this never
-- overwrites a number the committee has since changed.
insert into public.sections (key, value)
values (
  'announcementSettings',
  '{"visibleCount": 3, "showArchive": true, "archiveLabel": "Earlier announcements"}'::jsonb
)
on conflict (key) do nothing;

-- Events: a page of their own, the way projects already have one.
--
-- Run after 0004. Every ADD COLUMN carries a default and is IF NOT EXISTS, so
-- re-running it is safe and no existing row changes meaning: an event written
-- before this migration comes back with no write-up, no photos and no
-- registration link, and every one of those sections hides itself on the page.
-- What that event does get is a slug, backfilled below, because a page nobody
-- can address is not a page.
--
-- Nothing here needs a policy of its own. These are columns on `events`, which
-- already has row level security and the staff-write / public-read-published
-- policies from 0001 — a policy is per table, not per column.

alter table public.events
  add column if not exists slug         text  not null default '',
  add column if not exists register_url text  not null default '',
  add column if not exists detail       jsonb not null default '[]'::jsonb,
  add column if not exists gallery      jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------- slug
--
-- Backfilled from the title with the same rule lib/slug.js uses, so a row that
-- has been rendering through the app's fallback keeps the URL it already had
-- rather than moving the first time somebody presses Save.
--
-- The row_number is what makes the unique index below safe to create. Two
-- events genuinely can share a title — a competition that runs every year is
-- the normal case, not the odd one — and the second of them becomes
-- <slug>-2 rather than failing the migration. Ordering by sort_order first
-- means the one the committee put at the top of the list keeps the clean slug.
--
-- coalesce(nullif(...)) catches a title that slugifies to nothing at all:
-- punctuation only, or a script the regex strips whole. Rare, but it would
-- otherwise leave an empty slug behind and collide on the index.

with slugged as (
  select
    id,
    left(
      trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')),
      60
    ) as base,
    row_number() over (
      partition by left(
        trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')),
        60
      )
      order by sort_order, created_at, id
    ) as n
  from public.events
  where slug = ''
)
update public.events e
   set slug = case
                when s.n = 1 then coalesce(nullif(s.base, ''), 'event')
                else coalesce(nullif(s.base, ''), 'event') || '-' || s.n
              end
  from slugged s
 where e.id = s.id;

create unique index if not exists events_slug_idx on public.events (slug);

-- -------------------------------------------------------------------- detail
--
-- [{ heading, body, figures: [[label, value], ...] }] — the same shape as a
-- project's `thesis`, and rendered by the same component. Kept apart from
-- `body`, which stays what it has always been: the one paragraph the card on
-- the home page shows. Blank lines inside `body` here become paragraphs.

-- ------------------------------------------------------------------- gallery
--
-- [{ src, caption }] — the same shape as a project's `cad`, so event photos go
-- through the existing media picker and open in the existing lightbox.

-- -------------------------------------------------------- registration link
--
-- Shown as the call to action on an upcoming event and ignored on a past one,
-- so a form that has closed stops being offered without anybody having to
-- remember to clear the field.

-- Projects: interactive models, CAD drawings, the long write-up, flight data.
--
-- Run after 0003. Every statement is IF NOT EXISTS or a default-carrying ADD
-- COLUMN, so re-running it is safe and no existing row changes meaning: a
-- project written before this migration comes back with an empty model path,
-- no drawings and no telemetry, and every one of those sections hides itself
-- on the page.
--
-- Nothing here needs a policy of its own. These are columns on `projects` and
-- `project_parts`, both of which already have row level security and the
-- staff-write / public-read-published policies from 0001 — a policy is per
-- table, not per column, so the new fields inherit them.

-- -------------------------------------------------------------------- models
--
-- A path to a .glb or .gltf, not an upload. The media library and its picker
-- are built around images — they read dimensions, show thumbnails and filter
-- on image content types — and a binary CAD export fits none of that. The path
-- convention is the same one the showcase clips already use for video: put the
-- file in public/models/ and reference it, or paste a full URL.

alter table public.projects
  add column if not exists model         text not null default '',
  add column if not exists model_caption text not null default '';

alter table public.project_parts
  add column if not exists model         text not null default '',
  add column if not exists model_caption text not null default '';

-- ----------------------------------------------------------------------- CAD
--
-- [{ src, caption }] — src is a media path like every other image on the site,
-- so these do go through the picker and the library.

alter table public.projects
  add column if not exists cad jsonb not null default '[]'::jsonb;

alter table public.project_parts
  add column if not exists cad jsonb not null default '[]'::jsonb;

-- -------------------------------------------------------------------- thesis
--
-- [{ heading, body, figures: [[label, value], ...] }] — the report-length
-- write-up, kept apart from `body` (which is the one-paragraph overview shown
-- when a project has no parts) and from a part's `detail` (a few paragraphs on
-- one component). Blank lines inside `body` become paragraphs on the page.

alter table public.projects
  add column if not exists thesis jsonb not null default '[]'::jsonb;

-- ----------------------------------------------------------------- telemetry
--
-- The raw log, as pasted. Kept as text rather than parsed into rows of its own
-- on purpose: this is the committee's own export, it is rewritten wholesale
-- when a flight is re-flown, and nothing ever queries inside it — the page
-- parses, thins and summarises it at render time. A table would buy indexing
-- nobody needs and cost a schema that has to match every sensor board the club
-- ever builds.
--
--   telemetry_x       which column is the x axis; empty guesses at a time column
--   telemetry_charts  [{ field, label, unit }] — which columns to plot and what
--                     to call them; empty plots every numeric column

alter table public.projects
  add column if not exists telemetry_csv    text  not null default '',
  add column if not exists telemetry_x      text  not null default '',
  add column if not exists telemetry_title  text  not null default '',
  add column if not exists telemetry_blurb  text  not null default '',
  add column if not exists telemetry_charts jsonb not null default '[]'::jsonb;

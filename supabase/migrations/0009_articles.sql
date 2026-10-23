-- 0009 — Learn: long-form articles behind the club's Instagram posts.
--
-- Additive only: a new table, nothing existing changes, so it is safe to apply
-- before or after the app version that reads it. The app treats a missing
-- table as "no articles yet" rather than failing the whole site.
--
-- One row per article. An article may belong to a series ("RC plane basics");
-- its part number is its position among the series' published articles in
-- sort_order. Write-up sections, infographic slides and further-reading links
-- are JSON arrays, like the event and project write-ups.

create table if not exists public.articles (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null,
  title           text not null,
  series          text not null default '',
  summary         text not null default '',
  cover           text not null default '',
  author          text not null default '',
  level           text not null default '',
  instagram_url   text not null default '',
  posted_at       timestamptz not null default now(),
  sections        jsonb not null default '[]'::jsonb,
  slides          jsonb not null default '[]'::jsonb,
  further_reading jsonb not null default '[]'::jsonb,
  published       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 60),
  constraint articles_title_present check (length(btrim(title)) > 0),
  constraint articles_sections_array check (jsonb_typeof(sections) = 'array'),
  constraint articles_slides_array check (jsonb_typeof(slides) = 'array'),
  constraint articles_reading_array check (jsonb_typeof(further_reading) = 'array'),
  constraint articles_instagram_https check (instagram_url = '' or instagram_url ~ '^https://')
);

create unique index if not exists articles_slug_idx  on public.articles (slug);
create index if not exists articles_order_idx        on public.articles (sort_order);
create index if not exists articles_posted_idx       on public.articles (posted_at desc);

drop trigger if exists touch_articles on public.articles;
create trigger touch_articles before update on public.articles
  for each row execute function public.touch_updated_at();

-- Same rules as events and projects: the public (anon) reads published rows
-- only; staff do everything; a signed-in account that is not staff sees
-- nothing.
alter table public.articles enable row level security;

drop policy if exists articles_read on public.articles;
drop policy if exists articles_staff_all on public.articles;
create policy articles_read on public.articles
  for select to anon
  using (published);
create policy articles_staff_all on public.articles
  for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

-- Table rights spelled out rather than left to default privileges. RLS still
-- decides which rows; TRUNCATE is not covered by RLS, so the API roles never
-- get it.
revoke all on public.articles from anon, authenticated;
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
grant all on public.articles to service_role;

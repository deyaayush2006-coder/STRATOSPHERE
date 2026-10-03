alter table public.events
  add column if not exists slug         text  not null default '',
  add column if not exists register_url text  not null default '',
  add column if not exists detail       jsonb not null default '[]'::jsonb,
  add column if not exists gallery      jsonb not null default '[]'::jsonb;

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

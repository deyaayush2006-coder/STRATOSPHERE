alter table public.achievements
  add column if not exists posted_at timestamptz;

update public.achievements
   set posted_at = coalesce(created_at, now()) - (sort_order * interval '1 second')
 where posted_at is null;

alter table public.achievements alter column posted_at set default now();
alter table public.achievements alter column posted_at set not null;

create index if not exists achievements_posted_idx
  on public.achievements (posted_at desc);

insert into public.sections (key, value)
values (
  'achievementSettings',
  '{"visibleCount": 4, "showArchive": true, "archiveLabel": "Earlier achievements"}'::jsonb
)
on conflict (key) do nothing;

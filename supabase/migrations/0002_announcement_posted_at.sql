alter table public.announcements
  add column if not exists posted_at timestamptz;

update public.announcements
   set posted_at = coalesce(created_at, now()) - (sort_order * interval '1 second')
 where posted_at is null;

alter table public.announcements alter column posted_at set default now();
alter table public.announcements alter column posted_at set not null;

create index if not exists announcements_posted_idx
  on public.announcements (posted_at desc);

insert into public.sections (key, value)
values (
  'announcementSettings',
  '{"visibleCount": 3, "showArchive": true, "archiveLabel": "Earlier announcements"}'::jsonb
)
on conflict (key) do nothing;

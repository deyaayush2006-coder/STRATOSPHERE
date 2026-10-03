create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  role        text not null default 'editor' check (role in ('editor', 'admin')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'editor')
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
  );
$fn$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and role = 'admin'
  );
$fn$;

create table if not exists public.media (
  id           uuid primary key default gen_random_uuid(),
  path         text not null unique,
  filename     text not null,
  content_type text not null default 'image/webp',
  size         integer not null default 0,
  width        integer,
  height       integer,
  alt          text not null default '',
  uploaded_by  uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.sections (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  body         text not null default '',
  tag          text not null default 'Update',
  date_label   text not null default '',
  published_on date,
  posted_at    timestamptz not null default now(),
  pinned       boolean not null default false,
  published    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  when_status text not null default 'upcoming' check (when_status in ('upcoming', 'past')),
  date_label  text not null default 'TBD',
  time_label  text not null default 'TBD',
  starts_at   timestamptz,
  location    text not null default '',
  body        text not null default '',
  image       text not null default '',
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.achievements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  year_label text not null default '',
  posted_at  timestamptz not null default now(),
  tag        text not null default '',
  body       text not null default '',
  published  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  n          text not null default '',
  title      text not null,
  status     text not null default 'Ongoing',
  timeline   text not null default '',
  summary    text not null default '',
  body       text not null default '',
  image      text not null default '',
  published  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_parts (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  slug       text not null,
  name       text not null,
  blurb      text not null default '',
  image      text not null default '',
  detail     jsonb not null default '[]'::jsonb,
  specs      jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  unique (project_id, slug)
);

create table if not exists public.cohorts (
  id         uuid primary key default gen_random_uuid(),
  year       text not null unique,
  tag        text not null default '',
  blurb      text not null default '',
  is_current boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.cohort_members (
  id         uuid primary key default gen_random_uuid(),
  cohort_id  uuid not null references public.cohorts (id) on delete cascade,
  name       text not null,
  role       text not null default '',
  dept       text not null default '',
  image      text not null default '',
  linkedin   text not null default '',
  email      text not null default '',
  sort_order integer not null default 0
);

create index if not exists announcements_order_idx  on public.announcements (sort_order);
create index if not exists announcements_posted_idx on public.announcements (posted_at desc);
create index if not exists events_order_idx         on public.events (sort_order);
create index if not exists achievements_order_idx   on public.achievements (sort_order);
create index if not exists achievements_posted_idx  on public.achievements (posted_at desc);
create index if not exists projects_order_idx       on public.projects (sort_order);
create index if not exists project_parts_owner_idx  on public.project_parts (project_id, sort_order);
create index if not exists cohorts_order_idx        on public.cohorts (sort_order);
create index if not exists cohort_members_owner_idx on public.cohort_members (cohort_id, sort_order);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

do $do$
declare t text;
begin
  foreach t in array array['announcements', 'events', 'achievements', 'projects'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$s
       for each row execute function public.touch_updated_at()', t);
  end loop;
end;
$do$;

alter table public.profiles       enable row level security;
alter table public.media          enable row level security;
alter table public.sections       enable row level security;
alter table public.announcements  enable row level security;
alter table public.events         enable row level security;
alter table public.achievements   enable row level security;
alter table public.projects       enable row level security;
alter table public.project_parts  enable row level security;
alter table public.cohorts        enable row level security;
alter table public.cohort_members enable row level security;

drop policy if exists profiles_read      on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_read      on public.profiles for select to authenticated using (true);
create policy profiles_admin_all on public.profiles for all    to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists media_read      on public.media;
drop policy if exists media_staff_all on public.media;
create policy media_read      on public.media for select using (true);
create policy media_staff_all on public.media for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists sections_read      on public.sections;
drop policy if exists sections_staff_all on public.sections;
create policy sections_read      on public.sections for select using (true);
create policy sections_staff_all on public.sections for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

do $do$
declare t text;
begin
  foreach t in array array['announcements', 'events', 'achievements', 'projects'] loop
    execute format('drop policy if exists %1$s_read on public.%1$s', t);
    execute format('drop policy if exists %1$s_staff_all on public.%1$s', t);
    execute format(
      'create policy %1$s_read on public.%1$s for select
       using (published or public.is_staff())', t);
    execute format(
      'create policy %1$s_staff_all on public.%1$s for all to authenticated
       using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end;
$do$;

drop policy if exists project_parts_read      on public.project_parts;
drop policy if exists project_parts_staff_all on public.project_parts;
create policy project_parts_read on public.project_parts for select using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and (p.published or public.is_staff())
  )
);
create policy project_parts_staff_all on public.project_parts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists cohorts_read      on public.cohorts;
drop policy if exists cohorts_staff_all on public.cohorts;
create policy cohorts_read      on public.cohorts for select using (true);
create policy cohorts_staff_all on public.cohorts for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists cohort_members_read      on public.cohort_members;
drop policy if exists cohort_members_staff_all on public.cohort_members;
create policy cohort_members_read      on public.cohort_members for select using (true);
create policy cohort_members_staff_all on public.cohort_members for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_objects_read   on storage.objects;
drop policy if exists media_objects_write  on storage.objects;
drop policy if exists media_objects_update on storage.objects;
drop policy if exists media_objects_delete on storage.objects;

create policy media_objects_read on storage.objects
  for select using (bucket_id = 'media');

create policy media_objects_write on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_staff());

create policy media_objects_update on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_staff());

create policy media_objects_delete on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_staff());

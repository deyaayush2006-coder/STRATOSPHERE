create table if not exists public.contact_messages (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null default '' check (char_length(name) <= 120),
  email      text        not null check (char_length(email) between 3 and 254),
  subject    text        not null default '' check (char_length(subject) <= 200),
  message    text        not null check (char_length(message) between 1 and 4000),
  page       text        not null default '' check (char_length(page) <= 200),
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_email_created_at_idx
  on public.contact_messages (email, created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists contact_messages_staff_all on public.contact_messages;
create policy contact_messages_staff_all on public.contact_messages for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

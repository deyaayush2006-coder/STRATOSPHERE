alter table public.projects
  add column if not exists model         text not null default '',
  add column if not exists model_caption text not null default '';

alter table public.project_parts
  add column if not exists model         text not null default '',
  add column if not exists model_caption text not null default '';

alter table public.projects
  add column if not exists cad jsonb not null default '[]'::jsonb;

alter table public.project_parts
  add column if not exists cad jsonb not null default '[]'::jsonb;

alter table public.projects
  add column if not exists thesis jsonb not null default '[]'::jsonb;

alter table public.projects
  add column if not exists telemetry_csv    text  not null default '',
  add column if not exists telemetry_x      text  not null default '',
  add column if not exists telemetry_title  text  not null default '',
  add column if not exists telemetry_blurb  text  not null default '',
  add column if not exists telemetry_charts jsonb not null default '[]'::jsonb;

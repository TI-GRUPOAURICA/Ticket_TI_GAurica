alter table public.radios
  add column if not exists area text,
  add column if not exists justificacion text,
  add column if not exists cantidad integer not null default 1,
  add column if not exists estado text,
  add column if not exists canal text;

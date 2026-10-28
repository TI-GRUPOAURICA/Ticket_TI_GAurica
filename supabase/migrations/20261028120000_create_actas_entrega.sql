-- Actas de entrega: los archivos incluyen datos personales y permanecen privados.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('actas-entrega', 'actas-entrega', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf'];

create table if not exists public.actas_entrega (
  id uuid primary key default gen_random_uuid(),
  nombre_colaborador text not null,
  dni text not null,
  empresa text not null,
  fecha_entrega date not null,
  nombre_archivo text not null,
  ruta_archivo text not null unique,
  tamano_bytes bigint not null check (tamano_bytes > 0 and tamano_bytes <= 10485760),
  cargado_por text not null,
  creado_en timestamptz not null default now()
);

create index if not exists actas_entrega_fecha_idx
  on public.actas_entrega (fecha_entrega desc, creado_en desc);

alter table public.actas_entrega enable row level security;
revoke all on public.actas_entrega from anon, authenticated;
grant all on public.actas_entrega to service_role;
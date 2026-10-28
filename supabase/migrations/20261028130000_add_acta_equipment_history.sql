-- Clasifica las actas y registra los equipos individualmente para trazar su custodia.
alter table public.actas_entrega
  add column if not exists tipo_acta text not null default 'Entrega inicial';
alter table public.actas_entrega drop constraint if exists actas_entrega_tipo_acta_check;
alter table public.actas_entrega add constraint actas_entrega_tipo_acta_check
  check (tipo_acta in ('Entrega inicial', 'Entrega adicional'));

create table if not exists public.actas_entrega_equipos (
  id uuid primary key default gen_random_uuid(),
  acta_id uuid not null references public.actas_entrega(id) on delete cascade,
  tipo text not null,
  descripcion text not null,
  identificador text not null,
  creado_en timestamptz not null default now()
);
create index if not exists actas_entrega_equipos_identificador_idx
  on public.actas_entrega_equipos (lower(identificador), creado_en desc);
create index if not exists actas_entrega_equipos_acta_idx
  on public.actas_entrega_equipos (acta_id);
alter table public.actas_entrega_equipos enable row level security;
revoke all on public.actas_entrega_equipos from anon, authenticated;
grant all on public.actas_entrega_equipos to service_role;
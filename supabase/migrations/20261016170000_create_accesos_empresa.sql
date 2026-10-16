-- Registro de accesos por empresa. Las escrituras/lecturas se realizan
-- desde Edge Functions con la clave service_role; el navegador no accede
-- directamente a esta tabla.
create table if not exists public.accesos_empresa (
  correo text primary key,
  rol text not null default 'ti_empresa'
    check (rol in ('admin_global', 'ti_empresa')),
  empresa text,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint accesos_empresa_empresa_requerida
    check ((rol = 'admin_global' and empresa is null) or (rol = 'ti_empresa' and empresa is not null))
);

create index if not exists accesos_empresa_empresa_idx
  on public.accesos_empresa (empresa);

insert into public.accesos_empresa (correo, rol, empresa, activo)
values
  ('ti@metalabsac.com', 'admin_global', null, true),
  ('soporte@auricasac.com', 'admin_global', null, true)
on conflict (correo) do update
  set rol = excluded.rol,
      empresa = excluded.empresa,
      activo = excluded.activo,
      actualizado_en = now();

revoke all on public.accesos_empresa from anon, authenticated;
grant all on public.accesos_empresa to service_role;

-- Permite preparar la ficha del colaborador antes de instalar su equipo.
alter table public.colaboradores
  alter column host drop not null;

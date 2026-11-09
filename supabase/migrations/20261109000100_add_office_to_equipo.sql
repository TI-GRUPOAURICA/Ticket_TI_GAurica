-- Persiste la activación y la cuenta/licencia de Office en el equipo.
ALTER TABLE public.equipos
  ADD COLUMN IF NOT EXISTS office_activado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS office_cuenta text,
  ADD COLUMN IF NOT EXISTS office_licencia text;

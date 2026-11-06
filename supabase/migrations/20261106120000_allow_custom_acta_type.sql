-- Permite describir libremente el tipo de entrega y conserva los valores históricos.
alter table public.actas_entrega drop constraint if exists actas_entrega_tipo_acta_check;
alter table public.actas_entrega add constraint actas_entrega_tipo_acta_check
  check (char_length(btrim(tipo_acta)) between 1 and 120);
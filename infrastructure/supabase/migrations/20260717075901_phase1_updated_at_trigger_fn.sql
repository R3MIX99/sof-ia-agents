create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Actualiza automáticamente la columna updated_at de auditoría en cualquier tabla que la use como disparador BEFORE UPDATE.';

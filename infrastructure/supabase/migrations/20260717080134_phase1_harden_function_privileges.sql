-- Corrige el search_path mutable señalado por el linter de seguridad.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Estas funciones son de uso interno (disparadores o auxiliares de RLS) y
-- nunca deben quedar expuestas como RPC pública. Supabase concede EXECUTE a
-- anon/authenticated por privilegios por defecto al crear la función; se
-- revoca explícitamente aquí.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

-- Estas sí se invocan desde el backend autenticado (políticas RLS y futuros
-- casos de uso), pero nunca desde una sesión anónima.
revoke execute on function public.is_organization_member(uuid) from anon;
revoke execute on function public.is_organization_admin(uuid) from anon;
revoke execute on function public.get_organization_member_profiles(uuid) from anon;

-- Sección 15.23: función de seguridad centralizada de pertenencia a organización,
-- reutilizada por las políticas RLS de todas las tablas con datos organizacionales.
create or replace function public.is_organization_member(p_organization_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'activo'
  );
$$;

comment on function public.is_organization_member(uuid) is
  'Función de seguridad centralizada (sección 15.23): verifica si el usuario autenticado pertenece activamente a la organización dada.';

-- Complemento para las políticas que restringen la escritura a roles administrativos.
create or replace function public.is_organization_admin(p_organization_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r on r.id = om.role_id
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.status = 'activo'
      and lower(r.name) = 'admin'
  );
$$;

comment on function public.is_organization_admin(uuid) is
  'Verifica si el usuario autenticado tiene un rol administrativo activo en la organización dada.';

-- Sección 15.2: "vista restringida a los campos no sensibles" para leer perfiles
-- de otros usuarios de la misma organización.
create or replace function public.get_organization_member_profiles(p_organization_id uuid)
returns table (id uuid, full_name text, avatar_url text, locale text)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, u.full_name, u.avatar_url, u.locale
  from public.users u
  join public.organization_members om on om.user_id = u.id
  where om.organization_id = p_organization_id
    and om.status = 'activo'
    and public.is_organization_member(p_organization_id);
$$;

comment on function public.get_organization_member_profiles(uuid) is
  'Vista restringida de perfiles (sección 15.2): expone únicamente campos no sensibles de los usuarios que pertenecen a la misma organización que el llamante.';

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;
revoke all on function public.get_organization_member_profiles(uuid) from public;

grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
grant execute on function public.get_organization_member_profiles(uuid) to authenticated;

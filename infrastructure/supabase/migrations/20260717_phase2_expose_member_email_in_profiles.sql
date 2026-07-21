-- La pantalla Usuarios (9.6) requiere mostrar el correo de cada miembro.
-- Se amplía la vista restringida de perfiles (15.2) para incluir email,
-- ya que dentro del contexto de administración de una organización el
-- correo de sus propios miembros no se considera un dato sensible frente
-- a quienes ya comparten esa organización.
drop function if exists public.get_organization_member_profiles(uuid);

create function public.get_organization_member_profiles(p_organization_id uuid)
returns table (id uuid, full_name text, email text, avatar_url text, locale text)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, u.full_name, u.email, u.avatar_url, u.locale
  from public.users u
  join public.organization_members om on om.user_id = u.id
  where om.organization_id = p_organization_id
    and om.status = 'activo'
    and public.is_organization_member(p_organization_id);
$$;

comment on function public.get_organization_member_profiles(uuid) is
  'Vista restringida de perfiles (sección 15.2): expone campos no sensibles frente a otros miembros de la misma organización, incluyendo el correo para la pantalla Usuarios (9.6).';

revoke all on function public.get_organization_member_profiles(uuid) from public, anon;
grant execute on function public.get_organization_member_profiles(uuid) to authenticated;

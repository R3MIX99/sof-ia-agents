-- Índices adicionales sobre claves foráneas de organization_members: la
-- interfaz OrganizationMemberRepository.findByUserId depende de esta.
create index organization_members_user_id_idx on public.organization_members (user_id);
create index organization_members_role_id_idx on public.organization_members (role_id);
create index organization_members_invited_by_idx on public.organization_members (invited_by);

-- Envuelve auth.uid() en (select auth.uid()) para que el planificador lo
-- evalúe una sola vez por sentencia en lugar de una vez por fila.
alter policy "users_select_own" on public.users
  using ((select auth.uid()) = id);

alter policy "users_update_own" on public.users
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

alter policy "organizations_insert_owner" on public.organizations
  with check (owner_id = (select auth.uid()));

alter policy "roles_select_system_or_member" on public.roles
  using (
    (is_system_role and (select auth.uid()) is not null)
    or public.is_organization_member(organization_id)
  );

alter policy "organization_members_select_admin_or_self" on public.organization_members
  using (
    user_id = (select auth.uid())
    or public.is_organization_admin(organization_id)
  );

alter policy "organization_members_insert_admins_or_owner_bootstrap" on public.organization_members
  with check (
    public.is_organization_admin(organization_id)
    or (
      user_id = (select auth.uid())
      and exists (
        select 1 from public.organizations o
        where o.id = organization_id and o.owner_id = (select auth.uid())
      )
    )
  );

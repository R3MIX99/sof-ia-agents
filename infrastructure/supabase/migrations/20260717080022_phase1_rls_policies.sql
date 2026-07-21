-- organizations (15.1)
alter table public.organizations enable row level security;
grant select, insert, update, delete on public.organizations to authenticated;

create policy "organizations_select_members"
  on public.organizations for select
  using (public.is_organization_member(id));

create policy "organizations_insert_owner"
  on public.organizations for insert
  with check (owner_id = auth.uid());

create policy "organizations_update_admins"
  on public.organizations for update
  using (public.is_organization_admin(id))
  with check (public.is_organization_admin(id));

create policy "organizations_delete_admins"
  on public.organizations for delete
  using (public.is_organization_admin(id));

-- roles (15.4)
alter table public.roles enable row level security;
grant select, insert, update, delete on public.roles to authenticated;

create policy "roles_select_system_or_member"
  on public.roles for select
  using (
    (is_system_role and auth.uid() is not null)
    or public.is_organization_member(organization_id)
  );

create policy "roles_insert_admins"
  on public.roles for insert
  with check (
    not is_system_role
    and organization_id is not null
    and public.is_organization_admin(organization_id)
  );

create policy "roles_update_admins"
  on public.roles for update
  using (not is_system_role and public.is_organization_admin(organization_id))
  with check (not is_system_role and public.is_organization_admin(organization_id));

create policy "roles_delete_admins"
  on public.roles for delete
  using (not is_system_role and public.is_organization_admin(organization_id));

-- teams (15.5)
alter table public.teams enable row level security;
grant select, insert, update, delete on public.teams to authenticated;

create policy "teams_select_members"
  on public.teams for select
  using (public.is_organization_member(organization_id));

create policy "teams_insert_admins"
  on public.teams for insert
  with check (public.is_organization_admin(organization_id));

create policy "teams_update_admins"
  on public.teams for update
  using (public.is_organization_admin(organization_id))
  with check (public.is_organization_admin(organization_id));

create policy "teams_delete_admins"
  on public.teams for delete
  using (public.is_organization_admin(organization_id));

-- organization_members (15.3)
alter table public.organization_members enable row level security;
grant select, insert, update, delete on public.organization_members to authenticated;

create policy "organization_members_select_admin_or_self"
  on public.organization_members for select
  using (
    user_id = auth.uid()
    or public.is_organization_admin(organization_id)
  );

-- Permite además que el propietario de una organización recién creada se
-- auto-inscriba como su primer miembro (arranque de la cadena de RLS: sin
-- esta excepción nadie podría llegar a ser el primer administrador).
create policy "organization_members_insert_admins_or_owner_bootstrap"
  on public.organization_members for insert
  with check (
    public.is_organization_admin(organization_id)
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.organizations o
        where o.id = organization_id and o.owner_id = auth.uid()
      )
    )
  );

create policy "organization_members_update_admins"
  on public.organization_members for update
  using (public.is_organization_admin(organization_id))
  with check (public.is_organization_admin(organization_id));

create policy "organization_members_delete_admins"
  on public.organization_members for delete
  using (public.is_organization_admin(organization_id));

-- team_widgets (15.6)
alter table public.team_widgets enable row level security;
grant select, insert, update, delete on public.team_widgets to authenticated;

create policy "team_widgets_select_members"
  on public.team_widgets for select
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.is_organization_member(t.organization_id)
    )
  );

create policy "team_widgets_insert_members"
  on public.team_widgets for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.is_organization_member(t.organization_id)
    )
  );

create policy "team_widgets_update_members"
  on public.team_widgets for update
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.is_organization_member(t.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.is_organization_member(t.organization_id)
    )
  );

create policy "team_widgets_delete_members"
  on public.team_widgets for delete
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_id and public.is_organization_member(t.organization_id)
    )
  );

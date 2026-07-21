-- Sección 15.16
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets (id) on delete cascade,
  visitor_identifier text not null,
  visitor_name text,
  domain text not null,
  user_agent text,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  status text not null default 'activa' check (status in ('activa', 'expirada', 'cerrada'))
);

create index sessions_widget_id_idx on public.sessions (widget_id);
create index sessions_visitor_identifier_idx on public.sessions (visitor_identifier);
create index sessions_visitor_name_idx on public.sessions (visitor_name);

alter table public.sessions enable row level security;

-- Lectura para miembros de la organización propietaria. La creación y
-- actualización general están reservadas exclusivamente a funciones de
-- servidor (service_role) invocadas desde la API pública del widget. Se
-- concede además `update` a `authenticated` únicamente para permitir que un
-- administrador de la organización elimine el nombre almacenado del
-- visitante (sección 12.5), acción acotada por la política siguiente.
grant select, update on public.sessions to authenticated;

create policy "sessions_select_members"
  on public.sessions for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "sessions_update_admins"
  on public.sessions for update
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_admin(w.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_admin(w.organization_id)
    )
  );

-- Sección 15.17
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets (id) on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  visitor_name text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  outcome text not null default 'abandonada' check (outcome in ('completada', 'abandonada', 'con error')),
  rating integer,
  feedback_text text
);

create index conversations_widget_id_idx on public.conversations (widget_id);
create index conversations_session_id_idx on public.conversations (session_id);
create index conversations_started_at_idx on public.conversations (started_at);
create index conversations_visitor_name_idx on public.conversations (visitor_name);

alter table public.conversations enable row level security;

-- Lectura para miembros de la organización propietaria. La creación y el
-- cierre de una conversación están reservados a funciones de servidor. Se
-- concede `update` a `authenticated` únicamente para que un administrador
-- elimine el visitor_name almacenado (sección 12.5); la actualización de
-- calificación y retroalimentación del visitante llega en la Fase 7.
grant select, update on public.conversations to authenticated;

create policy "conversations_select_members"
  on public.conversations for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "conversations_update_admins"
  on public.conversations for update
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

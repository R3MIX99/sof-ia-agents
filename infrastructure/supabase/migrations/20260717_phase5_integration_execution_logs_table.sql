-- Sección 15.15
create table public.integration_execution_logs (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.n8n_integrations (id) on delete cascade,
  widget_id uuid not null references public.widgets (id) on delete cascade,
  -- `conversations` se crea en la Fase 6. La restricción de clave foránea
  -- correspondiente se añade en esa fase.
  conversation_id uuid,
  request_payload jsonb not null,
  response_payload jsonb,
  status_code integer,
  duration_ms integer not null default 0,
  attempt_number integer not null default 1,
  result text not null check (result in ('éxito', 'error', 'tiempo_agotado')),
  created_at timestamptz not null default now()
);

create index integration_execution_logs_integration_id_idx on public.integration_execution_logs (integration_id);
create index integration_execution_logs_widget_id_idx on public.integration_execution_logs (widget_id);
create index integration_execution_logs_created_at_idx on public.integration_execution_logs (created_at);

alter table public.integration_execution_logs enable row level security;

-- Lectura para miembros de la organización propietaria (a través de
-- n8n_integrations). Escritura exclusiva mediante funciones de servidor
-- (service_role, que omite RLS).
grant select on public.integration_execution_logs to authenticated;

create policy "integration_execution_logs_select_members"
  on public.integration_execution_logs for select
  using (
    exists (
      select 1 from public.n8n_integrations i
      where i.id = integration_id and public.is_organization_member(i.organization_id)
    )
  );

-- Sección 15.20
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  widget_id uuid references public.widgets (id) on delete set null,
  event_type text not null,
  severity text not null check (severity in ('información', 'advertencia', 'error', 'crítico')),
  source text not null check (source in ('widget', 'proveedor', 'integración n8n', 'sistema')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index events_organization_id_idx on public.events (organization_id);
create index events_severity_idx on public.events (severity);
create index events_created_at_idx on public.events (created_at);

alter table public.events enable row level security;

-- Se registran tanto desde acciones autenticadas del dashboard (por ejemplo,
-- publicación de un widget) como desde el flujo público del widget
-- embebido (que opera con el cliente de servicio y por lo tanto omite RLS).
grant select, insert on public.events to authenticated;

create policy "events_select_members"
  on public.events for select
  using (public.is_organization_member(organization_id));

create policy "events_insert_members"
  on public.events for insert
  with check (public.is_organization_member(organization_id));

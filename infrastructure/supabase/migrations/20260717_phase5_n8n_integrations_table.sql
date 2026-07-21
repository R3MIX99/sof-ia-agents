-- Sección 15.13
create table public.n8n_integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  webhook_url text not null,
  http_method text not null default 'POST' check (http_method in ('POST', 'GET', 'PUT', 'PATCH')),
  headers jsonb not null default '{}'::jsonb,
  auth_type text not null default 'ninguna' check (auth_type in ('ninguna', 'cabecera_estatica', 'token', 'básica')),
  auth_credentials_encrypted text,
  dynamic_variables jsonb not null default '{}'::jsonb,
  timeout_ms integer not null default 10000,
  retry_count integer not null default 0,
  retry_backoff_ms integer not null default 1000,
  error_handling_strategy text not null default 'continuar' check (error_handling_strategy in ('continuar', 'interrumpir')),
  expected_response_format jsonb not null default '{}'::jsonb,
  status text not null default 'activa' check (status in ('activa', 'deshabilitada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index n8n_integrations_organization_id_idx on public.n8n_integrations (organization_id);

create trigger set_n8n_integrations_updated_at
  before update on public.n8n_integrations
  for each row execute function public.set_updated_at();

alter table public.n8n_integrations enable row level security;

-- auth_credentials_encrypted nunca se expone a través de consultas con
-- privilegios de `authenticated`; solo el rol de servicio puede leerlo,
-- para descifrarlo en el servidor al ejecutar el Webhook (sección 6.2).
grant select (
  id, organization_id, name, webhook_url, http_method, headers, auth_type,
  dynamic_variables, timeout_ms, retry_count, retry_backoff_ms,
  error_handling_strategy, expected_response_format, status,
  created_at, updated_at
), insert, update, delete on public.n8n_integrations to authenticated;

create policy "n8n_integrations_select_members"
  on public.n8n_integrations for select
  using (public.is_organization_member(organization_id));

create policy "n8n_integrations_insert_admins"
  on public.n8n_integrations for insert
  with check (public.is_organization_admin(organization_id));

create policy "n8n_integrations_update_admins"
  on public.n8n_integrations for update
  using (public.is_organization_admin(organization_id))
  with check (public.is_organization_admin(organization_id));

create policy "n8n_integrations_delete_admins"
  on public.n8n_integrations for delete
  using (public.is_organization_admin(organization_id));

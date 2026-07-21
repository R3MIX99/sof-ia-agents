-- Sección 15.12
create table public.provider_usage_logs (
  id uuid primary key default gen_random_uuid(),
  provider_config_id uuid not null references public.provider_configs (id) on delete cascade,
  -- `widgets` se crea en la Fase 4; `conversations` en la Fase 6. Las
  -- restricciones de clave foránea correspondientes se añaden en esas fases.
  widget_id uuid not null,
  conversation_id uuid,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  latency_ms integer not null default 0,
  status text not null check (status in ('éxito', 'error')),
  error_type text check (error_type in ('autenticación', 'límite de uso', 'contenido', 'disponibilidad', 'desconocido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index provider_usage_logs_provider_config_id_idx on public.provider_usage_logs (provider_config_id);
create index provider_usage_logs_widget_id_idx on public.provider_usage_logs (widget_id);
create index provider_usage_logs_created_at_idx on public.provider_usage_logs (created_at);

create trigger set_provider_usage_logs_updated_at
  before update on public.provider_usage_logs
  for each row execute function public.set_updated_at();

alter table public.provider_usage_logs enable row level security;

-- Lectura para miembros de la organización propietaria (resuelta a través de
-- provider_configs, ya que widgets todavía no existe). Escritura exclusiva
-- mediante funciones de servidor (service_role, que omite RLS).
grant select on public.provider_usage_logs to authenticated;

create policy "provider_usage_logs_select_members"
  on public.provider_usage_logs for select
  using (
    exists (
      select 1 from public.provider_configs pc
      where pc.id = provider_config_id
        and public.is_organization_member(pc.organization_id)
    )
  );

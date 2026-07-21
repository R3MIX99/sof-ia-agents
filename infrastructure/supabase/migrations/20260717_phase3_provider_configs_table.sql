-- Sección 15.11
create table public.provider_configs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic')),
  credentials_encrypted text not null,
  model text not null,
  default_temperature numeric,
  default_max_tokens integer,
  default_system_prompt text,
  validation_status text not null default 'pendiente' check (validation_status in ('pendiente', 'válida', 'inválida')),
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index provider_configs_organization_id_idx on public.provider_configs (organization_id);
create index provider_configs_provider_idx on public.provider_configs (provider);

create trigger set_provider_configs_updated_at
  before update on public.provider_configs
  for each row execute function public.set_updated_at();

alter table public.provider_configs enable row level security;

-- credentials_encrypted nunca se expone a través de consultas con privilegios
-- de `authenticated`; solo el rol de servicio (service_role, que ya tiene
-- BYPASSRLS y omite los privilegios por columna) puede leerlo, para
-- descifrarlo en el servidor en el momento de invocar al proveedor.
grant select (
  id, organization_id, provider, model, default_temperature,
  default_max_tokens, default_system_prompt, validation_status,
  last_validated_at, created_at, updated_at
), insert, update, delete on public.provider_configs to authenticated;

create policy "provider_configs_select_members"
  on public.provider_configs for select
  using (public.is_organization_member(organization_id));

create policy "provider_configs_insert_admins"
  on public.provider_configs for insert
  with check (public.is_organization_admin(organization_id));

create policy "provider_configs_update_admins"
  on public.provider_configs for update
  using (public.is_organization_admin(organization_id))
  with check (public.is_organization_admin(organization_id));

create policy "provider_configs_delete_admins"
  on public.provider_configs for delete
  using (public.is_organization_admin(organization_id));

-- Sección 15.4
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete cascade,
  name text not null,
  permissions jsonb not null default '{}'::jsonb,
  is_system_role boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_system_role_no_organization check (not is_system_role or organization_id is null)
);

create index roles_organization_id_idx on public.roles (organization_id);

-- Evita duplicar nombres entre los roles predefinidos del sistema.
create unique index roles_system_role_name_unique on public.roles (name) where is_system_role;

create trigger set_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

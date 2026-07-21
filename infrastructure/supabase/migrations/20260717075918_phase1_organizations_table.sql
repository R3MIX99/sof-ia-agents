-- Sección 15.1
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.users (id),
  timezone text not null default 'America/Mexico_City',
  default_language text not null default 'es-419',
  status text not null default 'activa' check (status in ('activa', 'suspendida', 'eliminada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_owner_id_idx on public.organizations (owner_id);

create trigger set_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

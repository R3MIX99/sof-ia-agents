-- Sección 15.5
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index teams_organization_id_idx on public.teams (organization_id);

create trigger set_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

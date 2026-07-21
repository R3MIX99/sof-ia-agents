-- Sección 15.3
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role_id uuid references public.roles (id) on delete set null,
  team_id uuid references public.teams (id) on delete set null,
  invited_by uuid references public.users (id) on delete set null,
  status text not null default 'invitado' check (status in ('invitado', 'activo', 'suspendido')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

create index organization_members_team_id_idx on public.organization_members (team_id);

create trigger set_organization_members_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

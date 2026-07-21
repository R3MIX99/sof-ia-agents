-- Sección 15.7
create table public.widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'borrador' check (status in ('borrador', 'publicado', 'pausado', 'archivado')),
  provider_config_id uuid references public.provider_configs (id) on delete set null,
  logo_url text,
  avatar_url text,
  language text not null default 'es-419',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index widgets_organization_id_idx on public.widgets (organization_id);
create index widgets_status_idx on public.widgets (status);

create trigger set_widgets_updated_at
  before update on public.widgets
  for each row execute function public.set_updated_at();

alter table public.widgets enable row level security;
grant select, insert, update, delete on public.widgets to authenticated;

create policy "widgets_select_members"
  on public.widgets for select
  using (public.is_organization_member(organization_id));

create policy "widgets_insert_members"
  on public.widgets for insert
  with check (public.is_organization_member(organization_id));

create policy "widgets_update_members"
  on public.widgets for update
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id));

create policy "widgets_delete_members"
  on public.widgets for delete
  using (public.is_organization_member(organization_id));

-- Ahora que `widgets` existe, se completa la clave foránea diferida desde la Fase 1.
alter table public.team_widgets
  add constraint team_widgets_widget_id_fkey
  foreign key (widget_id) references public.widgets (id) on delete cascade;

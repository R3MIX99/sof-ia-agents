-- Sección 15.14
create table public.widget_integrations (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets (id) on delete cascade,
  integration_id uuid not null references public.n8n_integrations (id) on delete cascade,
  trigger_point text not null default 'después_ia' check (trigger_point in ('antes_ia', 'después_ia', 'independiente')),
  execution_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint widget_integrations_widget_integration_unique unique (widget_id, integration_id)
);

create index widget_integrations_widget_id_execution_order_idx
  on public.widget_integrations (widget_id, execution_order);

create trigger set_widget_integrations_updated_at
  before update on public.widget_integrations
  for each row execute function public.set_updated_at();

alter table public.widget_integrations enable row level security;
grant select, insert, update, delete on public.widget_integrations to authenticated;

create policy "widget_integrations_select_members"
  on public.widget_integrations for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_integrations_insert_members"
  on public.widget_integrations for insert
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
    and exists (
      select 1 from public.n8n_integrations i
      where i.id = integration_id and public.is_organization_member(i.organization_id)
    )
  );

create policy "widget_integrations_update_members"
  on public.widget_integrations for update
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_integrations_delete_members"
  on public.widget_integrations for delete
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

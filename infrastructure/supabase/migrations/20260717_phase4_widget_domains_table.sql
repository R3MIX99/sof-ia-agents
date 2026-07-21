-- Sección 15.9
create table public.widget_domains (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets (id) on delete cascade,
  domain text not null,
  is_wildcard boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint widget_domains_widget_domain_unique unique (widget_id, domain)
);

create trigger set_widget_domains_updated_at
  before update on public.widget_domains
  for each row execute function public.set_updated_at();

alter table public.widget_domains enable row level security;
grant select, insert, update, delete on public.widget_domains to authenticated;

create policy "widget_domains_select_members"
  on public.widget_domains for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_domains_insert_members"
  on public.widget_domains for insert
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_domains_update_members"
  on public.widget_domains for update
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

create policy "widget_domains_delete_members"
  on public.widget_domains for delete
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

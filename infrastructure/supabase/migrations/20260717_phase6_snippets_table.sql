-- Sección 15.21
create table public.snippets (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null unique references public.widgets (id) on delete cascade,
  public_key text not null unique,
  generated_at timestamptz not null default now(),
  revoked boolean not null default false
);

alter table public.snippets enable row level security;
grant select, insert, update, delete on public.snippets to authenticated;

create policy "snippets_select_members"
  on public.snippets for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "snippets_insert_admins"
  on public.snippets for insert
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_admin(w.organization_id)
    )
  );

create policy "snippets_update_admins"
  on public.snippets for update
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_admin(w.organization_id)
    )
  )
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_admin(w.organization_id)
    )
  );

create policy "snippets_delete_admins"
  on public.snippets for delete
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_admin(w.organization_id)
    )
  );

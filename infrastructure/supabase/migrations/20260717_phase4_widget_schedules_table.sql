-- Sección 15.10
create table public.widget_schedules (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets (id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/Mexico_City',
  out_of_schedule_behavior text not null default 'ocultar widget' check (out_of_schedule_behavior in ('ocultar widget', 'mostrar mensaje de no disponibilidad')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index widget_schedules_widget_id_idx on public.widget_schedules (widget_id);

create trigger set_widget_schedules_updated_at
  before update on public.widget_schedules
  for each row execute function public.set_updated_at();

alter table public.widget_schedules enable row level security;
grant select, insert, update, delete on public.widget_schedules to authenticated;

create policy "widget_schedules_select_members"
  on public.widget_schedules for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_schedules_insert_members"
  on public.widget_schedules for insert
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_schedules_update_members"
  on public.widget_schedules for update
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

create policy "widget_schedules_delete_members"
  on public.widget_schedules for delete
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

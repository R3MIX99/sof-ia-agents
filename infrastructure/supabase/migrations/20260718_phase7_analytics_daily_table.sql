-- Sección 15.19
create table public.analytics_daily (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null references public.widgets (id) on delete cascade,
  date date not null,
  unique_users integer not null default 0,
  conversations_count integer not null default 0,
  messages_sent integer not null default 0,
  messages_received integer not null default 0,
  avg_response_time_ms integer not null default 0,
  errors_count integer not null default 0,
  tokens_input_total integer not null default 0,
  tokens_output_total integer not null default 0,
  constraint analytics_daily_widget_date_unique unique (widget_id, date)
);

alter table public.analytics_daily enable row level security;

-- Tabla de agregación precalculada: se escribe bajo demanda cuando un
-- administrador consulta la pantalla Analíticas (sección 9.3), a partir de
-- conversations/messages/events, o mediante procesos programados futuros.
grant select, insert, update on public.analytics_daily to authenticated;

create policy "analytics_daily_select_members"
  on public.analytics_daily for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "analytics_daily_insert_members"
  on public.analytics_daily for insert
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "analytics_daily_update_members"
  on public.analytics_daily for update
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

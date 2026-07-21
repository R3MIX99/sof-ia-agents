-- Sección 15.8
create table public.widget_appearance (
  id uuid primary key default gen_random_uuid(),
  widget_id uuid not null unique references public.widgets (id) on delete cascade,
  theme_mode text not null default 'automático' check (theme_mode in ('claro', 'oscuro', 'automático')),
  primary_color text not null default '#6366f1',
  background_color text not null default '#ffffff',
  text_color text not null default '#0f172a',
  font_family text not null default 'Inter',
  header_title text not null default '',
  header_subtitle text,
  footer_text text,
  initial_message text not null default '',
  suggested_messages jsonb not null default '[]'::jsonb,
  position text not null default 'inferior-derecha' check (position in ('inferior-derecha', 'inferior-izquierda', 'superior-derecha', 'superior-izquierda')),
  window_width integer not null default 380,
  window_height integer not null default 600,
  border_radius integer not null default 16,
  shadow_style text not null default 'suave',
  spacing_scale text not null default 'normal',
  animations_enabled boolean not null default true,
  launcher_icon text not null default 'message-circle',
  launcher_color text not null default '#6366f1',
  copyright_text text,
  powered_by_enabled boolean not null default true,
  footer_link_url text,
  footer_link_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_widget_appearance_updated_at
  before update on public.widget_appearance
  for each row execute function public.set_updated_at();

alter table public.widget_appearance enable row level security;
grant select, insert, update, delete on public.widget_appearance to authenticated;

create policy "widget_appearance_select_members"
  on public.widget_appearance for select
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_appearance_insert_members"
  on public.widget_appearance for insert
  with check (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

create policy "widget_appearance_update_members"
  on public.widget_appearance for update
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

create policy "widget_appearance_delete_members"
  on public.widget_appearance for delete
  using (
    exists (
      select 1 from public.widgets w
      where w.id = widget_id and public.is_organization_member(w.organization_id)
    )
  );

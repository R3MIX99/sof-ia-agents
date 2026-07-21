-- Sección 15.6
create table public.team_widgets (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  -- `widgets` se crea en la Fase 4. La restricción de clave foránea
  -- team_widgets_widget_id_fkey hacia public.widgets(id) on delete cascade
  -- debe añadirse en la migración de la Fase 4, una vez exista esa tabla.
  widget_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_widgets_team_widget_unique unique (team_id, widget_id)
);

create trigger set_team_widgets_updated_at
  before update on public.team_widgets
  for each row execute function public.set_updated_at();

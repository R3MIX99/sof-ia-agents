-- Completa la clave foránea diferida desde la Fase 3 (15.12).
alter table public.provider_usage_logs
  add constraint provider_usage_logs_widget_id_fkey
  foreign key (widget_id) references public.widgets (id) on delete cascade;

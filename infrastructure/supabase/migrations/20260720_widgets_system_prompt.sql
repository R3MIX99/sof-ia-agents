-- Instrucciones de comportamiento propias de cada widget (independientes del
-- default_system_prompt de provider_configs, que puede ser compartido por
-- varios widgets bajo la misma configuración de proveedor).
alter table public.widgets
  add column system_prompt text;

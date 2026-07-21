-- La sección 15.15 marca widget_id como obligatorio, pero la sección 9.5
-- describe explícitamente que una integración se prueba ("panel de pruebas
-- de conexión") antes de asociarse a ningún widget. Para permitir esa
-- prueba de conexión sin un widget asociado, se relaja widget_id a opcional;
-- las ejecuciones reales durante una conversación (Fase 6) siempre lo
-- incluirán.
alter table public.integration_execution_logs
  alter column widget_id drop not null;

-- Sección 10 "Configuración avanzada" no tiene columnas explícitas en 15.7,
-- pero la Fase 4 exige implementar exhaustivamente estos campos: persistencia
-- de la conversación entre sesiones, límite de mensajes por sesión y
-- comportamiento ante inactividad prolongada.
alter table public.widgets
  add column persist_conversation_across_sessions boolean not null default true,
  add column max_messages_per_session integer,
  add column inactivity_behavior text not null default 'sin acción' check (
    inactivity_behavior in ('sin acción', 'cerrar sesión automáticamente', 'mostrar mensaje de inactividad')
  );

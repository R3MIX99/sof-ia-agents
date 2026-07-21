-- Completa las claves foráneas diferidas hacia conversations, ahora que la
-- tabla existe (secciones 15.12 y 15.15).
alter table public.provider_usage_logs
  add constraint provider_usage_logs_conversation_id_fkey
  foreign key (conversation_id) references public.conversations (id) on delete set null;

alter table public.integration_execution_logs
  add constraint integration_execution_logs_conversation_id_fkey
  foreign key (conversation_id) references public.conversations (id) on delete set null;

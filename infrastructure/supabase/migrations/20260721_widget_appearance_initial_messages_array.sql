-- Reemplaza el mensaje inicial único (initial_message) por una lista de mensajes
-- (initial_messages), cada uno enviado como una burbuja independiente del asistente,
-- en orden, antes de que el visitante escriba algo.
alter table public.widget_appearance
  add column initial_messages jsonb not null default '[]'::jsonb;

update public.widget_appearance
set initial_messages = case
  when initial_message is not null and btrim(initial_message) <> '' then jsonb_build_array(initial_message)
  else '[]'::jsonb
end;

alter table public.widget_appearance drop column initial_message;

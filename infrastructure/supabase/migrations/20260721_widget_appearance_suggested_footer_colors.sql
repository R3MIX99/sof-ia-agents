-- Colores independientes para los mensajes sugeridos y el enlace inferior,
-- antes ligados a primary_color y text_color respectivamente. Los valores
-- por defecto reproducen el comportamiento actual para no alterar la
-- apariencia de los widgets ya existentes.
alter table public.widget_appearance
  add column suggested_message_color text not null default '#6366f1',
  add column footer_link_color text not null default '#0f172a';

-- Ajuste de producto (sesión de diseño): se simplifica el pie del widget a
-- un único enlace centrado (etiqueta + URL), eliminando footer_text,
-- copyright_text y powered_by_enabled. Se agregan colores de burbuja de
-- mensaje (usuario/asistente) y la forma del botón flotante, visibles ahora
-- en la previsualización en vivo.
alter table public.widget_appearance
  drop column footer_text,
  drop column copyright_text,
  drop column powered_by_enabled,
  add column user_bubble_color text not null default '#6366f1',
  add column assistant_bubble_color text not null default '#f1f5f9',
  add column launcher_shape text not null default 'circular' check (launcher_shape in ('circular', 'cuadrado'));

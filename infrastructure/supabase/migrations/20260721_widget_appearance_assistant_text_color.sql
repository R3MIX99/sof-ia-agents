-- Color de texto propio de la burbuja del asistente, independiente del color de texto general
-- (necesario para poder usar burbujas claras con texto oscuro, por ejemplo).
alter table public.widget_appearance
  add column assistant_text_color text not null default '#0f172a';

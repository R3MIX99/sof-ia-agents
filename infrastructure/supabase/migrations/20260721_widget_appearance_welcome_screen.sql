-- Bloque de bienvenida centrado (logo + nombre de la empresa + frase) que se
-- muestra al abrir el widget, antes del primer mensaje.
alter table public.widget_appearance
  add column company_name text,
  add column company_tagline text;

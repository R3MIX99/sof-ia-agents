-- Tipo de botón flotante (launcher): solo ícono, solo texto, o ícono + texto.
alter table public.widget_appearance
  add column launcher_type text not null default 'icono',
  add column launcher_label text;

alter table public.widget_appearance
  add constraint widget_appearance_launcher_type_check
  check (launcher_type in ('icono', 'texto', 'icono_texto'));

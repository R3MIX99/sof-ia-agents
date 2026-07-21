-- Sección 15.18
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('usuario', 'asistente', 'sistema', 'integración')),
  content text not null,
  content_format text not null default 'texto simple' check (content_format in ('texto simple', 'markdown')),
  tokens_input integer,
  tokens_output integer,
  latency_ms integer,
  sequence_number integer not null,
  created_at timestamptz not null default now(),
  constraint messages_conversation_sequence_unique unique (conversation_id, sequence_number)
);

create index messages_conversation_id_idx on public.messages (conversation_id);

alter table public.messages enable row level security;

-- Lectura para miembros de la organización propietaria del widget asociado
-- a la conversación; escritura exclusiva mediante funciones de servidor.
grant select on public.messages to authenticated;

create policy "messages_select_members"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      join public.widgets w on w.id = c.widget_id
      where c.id = conversation_id and public.is_organization_member(w.organization_id)
    )
  );

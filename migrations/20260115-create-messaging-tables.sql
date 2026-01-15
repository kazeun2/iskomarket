-- 2026-01-15: Create conversations, conversation_participants, messages tables and policies

-- Conversations table
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid null,
  buyer_id uuid null,
  seller_id uuid null,
  last_message_id uuid null,
  last_message_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conversation participants (for flexible multi-party conversations)
create table if not exists conversation_participants (
  conversation_id uuid references conversations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- Messages table (flexible content field names to tolerate schema variants)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  receiver_id uuid references auth.users(id) on delete cascade,
  -- canonical content field used by application
  message text not null,
  -- legacy/alternative columns left for compatibility with external schemas
  message_text text,
  content text,
  body text,
  product_id uuid null,
  transaction_id uuid null,
  is_read boolean not null default false,
  read_at timestamptz null,
  is_automated boolean not null default false,
  automation_type text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null
);

-- Indexes for common queries
create index if not exists idx_messages_conversation_created_at on messages (conversation_id, created_at desc);
create index if not exists idx_conversation_participants_user on conversation_participants (user_id, created_at desc);
create index if not exists idx_conversations_updated_at on conversations (updated_at desc);

-- Enable Row Level Security
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;

-- Policies: participants can select conversations they are in
drop policy if exists "participants can select conversations" on conversations;
create policy "participants can select conversations"
  on conversations
  for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversations.id
        and cp.user_id = auth.uid()
    )
  );

-- Policy: participants can manage their participant rows
drop policy if exists "users manage their participant rows" on conversation_participants;
create policy "users manage their participant rows"
  on conversation_participants
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policy: participants can read messages
drop policy if exists "participants can read messages" on messages;
create policy "participants can read messages"
  on messages
  for select
  using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- Policy: participants can insert messages (must be sender and a participant)
drop policy if exists "participants can insert messages" on messages;
create policy "participants can insert messages"
  on messages
  for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = messages.conversation_id
        and cp.user_id = auth.uid()
    )
  );

-- Policy: participants can update their own messages (e.g., mark read or edit small changes)
drop policy if exists "participants can update_messages" on messages;
create policy "participants can update_messages"
  on messages
  for update
  using (
    sender_id = auth.uid() or (exists (select 1 from conversation_participants cp where cp.conversation_id = messages.conversation_id and cp.user_id = auth.uid()))
  )
  with check (
    (sender_id = auth.uid()) or (is_read = messages.is_read)
  );

-- Policy: participants can delete their own messages (soft delete via is_deleted can be implemented at app level)
drop policy if exists "participants can delete their own messages" on messages;
create policy "participants can delete their own messages"
  on messages
  for delete
  using (sender_id = auth.uid());

-- Comment: Enable publish for Realtime (Supabase dashboard is required in some deployments)
comment on table messages is 'Enable realtime (Postgres changes) in Supabase project to receive live inserts/updates from clients.';

-- Update trigger to set updated_at on conversations
-- Some Postgres versions don't support CREATE FUNCTION IF NOT EXISTS; use DROP + CREATE for compatibility
drop function if exists conversations_updated_at_trigger();
create function conversations_updated_at_trigger() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_conversation_updated_at on conversations;
create trigger set_conversation_updated_at
  before update on conversations
  for each row
  execute function conversations_updated_at_trigger();

-- Update conversations.last_message_id and last_message_at on message insert (best-effort)
-- Some Postgres versions don't support CREATE FUNCTION IF NOT EXISTS; use DROP + CREATE for compatibility
drop function if exists messages_after_insert_update();
create function messages_after_insert_update() returns trigger as $$
begin
  begin
    update conversations set last_message_id = new.id, last_message_at = new.created_at where id = new.conversation_id;
  exception when others then
    -- ignore failures (best-effort)
    null;
  end;
  return new;
end;
$$ language plpgsql;

drop trigger if exists messages_after_insert_update_trigger on messages;
create trigger messages_after_insert_update_trigger
  after insert on messages
  for each row
  execute function messages_after_insert_update();
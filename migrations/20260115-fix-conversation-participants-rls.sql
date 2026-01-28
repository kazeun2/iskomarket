-- 2026-01-15: Ensure conversation_participants RLS policy allows users to manage their own participant rows

alter table public.conversation_participants enable row level security;

-- Recreate policy to ensure it exists and uses auth.uid()
drop policy if exists "users manage their participant rows" on public.conversation_participants;

create policy "users manage their participant rows"
  on public.conversation_participants
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

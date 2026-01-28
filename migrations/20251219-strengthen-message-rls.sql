-- Strengthen RLS policies for messages to prevent cross-conversation leakage
-- This ensures messages can only be viewed if:
-- 1. User is the sender or receiver
-- 2. AND the message's conversation exists and user is part of it

-- Drop old policy (too permissive, doesn't check conversation membership)
DROP POLICY IF EXISTS "Users can view messages they are part of" ON public.messages;

-- Create stronger policy that verifies both direct participation AND conversation membership
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    (sender_id = auth.uid() OR receiver_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Keep insert policy strict - only allow sending as authenticated user
DROP POLICY IF EXISTS "Users can insert messages they are sending" ON public.messages;
CREATE POLICY "Users can insert messages they are sending"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Keep update policy for read status
DROP POLICY IF EXISTS "Users can update read status" ON public.messages;
CREATE POLICY "Users can update read status"
  ON public.messages FOR UPDATE
  USING (
    receiver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  )
  WITH CHECK (
    receiver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

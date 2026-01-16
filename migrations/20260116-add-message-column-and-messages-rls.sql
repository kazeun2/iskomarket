-- 2026-01-16: Ensure canonical `message` column exists, create messages table if missing, backfill legacy columns, add missing columns, and create RLS policy

-- Create table if it doesn't exist (minimal stable shape)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Add canonical / required columns (idempotent)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS is_automated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Backfill canonical `message` from common legacy columns when present.
-- Use an idempotent plpgsql block that checks for the existence of legacy columns before
-- referencing them to avoid errors on schemas that don't have those columns.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'message_text'
  ) THEN
    UPDATE public.messages SET message = coalesce(message, message_text) WHERE message IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'body'
  ) THEN
    UPDATE public.messages SET message = coalesce(message, body) WHERE message IS NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'content'
  ) THEN
    UPDATE public.messages SET message = coalesce(message, content) WHERE message IS NULL;
  END IF;
END
$$;

-- Make canonical `message` column NOT NULL only when all rows are backfilled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.messages WHERE message IS NULL) THEN
    ALTER TABLE public.messages ALTER COLUMN message SET NOT NULL;
  END IF;
END
$$;

-- Ensure conversation_participants.user_id has a foreign key to public.users(id) if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = 'f' AND t.relname = 'conversation_participants' AND c.conname = 'conversation_participants_user_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.conversation_participants
        ADD CONSTRAINT conversation_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) NOT VALID;
      -- Try to validate constraint if possible
      BEGIN
        ALTER TABLE public.conversation_participants VALIDATE CONSTRAINT conversation_participants_user_id_fkey;
      EXCEPTION WHEN OTHERS THEN
        -- If validation fails because of orphaned rows, leave the constraint NOT VALID so it does not block migration
        RAISE NOTICE 'conversation_participants.user_id FK constraint added but not validated due to data issues';
      END;
    EXCEPTION WHEN OTHERS THEN
      -- ignore errors adding FK (best-effort)
      RAISE NOTICE 'Could not add conversation_participants.user_id FK - continuing';
    END;
  END IF;
END
$$;

-- Enable Row Level Security on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if present and replace with a policy that allows participants to insert
-- their own messages when they are a participant in the conversation
DROP POLICY IF EXISTS "participants can insert messages" ON public.messages;

CREATE POLICY "participants can insert messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- Create a readonly SELECT policy so participants can select messages in their conversations
DROP POLICY IF EXISTS "participants can select messages" ON public.messages;
CREATE POLICY "participants can select messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = public.messages.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

-- Finished: the canonical `message` column and RLS policies are in place. Please re-run your app and ensure
-- your client code uses the `message` column for all inserts and selects.
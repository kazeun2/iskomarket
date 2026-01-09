-- Migration: add message_cards table and trigger to upsert card rows + insert notifications

BEGIN;

-- 1) Create message_cards table (one row per user per conversation)
CREATE TABLE IF NOT EXISTS public.message_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  other_user_id uuid NOT NULL,
  product_id uuid NULL,
  last_message text NULL,
  last_message_at timestamptz NULL,
  unread_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for upserts (one card per conversation per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_cards_conv_user ON public.message_cards(conversation_id, user_id);
CREATE INDEX IF NOT EXISTS idx_message_cards_user_id ON public.message_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_message_cards_last_message_at ON public.message_cards(last_message_at DESC);

-- 2) Ensure notifications table exists (most deployments already have it - this is safe)
-- See project schema for more fields; we just ensure it matches expectations used by triggers below
-- (If your notifications table differs, update this migration accordingly.)

-- 3) Trigger function that upserts message_cards and inserts/updates notifications on message insert
CREATE OR REPLACE FUNCTION public.fn_on_message_insert_upsert_cards_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_preview text;
  effective_product_id uuid;
BEGIN
  -- If message lacks conversation_id, skip message_card upserts and notification insertion for now
  -- (sendMessage attempts to repair/patch conversation_id after the fact; we avoid failing here)
  IF NEW.conversation_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prepare a short preview for notifications
  -- Use json-extraction via row_to_json to safely access optional fields like 'content' or 'message'
  msg_preview := left(coalesce(NEW.message_text, (row_to_json(NEW)::jsonb ->> 'content'), (row_to_json(NEW)::jsonb ->> 'message')), 256);

  -- Derive a product_id for this message: prefer explicit message.product_id, otherwise try to derive from a linked transaction
  effective_product_id := NEW.product_id;
  IF effective_product_id IS NULL AND NEW.transaction_id IS NOT NULL THEN
    BEGIN
      SELECT product_id INTO effective_product_id FROM public.transactions WHERE id = NEW.transaction_id LIMIT 1;
    EXCEPTION WHEN others THEN
      -- ignore and leave effective_product_id NULL
      effective_product_id := NULL;
    END;
  END IF;

  -- Upsert sender's card: keep unread_count as-is (sender typically doesn't gain unread on sending)
  BEGIN
    INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
    VALUES (NEW.conversation_id, NEW.sender_id, NEW.receiver_id, effective_product_id, msg_preview, NEW.created_at, 0, 'active', now(), now())
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        updated_at = now();
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'fn_on_message_insert_upsert_cards_and_notify: sender card upsert failed: %', SQLERRM;
  END;

  -- Upsert receiver's card: increment unread_count
  BEGIN
    INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
    VALUES (NEW.conversation_id, NEW.receiver_id, NEW.sender_id, effective_product_id, msg_preview, NEW.created_at, 1, 'active', now(), now())
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        unread_count = public.message_cards.unread_count + 1,
        updated_at = now();
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'fn_on_message_insert_upsert_cards_and_notify: receiver card upsert failed: %', SQLERRM;
  END;

  -- Insert or bump a single unread notification for the receiver for this conversation
  -- Defensive: don't let notificationErrors break message_card upserts or message insert
  BEGIN
    -- Ensure notifications table exists and has the expected 'payload' column
    IF to_regclass('public.notifications') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'payload') THEN

      IF EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = NEW.receiver_id
          AND (n.payload->>'conversation_id') = (NEW.conversation_id::text)
          AND n.type = 'message'
          AND n.read_at IS NULL
        LIMIT 1
      ) THEN
        -- Update existing notification (bump timestamp and refresh preview)
        UPDATE public.notifications
        SET created_at = now(),
            payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{message_preview}', to_jsonb(msg_preview))
        WHERE user_id = NEW.receiver_id
          AND (payload->>'conversation_id') = (NEW.conversation_id::text)
          AND type = 'message'
          AND read_at IS NULL;
      ELSE
        -- Insert a new notification for receiver (include product + transaction metadata when available)
        INSERT INTO public.notifications (user_id, type, payload, created_at)
          VALUES (
            NEW.receiver_id,
            CASE WHEN NEW.automation_type = 'meetup_request' THEN 'meetup_proposed' ELSE 'message' END,
            jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id, 'product_id', effective_product_id::text, 'transaction_id', NEW.transaction_id::text, 'message_preview', msg_preview),
            now()
          );
      END IF;
    ELSE
      -- Notifications table missing or incompatible; skip notifications without failing the message insert
      RAISE NOTICE 'Skipping notifications: notifications table missing or payload column not found';
    END IF;
  EXCEPTION WHEN others THEN
    -- Log and continue - notifications should not prevent messages from being saved
    RAISE NOTICE 'fn_on_message_insert_upsert_cards_and_notify: notification step failed, continuing - %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Ensure the function runs with an owner that can bypass RLS; attempt to change owner to postgres (best-effort)
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.fn_on_message_insert_upsert_cards_and_notify() OWNER TO postgres;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not change owner of fn_on_message_insert_upsert_cards_and_notify: %', SQLERRM;
  END;
END;$$;

-- 4) Attach trigger to messages table
DROP TRIGGER IF EXISTS trg_messages_after_insert_upsert_cards ON public.messages;
CREATE TRIGGER trg_messages_after_insert_upsert_cards
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_message_insert_upsert_cards_and_notify();

-- Also run the same logic when a message row is later patched with a conversation_id
DROP TRIGGER IF EXISTS trg_messages_after_update_set_conv ON public.messages;
CREATE TRIGGER trg_messages_after_update_set_conv
AFTER UPDATE OF conversation_id ON public.messages
FOR EACH ROW
WHEN (OLD.conversation_id IS NULL AND NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION public.fn_on_message_insert_upsert_cards_and_notify();

-- 5) Row-Level Security (RLS) policies
-- Messages: select only if you're sender or receiver
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS messages_insert_authenticated_sender ON public.messages;
CREATE POLICY messages_insert_authenticated_sender ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS messages_update_owner ON public.messages;
CREATE POLICY messages_update_owner ON public.messages FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid()) WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Message cards: only visible/modifyable by owner (user_id)
ALTER TABLE public.message_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS message_cards_user_access ON public.message_cards;
CREATE POLICY message_cards_user_access ON public.message_cards FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Notifications: only visible by owner
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_user_access ON public.notifications;
CREATE POLICY notifications_user_access ON public.notifications FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6) Backfill: populate message_cards from existing conversations/messages (idempotent)
DO $$
BEGIN
  -- Insert/Upsert buyer cards
  INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
  SELECT
    conv.id,
    conv.buyer_id,
    conv.seller_id,
    conv.product_id,
    (SELECT left(coalesce(m.message_text, (row_to_json(m)::jsonb ->> 'content'), (row_to_json(m)::jsonb ->> 'message')), 256) FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT count(*)::int FROM public.messages mm WHERE mm.conversation_id = conv.id AND mm.receiver_id = conv.buyer_id AND mm.is_read = false),
    'active', now(), now()
  FROM public.conversations conv
  ON CONFLICT (conversation_id, user_id) DO UPDATE
  SET last_message = EXCLUDED.last_message,
      last_message_at = EXCLUDED.last_message_at,
      unread_count = EXCLUDED.unread_count,
      updated_at = now();

  -- Insert/Upsert seller cards
  INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
  SELECT
    conv.id,
    conv.seller_id,
    conv.buyer_id,
    conv.product_id,
    (SELECT left(coalesce(m.message_text, (row_to_json(m)::jsonb ->> 'content'), (row_to_json(m)::jsonb ->> 'message')), 256) FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
    (SELECT count(*)::int FROM public.messages mm WHERE mm.conversation_id = conv.id AND mm.receiver_id = conv.seller_id AND mm.is_read = false),
    'active', now(), now()
  FROM public.conversations conv
  ON CONFLICT (conversation_id, user_id) DO UPDATE
  SET last_message = EXCLUDED.last_message,
      last_message_at = EXCLUDED.last_message_at,
      unread_count = EXCLUDED.unread_count,
      updated_at = now();

EXCEPTION WHEN others THEN
  RAISE NOTICE 'message_cards backfill failed (non-fatal): %', SQLERRM;
END;$$;

COMMIT;

-- Migration: Fix messaging schema, add FKs, ensure message_cards data & RLS

BEGIN;

-- 1) Ensure messages table has required columns
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS sender_id uuid,
  ADD COLUMN IF NOT EXISTS receiver_id uuid,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now());

-- 2) Ensure transactions FKs to user_profile exist (fixes PGRST200 in transactions.getTransaction)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'transactions' AND kcu.column_name = 'buyer_id'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_buyer_fk FOREIGN KEY (buyer_id) REFERENCES public.user_profile(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'transactions' AND kcu.column_name = 'seller_id'
  ) THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_seller_fk FOREIGN KEY (seller_id) REFERENCES public.user_profile(user_id) ON DELETE CASCADE;
  END IF;
END;$$;

-- 3) Ensure messages has FK to user_profile.sender_id
-- Ensure any missing profiles are created as minimal placeholders so we don't lose messages
DO $$
DECLARE
  _count int;
BEGIN
  SELECT COUNT(*) INTO _count FROM public.messages m
  WHERE (m.sender_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = m.sender_id))
     OR (m.receiver_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = m.receiver_id));
  IF _count > 0 THEN
    RAISE NOTICE 'Found % orphaned messages referencing missing user_profile rows; creating placeholder profiles', _count;
    -- Create minimal placeholder user_profile rows for missing senders
    INSERT INTO public.user_profile (user_id, created_at)
    SELECT DISTINCT m.sender_id, now() FROM public.messages m
    WHERE m.sender_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = m.sender_id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create minimal placeholder user_profile rows for missing receivers
    INSERT INTO public.user_profile (user_id, created_at)
    SELECT DISTINCT m.receiver_id, now() FROM public.messages m
    WHERE m.receiver_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = m.receiver_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'messages' AND kcu.column_name = 'sender_id'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_sender_fk FOREIGN KEY (sender_id) REFERENCES public.user_profile(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'messages' AND kcu.column_name = 'receiver_id'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_receiver_fk FOREIGN KEY (receiver_id) REFERENCES public.user_profile(user_id) ON DELETE CASCADE;
  END IF;
END;$$;

-- 4) Ensure message_cards has expected columns and FKs to user_profile
ALTER TABLE public.message_cards
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS other_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_message text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz;

-- Ensure any users referenced by message_cards exist; create minimal placeholder profiles when missing
DO $$
DECLARE
  _cnt_user int;
  _cnt_other int;
BEGIN
  SELECT COUNT(*) INTO _cnt_user FROM public.message_cards mc WHERE mc.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = mc.user_id);
  IF _cnt_user > 0 THEN
    RAISE NOTICE 'Found % message_cards with missing user_id; creating placeholder profiles', _cnt_user;
    INSERT INTO public.user_profile (user_id, created_at)
    SELECT DISTINCT mc.user_id, now() FROM public.message_cards mc
    WHERE mc.user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = mc.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  SELECT COUNT(*) INTO _cnt_other FROM public.message_cards mc WHERE mc.other_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = mc.other_user_id);
  IF _cnt_other > 0 THEN
    RAISE NOTICE 'Found % message_cards with missing other_user_id; creating placeholder profiles', _cnt_other;
    INSERT INTO public.user_profile (user_id, created_at)
    SELECT DISTINCT mc.other_user_id, now() FROM public.message_cards mc
    WHERE mc.other_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.user_id = mc.other_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END;$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'message_cards' AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE public.message_cards ADD CONSTRAINT message_cards_user_fk FOREIGN KEY (user_id) REFERENCES public.user_profile(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'message_cards' AND kcu.column_name = 'other_user_id'
  ) THEN
    ALTER TABLE public.message_cards ADD CONSTRAINT message_cards_other_user_fk FOREIGN KEY (other_user_id) REFERENCES public.user_profile(user_id) ON DELETE CASCADE;
  END IF;
END;$$;

-- 5) Update trigger function to prefer `body` for previews and ensure other_user_id & last_message fields are filled
-- We will replace the existing function if present to ensure consistent behavior
CREATE OR REPLACE FUNCTION public.fn_on_message_insert_upsert_cards_and_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  msg_preview text;
  effective_product_id uuid;
BEGIN
  IF NEW.conversation_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Prefer body column, fallback to json extraction
  msg_preview := left(coalesce(NEW.body, NEW.message_text, (row_to_json(NEW)::jsonb ->> 'content'), (row_to_json(NEW)::jsonb ->> 'message')), 512);

  effective_product_id := NEW.product_id;
  IF effective_product_id IS NULL AND NEW.transaction_id IS NOT NULL THEN
    BEGIN
      SELECT product_id INTO effective_product_id FROM public.transactions WHERE id = NEW.transaction_id LIMIT 1;
    EXCEPTION WHEN others THEN
      effective_product_id := NULL;
    END;
  END IF;

  -- Sender's card: set other_user_id to receiver
  BEGIN
    INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
    VALUES (NEW.conversation_id, NEW.sender_id, NEW.receiver_id, effective_product_id, msg_preview, NEW.created_at, 0, 'active', now(), now())
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        other_user_id = EXCLUDED.other_user_id,
        updated_at = now();
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'sender card upsert issue: %', SQLERRM;
  END;

  -- Receiver's card: set other_user_id to sender and increment unread
  BEGIN
    INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
    VALUES (NEW.conversation_id, NEW.receiver_id, NEW.sender_id, effective_product_id, msg_preview, NEW.created_at, 1, 'active', now(), now())
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        other_user_id = EXCLUDED.other_user_id,
        unread_count = public.message_cards.unread_count + 1,
        updated_at = now();
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'receiver card upsert issue: %', SQLERRM;
  END;

  -- Best-effort notifications (unchanged pattern)
  BEGIN
    IF to_regclass('public.notifications') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'payload') THEN
      IF EXISTS (
        SELECT 1 FROM public.notifications
        WHERE n.user_id = NEW.receiver_id
          AND (n.payload->>'conversation_id') = (NEW.conversation_id::text)
          AND n.type = 'message'
          AND n.read_at IS NULL
        LIMIT 1
      ) THEN
        UPDATE public.notifications
        SET created_at = now(),
            payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{message_preview}', to_jsonb(msg_preview))
        WHERE user_id = NEW.receiver_id
          AND (payload->>'conversation_id') = (NEW.conversation_id::text)
          AND type = 'message'
          AND read_at IS NULL;
      ELSE
        INSERT INTO public.notifications (user_id, type, payload, created_at)
          VALUES (
            NEW.receiver_id,
            CASE WHEN NEW.automation_type = 'meetup_request' THEN 'meetup_proposed' ELSE 'message' END,
            jsonb_build_object('conversation_id', NEW.conversation_id, 'sender_id', NEW.sender_id, 'product_id', effective_product_id::text, 'transaction_id', NEW.transaction_id::text, 'message_preview', msg_preview),
            now()
          );
      END IF;
    END IF;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'notification step failed, continuing: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Re-attach triggers
DROP TRIGGER IF EXISTS trg_messages_after_insert_upsert_cards ON public.messages;
CREATE TRIGGER trg_messages_after_insert_upsert_cards
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.fn_on_message_insert_upsert_cards_and_notify();

DROP TRIGGER IF EXISTS trg_messages_after_update_set_conv ON public.messages;
CREATE TRIGGER trg_messages_after_update_set_conv
AFTER UPDATE OF conversation_id ON public.messages
FOR EACH ROW
WHEN (OLD.conversation_id IS NULL AND NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION public.fn_on_message_insert_upsert_cards_and_notify();

-- 6) RLS: messages visible only to participants
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS messages_insert_authenticated_party ON public.messages;
CREATE POLICY messages_insert_authenticated_party ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS messages_update_owner ON public.messages;
CREATE POLICY messages_update_owner ON public.messages FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid()) WITH CHECK (sender_id = auth.uid() OR receiver_id = auth.uid());

-- message_cards visible only to owner
ALTER TABLE public.message_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS message_cards_user_access ON public.message_cards;
CREATE POLICY message_cards_user_access ON public.message_cards FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Backfill: ensure every conversation has a message_card for buyer and seller (idempotent)
DO $$
DECLARE
  _rows int;
BEGIN
  -- Ensure unique index exists for upserts
  BEGIN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_message_cards_conv_user ON public.message_cards(conversation_id,user_id)';
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not create index idx_message_cards_conv_user: %', SQLERRM;
  END;

  -- Buyer cards
  BEGIN
    INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
    SELECT
      conv.id,
      conv.buyer_id,
      conv.seller_id,
      conv.product_id,
      (SELECT left(coalesce(m.body, m.message_text, (row_to_json(m)::jsonb ->> 'content'), (row_to_json(m)::jsonb ->> 'message')), 512) FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
      (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
      (SELECT count(*)::int FROM public.messages mm WHERE mm.conversation_id = conv.id AND mm.receiver_id = conv.buyer_id AND mm.is_read = false),
      'active', now(), now()
    FROM public.conversations conv
    WHERE conv.buyer_id IS NOT NULL
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        unread_count = EXCLUDED.unread_count,
        updated_at = now();

    GET DIAGNOSTICS _rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled % buyer message_cards', _rows;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Buyer backfill failed (non-fatal): %', SQLERRM;
  END;

  -- Seller cards
  BEGIN
    INSERT INTO public.message_cards (conversation_id, user_id, other_user_id, product_id, last_message, last_message_at, unread_count, status, created_at, updated_at)
    SELECT
      conv.id,
      conv.seller_id,
      conv.buyer_id,
      conv.product_id,
      (SELECT left(coalesce(m.body, m.message_text, (row_to_json(m)::jsonb ->> 'content'), (row_to_json(m)::jsonb ->> 'message')), 512) FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
      (SELECT m.created_at FROM public.messages m WHERE m.conversation_id = conv.id ORDER BY m.created_at DESC LIMIT 1),
      (SELECT count(*)::int FROM public.messages mm WHERE mm.conversation_id = conv.id AND mm.receiver_id = conv.seller_id AND mm.is_read = false),
      'active', now(), now()
    FROM public.conversations conv
    WHERE conv.seller_id IS NOT NULL
    ON CONFLICT (conversation_id, user_id) DO UPDATE
    SET last_message = EXCLUDED.last_message,
        last_message_at = EXCLUDED.last_message_at,
        unread_count = EXCLUDED.unread_count,
        updated_at = now();

    GET DIAGNOSTICS _rows = ROW_COUNT;
    RAISE NOTICE 'Backfilled % seller message_cards', _rows;
  EXCEPTION WHEN others THEN
    RAISE NOTICE 'Seller backfill failed (non-fatal): %', SQLERRM;
  END;
END;$$;

COMMIT;
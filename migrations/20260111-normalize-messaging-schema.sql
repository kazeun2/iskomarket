-- Migration: Normalize user_profile id and ensure messaging schema integrity
-- Adds `id` on user_profile (copy from existing user_id), ensures columns and foreign keys
BEGIN;

-- 0) Ensure user_profile has an 'id' column and a reliable unique key
ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS id uuid;

-- Populate id from existing user_id when empty
UPDATE public.user_profile
SET id = user_id
WHERE id IS NULL AND user_id IS NOT NULL;

-- Make id NOT NULL if possible
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profile' AND column_name='id') THEN
    -- If there is no primary key defined already, add a unique constraint on id
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints tc WHERE tc.table_name = 'user_profile' AND tc.constraint_type = 'PRIMARY KEY') THEN
      BEGIN
        EXECUTE 'ALTER TABLE public.user_profile ADD CONSTRAINT user_profile_pk PRIMARY KEY (id)';
      EXCEPTION WHEN others THEN
        -- If adding PK fails (existing PK on another column), ignore and keep id as unique
        BEGIN
          EXECUTE 'ALTER TABLE public.user_profile ADD CONSTRAINT user_profile_id_unique UNIQUE (id)';
        EXCEPTION WHEN others THEN
          RAISE NOTICE 'Could not add primary key or unique constraint on user_profile.id: %', SQLERRM;
        END;
      END;
    END IF;
  END IF;
END;$$;

-- Ensure display_name/username columns exist
ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- 1) Ensure conversations table exists with expected foreign keys (buyer_id/seller_id referencing user_profile.id)
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid,
  seller_id uuid,
  product_id uuid,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'conversations' AND kcu.column_name = 'buyer_id'
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_buyer_fk FOREIGN KEY (buyer_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'conversations' AND kcu.column_name = 'seller_id'
  ) THEN
    ALTER TABLE public.conversations ADD CONSTRAINT conversations_seller_fk FOREIGN KEY (seller_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
  END IF;
END;$$;

-- 2) Ensure messages has required columns and FK to user_profile(id)
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS sender_id uuid,
  ADD COLUMN IF NOT EXISTS receiver_id uuid,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT timezone('utc', now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'messages' AND kcu.column_name = 'sender_id'
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_sender_fk FOREIGN KEY (sender_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'messages' AND kcu.column_name = 'receiver_id'
  ) THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_fk FOREIGN KEY (receiver_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
  END IF;
END;$$;

-- 3) Ensure message_cards has required columns and FKs to user_profile(id)
ALTER TABLE public.message_cards
  ADD COLUMN IF NOT EXISTS conversation_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS other_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_message text,
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS unread_count integer DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'message_cards' AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE public.message_cards ADD CONSTRAINT message_cards_user_fk FOREIGN KEY (user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'message_cards' AND kcu.column_name = 'other_user_id'
  ) THEN
    ALTER TABLE public.message_cards ADD CONSTRAINT message_cards_other_user_fk FOREIGN KEY (other_user_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
  END IF;
END;$$;

-- 4) Ensure transactions buyer/seller fks reference user_profile(id) (compatibility)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'transactions' AND kcu.column_name = 'buyer_id'
    ) THEN
      ALTER TABLE public.transactions ADD CONSTRAINT transactions_buyer_fk FOREIGN KEY (buyer_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'transactions' AND kcu.column_name = 'seller_id'
    ) THEN
      ALTER TABLE public.transactions ADD CONSTRAINT transactions_seller_fk FOREIGN KEY (seller_id) REFERENCES public.user_profile(id) ON DELETE CASCADE;
    END IF;
  END IF;
END;$$;

COMMIT;

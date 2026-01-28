-- Migration: Add meetup support and normalize transactions table
-- Adds meetup columns (if missing), adds buyer/seller/product columns (if missing), backfills from existing sender/receiver values,
-- adds helpful indexes and FKs (only when referenced tables exist), and updates RLS policies idempotently.
-- Run this as an admin (e.g., in Supabase SQL Editor) and restart PostgREST / Supabase API after running so PostgREST picks up schema changes.

-- 1) Add columns we need for the canonical design
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS buyer_id uuid,
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS meetup_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS meetup_location TEXT,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS meetup_confirmed_by_buyer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS meetup_confirmed_by_seller boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  -- New helper column for index-friendly meetup date (date only)
  ADD COLUMN IF NOT EXISTS meetup_date_date DATE;

-- 2) Backfill buyer_id/seller_id from existing sender_id/receiver_id where appropriate
UPDATE public.transactions
SET buyer_id = sender_id
WHERE buyer_id IS NULL AND sender_id IS NOT NULL;

UPDATE public.transactions
SET seller_id = receiver_id
WHERE seller_id IS NULL AND receiver_id IS NOT NULL;

-- 2b) Ensure existing rows have a status value (defaults won't affect old NULLs)
UPDATE public.transactions
SET status = 'pending'
WHERE status IS NULL;

-- 3) Create indexes to speed lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_transactions_product_id ON public.transactions(product_id);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sender_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_sender_id ON public.transactions(sender_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receiver_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_receiver_id ON public.transactions(receiver_id)';
  END IF;
END
$$;

-- 4) Add FK constraints only if the referenced tables exist; respect `user_profile.user_id` if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND c.relname='products') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_product_id_fkey') THEN
      ALTER TABLE public.transactions ADD CONSTRAINT transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);
    END IF;
  END IF;

  -- Prefer existing `user_profile(user_id)` FK if present since legacy FK points there; else fallback to `users(id)`
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND c.relname='user_profile') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_buyer_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.user_profile(user_id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_seller_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.user_profile(user_id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sender_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_sender_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.user_profile(user_id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receiver_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_receiver_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.user_profile(user_id);
      END IF;
    END IF;
  ELSIF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname='public' AND c.relname='users') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_buyer_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'seller_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_seller_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sender_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_sender_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);
      END IF;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receiver_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_receiver_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id);
      END IF;
    END IF;
  END IF;
END
$$;

-- 4b) Ensure explicit FKs to auth.users so PostgREST can discover relationships
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname = 'auth') THEN
    -- Drop any existing sender/receiver FK constraints so we can recreate them pointing at auth.users
    ALTER TABLE public.transactions
      DROP CONSTRAINT IF EXISTS transactions_sender_id_fkey,
      DROP CONSTRAINT IF EXISTS transactions_receiver_id_fkey;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sender_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_sender_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id);
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'receiver_id') THEN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_receiver_id_fkey') THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id);
      END IF;
    END IF;
  END IF;
END
$$;

-- 5) Add a unique constraint on (product_id, buyer_id, seller_id) (or sender/receiver if present) only if there are no duplicates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_product_buyer_seller_unique') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'buyer_id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM (
          SELECT product_id, buyer_id, seller_id, COUNT(*) AS cnt
          FROM public.transactions
          GROUP BY product_id, buyer_id, seller_id
          HAVING COUNT(*) > 1
        ) dup
      ) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_product_buyer_seller_unique UNIQUE (product_id, buyer_id, seller_id);
      END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sender_id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM (
          SELECT product_id, sender_id, receiver_id, COUNT(*) AS cnt
          FROM public.transactions
          GROUP BY product_id, sender_id, receiver_id
          HAVING COUNT(*) > 1
        ) dup
      ) THEN
        ALTER TABLE public.transactions ADD CONSTRAINT transactions_product_buyer_seller_unique UNIQUE (product_id, sender_id, receiver_id);
      END IF;
    END IF;
  END IF;

  -- New index to speed up date-only meetup queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'meetup_date_date') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_meetup_date_date ON public.transactions(meetup_date_date)';
  END IF;

-- Drop any old buyer_id/seller_id policies and create sender/receiver-only policies
-- (This enforces the canonical sender_id/receiver_id model used by the app and PostgREST)
DROP POLICY IF EXISTS transactions_insert_by_party ON public.transactions;
DROP POLICY IF EXISTS transactions_select_by_party ON public.transactions;
DROP POLICY IF EXISTS transactions_update_by_party ON public.transactions;

DO $$
BEGIN
  -- Ensure sender/receiver columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sender_id') THEN

    -- INSERT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_insert_by_party'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY transactions_insert_by_party
          ON public.transactions
          FOR INSERT
          WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
      $pol$;
    END IF;

    -- SELECT policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_select_by_party'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY transactions_select_by_party
          ON public.transactions
          FOR SELECT
          USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
      $pol$;
    END IF;

    -- UPDATE policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'transactions_update_by_party'
    ) THEN
      EXECUTE $pol$
        CREATE POLICY transactions_update_by_party
          ON public.transactions
          FOR UPDATE
          USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
          WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
      $pol$;
    END IF;

  ELSE
    RAISE NOTICE 'transactions policies creation skipped: sender_id/receiver_id columns not present';
  END IF;
END
$$;

-- 7) Helpful verification queries (run after migration to verify)
-- Show relevant columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'transactions'
  AND column_name IN ('product_id','buyer_id','seller_id','meetup_date','meetup_location','meetup_date_date');

-- Show FK constraints on transactions
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.transactions'::regclass AND contype = 'f';

-- Verify policies for transactions (should reference sender_id/receiver_id only)
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'transactions';

-- Helpful helper to copy meetup_date -> meetup_date_date for existing rows
UPDATE public.transactions
SET meetup_date_date = meetup_date::date
WHERE meetup_date IS NOT NULL AND meetup_date_date IS NULL;

-- Add trigger to keep meetup_date_date in sync when meetup_date is updated
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'transactions_meetup_date_date_sync_trigger') THEN
    EXECUTE $exec$
      CREATE FUNCTION public.transactions_meetup_date_date_sync() RETURNS trigger AS $$
      BEGIN
        NEW.meetup_date_date := NEW.meetup_date::date;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER transactions_meetup_date_date_sync_trigger
      BEFORE INSERT OR UPDATE ON public.transactions
      FOR EACH ROW
      EXECUTE PROCEDURE public.transactions_meetup_date_date_sync();
    $exec$;
  END IF;
END
$$;

-- Note:
-- - Backfill of product_id is intentionally excluded because determining product_id from historical messages may be ambiguous; use the helper SELECT below to inspect candidates and backfill manually after review.
-- Helper: inspect candidate product_id values referenced in messages for transactions missing product_id
SELECT t.id AS transaction_id, t.sender_id, t.receiver_id, m.product_id AS candidate_product_id, m.id AS message_id, m.created_at AS msg_created_at
FROM public.transactions t
JOIN public.messages m
  ON (
     (m.sender_id = t.sender_id AND m.receiver_id = t.receiver_id)
     OR (m.sender_id = t.receiver_id AND m.receiver_id = t.sender_id)
  )
WHERE m.product_id IS NOT NULL
  AND t.product_id IS NULL
ORDER BY t.id, m.created_at DESC
LIMIT 500;

-- After running this migration, restart the Supabase API (Project → Settings → API → Restart) to refresh PostgREST schema cache and then re-generate types locally:
-- supabase gen types typescript --schema public > src/lib/database.types.ts

-- Ensure canonical message column exists and backfill legacy names
-- 1) Add `message_text` column if missing
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_text TEXT;

-- 2) Backfill message_text from legacy `content` or `message` columns if present (defensive)
-- Some deployments may not have `content` or `message` columns; referencing missing columns causes an error.
-- Use a DO block to detect available legacy columns and run an UPDATE that only references existing columns.
DO $$
DECLARE
  has_content boolean := EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='content'
  );
  has_message boolean := EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='message'
  );
  sql text := '';
BEGIN
  IF has_content OR has_message THEN
    sql := 'UPDATE public.messages SET message_text = COALESCE(message_text';
    IF has_content THEN
      sql := sql || ', content';
    END IF;
    IF has_message THEN
      sql := sql || ', message';
    END IF;
    sql := sql || ') WHERE (message_text IS NULL OR message_text = '''')';

    sql := sql || ' AND (';
    IF has_content THEN
      sql := sql || 'content IS NOT NULL';
    END IF;
    IF has_content AND has_message THEN
      sql := sql || ' OR ';
    END IF;
    IF has_message THEN
      sql := sql || 'message IS NOT NULL';
    END IF;
    sql := sql || ');';

    EXECUTE sql;
  ELSE
    RAISE NOTICE 'No legacy message columns (content or message) found; skipping backfill';
  END IF;
END$$;

-- 3) Create index for faster conversation lookups
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);

-- 4) Attempt to repair messages that are missing a conversation_id but have product_id
-- This block will create conversations when possible (one conversation per product per buyer/seller pair)
-- Be defensive: some schemas may not include `product_id`, `sender_id`, or `receiver_id`.
DO $$
DECLARE
  r RECORD;
  v_conv_id uuid;
  v_prod_seller uuid;
  v_buyer_id uuid;
  has_receiver boolean := EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='receiver_id'
  );
  has_product boolean := EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='product_id'
  );
  has_sender boolean := EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='sender_id'
  );
BEGIN
  IF NOT has_product THEN
    RAISE NOTICE 'No product_id column found on messages table; skipping repair of orphan messages';
    RETURN;
  END IF;

  IF NOT has_sender THEN
    RAISE NOTICE 'No sender_id column found on messages table; skipping repair of orphan messages';
    RETURN;
  END IF;

  IF has_receiver THEN
    FOR r IN SELECT id, sender_id, receiver_id, product_id FROM public.messages WHERE conversation_id IS NULL AND product_id IS NOT NULL LOOP
      -- Try to find existing conversation
      SELECT id INTO v_conv_id FROM public.conversations
        WHERE product_id = r.product_id
          AND ((buyer_id = r.sender_id AND seller_id = r.receiver_id)
               OR (buyer_id = r.receiver_id AND seller_id = r.sender_id))
        LIMIT 1;

      IF v_conv_id IS NULL THEN
        -- Determine product seller to decide which side is buyer/seller
        SELECT seller_id INTO v_prod_seller FROM public.products WHERE id = r.product_id LIMIT 1;
        IF v_prod_seller IS NULL THEN
          RAISE NOTICE 'Product % not found; skipping message %', r.product_id, r.id;
          CONTINUE;
        END IF;

        IF v_prod_seller = r.sender_id THEN
          v_buyer_id := r.receiver_id;
        ELSE
          v_buyer_id := r.sender_id;
        END IF;

        INSERT INTO public.conversations (product_id, buyer_id, seller_id)
        VALUES (r.product_id, v_buyer_id, v_prod_seller)
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_conv_id;

        -- If ON CONFLICT DO NOTHING prevented insert, try to select again
        IF v_conv_id IS NULL THEN
          SELECT id INTO v_conv_id FROM public.conversations
            WHERE product_id = r.product_id
              AND buyer_id = v_buyer_id
              AND seller_id = v_prod_seller
            LIMIT 1;
        END IF;
      END IF;

      IF v_conv_id IS NOT NULL THEN
        UPDATE public.messages SET conversation_id = v_conv_id WHERE id = r.id;
        RAISE NOTICE 'Linked message % to conversation %', r.id, v_conv_id;
      ELSE
        RAISE NOTICE 'Could not resolve conversation for message %', r.id;
      END IF;
    END LOOP;
  ELSE
    -- No receiver_id column: attempt to infer buyer from sender and product seller when possible
    FOR r IN SELECT id, sender_id, product_id FROM public.messages WHERE conversation_id IS NULL AND product_id IS NOT NULL LOOP
      -- Try to find existing conversation where sender is a participant
      SELECT id INTO v_conv_id FROM public.conversations
        WHERE product_id = r.product_id
          AND (buyer_id = r.sender_id OR seller_id = r.sender_id)
        LIMIT 1;

      IF v_conv_id IS NULL THEN
        SELECT seller_id INTO v_prod_seller FROM public.products WHERE id = r.product_id LIMIT 1;
        IF v_prod_seller IS NULL THEN
          RAISE NOTICE 'Product % not found; skipping message %', r.product_id, r.id;
          CONTINUE;
        END IF;

        -- If sender is not the seller, treat sender as buyer; otherwise we cannot determine buyer
        IF r.sender_id IS NOT NULL AND r.sender_id <> v_prod_seller THEN
          v_buyer_id := r.sender_id;
        ELSE
          RAISE NOTICE 'Insufficient information to create conversation for message % (sender % is seller or unknown)', r.id, r.sender_id;
          CONTINUE;
        END IF;

        INSERT INTO public.conversations (product_id, buyer_id, seller_id)
        VALUES (r.product_id, v_buyer_id, v_prod_seller)
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_conv_id;

        IF v_conv_id IS NULL THEN
          SELECT id INTO v_conv_id FROM public.conversations
            WHERE product_id = r.product_id
              AND buyer_id = v_buyer_id
              AND seller_id = v_prod_seller
            LIMIT 1;
        END IF;
      END IF;

      IF v_conv_id IS NOT NULL THEN
        UPDATE public.messages SET conversation_id = v_conv_id WHERE id = r.id;
        RAISE NOTICE 'Linked message % to conversation %', r.id, v_conv_id;
      ELSE
        RAISE NOTICE 'Could not resolve conversation for message %', r.id;
      END IF;
    END LOOP;
  END IF;
END$$;

-- 5) Quick verification queries (run interactively after migration):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='messages';
-- SELECT * FROM pg_policies WHERE tablename IN ('products','messages','conversations');
-- SELECT id FROM public.messages WHERE conversation_id IS NULL LIMIT 20;

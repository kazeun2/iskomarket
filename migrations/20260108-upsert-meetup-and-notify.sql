-- Migration: Add RPC upsert helper to create-or-update meetup + optional message creation
-- Use this when you want a single server-side entrypoint for creating/updating meetup details.
-- IMPORTANT: Create this function as a DB admin (it uses SECURITY DEFINER and will run with the owner's privileges).

BEGIN;

-- Ensure search_path so function finds public schema objects even when called from RPC
SET LOCAL search_path = public;

CREATE OR REPLACE FUNCTION public.upsert_meetup_and_notify(
  p_product_id UUID,
  p_buyer_id UUID,
  p_seller_id UUID,
  p_amount NUMERIC,
  p_meetup_location VARCHAR,
  p_meetup_date TIMESTAMPTZ DEFAULT NULL,
  p_initiator_id UUID DEFAULT NULL -- optional: who triggered the action (for message sender)
)
RETURNS TABLE(
  id UUID,
  buyer_id UUID,
  seller_id UUID,
  product_id UUID,
  meetup_location VARCHAR,
  meetup_date TIMESTAMPTZ,
  status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx transactions%ROWTYPE;
  v_conv_id UUID;
BEGIN
  -- Try to find an existing pending/confirmed transaction for this product and parties
  SELECT * INTO v_tx
  FROM transactions
  WHERE product_id = p_product_id
    AND ((buyer_id = p_buyer_id AND seller_id = p_seller_id)
         OR (buyer_id = p_seller_id AND seller_id = p_buyer_id))
    AND status IN ('pending', 'confirmed')
  LIMIT 1;

  IF FOUND THEN
    UPDATE transactions
    SET meetup_location = p_meetup_location,
        meetup_date = p_meetup_date,
        updated_at = NOW()
    WHERE id = v_tx.id
    RETURNING id, buyer_id, seller_id, product_id, meetup_location, meetup_date, status INTO id, buyer_id, seller_id, product_id, meetup_location, meetup_date, status;
  ELSE
    INSERT INTO transactions (product_id, buyer_id, seller_id, amount, status, meetup_location, meetup_date, created_at, updated_at)
    VALUES (p_product_id, p_buyer_id, p_seller_id, p_amount, 'pending', p_meetup_location, p_meetup_date, NOW(), NOW())
    RETURNING id, buyer_id, seller_id, product_id, meetup_location, meetup_date, status INTO id, buyer_id, seller_id, product_id, meetup_location, meetup_date, status;
  END IF;

  -- Attempt to find a conversation for this product and parties
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE product_id = p_product_id
    AND ((buyer_id = p_buyer_id AND seller_id = p_seller_id)
         OR (buyer_id = p_seller_id AND seller_id = p_buyer_id))
  LIMIT 1;

  -- Insert an automated message into the conversation if exists and meetup_location is set
  IF v_conv_id IS NOT NULL AND COALESCE(p_meetup_location, '') <> '' THEN
    INSERT INTO messages (conversation_id, sender_id, message_text, is_automated, automation_type, created_at)
    VALUES (v_conv_id, COALESCE(p_initiator_id, p_buyer_id), 'Meet-up agreed: ' || p_meetup_location, TRUE, 'meetup_notification', NOW());

    -- Update conversation last_message info for UI convenience
    UPDATE conversations SET last_message_id = (SELECT id FROM messages WHERE conversation_id = v_conv_id ORDER BY created_at DESC LIMIT 1), last_message_at = NOW() WHERE id = v_conv_id;
  END IF;

  RETURN NEXT;
END;
$$;

COMMIT;

-- Usage (client):
-- select * from public.upsert_meetup_and_notify('product-uuid', 'buyer-uuid', 'seller-uuid', 100.00, 'Main Gate', now());
-- Or call via supabase.rpc('upsert_meetup_and_notify', { p_product_id: '...', p_buyer_id: '...', p_seller_id: '...', p_amount: 100, p_meetup_location: 'Main Gate' });

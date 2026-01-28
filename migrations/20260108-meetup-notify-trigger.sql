-- Optional migration: DB trigger to notify conversation when meetup_location changes
-- This is an alternative or complement to performing message insertion inside the RPC.

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_meetup_change()
RETURNS TRIGGER AS $$
DECLARE
  v_conv_id UUID;
  v_sender UUID;
BEGIN
  -- Only proceed when meetup_location changed and is not null/empty
  IF NEW.meetup_location IS NULL OR COALESCE(NEW.meetup_location, '') = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND COALESCE(NEW.meetup_location, '') = COALESCE(OLD.meetup_location, '') THEN
    RETURN NEW; -- no change
  END IF;

  -- Find a conversation for this product & parties
  SELECT id INTO v_conv_id
  FROM conversations
  WHERE product_id = NEW.product_id
    AND (buyer_id = NEW.buyer_id AND seller_id = NEW.seller_id OR buyer_id = NEW.seller_id AND seller_id = NEW.buyer_id)
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    -- Optionally, create the conversation here. For now, skip creating new conversation.
    RETURN NEW;
  END IF;

  -- Choose sender: prefer the buyer as sender for meetup notifications; you can adjust this
  v_sender := NEW.buyer_id;

  INSERT INTO messages (conversation_id, sender_id, message_text, is_automated, automation_type, created_at)
  VALUES (v_conv_id, v_sender, 'Meet-up agreed: ' || NEW.meetup_location, TRUE, 'meetup_notification', NOW());

  -- Update conversation's last message metadata
  UPDATE conversations SET last_message_id = (SELECT id FROM messages WHERE conversation_id = v_conv_id ORDER BY created_at DESC LIMIT 1), last_message_at = NOW() WHERE id = v_conv_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger after insert or update of meetup_location
DROP TRIGGER IF EXISTS trg_notify_meetup_change ON public.transactions;
CREATE TRIGGER trg_notify_meetup_change
AFTER INSERT OR UPDATE OF meetup_location ON public.transactions
FOR EACH ROW
WHEN (NEW.meetup_location IS DISTINCT FROM OLD.meetup_location)
EXECUTE FUNCTION public.notify_meetup_change();

COMMIT;

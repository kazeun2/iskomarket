-- Create trigger to ensure messages always have a conversation_id
-- This will create a conversation automatically when a new message is inserted without one

CREATE OR REPLACE FUNCTION public.ensure_message_conversation()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  conv_id uuid;
  prod_seller uuid;
  buyer_id uuid;
BEGIN
  -- If conversation_id already provided, nothing to do
  IF NEW.conversation_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- If product_id provided, try to find or create a product-specific conversation
  IF NEW.product_id IS NOT NULL THEN
    -- Try to find an existing conversation with matching participants for this product
    SELECT id INTO conv_id FROM public.conversations
      WHERE product_id = NEW.product_id
        AND ((buyer_id = NEW.sender_id AND seller_id = NEW.receiver_id)
             OR (buyer_id = NEW.receiver_id AND seller_id = NEW.sender_id))
      LIMIT 1;

    IF conv_id IS NULL THEN
      SELECT seller_id INTO prod_seller FROM public.products WHERE id = NEW.product_id LIMIT 1;
      IF prod_seller IS NULL THEN
        RAISE NOTICE 'ensure_message_conversation: product % not found; message will be inserted without conversation_id', NEW.product_id;
        RETURN NEW;
      END IF;

      IF prod_seller = NEW.sender_id THEN
        buyer_id := NEW.receiver_id;
      ELSE
        buyer_id := NEW.sender_id;
      END IF;

      INSERT INTO public.conversations (product_id, buyer_id, seller_id)
      VALUES (NEW.product_id, buyer_id, prod_seller)
      ON CONFLICT DO NOTHING
      RETURNING id INTO conv_id;

      IF conv_id IS NULL THEN
        SELECT id INTO conv_id FROM public.conversations
          WHERE product_id = NEW.product_id
            AND buyer_id = buyer_id
            AND seller_id = prod_seller
          LIMIT 1;
      END IF;
    END IF;

    IF conv_id IS NOT NULL THEN
      NEW.conversation_id := conv_id;
      RETURN NEW;
    ELSE
      -- If could not determine conversation, allow insert to continue; other code may later fix
      RAISE NOTICE 'ensure_message_conversation: could not determine conversation for product %; message % will be left without conversation', NEW.product_id, NEW.id;
      RETURN NEW;
    END IF;
  END IF;

  -- If no product_id, try to find or create a conversation between participants without product
  SELECT id INTO conv_id FROM public.conversations
    WHERE product_id IS NULL
      AND ((buyer_id = NEW.sender_id AND seller_id = NEW.receiver_id)
           OR (buyer_id = NEW.receiver_id AND seller_id = NEW.sender_id))
    LIMIT 1;

  IF conv_id IS NULL THEN
    -- Create conversation with product_id NULL
    INSERT INTO public.conversations (product_id, buyer_id, seller_id)
    VALUES (NULL, NEW.sender_id, NEW.receiver_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO conv_id;

    IF conv_id IS NULL THEN
      SELECT id INTO conv_id FROM public.conversations
        WHERE product_id IS NULL
          AND buyer_id = NEW.sender_id
          AND seller_id = NEW.receiver_id
        LIMIT 1;
    END IF;
  END IF;

  IF conv_id IS NOT NULL THEN
    NEW.conversation_id := conv_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_message_conversation ON public.messages;
CREATE TRIGGER trg_ensure_message_conversation
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.ensure_message_conversation();

-- Migration: Add safe_update_product RPC to perform controlled updates when PostgREST nested selects fail

BEGIN;

CREATE OR REPLACE FUNCTION public.safe_update_product(p_id uuid, p_payload jsonb)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  key text;
  set_clauses text := '';
  val text;
  res public.products%ROWTYPE;
BEGIN
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN
    RAISE EXCEPTION 'p_payload must be a json object';
  END IF;

  FOR key IN SELECT jsonb_object_keys(p_payload)
  LOOP
    -- Only allow updating known safe columns
    IF key IN (
      'title','description','price','category','condition','images','location',
      'is_available','is_sold','is_hidden','is_for_cause','cause_organization',
      'goal_amount','raised_amount','views','interested','sold_at'
    ) THEN
      IF (p_payload ->> key) IS NULL OR (p_payload ->> key) = '' THEN
        set_clauses := set_clauses || format('%I = NULL,', key);
      ELSE
        IF key = 'images' THEN
          -- images stored as JSONB
          set_clauses := set_clauses || format('%I = %s::jsonb,', key, quote_literal(p_payload ->> key));
        ELSIF key IN ('price','goal_amount','raised_amount') THEN
          set_clauses := set_clauses || format('%I = %s::numeric,', key, quote_literal(p_payload ->> key));
        ELSIF key IN ('views','interested') THEN
          set_clauses := set_clauses || format('%I = %s::int,', key, quote_literal(p_payload ->> key));
        ELSIF key IN ('is_available','is_sold','is_hidden','is_for_cause') THEN
          set_clauses := set_clauses || format('%I = %s::boolean,', key, quote_literal(p_payload ->> key));
        ELSIF key = 'sold_at' THEN
          set_clauses := set_clauses || format('%I = %s::timestamptz,', key, quote_literal(p_payload ->> key));
        ELSE
          set_clauses := set_clauses || format('%I = %s,', key, quote_literal(p_payload ->> key));
        END IF;
      END IF;
    END IF;
  END LOOP;

  IF set_clauses = '' THEN
    SELECT * INTO res FROM public.products WHERE id = p_id LIMIT 1;
    RETURN res;
  END IF;

  -- Remove trailing comma
  set_clauses := left(set_clauses, -1);

  EXECUTE format('UPDATE public.products SET %s, updated_at = now() WHERE id = %L', set_clauses, p_id::text);

  SELECT * INTO res FROM public.products WHERE id = p_id LIMIT 1;
  RETURN res;
END;
$$;

-- Grant execute to authenticated so authenticated clients can call the RPC
GRANT EXECUTE ON FUNCTION public.safe_update_product(uuid, jsonb) TO authenticated;

COMMIT;

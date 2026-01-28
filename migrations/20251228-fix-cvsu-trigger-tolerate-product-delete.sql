-- Migration: 20251228-fix-cvsu-trigger-tolerate-product-delete.sql
-- Purpose: Make cvsu_market_sync_product tolerant when delete_product_fallback fails
-- so that a failing best-effort product cleanup does not abort the CVSU row DELETE.

BEGIN;

-- Replace function with error-tolerant variant
CREATE OR REPLACE FUNCTION public.cvsu_market_sync_product() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  cvsu_cat_id uuid;
  inserted_prod_id uuid;
  default_seller uuid;
  price_nullable text;
  price_to_set numeric := NULL;
BEGIN
  -- ensure we have a CvSU category id (create a fallback if none exists)
  SELECT id INTO cvsu_cat_id FROM public.categories WHERE name ILIKE 'CvSU%' LIMIT 1;
  IF cvsu_cat_id IS NULL THEN
    INSERT INTO public.categories (name) VALUES ('CvSU Market') ON CONFLICT (name) DO NOTHING;
    SELECT id INTO cvsu_cat_id FROM public.categories WHERE name = 'CvSU Market' LIMIT 1;
  END IF;

  -- find an admin user to attribute as the seller if needed (best-effort)
  SELECT id INTO default_seller FROM public.users WHERE COALESCE(is_admin, false) = true LIMIT 1;

  -- Determine whether the products.price column allows NULL; if not, use 0 as fallback
  SELECT is_nullable INTO price_nullable FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price' LIMIT 1;
  IF price_nullable = 'NO' THEN
    price_to_set := 0;
  ELSE
    price_to_set := NULL;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    -- create a products row if none exists yet for this cvsu entry
    IF (NEW.product_id IS NULL) THEN
      INSERT INTO public.products (
        title, description, price, category_id, images, seller_id, condition, is_cvsu_only, is_available, is_hidden, is_deleted, views, interested, created_at, updated_at
      ) VALUES (
        NEW.title,
        COALESCE(NEW.description, NEW.title),
        price_to_set,
        cvsu_cat_id,
        to_jsonb(NEW.images)::jsonb,
        default_seller,
        'Not specified',
        true,
        true,
        false,
        false,
        0,
        0,
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now())
      ) RETURNING id INTO inserted_prod_id;

      IF inserted_prod_id IS NOT NULL THEN
        UPDATE public.cvsu_market_products SET product_id = inserted_prod_id WHERE id = NEW.id;
      END IF;
    ELSE
      -- product_id exists: ensure the products row is updated
      UPDATE public.products SET
        title = NEW.title,
        description = COALESCE(NEW.description, NEW.title),
        images = to_jsonb(NEW.images)::jsonb,
        category_id = cvsu_cat_id,
        updated_at = now()
      WHERE id = NEW.product_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.product_id IS NOT NULL) THEN
      -- update products row when linked
      UPDATE public.products SET
        title = NEW.title,
        description = COALESCE(NEW.description, NEW.title),
        images = to_jsonb(NEW.images)::jsonb,
        category_id = cvsu_cat_id,
        updated_at = now()
      WHERE id = NEW.product_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    -- when a cvsu row is deleted, attempt to soft-delete any linked product
    IF (OLD.product_id IS NOT NULL) THEN
      -- best-effort: do not let the product-delete failure abort the cvsu delete
      BEGIN
        PERFORM public.delete_product_fallback(OLD.product_id::text, 'Deleted via cvsu_market_products');
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'cvsu_market_sync_product: delete_product_fallback failed for product_id=%: %', OLD.product_id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Recreate trigger to ensure it uses the new function
DROP TRIGGER IF EXISTS trg_cvsu_sync_product ON public.cvsu_market_products;
CREATE TRIGGER trg_cvsu_sync_product
  AFTER INSERT OR UPDATE OR DELETE ON public.cvsu_market_products
  FOR EACH ROW EXECUTE FUNCTION public.cvsu_market_sync_product();

COMMIT;

-- Quick verification (run manually in SQL console):
-- 1) DELETE FROM public.cvsu_market_products WHERE id = '<uuid>' RETURNING *; -- should return the row and not error even if linked product delete fails
-- 2) SELECT * FROM public.admin_delete_cvsu_product('<uuid>'); -- admin RPC should also succeed

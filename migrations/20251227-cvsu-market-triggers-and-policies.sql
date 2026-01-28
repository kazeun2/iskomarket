-- Migration: 20251227-cvsu-market-triggers-and-policies.sql
-- Purpose: Add RLS policies for admin management of cvsu_market_products and
-- create triggers to keep products table in sync and cascade deletions.

BEGIN;

-- 1) Row-Level Security and Policies
-- Enable RLS (safe because we'll add explicit policies for public SELECT and admin writes)
ALTER TABLE public.cvsu_market_products ENABLE ROW LEVEL SECURITY;

-- Allow public read (SELECT) for the CvSU table/view (the view is already granted to anon/authenticated, but add explicit policy too so clients behind RLS can still read)
DROP POLICY IF EXISTS "cvsu_market_public_select" ON public.cvsu_market_products;
CREATE POLICY "cvsu_market_public_select" ON public.cvsu_market_products
  FOR SELECT
  USING (true);

-- Allow only admin users to INSERT
DROP POLICY IF EXISTS "cvsu_market_insert_admin" ON public.cvsu_market_products;
CREATE POLICY "cvsu_market_insert_admin" ON public.cvsu_market_products
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true));

-- Allow only admin users to UPDATE
DROP POLICY IF EXISTS "cvsu_market_update_admin" ON public.cvsu_market_products;
CREATE POLICY "cvsu_market_update_admin" ON public.cvsu_market_products
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true));

-- Allow only admin users to DELETE
DROP POLICY IF EXISTS "cvsu_market_delete_admin" ON public.cvsu_market_products;
CREATE POLICY "cvsu_market_delete_admin" ON public.cvsu_market_products
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true));

-- Note: We keep SELECT open for public read to match the view grant and make the CvSU catalog available to clients

-- 2) Function to sync cvsu_market_products -> products
CREATE OR REPLACE FUNCTION public.cvsu_market_sync_product() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  cvsu_cat_id uuid;
  inserted_prod_id uuid;
  default_seller uuid;
  price_nullable text;
  price_to_set numeric := NULL;
  v_rowcount integer := 0;
BEGIN
  -- Diagnostic: log the trigger invocation and acting user
  RAISE NOTICE 'cvsu_market_sync_product: invoked TG_OP=% TG_TABLE=% TG_WHEN=% on id=%', TG_OP, TG_TABLE_NAME, TG_WHEN, COALESCE(NEW.id::text, OLD.id::text);
  RAISE NOTICE 'current_user=%, session_user=%', current_user, session_user;
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
      BEGIN
        -- Preferred: use the centralized RPC which handles legacy id forms and compatibility
        PERFORM public.delete_product_fallback(OLD.product_id::text, 'Deleted via cvsu_market_products');
      EXCEPTION WHEN OTHERS THEN
        -- Fallback: try a direct, minimal update to ensure the product is marked deleted so it won't appear in listings.
        -- This protects against RPC failures, missing columns, or unexpected schema drift.
        RAISE NOTICE 'cvsu_market_sync_product: delete_product_fallback failed; applying fallback direct-update for product %', OLD.product_id;
        BEGIN
          UPDATE public.products
          SET is_deleted = true, deletion_reason = 'Deleted via cvsu_market_products (fallback)'
          WHERE id = OLD.product_id;
        EXCEPTION WHEN OTHERS THEN
          -- swallow to avoid causing the parent delete to fail; admins can investigate logs
          RAISE NOTICE 'cvsu_market_sync_product: fallback update also failed for product %: %', OLD.product_id, SQLERRM;
        END;
      END;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- 3) Triggers
DROP TRIGGER IF EXISTS trg_cvsu_sync_product ON public.cvsu_market_products;
CREATE TRIGGER trg_cvsu_sync_product
  AFTER INSERT OR UPDATE OR DELETE ON public.cvsu_market_products
  FOR EACH ROW EXECUTE FUNCTION public.cvsu_market_sync_product();

-- 4) Ensure cvsu table updated_at gets touched on row changes (small helper trigger)
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cvsu_touch_updated ON public.cvsu_market_products;
CREATE TRIGGER trg_cvsu_touch_updated
  BEFORE UPDATE ON public.cvsu_market_products
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

COMMIT;
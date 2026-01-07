-- Migration: 20251225-allow-null-price-for-cvsu-products.sql
-- Purpose: Make `products.price` nullable so CvSU items can have no price,
-- nullify price for already-migrated CvSU products, and add a CHECK constraint
-- to ensure that if a product is in CvSU market, price must be NULL.

BEGIN;

-- 1) Make price nullable if it is currently NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;
  END IF;
END
$$;

-- 2) Ensure we have the is_in_cvsu_market flag column (idempotent)
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_in_cvsu_market boolean DEFAULT false;

-- 3) Nullify price for products that are in the cvsu table (if any)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price') THEN
    UPDATE public.products
    SET price = NULL
    WHERE id IN (SELECT product_id FROM public.cvsu_market_products WHERE product_id IS NOT NULL);
  END IF;
END
$$;

-- 4) Mark those products as is_in_cvsu_market so future checks are easy
UPDATE public.products
SET is_in_cvsu_market = true
WHERE id IN (SELECT product_id FROM public.cvsu_market_products WHERE product_id IS NOT NULL);

-- 5) Add a CHECK constraint to enforce price IS NULL when is_in_cvsu_market = true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'products_price_null_for_cvsu'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_price_null_for_cvsu CHECK (NOT COALESCE(is_in_cvsu_market, false) OR price IS NULL);
  END IF;
END
$$;

COMMIT;
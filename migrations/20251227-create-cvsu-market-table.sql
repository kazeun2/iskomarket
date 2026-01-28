-- Migration: 20251227-create-cvsu-market-table.sql
-- Purpose: Create a lightweight table for the CvSU Market page that only
-- stores the fields: title, category, images (and an optional link back to
-- the canonical products table). Then migrate current CvSU items into it
-- and nullify unrelated fields (price, location) on the source product rows.

BEGIN;

-- Ensure extension for uuid generation is available (id defaults)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- New table for CvSU Market (minimal fields only)
CREATE TABLE IF NOT EXISTS public.cvsu_market_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  images text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add description column if this migration is re-run on an older DB where the
-- column may be missing (idempotent safety)
ALTER TABLE IF EXISTS public.cvsu_market_products ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';

-- Grant read access to anonymous/authenticated roles so the static market
-- can be served directly if desired. Adjust roles/policies as needed.
GRANT SELECT ON public.cvsu_market_products TO anon, authenticated;

-- Populate the new table from products matching CvSU categories/titles
-- We handle multiple possible storage types for the "images" column and use
-- the categories table if products store a category_id.
INSERT INTO public.cvsu_market_products (product_id, title, description, category, images, created_at, updated_at)
SELECT
  p.id,
  COALESCE(p.title, '') AS title,
  COALESCE(p.description, COALESCE(p.title, '')) AS description,
  COALESCE(c.name, 'CvSU Market') AS category,
  CASE
    WHEN p.images IS NULL THEN ARRAY[]::text[]
    WHEN jsonb_typeof(to_jsonb(p.images)) = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(to_jsonb(p.images)))
    WHEN jsonb_typeof(to_jsonb(p.images)) = 'string' THEN ARRAY[ to_jsonb(p.images) #>> '{}' ]
    ELSE ARRAY[]::text[]
  END AS images,
  now(), now()
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE (
  (c.name ILIKE 'CvSU%')
  OR (p.title ILIKE 'CvSU%')
)
AND COALESCE(p.is_deleted, false) = false
AND COALESCE(p.is_hidden, false) = false
-- Ignore rows already migrated (idempotent)
AND NOT EXISTS (
  SELECT 1 FROM public.cvsu_market_products cm WHERE cm.product_id = p.id
);

-- Nullify fields on the original products that were migrated **safely**.
-- Some installations have NOT NULL constraints on `price` so setting it to NULL
-- would fail (as you've observed). We'll only set a column to NULL if it
-- exists and is nullable. This prevents migration failures and is idempotent.

-- Safely nullify `location` if the column is nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'location' AND is_nullable = 'YES'
  ) THEN
    UPDATE public.products
    SET location = NULL
    WHERE id IN (SELECT product_id FROM public.cvsu_market_products WHERE product_id IS NOT NULL);
  END IF;
END
$$;

-- Safely nullify `price` only when the column allows NULL (otherwise skip)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'price' AND is_nullable = 'YES'
  ) THEN
    UPDATE public.products
    SET price = NULL
    WHERE id IN (SELECT product_id FROM public.cvsu_market_products WHERE product_id IS NOT NULL);
  ELSE
    -- price is NOT NULL on this schema. We intentionally skip nullifying to avoid
    -- constraint violations. If you want to remove price, consider a separate
    -- migration to either alter the column to allow NULL or archive & delete rows.
    RAISE NOTICE 'Skipping setting products.price to NULL because column is NOT NULL.';
  END IF;
END
$$;

-- Optional: mark migrated products for easy identification in the future
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS is_in_cvsu_market boolean DEFAULT false;

UPDATE public.products
SET is_in_cvsu_market = true
WHERE id IN (SELECT product_id FROM public.cvsu_market_products WHERE product_id IS NOT NULL);

COMMIT;

-- Usage notes:
-- 1) This migration is idempotent: re-running it won't duplicate rows for
--    the same product (it checks for an existing product_id).
-- 2) If you want to remove CvSU product rows entirely from `products`,
--    use a controlled DELETE after you validate the new `cvsu_market_products` data.
-- 3) If your app queries directly from `products` for the CvSU market page,
--    update it to query `cvsu_market_products` instead (or add a view that
--    selects from the new table).

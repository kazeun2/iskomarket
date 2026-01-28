-- Migration: 20251226-backfill-cvsu-products.sql
-- Purpose: Backfill `is_cvsu_only` for existing products whose category suggests they belong to CvSU market.

BEGIN;

-- Set is_cvsu_only = true for products whose category name starts with 'CvSU'
UPDATE public.products
SET is_cvsu_only = true
WHERE category_id IN (
  SELECT id FROM public.categories WHERE name ILIKE 'CvSU%'
);

-- Also, as a defensive measure, set is_cvsu_only true for products created by the marketing office alias if that convention is used
-- (example seller id 'marketing-office', adjust if your seed/fixture uses a different id)
UPDATE public.products
SET is_cvsu_only = true
WHERE seller_id = 'marketing-office';

COMMIT;
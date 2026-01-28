-- Migration: 20251225-add-is-cvsu-only.sql
-- Purpose: Add a boolean flag to products to mark items that should appear only
-- in the CvSU Market page and NOT in the public marketplace listing.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_cvsu_only boolean DEFAULT false;

-- Ensure default for new inserts is false and existing rows are false
UPDATE public.products SET is_cvsu_only = false WHERE is_cvsu_only IS NULL;

-- Index the column for efficient queries
CREATE INDEX IF NOT EXISTS idx_products_is_cvsu_only ON public.products (is_cvsu_only);

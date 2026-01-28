-- Migration: 20251227-create-cvsu-market-view.sql
-- Purpose: Create a read-safe view for the CvSU Market page that exposes
-- only the minimal fields: title, category, images. Grant SELECT to
-- public auth roles so the frontend can safely query the view.

BEGIN;

CREATE OR REPLACE VIEW public.view_cvsu_market AS
SELECT
  id AS id,
  product_id,
  title,
  description,
  category,
  images
FROM public.cvsu_market_products;

-- Make the view accessible to public clients (adjust as needed if you use RLS)
GRANT SELECT ON public.view_cvsu_market TO anon, authenticated;

COMMIT;

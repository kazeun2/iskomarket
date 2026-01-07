-- Migration: 20251227-hard-delete-cvsu-products.sql
-- Purpose: Permanently delete CvSU product rows from `public.products`.
-- WARNING: This is destructive. Only run after you have a verified backup.
-- Safety mechanism: this migration will refuse to run unless
--   SET app.cvsu_delete_confirm = 'true'; has been executed in the session.

BEGIN;

-- Safety gate: require the session variable to be set to 'true'
DO $$
BEGIN
  IF current_setting('app.cvsu_delete_confirm', true) IS NULL OR current_setting('app.cvsu_delete_confirm', true) <> 'true' THEN
    RAISE EXCEPTION 'Deletion guard: set the session parameter app.cvsu_delete_confirm = ''true'' to allow permanent deletion (ensure backups exist).';
  END IF;
END;
$$;

-- Optional: archive rows before deletion (uncomment if you want to keep an audit copy)
-- CREATE TABLE IF NOT EXISTS public.cvsu_products_archive AS TABLE public.products WITH NO DATA;
-- INSERT INTO public.cvsu_products_archive SELECT p.* FROM public.products p WHERE (COALESCE(p.is_in_cvsu_market,false) = true OR COALESCE(p.title,p.name) ILIKE 'CvSU%' OR COALESCE(p.category,'') ILIKE 'CvSU%');

-- Delete candidate rows. The WHERE clause matches three heuristics:
--  - products marked is_in_cvsu_market = true
--  - title/name starts with or includes 'CvSU'
--  - category includes 'CvSU'
WITH candidates AS (
  SELECT id FROM public.products
  WHERE (COALESCE(is_in_cvsu_market, false) = true)
    OR (COALESCE(title, name) ILIKE 'CvSU%')
    OR (COALESCE(category, '') ILIKE 'CvSU%')
)
DELETE FROM public.products p
USING candidates c
WHERE p.id = c.id
RETURNING p.id;

COMMIT;

-- Usage:
-- 1) Verify backups exist.
-- 2) In the same SQL session run:
--      SET app.cvsu_delete_confirm = 'true';
-- 3) Run the migration SQL (paste this file into the SQL editor or run via migration tool).
-- 4) Confirm returned ids are those you expect.

-- Notes:
-- - If foreign key constraints prevent deletion, the DELETE will fail and roll back.
--   In that case, consider archiving and manually removing or updating dependent rows first.
-- - I intentionally used a session guard rather than an always-on kill switch to avoid accidental execution.

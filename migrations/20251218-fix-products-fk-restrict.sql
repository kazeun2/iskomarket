-- Make products.seller_id foreign key use ON DELETE RESTRICT to avoid accidental cascade deletion
-- Run as an admin in Supabase SQL editor. This migration is defensive and will only alter the constraint if it exists and differs.
DO $$
DECLARE
  fkname text;
  target_relname text := 'products';
  conns RECORD;
BEGIN
  -- Find existing FK constraint name on products referencing users(id)
  SELECT conname INTO fkname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE c.contype = 'f'
    AND t.relname = target_relname
    AND (SELECT relname FROM pg_class WHERE oid = c.confrelid) = 'users'
    LIMIT 1;

  IF fkname IS NULL THEN
    RAISE NOTICE 'No foreign key constraint found on products referencing users; no changes made.';
    RETURN;
  END IF;

  -- Drop and re-create constraint with ON DELETE RESTRICT
  EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', target_relname, fkname);
  EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE RESTRICT', target_relname, fkname);

  RAISE NOTICE 'Recreated FK % with ON DELETE RESTRICT', fkname;
END$$;
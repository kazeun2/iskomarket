-- Ensure SELECT/INSERT/UPDATE/DELETE policies for products allow visible public reads
-- and allow owners to view their own rows regardless of visibility flags.

-- DROP any existing conflicting policies
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Owners can view own products" ON public.products;
DROP POLICY IF EXISTS "Users can create products" ON public.products;
DROP POLICY IF EXISTS "Products owners can update" ON public.products;
DROP POLICY IF EXISTS "Products owners can delete" ON public.products;

-- Public SELECT: visible products only
-- Treat legacy NULL is_available as visible and coalesce flags to false
CREATE POLICY "Anyone can view available products"
  ON public.products
  FOR SELECT
  TO public
  USING (
    (is_available IS NULL OR is_available = true)
    AND (COALESCE(is_deleted, false) = false)
    AND (COALESCE(is_hidden, false) = false)
  );

-- Owner SELECT: owners can always view their own products (authenticated)
CREATE POLICY "Owners can view own products"
  ON public.products
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

-- Secure INSERT: authenticated users may insert rows if seller_id = auth.uid()
CREATE POLICY "Users can create products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- OWNER UPDATE: only owner can update their rows (and must remain owner)
CREATE POLICY "Products owners can update"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- OWNER DELETE: only owner can delete (soft or hard delete)
CREATE POLICY "Products owners can delete"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Note: Review policies if you have admin roles that need broader access.
-- Run SELECT pg_policies WHERE tablename = 'products' to verify.

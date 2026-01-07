-- Allow admin users to update or delete any product
-- Adds policies that permit users with users.is_admin = true to UPDATE and DELETE products

-- NOTE: This complements existing owner policies and does not remove them.

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admins can update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  )
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

CREATE POLICY "Admins can delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS(
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND COALESCE(u.is_admin, false) = true
    )
  );

-- If you prefer admins to also bypass INSERT checks or be treated as owner on create,
-- consider adding an INSERT policy variant. For now we only add UPDATE/DELETE privileges.
-- Migration (no transaction wrapper): Allow sender OR receiver to insert transactions

-- Drop the existing buyer-only or legacy INSERT policies if they exist
DROP POLICY IF EXISTS "Buyers can create transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
-- Also drop the new policy if it already exists so the migration is idempotent
DROP POLICY IF EXISTS "Senders or receivers can create transactions" ON public.transactions;

-- Create a policy that allows either sender OR receiver to insert the transaction row
CREATE POLICY "Senders or receivers can create transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

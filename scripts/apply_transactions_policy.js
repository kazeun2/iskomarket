require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

async function run() {
  const sql = `DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Buyers can create transactions') THEN
    EXECUTE 'DROP POLICY "Buyers can create transactions" ON public.transactions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Users can create transactions') THEN
    EXECUTE 'DROP POLICY "Users can create transactions" ON public.transactions';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Senders or receivers can create transactions') THEN
    EXECUTE 'DROP POLICY "Senders or receivers can create transactions" ON public.transactions';
  END IF;

  EXECUTE 'CREATE POLICY "Senders or receivers can create transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id)';
END
$$; SELECT 1 as ok;`;

  try {
    const res = await admin.rpc('sql', { query: sql });
    console.log('apply policy RPC result:', res);
  } catch (e) {
    console.error('apply policy RPC failed:', e?.message || e);
    process.exit(1);
  }
}

run().catch((e)=>{ console.error(e); process.exit(1); });

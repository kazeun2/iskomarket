// One-off script to check for a user in auth.users and public.users
// Usage: node scripts/check_user.js user@example.com

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/check_user.js <email>')
  process.exit(1)
}

async function main() {
  try {
    // Query public.users
    const { data: publicUser, error: pErr } = await supabase
      .from('users')
      .select('id,email')
      .eq('email', email)
      .maybeSingle()

    if (pErr) {
      console.error('Error querying public.users:', pErr.message || pErr)
    } else if (publicUser) {
      console.log('FOUND in public.users:', { id: publicUser.id, email: publicUser.email })

      // Try to find matching auth user by the profile's id using Admin API
      try {
        const { data: authById, error: authByIdErr } = await supabase.auth.admin.getUserById(publicUser.id)
        if (authByIdErr || !authById) {
          console.log('No auth user found with id matching profile:', publicUser.id)
        } else {
          console.log('Auth user found via admin.getUserById:', { id: authById.id, email: authById.email })
        }
      } catch (e) {
        console.error('Admin getUserById error:', e.message || e)
      }

    } else {
      console.log('Not found in public.users')
    }

    // Query auth.users via SQL (auth.users is a system table)
    const { data: authRows, error: aErr } = await supabase
      .from('auth.users')
      .select('id,email')
      .eq('email', email)
      .maybeSingle()

    if (aErr) {
      console.error('Error querying auth.users:', aErr.message || aErr)
    } else if (authRows) {
      console.log('FOUND in auth.users:', { id: authRows.id, email: authRows.email })
    } else {
      console.log('Not found in auth.users')
    }

  } catch (e) {
    console.error('Unexpected error:', e.message || e)
  }
}

main()

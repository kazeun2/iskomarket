import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or key in .env')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const email = process.argv[2]
if (!email) {
  console.error('Usage: node scripts/send_otp_test.js <email>')
  process.exit(1)
}

async function main() {
  try {
    console.log('Calling signInWithOtp for', email)
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { username: email.split('@')[0] } },
      // Explicit email OTP (numeric code) — avoid magic links
      type: 'email',
    })
    console.log('signInWithOtp test response:', { data, error })
  } catch (e) {
    console.error('Unexpected error:', e)
  }
}

main()

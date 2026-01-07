require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const supabase = createClient(url, serviceKey)

async function check() {
  try {
    const { data, error } = await supabase.from('users').select('date_registered').limit(1)
    if (error) {
      console.error('Query error:', error.message || error)
      process.exit(2)
    }
    console.log('date_registered column exists — sample row:', data)
    process.exit(0)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(3)
  }
}

check()

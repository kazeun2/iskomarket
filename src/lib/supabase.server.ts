import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || ''

export function createServerSupabaseClient(serviceRoleKey?: string) {
  const key = serviceRoleKey || SERVICE_ROLE_KEY
  if (!SUPABASE_URL || !key) throw new Error('SUPABASE_URL and SERVICE_ROLE key are required to create server supabase client')
  return createClient<Database>(SUPABASE_URL, key, { auth: { persistSession: false } })
}

// Convenience admin client when service role key is present
export const adminSupabase = (SERVICE_ROLE_KEY && SUPABASE_URL) ? createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } }) : null

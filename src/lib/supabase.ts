/**
 * Supabase Client Configuration
 * Last Updated: December 13, 2025
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Safely access environment variables with fallbacks
const getEnvVar = (key: string): string => {
  // Check if import.meta.env exists (Vite environment)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || ''
  }
  
  // Fallback to empty string if not available
  return ''
}

// Supabase configuration from environment variables
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

// Check if Supabase is configured
export const IS_SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey)

// Only create client if configured
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

if (IS_SUPABASE_CONFIGURED) {
  try {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'iskomarket-auth',
      },
      global: {
        headers: {
          'x-application-name': 'IskoMarket',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
    console.log('✅ Supabase connected')
    try { if (import.meta.env.DEV) console.debug('Supabase URL (dev):', supabaseUrl) } catch (e) { /* no-op */ }
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
  }
} else {
  console.warn(
    '⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file.\n' +
    'See QUICK_START.md for setup instructions.'
  )
}

// Export the Supabase client (will be null if not configured)
// Cast to `any` to avoid overly-strict DB typing issues in editor environments
export const supabase: any = supabaseClient!

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return IS_SUPABASE_CONFIGURED
}

// Export types for use throughout the application
export type { Database }

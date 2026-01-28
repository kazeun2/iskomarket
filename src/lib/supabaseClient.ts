/**
 * Supabase Client Helper
 * Last Updated: December 13, 2025
 * Provides a safe way to access the Supabase client with proper error handling
 */
/**
 * Lightweight wrapper for accessing the Supabase client
 * Uses the concrete client created in `src/lib/supabase.ts`.
 */
import { supabase, isSupabaseConfigured } from './supabase'

/**
 * Return the initialized Supabase client or throw a helpful error
 */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      '❌ Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    )
  }

  return supabase
}

export function isSupabaseReady(): boolean {
  return isSupabaseConfigured()
}

export { supabase }

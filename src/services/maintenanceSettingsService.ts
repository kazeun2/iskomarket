import { supabase } from '../lib/supabase'

export interface MaintenanceSettingsRow {
  id: string
  is_active: boolean
  title: string
  message?: string | null
  updated_at: string
}

export const MAINTENANCE_SETTINGS_ENABLED = (() => {
  // 1) Explicit runtime override on window (test / debug harnesses)
  if (typeof window !== 'undefined' && (window as any).__ISKO_ENABLE_MAINTENANCE_SETTINGS === true) return true

  // 2) Vite-style runtime env: import.meta.env.VITE_ENABLE_MAINTENANCE_SETTINGS (safe access)
  try {
    const v = (import.meta as any)?.env?.VITE_ENABLE_MAINTENANCE_SETTINGS
    if (v === '1' || v === 'true') return true
  } catch (_) {
    /* import.meta not available in this environment */
  }

  // 3) Node/Next-style build-time env (guarded for browser safety)
  if (typeof process !== 'undefined' && process?.env) {
    const p = process.env.NEXT_PUBLIC_ENABLE_MAINTENANCE_SETTINGS ?? process.env.VITE_ENABLE_MAINTENANCE_SETTINGS
    if (p === '1' || p === 'true') return true
  }

  return false
})()

export async function getMaintenanceStatus() {
  // Short-circuit when maintenance settings are intentionally disabled to avoid noisy 404s for missing tables
  if (!MAINTENANCE_SETTINGS_ENABLED) {
    return { data: null, error: null }
  }

  try {
    const { data, error } = await supabase.from('maintenance_settings').select('*').order('updated_at', { ascending: false }).limit(1).single()
    if (error) {
      const msg = (error as any)?.message || ''
      // Silently skip maintenance checks when table is missing (avoid noisy console warnings in dev)
      if (msg.includes('Could not find the table') || (error as any)?.code === 'PGRST205' || (error as any)?.status === 404) {
        return { data: null, error: null }
      }
      console.error('Error fetching maintenance status:', error)
      return { data: null, error }
    }

    return { data: data as MaintenanceSettingsRow | null, error: null }
  } catch (error) {
    console.error('Unexpected error fetching maintenance status:', error)
    return { data: null, error }
  }
}

export async function subscribeToMaintenanceSettings(callback: (rows: MaintenanceSettingsRow[] | null) => void) {
  // Respect explicit enable flag: if disabled, return a no-op unsubscribe immediately
  if (!MAINTENANCE_SETTINGS_ENABLED) return () => {}

  // First check whether maintenance_settings table exists (quietly). If it doesn't, return a no-op unsubscribe.
  const { data } = await getMaintenanceStatus()
  if (!data) {
    // Table is absent or no active settings — don't subscribe to a non-existent table
    return () => {}
  }

  const channel = supabase
    .channel('maintenance_settings_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'maintenance_settings' },
      async () => {
        const { data: d } = await getMaintenanceStatus()
        if (d) callback([d])
        else callback(null)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function updateMaintenanceSettings(id: string, payload: Partial<MaintenanceSettingsRow>) {
  if (!MAINTENANCE_SETTINGS_ENABLED) {
    console.warn('Attempted to update maintenance_settings while maintenance settings are disabled (no-op)')
    return { data: null, error: null }
  }

  try {
    const res = await supabase.from('maintenance_settings').update(payload).eq('id', id)
    return res
  } catch (error) {
    console.error('Unexpected error updating maintenance settings:', error)
    return { error }
  }
}

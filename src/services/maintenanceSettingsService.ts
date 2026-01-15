import { supabase } from '../lib/supabase'

export interface MaintenanceSettingsRow {
  id: string
  is_active: boolean
  title: string
  message?: string | null
  updated_at: string
}

export async function getMaintenanceStatus() {
  try {
    const { data, error } = await supabase.from('maintenance_settings').select('*').order('updated_at', { ascending: false }).limit(1).single()
    if (error) {
      const msg = (error as any)?.message || ''
      // Silently skip maintenance checks when table is missing (avoid noisy console warnings in dev)
      if (msg.includes('Could not find the table') || (error as any)?.code === 'PGRST205') {
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
  try {
    const res = await supabase.from('maintenance_settings').update(payload).eq('id', id)
    return res
  } catch (error) {
    console.error('Unexpected error updating maintenance settings:', error)
    return { error }
  }
}

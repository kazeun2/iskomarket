import { supabase } from '../lib/supabase'
import { createNotification } from '../lib/services/notifications'
import { insertAdminAuditLog } from './adminAuditService'

export type MaintenanceWindowType = 'maintenance' | 'alert'

export interface MaintenanceWindowRow {
  id: string
  title: string
  message?: string | null
  start_at: string
  end_at: string
  is_active: boolean
  type?: MaintenanceWindowType
  created_by?: string | null
  created_at: string
}

export async function getActiveMaintenanceWindow() {
  // Returns a single window that matches: is_active = true AND start_at <= now <= end_at
  try {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('maintenance_windows')
      .select('*')
      .lte('start_at', now)
      .gte('end_at', now)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      const msg = (error as any)?.message || ''
      if (msg.includes('Could not find the table') || (error as any)?.code === 'PGRST205') {
        console.warn('maintenance_windows table not found in Supabase - skipping maintenance checks')
        return { data: null, error: null }
      }
      console.error('Error fetching active maintenance window:', error)
      return { data: null, error }
    }

    // Prefer a maintenance-type window if one exists, otherwise return an alert-type window.
    // Treat missing `type` column (undefined) as 'maintenance' for backwards compatibility.
    const rows = (data || []) as MaintenanceWindowRow[]
    if (!rows.length) return { data: null, error: null }

    const maintenance = rows.find(r => ((r as any).type ?? 'maintenance') === 'maintenance')
    if (maintenance) return { data: maintenance, error: null }

    return { data: rows[0], error: null }
  } catch (error) {
    console.error('Unexpected error fetching active maintenance window:', error)
    return { data: null, error }
  }
}

export function subscribeToMaintenanceWindows(callback: (rows: MaintenanceWindowRow[] | null) => void) {
  const channel = supabase
    .channel('maintenance_windows_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'maintenance_windows' },
      async () => {
        const { data } = await getActiveMaintenanceWindow()
        if (data) callback([data])
        else callback(null)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function createMaintenanceWindow(opts: {
  title?: string
  message?: string
  start_at: string // ISO
  end_at: string // ISO
  created_by?: string
  type?: MaintenanceWindowType
}) {
  try {
    // deactivate any existing active windows of same type (best-effort, ignore errors)
    try {
      const deactivateRes = await supabase.from('maintenance_windows').update({ is_active: false }).eq('is_active', true).eq('type', opts.type || 'maintenance')
      // If the `type` column isn't present, retry without the type filter for backwards compatibility
      if (deactivateRes.error && (deactivateRes.error.code === 'PGRST204' || (deactivateRes.error.message || '').includes("'type' column"))) {
        await supabase.from('maintenance_windows').update({ is_active: false }).eq('is_active', true)
      }
    } catch (e) {
      console.warn('Failed deactivating existing maintenance windows (non-fatal):', e)
    }

    // Try inserting including `type` (supported in newer schemas). If the column
    // isn't present (PGRST204 / schema cache message), retry without `type` for
    // backwards compatibility with older deployments.
    let insertPayload: any = {
      title: opts.title || 'System Maintenance',
      message: opts.message || null,
      start_at: opts.start_at,
      end_at: opts.end_at,
      is_active: true,
      type: opts.type || 'maintenance',
      created_by: opts.created_by || null,
    }

    let data: any = null
    let error: any = null

    try {
      const res = await supabase.from('maintenance_windows').insert([insertPayload]).select().single()
      data = res.data
      error = res.error
    } catch (e) {
      error = e
    }

    // If error indicates `type` column not found in schema, retry without it
    const msg = (error as any)?.message || ''
    if (error && (msg.includes("Could not find the 'type' column") || (error as any)?.code === 'PGRST204')) {
      try {
        delete insertPayload.type
        const res2 = await supabase.from('maintenance_windows').insert([insertPayload]).select().single()
        data = res2.data
        error = res2.error
      } catch (e2) {
        error = e2
      }
    }

    if (error) {
      console.error('Error creating maintenance window:', error)
      return { data: null, error }
    }

    // Notify all users by creating notifications in a single batch insert (fetch user ids first)
    try {
      const { data: users } = await supabase.from('users').select('id')
      if (users && users.length > 0) {
        const payload = users.map((u: any) => ({
          user_id: u.id,
          type: 'system',
          title: opts.type === 'alert' ? 'System Alert' : 'System Maintenance Notice',
          message: `${opts.type === 'alert' ? 'Scheduled alert' : 'Scheduled maintenance'}: ${opts.title || 'System Notification'}`,
          related_id: (data as any)?.id || null,
        }))
        // Bulk insert (ignore errors if any)
        await supabase.from('notifications').insert(payload)
      }
    } catch (e) {
      console.warn('Failed to send maintenance notifications to all users (non-fatal):', e)
    }

    // Add an admin audit log entry for transparency
    try {
      await insertAdminAuditLog({
        admin_id: opts.created_by ?? null,
        admin_email: null,
        action: 'suspended' as any,
        target_type: 'account' as any,
        target_id: String((data as any)?.id),
        target_title: opts.title || (opts.type === 'alert' ? 'System Alert' : 'System Maintenance'),
        reason: `${opts.type === 'alert' ? 'Scheduled alert' : 'Scheduled maintenance'} created: ${opts.start_at} -> ${opts.end_at}`,
        metadata: { createdBy: opts.created_by ?? null, type: opts.type || 'maintenance' },
      })
    } catch (e) {
      // Audit log failure shouldn't block creation
      console.warn('Failed to write admin audit log for maintenance creation (non-fatal):', e)
    }

    return { data, error: null }
  } catch (error) {
    console.error('Unexpected error creating maintenance window:', error)
    return { data: null, error }
  }
}

export async function cancelMaintenanceWindow(windowId: string) {
  try {
    const { error } = await supabase.from('maintenance_windows').update({ is_active: false }).eq('id', windowId)
    if (error) {
      console.error('Error cancelling maintenance window:', error)
      return { error }
    }
    return { error: null }
  } catch (err) {
    console.error('Unexpected error cancelling maintenance window:', err)
    return { error: err }
  }
}
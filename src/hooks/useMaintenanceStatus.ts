import { useEffect, useState, useRef } from 'react'
import { getMaintenanceStatus, subscribeToMaintenanceSettings, MaintenanceSettingsRow, MAINTENANCE_SETTINGS_ENABLED } from '../services/maintenanceSettingsService'

export type MaintenanceStatus = {
  id?: string
  isActive: boolean
  title?: string
  message?: string
}

export function useMaintenanceStatus(pollIntervalMs: number = 30000) {
  const [status, setStatus] = useState<MaintenanceStatus>({ isActive: false })
  const timerRef = useRef<any | null>(null)

  useEffect(() => {
    // If maintenance settings are not enabled, avoid starting timers/subscriptions altogether
    if (!MAINTENANCE_SETTINGS_ENABLED) return

    let cancelled = false

    async function load() {
      const { data, error } = await getMaintenanceStatus()
      if (cancelled || error) return
      if (data) {
        setStatus({
          id: data.id,
          isActive: data.is_active,
          title: data.title ?? undefined,
          message: data.message ?? undefined,
        })
      } else {
        setStatus({ isActive: false })
      }
    }

    load()

    timerRef.current = setInterval(() => load(), pollIntervalMs)

    let unsubscribe: (() => void) | null = null
    subscribeToMaintenanceSettings((rows: MaintenanceSettingsRow[] | null) => {
      if (cancelled) return
      if (rows && rows.length > 0) {
        const d = rows[0]
        setStatus({
          id: d.id,
          isActive: d.is_active,
          title: d.title ?? undefined,
          message: d.message ?? undefined,
        })
      } else {
        setStatus({ isActive: false })
      }
    }).then(u => {
      // If the service returned an unsubscribe function, save it
      if (typeof u === 'function') unsubscribe = u
    }).catch(() => {
      // If subscription couldn't be established (table missing), we silently ignore it
      unsubscribe = null
    })

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
      if (unsubscribe) unsubscribe()
    }
  }, [pollIntervalMs])

  return status
}

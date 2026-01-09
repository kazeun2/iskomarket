import { useEffect, useState, useRef } from 'react'
import { getMaintenanceStatus, subscribeToMaintenanceSettings, MaintenanceSettingsRow } from '../services/maintenanceSettingsService'

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

    const unsubscribe = subscribeToMaintenanceSettings((rows: MaintenanceSettingsRow[] | null) => {
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
    })

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
      if (unsubscribe) unsubscribe()
    }
  }, [pollIntervalMs])

  return status
}

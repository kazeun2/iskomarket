import { useEffect, useState, useRef } from 'react'
import { getActiveMaintenanceWindow, subscribeToMaintenanceWindows, MaintenanceWindowRow } from '../services/maintenanceService'

export function useMaintenance(pollIntervalMs: number = 30000) {
  const [window, setWindow] = useState<MaintenanceWindowRow | null>(null)
  const timerRef = useRef<any | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data } = await getActiveMaintenanceWindow()
      if (!cancelled) setWindow(data)
    }

    load()

    // Poll as a fallback in case realtime misses an event
    timerRef.current = setInterval(() => load(), pollIntervalMs)

    // Subscribe to realtime updates
    const unsubscribe = subscribeToMaintenanceWindows((rows) => {
      if (rows && rows.length > 0) setWindow(rows[0])
      else setWindow(null)
    })

    return () => {
      cancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
      if (unsubscribe) unsubscribe()
    }
  }, [pollIntervalMs])

  return { maintenanceWindow: window }
}
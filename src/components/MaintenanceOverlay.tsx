import React from 'react'
import { Button } from './ui/button'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  title?: string
  message?: string
  currentWindowId?: string
  type?: 'maintenance' | 'alert'
}

export function MaintenanceOverlay({ title = 'System Maintenance', message = '', currentWindowId, type = 'maintenance', isAdmin: isAdminProp }: Props & { isAdmin?: boolean }) {
  const { user } = useAuth()
  const isAdmin = typeof isAdminProp !== 'undefined' ? isAdminProp : Boolean(user?.is_admin)

  if (type === 'alert') {
    // Alerts show a top banner for all users (non-blocking)
    return (
      <div className="fixed inset-x-0 top-0 z-[1200]">
        <div className="max-w-6xl mx-auto px-4 py-3 bg-[#F0FFF4] dark:bg-[#04220f] border-b border-[#D7F2DF] dark:border-[#062e1a] text-[#064E33] dark:text-[#A8EFD0] text-sm flex items-center justify-between gap-4">
          <div className="flex-1 mr-4">
            <strong className="mr-2">System Alert:</strong> <span className="whitespace-pre-line">{title}{message ? ` — ${message}` : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/notifications" className="underline text-[#05683a] dark:text-[#9EE6BF] text-sm">View Notifications</a>
          </div>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    // Admins see only a small banner for maintenance
    return (
      <div className="fixed inset-x-0 top-0 z-[1200]">
        <div className="max-w-6xl mx-auto px-4 py-2 bg-yellow-50 border-t border-b border-yellow-200 text-yellow-900 text-sm flex items-center justify-between">
          <div>
            <strong>Maintenance mode active:</strong> {title} — {message || 'Site is under scheduled maintenance.'}
          </div>
          <div>
            <a href="/admin" className="text-sm underline text-yellow-800">Open Admin Dashboard</a>
          </div>
        </div>
      </div>
    )
  }

  // Non-admin users: fullscreen lock
  return (
    <div className="fixed inset-0 z-[200000] bg-black/40 dark:bg-black/95 flex items-center justify-center p-6" style={{ pointerEvents: 'auto' }}>
      <div className="max-w-3xl w-full rounded-lg border p-6 bg-[var(--card)] dark:bg-[#06110b] shadow-lg text-center select-none">
        <h2 className="text-2xl font-semibold mb-3">{title}</h2>
        <p className="text-sm text-muted-foreground mb-6 whitespace-pre-line">{message}</p>

        <div className="flex flex-col gap-3">
          <div className="text-xs text-muted-foreground">We’ll return the site to normal automatically when maintenance ends.</div>
        </div>
      </div>
    </div>
  )
}

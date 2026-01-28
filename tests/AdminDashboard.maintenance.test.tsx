/* @vitest-environment jsdom */
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin1', is_admin: true } })
}))

const fakeWindow = {
  id: 'mw1',
  title: 'Planned Maintenance',
  message: 'Upgrades in progress',
  start_at: new Date().toISOString(),
  end_at: new Date(Date.now() + 3600 * 1000).toISOString(),
  is_active: true,
}

vi.mock('../src/services/maintenanceService', async () => {
  return {
    getActiveMaintenanceWindow: async () => ({ data: fakeWindow, error: null }),
    subscribeToMaintenanceWindows: (cb: any) => {
      // Immediately invoke callback with current window
      cb([fakeWindow])
      return () => {}
    },
    cancelMaintenanceWindow: async (id: string) => ({ error: null }),
  }
})

vi.mock('sonner', () => ({ toast: { success: () => {}, error: () => {} } }))

import { AdminDashboard } from '../src/components/AdminDashboard'

describe('AdminDashboard maintenance UI', () => {
  beforeEach(() => {
    // clear any state if necessary
  })

  it('shows active maintenance status and allows cancelling', async () => {
    render(<AdminDashboard currentUser={{ id: 'admin1', is_admin: true }} />)

    // Expect the maintenance status to render
    expect(await screen.findByText(/Maintenance active/i)).toBeTruthy()
    expect(screen.getByText(/Planned Maintenance/)).toBeTruthy()

    // Open cancel confirmation
    const cancelButton = screen.getByRole('button', { name: /Cancel Maintenance/i })
    fireEvent.click(cancelButton)

    // Confirm dialog appears
    expect(screen.getByText(/Are you sure you want to cancel the active maintenance window/i)).toBeTruthy()

    // Click the confirm cancel button
    const confirm = screen.getByRole('button', { name: /Cancel Maintenance/i })
    fireEvent.click(confirm)

    // Wait for cancellation to happen (mock resolves immediately)
    await waitFor(() => {
      expect(screen.queryByText(/Planned Maintenance/)).toBeNull()
    })
  })
})
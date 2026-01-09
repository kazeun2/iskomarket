/* @vitest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, vi, beforeEach, expect } from 'vitest'

vi.mock('../src/contexts/AnnouncementContext', () => ({
  useAnnouncements: () => ({ addSystemAlert: () => {} })
}))

const createMaintenanceMock = vi.fn().mockResolvedValue({ data: { id: 'm1' }, error: null })
vi.mock('../src/services/maintenanceService', async () => ({
  createMaintenanceWindow: createMaintenanceMock,
}))

vi.mock('sonner', () => ({ toast: { success: () => {}, error: () => {} } }))

import { SystemAlertModal } from '../src/components/SystemAlertModal'

describe('SystemAlertModal - create maintenance', () => {
  beforeEach(() => {
    createMaintenanceMock.mockClear()
  })

  it('calls createMaintenanceWindow when scheduling maintenance', async () => {
    render(<SystemAlertModal isOpen={true} onClose={() => {}} />)

    // Use maintenance template and fill message
    const maintenanceBtn = screen.getByText(/🔧 Maintenance/)
    fireEvent.click(maintenanceBtn)

    const useTemplateBtn = screen.getByText(/Use Maintenance Template/i)
    fireEvent.click(useTemplateBtn)

    const sendBtn = screen.getByRole('button', { name: /Send Alert/i })

    // Enter times
    const start = screen.getByLabelText(/Start date and time/i)
    const end = screen.getByLabelText(/End date and time/i)
    fireEvent.change(start, { target: { value: '2025-01-02T10:00' } })
    fireEvent.change(end, { target: { value: '2025-01-02T11:00' } })

    fireEvent.click(sendBtn)

    // Wait for mock to be called
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(createMaintenanceMock).toHaveBeenCalled()
  })
})
/* @vitest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/contexts/AnnouncementContext', () => ({
  useAnnouncements: () => ({ addSystemAlert: () => {} })
}))

import { SystemAlertModal } from '../src/components/SystemAlertModal'

describe('SystemAlertModal', () => {
  it('shows schedule inputs (Start/End) when alert type is alert', () => {
    render(<SystemAlertModal isOpen={true} onClose={() => {}} />)
    // By default alertType is 'maintenance' - switch to alert by clicking the button
    const alertBtn = screen.getByText(/🔔 Alert/i)
    alertBtn.click()

    const startInputs = screen.getAllByLabelText(/Start date and time/i)
    const endInputs = screen.getAllByLabelText(/End date and time/i)
    expect(startInputs.length).toBeGreaterThan(0)
    expect(endInputs.length).toBeGreaterThan(0)
    // Labels should be visible
    expect(screen.getByText(/Start/)).toBeTruthy()
    expect(screen.getByText(/End/)).toBeTruthy()
    // Persistent checkbox is present
    expect(screen.getByLabelText(/Persistent/i)).toBeTruthy()
  })

  it('shows schedule inputs when alert type is maintenance', () => {
    render(<SystemAlertModal isOpen={true} onClose={() => {}} />)
    // default is maintenance
    const startInputs = screen.getAllByLabelText(/Start date and time/i)
    const endInputs = screen.getAllByLabelText(/End date and time/i)
    expect(startInputs.length).toBeGreaterThan(0)
    expect(endInputs.length).toBeGreaterThan(0)
  })
})
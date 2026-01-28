/* @vitest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1', is_admin: false } })
}))

import { MaintenanceOverlay } from '../src/components/MaintenanceOverlay'

describe('MaintenanceOverlay', () => {
  it('renders fullscreen lock for non-admin users (maintenance)', () => {
    render(<MaintenanceOverlay title="Test" message="Going down" type="maintenance" />)
    expect(screen.getByText(/Going down/)).toBeTruthy()
    // The title should be visible
    expect(screen.getByText(/Test/)).toBeTruthy()
  })

  it('renders a banner for admin users (maintenance)', () => {
    render(<MaintenanceOverlay title="AdminTest" message="For admins" type="maintenance" isAdmin={true} />)
    expect(screen.getByText(/AdminTest/)).toBeTruthy()
    expect(screen.getByText(/Open Admin Dashboard/)).toBeTruthy()
  })

  it('renders top banner for alert type and is pinned to top-of-screen', () => {
    const { container } = render(<MaintenanceOverlay title="AlertTitle" message="Heads up" type="alert" isAdmin={false} />)
    expect(screen.getByText(/AlertTitle/)).toBeTruthy()
    expect(screen.getByText(/Heads up/)).toBeTruthy()

    // The root banner should be fixed and pinned to the top
    const banner = container.querySelector('div.fixed')
    expect(banner).toBeTruthy()
    if (banner) {
      expect(banner.className).toContain('top-0')
      expect(banner.className).toContain('z-[1200]')
    }
  })
})
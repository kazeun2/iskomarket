/* @vitest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin1', is_admin: true } })
}))

// Mock AdminAppeals so we don't need full ConversationContext in this unit test
vi.mock('../src/components/AdminAppeals', () => ({
  default: () => <div>AdminAppealsMock</div>
}))

import { AdminDashboard } from '../src/components/AdminDashboard'

describe('AdminDashboard appeals UI', () => {
  it('opens transaction appeals modal when stat clicked', async () => {
    render(<AdminDashboard currentUser={{ id: 'admin1', is_admin: true }} />)

    const t = screen.getByText(/Transaction Appeals/i)
    expect(t).toBeTruthy()

    fireEvent.click(t)

    // After clicking, the modal content should mount
    expect(await screen.findByText(/AdminAppealsMock/i)).toBeTruthy()
  })
})
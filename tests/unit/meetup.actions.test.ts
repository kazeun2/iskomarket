import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as tx from '../../src/lib/services/transactions'
import * as msg from '../../src/services/messageService'
import { agreeMeetupAndNotify } from '../../src/lib/actions/meetup'
import { supabase } from '../../src/lib/supabase'

describe('agreeMeetupAndNotify', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Provide a default authenticated session for tests that rely on supabase.auth.getUser()
    supabase.auth = { getUser: async () => ({ data: { user: { id: 'auth-u1' } }, error: null }) }
  })

  it('creates a new transaction and sends a message when none exists', async () => {
    // Ensure the session user matches the provided buyer id for this test case
    supabase.auth.getUser = async () => ({ data: { user: { id: 'b1' } }, error: null })

    vi.spyOn(tx, 'getPendingTransactions').mockResolvedValue([])
    const createSpy = vi.spyOn(tx, 'createTransaction').mockResolvedValue({ id: 'tx-create' } as any)
    const sendSpy = vi.spyOn(msg, 'sendMessage').mockResolvedValue({} as any)

    const result = await agreeMeetupAndNotify({ productId: 'p1', buyerId: 'b1', sellerId: 's1', meetupLocation: 'Gate' })

    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({ productId: 'p1', buyerId: 'b1', sellerId: 's1' }))
    expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('Meet-up proposed') }))
    expect(result).toBeDefined()
  })

  it('updates existing transaction when found and still sends a message', async () => {
    const existing = { id: 'tx-exist', product_id: 'p1', receiver_id: 's1', meetup_date: null }
    vi.spyOn(tx, 'getPendingTransactions').mockResolvedValue([existing as any])
    const updateSpy = vi.spyOn(tx, 'updateMeetupDetails').mockResolvedValue({ id: 'tx-exist' } as any)
    const sendSpy = vi.spyOn(msg, 'sendMessage').mockResolvedValue({} as any)

    const result = await agreeMeetupAndNotify({ productId: 'p1', buyerId: 'b1', sellerId: 's1', meetupLocation: 'Library' })

    expect(updateSpy).toHaveBeenCalledWith('tx-exist', 'Library', null)
    expect(sendSpy).toHaveBeenCalled()
    expect(result).toBeDefined()
  })

  it('creates a local provisional transaction and sends a message when transactions are disabled', async () => {
    process.env.NEXT_PUBLIC_DISABLE_TRANSACTIONS = '1'
    const createSpy = vi.spyOn(tx, 'createTransaction')
    const updateSpy = vi.spyOn(tx, 'updateMeetupDetails')
    const sendSpy = vi.spyOn(msg, 'sendMessage').mockResolvedValue({} as any)

    const localTx = await agreeMeetupAndNotify({ productId: 'p1', buyerId: 'b1', sellerId: 's1', meetupLocation: 'Gate', meetupDate: '2026-01-01T12:00:00Z' })

    expect(createSpy).not.toHaveBeenCalled()
    expect(updateSpy).not.toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalled()
    expect(localTx).toHaveProperty('local_only', true)
    delete process.env.NEXT_PUBLIC_DISABLE_TRANSACTIONS
  })
})

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as meetup from '../../src/lib/actions/meetup'
import * as txService from '../../src/lib/services/transactions'
import * as msgService from '../../src/services/messageService'
import { supabase } from '../../src/lib/supabase'

describe('agreeMeetupAndNotify', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uses authenticated session as sender when sending notification and creating transaction', async () => {
    // Mock auth session
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'auth-u1' } } } as any)

    // No pending transactions
    vi.spyOn(txService, 'getPendingTransactions').mockResolvedValue([] as any)

    // createTransaction should be called with buyerId overridden to session user
    const createSpy = vi.spyOn(txService, 'createTransaction').mockResolvedValue({ id: 'tx1' } as any)

    // sendMessage should be called with sender_id === auth-u1
    const sendSpy = vi.spyOn(msgService, 'sendMessage').mockResolvedValue({ data: { id: 'm1', conversation_id: 'c1' }, error: null } as any)

    await meetup.agreeMeetupAndNotify({ productId: 'p1', buyerId: 'other-u', sellerId: 'seller1', meetupLocation: 'Gate', meetupDate: null })

    expect(createSpy).toHaveBeenCalled()
    const calledWith = createSpy.mock.calls[0][0]
    expect(calledWith.buyerId).toBe('auth-u1')

    expect(sendSpy).toHaveBeenCalled()
    const msgCallArg = sendSpy.mock.calls[0][0]
    expect(msgCallArg.sender_id).toBe('auth-u1')
    expect(msgCallArg.receiver_id).toBe('seller1')
    // Should include transaction metadata and mark as meetup_request automation
    expect(msgCallArg.transaction_id).toBe('tx1')
    expect(msgCallArg.automation_type).toBe('meetup_request')
  })

  it('updates existing transaction when found and still notifies with auth session', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'auth-u2' } } } as any)

    const existing = { id: 'tx-existing', product_id: 'p2', receiver_id: 'seller2' }
    vi.spyOn(txService, 'getPendingTransactions').mockResolvedValue([existing] as any)

    const updateSpy = vi.spyOn(txService, 'updateMeetupDetails').mockResolvedValue(existing as any)
    const sendSpy = vi.spyOn(msgService, 'sendMessage').mockResolvedValue({ data: { id: 'm2', conversation_id: 'c2' }, error: null } as any)

    const tx = await meetup.agreeMeetupAndNotify({ productId: 'p2', buyerId: 'auth-u2', sellerId: 'seller2', meetupLocation: 'Library', meetupDate: null })

    expect(updateSpy).toHaveBeenCalledWith('tx-existing', 'Library', null)
    expect(sendSpy).toHaveBeenCalled()
    const arg = sendSpy.mock.calls[0][0]
    expect(arg.sender_id).toBe('auth-u2')
    expect(arg.receiver_id).toBe('seller2')
    // Should include transaction metadata and mark as meetup_request automation
    expect(arg.transaction_id).toBe('tx-existing')
    expect(arg.automation_type).toBe('meetup_request')
  })
})

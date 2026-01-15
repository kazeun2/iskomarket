import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as tx from '../../src/lib/services/transactions'
import { supabase } from '../../src/lib/supabase'

describe('getPendingTransactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns enriched transactions with product and profiles (falls back to user_id when id lookup empty)', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'transactions') {
        return {
          select: () => ({
            or: () => ({ order: () => Promise.resolve({ data: [
              { id: 't1', product_id: 'p1', sender_id: 'u1', receiver_id: 'u2', meetup_date: null, meetup_location: null, status: 'pending', created_at: '2026-01-01T00:00:00Z', conversation_id: 'c1' }
            ], error: null }) })
          })
        } as any
      }

      if (table === 'products') {
        return {
          select: () => ({ in: () => Promise.resolve({ data: [{ id: 'p1', title: 'Sari-sari item', images: [] }], error: null }) })
        } as any
      }

      if (table === 'user_profile') {
        return {
          select: () => ({ in: (col: string, vals: string[]) => {
            // Simulate id lookup returning empty, and user_id lookup returning rows
            if (col === 'id') return Promise.resolve({ data: [], error: null })
            if (col === 'user_id') return Promise.resolve({ data: [{ user_id: 'u1', username: 'buyer', avatar_url: null }, { user_id: 'u2', username: 'seller', avatar_url: null }], error: null })
            return Promise.resolve({ data: [], error: null })
          } })
        } as any
      }

      return { select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) } as any
    })

    const result = await tx.getPendingTransactions('u1')
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(1)
    expect((result[0] as any).product).toBeDefined()
    expect((result[0] as any).buyer).toBeDefined()
    expect((result[0] as any).buyer.username).toBe('buyer')
    expect((result[0] as any).seller.username).toBe('seller')
  })
})
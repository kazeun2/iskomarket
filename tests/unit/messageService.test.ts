import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as msg from '../../src/services/messageService'
import { supabase } from '../../src/lib/supabase'

function mockQuery(result: any) {
  return {
    select: () => ({
      or: () => ({ order: () => ({ limit: () => Promise.resolve(result) }) }),
      order: () => ({ limit: () => Promise.resolve(result) }),
      limit: () => Promise.resolve(result),
      eq: () => ({ order: () => ({ limit: () => Promise.resolve(result) }) }),
      maybeSingle: () => Promise.resolve(result),
    }),
  }
}

describe('getConversations (transaction-derived)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('includes transaction-only conversations when no messages exist', async () => {
    // conversations query returns empty
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'conversations') return mockQuery({ data: [], error: null }) as any
      if (table === 'messages') return mockQuery({ data: [], error: null }) as any
      if (table === 'transactions') return mockQuery({ data: [{ id: 'tx1', sender_id: 'u1', receiver_id: 'u2', product_id: 'p1', created_at: '2026-01-01T00:00:00Z' }], error: null }) as any
      return mockQuery({ data: [], error: null }) as any
    })

    const res = await msg.getConversations('u1')
    expect(res.error).toBeNull()
    expect(res.data).toBeDefined()
    const found = res.data?.find(c => String(c.conversation_id).startsWith('tx:tx1'))
    expect(found).toBeDefined()
    expect(found?.last_message).toContain('(No messages yet)')
  })
})
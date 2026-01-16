import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as msg from '../../src/services/messageService'
import { supabase } from '../../src/lib/supabase'

function mockQuery(result: any) {
  return {
    select: () => ({
      or: () => ({ order: () => ({ limit: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result) }), maybeSingle: () => Promise.resolve(result) }),
      order: () => ({ limit: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result) }),
      limit: () => Promise.resolve(result),
      eq: () => ({ order: () => ({ limit: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result) }), maybeSingle: () => Promise.resolve(result), limit: () => Promise.resolve(result) }),
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

  it('sendMessage inserts body and returns normalized message.message field', async () => {
    // Mock auth to return user
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'u1' } } } as any)

    // Mock conversations insert (not needed if conversation_id provided)
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'messages') {
        return {
          insert: (payload: any) => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'm1', ...payload, created_at: '2026-01-02T00:00:00Z' }, error: null }) }) })
        } as any
      }
      return mockQuery({ data: [], error: null }) as any
    })

    const res = await msg.sendMessage({ sender_id: 'u1', receiver_id: 'u2', conversation_id: 'c1', message: 'Hello world' })
    expect(res.error).toBeNull()
    expect(res.data).toBeDefined()
    expect((res.data as any).body).toBe('Hello world')
    expect((res.data as any).message).toBe('Hello world')
  })

  it('sendMessageWithAutoReply skips auto-reply when current session user is not the intended auto-reply sender', async () => {
    // Simulate: current auth user is the sender (u1), receiver is u2 - so auto-reply should be skipped
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({ data: { user: { id: 'u1' } } } as any)

    let insertCalls = 0;
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'conversations') {
        return mockQuery({ data: { id: 'c1', last_auto_reply_at: null }, error: null }) as any
      }
      if (table === 'messages') {
        return {
          insert: (payload: any) => ({ select: () => ({ single: () => {
            insertCalls += 1;
            // Only the user's message insert should be attempted (1 call)
            return Promise.resolve({ data: { id: 'm1', ...payload, created_at: '2026-01-04T00:00:00Z' }, error: null });
          } }) })
        } as any
      }

      return mockQuery({ data: [], error: null }) as any
    })

    const res = await msg.sendMessageWithAutoReply({ sender_id: 'u1', receiver_id: 'u2', conversation_id: 'c1', message: 'NoAuto' })
    expect(res.error).toBeNull()
    expect(res.userMessage).toBeDefined()
    expect((res.userMessage as any).message).toBe('NoAuto')
    expect(insertCalls).toBe(1)
  })

  it('sendMessageWithAutoReply treats automated reply RLS failures as non-fatal and returns userMessage', async () => {
    const now = new Date().toISOString();

    let insertCalls = 0;
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'conversations') {
        return mockQuery({ data: { id: 'c1', last_auto_reply_at: null }, error: null }) as any
      }
      if (table === 'messages') {
        return {
          insert: (payload: any) => ({ select: () => ({ single: () => {
            insertCalls += 1;
            // 1st call: user message insert succeeds
            if (insertCalls === 1) {
              return Promise.resolve({ data: { id: 'm1', ...payload, created_at: '2026-01-04T00:00:00Z' }, error: null });
            }
            // 2nd call: automated insert fails due to RLS (42501)
            return Promise.resolve({ data: null, error: { message: 'new row violates row-level security policy for table "messages"', code: '42501' } });
          } }) })
        } as any
      }

      return mockQuery({ data: [], error: null }) as any
    })

    const res = await msg.sendMessageWithAutoReply({ sender_id: 'u1', receiver_id: 'u2', conversation_id: 'c1', message: 'RLSTest' })
    expect(res.error).toBeNull()
    expect(res.userMessage).toBeDefined()
    expect((res.userMessage as any).message || (res.userMessage as any).body || (res.userMessage as any).message_text).toBe('RLSTest')
  })

  it('getConversations extracts meetup metadata from meetup messages', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'conversations') return mockQuery({ data: [{ id: 'c1', buyer_id: 'u1', seller_id: 'u2', product_id: 'p1', updated_at: '2026-01-05T00:00:00Z' }], error: null }) as any
      if (table === 'messages') return mockQuery({ data: [{ id: 'm1', conversation_id: 'c1', sender_id: 'u2', receiver_id: 'u1', message: 'Meet-up: 2026-01-16 at U-Mall Gate', created_at: '2026-01-16T12:00:00Z', automation_type: 'meetup_proposed' }], error: null }) as any
      if (table === 'products') return mockQuery({ data: { title: 'Product A' }, error: null }) as any
      if (table === 'users') return mockQuery({ data: { name: 'Seller Name', username: 'seller1' }, error: null }) as any
      if (table === 'user_profile') return mockQuery({ data: [{ id: 'u2', user_id: 'u2', display_name: 'Seller Name', username: 'seller1' }], error: null }) as any
      return mockQuery({ data: [], error: null }) as any
    })

    const res = await msg.getConversations('u1')
    expect(res.error).toBeNull()
    expect(res.data).toBeDefined()
    const c = res.data?.find(cc => cc.conversation_id === 'c1')
    expect(c).toBeDefined()
    expect(c?.meetup_date).toBe('2026-01-16T12:00:00Z')
    expect(c?.meetup_location).toContain('U-Mall')
  })
})
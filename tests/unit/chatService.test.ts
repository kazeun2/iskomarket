import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as cs from '../../src/lib/chatService'
import { supabase } from '../../src/lib/supabase'

describe('chatService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sendMessage should throw on empty body', async () => {
    await expect(cs.sendMessage('c1', 'u1', '   ')).rejects.toThrow('Empty message')
  })

  it('listMessages returns messages', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'messages') {
        return {
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [{ id: 'm1', conversation_id: 'c1', sender_id: 'u1', body: 'hi', created_at: '2026-01-01T00:00:00Z' }], error: null }) }) })
        } as any
      }
      return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) } as any
    })

    const res = await cs.listMessages('c1')
    expect(Array.isArray(res)).toBe(true)
    expect(res.length).toBe(1)
    expect(res[0].body).toBe('hi')
  })

  it('getOrCreateConversation returns existing id when found', async () => {
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: () => ({ eq: () => ({ limit: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'conv1' }, error: null } ) }) }) })
        } as any
      }
      return { insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'conv1' }, error: null } ) }) }) } as any
    })

    const id = await cs.getOrCreateConversation('u1', 'u2', 'p1')
    expect(id).toBe('conv1')
  })
})
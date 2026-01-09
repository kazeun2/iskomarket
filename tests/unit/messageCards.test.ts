import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as mc from '../../src/lib/services/messageCards'
import { supabase } from '../../src/lib/supabase'

describe('getMessageCards fallback behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to simple select and enriches with profiles when nested select returns 42703', async () => {
    // Mock supabase.from to behave differently depending on the select string
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'message_cards') {
        return {
          select: (sel?: string) => {
            // First call uses nested select containing other_user:other_user_id -> simulate schema error
            if (typeof sel === 'string' && sel.includes('other_user:other_user_id')) {
              return {
                eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: { code: '42703', message: 'column user_profile_1.user_idasd does not exist' } }) }) })
              } as any;
            }

            // Fallback simple select('*') -> return rows
            return {
              eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [
                { id: 'mc1', conversation_id: 'c1', user_id: 'u1', other_user_id: 'u2', last_message: 'hi', last_message_at: '2026-01-01T00:00:00Z', unread_count: 0 }
              ], error: null }) }) })
            } as any;
          }
        } as any;
      }

      if (table === 'user_profile') {
        return {
          select: () => ({ in: () => Promise.resolve({ data: [{ user_id: 'u2', display_name: 'Other', avatar_url: null }], error: null }) })
        } as any
      }

      // Default fallback (shouldn't be used)
      return { select: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) } as any
    })

    const cards = await mc.getMessageCards('u1', 10)
    expect(Array.isArray(cards)).toBe(true)
    expect(cards.length).toBe(1)
    expect((cards[0] as any).other_user).toBeDefined()
    expect((cards[0] as any).other_user.display_name).toBe('Other')
  })
})
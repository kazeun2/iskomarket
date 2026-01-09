import { vi, describe, it, expect, beforeEach } from 'vitest'
import { updateProduct } from '../../src/lib/services/products'
import { supabase } from '../../src/lib/supabase'

describe('updateProduct fallback on relationship error', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('falls back to safe update+fetch when nested select returns PGRST204', async () => {
    // Mock behavior of supabase.from for products, users and categories
    vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          update: (payload?: any) => ({
            eq: (field: string, value: any) => ({
              select: (sel?: string) => {
                // Simulate nested select failing with PGRST204
                if (typeof sel === 'string' && sel.includes('seller:users!seller_id')) {
                  return Promise.resolve({ data: null, error: { code: 'PGRST204', message: "Could not find the 'seller' column of 'products' in the schema cache" } })
                }

                // Fallback update (no select) -> success
                return Promise.resolve({ data: null, error: null })
              }
            })
          }),
          // For the final simple select('*') after update
          select: (sel?: string) => ({
            eq: (field: string, v: any) => ({
              maybeSingle: () => Promise.resolve({ data: {
                id: 'prod-1', title: 'Updated Title', seller_id: 'user-1', category_id: 'cat-1', images: ['https://example.com/image.jpg']
              }, error: null })
            })
          })
        } as any
      }

      if (table === 'users') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'user-1', username: 'seller1', avatar_url: null, credit_score: 50, is_trusted_member: false }, error: null }) }) })
        } as any
      }

      if (table === 'categories') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { id: 'cat-1', name: 'Textbooks', icon: null }, error: null }) }) })
        } as any
      }

      return { update: () => ({ eq: () => ({ select: () => Promise.resolve({ data: null, error: null }) }) }), select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) } as any
    })

    const res = await updateProduct('prod-1', { title: 'Updated Title' })
    expect(res).toBeDefined()
    expect(res.id).toBe('prod-1')
    expect(res.title).toBe('Updated Title')
    expect((res as any).seller).toBeDefined()
    expect((res as any).category).toBeDefined()
    expect(Array.isArray(res.images)).toBe(true)
  })
})
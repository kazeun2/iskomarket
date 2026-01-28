import { describe, it, expect } from 'vitest'
import { createTransaction } from '../../src/lib/services/transactions'

describe('createTransaction guard', () => {
  it('throws when buyerId missing', async () => {
    // @ts-expect-error - testing runtime guard
    await expect(createTransaction({ productId: 'p1', sellerId: 's1' })).rejects.toThrow(/Missing buyerId/)
  })

  it('throws when sellerId missing', async () => {
    // @ts-expect-error - testing runtime guard
    await expect(createTransaction({ productId: 'p1', buyerId: 'b1' })).rejects.toThrow(/Missing buyerId or sellerId|Missing sellerId/)
  })
})
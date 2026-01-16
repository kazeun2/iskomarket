import { describe, it, expect } from 'vitest'
import { computeUsernameFromEmail } from '../../src/components/AuthPage'

describe('computeUsernameFromEmail', () => {
  it('extracts first segment before dot', () => {
    expect(computeUsernameFromEmail('example.admin@cvsu.edu.ph')).toBe('example')
  })

  it('falls back to whole localpart if no dot', () => {
    expect(computeUsernameFromEmail('alex@cvsu.edu.ph')).toBe('alex')
  })

  it('strips invalid chars and truncates to 10', () => {
    const local = 'LongName_With@!$'
    expect(computeUsernameFromEmail('longname_with@cvsu.edu.ph')).toBe('longname_w')
  })

  it('returns empty string when email falsy', () => {
    expect(computeUsernameFromEmail('')).toBe('')
    expect(computeUsernameFromEmail(null)).toBe('')
    expect(computeUsernameFromEmail(undefined)).toBe('')
  })
})
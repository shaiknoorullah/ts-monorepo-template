import { describe, expect, it } from 'vitest'
import { commonSchemas } from '../schemas'

describe('commonSchemas', () => {
  it('email accepts valid input', () => {
    expect(commonSchemas.email.safeParse('a@b.co').success).toBe(true)
  })
  it('email rejects invalid input', () => {
    expect(commonSchemas.email.safeParse('nope').success).toBe(false)
  })
  it('phoneE164 enforces +CC format', () => {
    expect(commonSchemas.phoneE164.safeParse('+15551234567').success).toBe(true)
    expect(commonSchemas.phoneE164.safeParse('5551234567').success).toBe(false)
  })
})

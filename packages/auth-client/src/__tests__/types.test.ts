import { describe, expect, it } from 'vitest'
import { UserSchema } from '../types'

describe('UserSchema', () => {
  it('parses minimal user', () => {
    const u = UserSchema.parse({ id: 'u1', email: 'a@b.co' })
    expect(u.roles).toEqual([])
  })
  it('rejects missing email', () => {
    expect(() => UserSchema.parse({ id: 'u1' })).toThrow()
  })
})

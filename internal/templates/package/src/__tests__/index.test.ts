import { describe, expect, it } from 'vitest'
import { NAME } from '../index'

describe('{{name}}', () => {
  it('exports its name', () => {
    expect(NAME).toBe('{{name}}')
  })
})

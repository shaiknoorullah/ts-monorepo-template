import { describe, expect, it } from 'vitest'
import { darkTheme, lightTheme, tokens } from '../tokens'

describe('tokens', () => {
  it('exposes spacing scale', () => {
    expect(tokens.spacing.md).toBe(16)
  })

  it('light + dark themes have matching shape', () => {
    expect(Object.keys(lightTheme.colors).sort()).toEqual(Object.keys(darkTheme.colors).sort())
  })
})

// packages/ui-nativewind/src/__tests__/tokens.test.ts

import { describe, expect, it } from 'vitest'

import { darkTheme, lightTheme, tokens } from '../tokens'

describe('ui-nativewind tokens', () => {
  it('mirrors the @pkg/ui spacing scale', () => {
    expect(tokens.spacing.md).toBe(16)
    expect(tokens.spacing['3xl']).toBe(64)
  })

  it('exposes light and dark theme palettes', () => {
    expect(lightTheme.colors.brand).toBe('#1f6feb')
    expect(darkTheme.colors.brand).toBe('#58a6ff')
  })
})

// packages/ui/src/tokens.ts
//
// Semantic design tokens consumed by every primitive. Two resolutions:
// lightTheme and darkTheme.

import type { Theme } from './types'

export const tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 16,
    full: 9999,
  },
  type: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },
} as const

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    brand: '#1f6feb',
    surface: '#ffffff',
    surfaceMuted: '#f6f8fa',
    border: '#d0d7de',
    text: '#0d1117',
    textMuted: '#57606a',
    success: '#1a7f37',
    warning: '#9a6700',
    danger: '#cf222e',
    info: '#0969da',
  },
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    brand: '#58a6ff',
    surface: '#0d1117',
    surfaceMuted: '#161b22',
    border: '#30363d',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    success: '#3fb950',
    warning: '#d29922',
    danger: '#f85149',
    info: '#58a6ff',
  },
}

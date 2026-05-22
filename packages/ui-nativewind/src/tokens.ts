// packages/ui-nativewind/src/tokens.ts
//
// Mirrors @pkg/ui/tokens — exported here so consumers can do
// `import { tokens } from '@pkg/ui-nativewind/tokens'` and get the same
// numeric values (in pixels) that the tailwind preset emits.

export const tokens = {
  radius: { full: 9999, lg: 16, md: 8, none: 0, sm: 4 },
  spacing: { '2xl': 48, '3xl': 64, lg: 24, md: 16, sm: 8, xl: 32, xs: 4 },
  type: { '2xl': 32, '3xl': 40, '4xl': 48, lg: 18, md: 16, sm: 14, xl: 24, xs: 12 },
} as const

export const lightTheme = {
  colors: {
    border: '#d0d7de',
    brand: '#1f6feb',
    danger: '#cf222e',
    info: '#0969da',
    success: '#1a7f37',
    surface: '#ffffff',
    surfaceMuted: '#f6f8fa',
    text: '#0d1117',
    textMuted: '#57606a',
    warning: '#9a6700',
  },
  name: 'light',
} as const

export const darkTheme = {
  colors: {
    border: '#30363d',
    brand: '#58a6ff',
    danger: '#f85149',
    info: '#58a6ff',
    success: '#3fb950',
    surface: '#0d1117',
    surfaceMuted: '#161b22',
    text: '#c9d1d9',
    textMuted: '#8b949e',
    warning: '#d29922',
  },
  name: 'dark',
} as const

export type ColorScheme = 'dark' | 'light'

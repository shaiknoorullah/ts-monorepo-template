// packages/ui/src/types.ts

export type ColorScheme = 'light' | 'dark' | 'system'

export interface Theme {
  name: 'light' | 'dark'
  colors: {
    brand: string
    surface: string
    surfaceMuted: string
    border: string
    text: string
    textMuted: string
    success: string
    warning: string
    danger: string
    info: string
  }
}

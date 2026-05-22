// packages/ui/src/types.ts

export type ColorScheme = 'dark' | 'light' | 'system'

export interface Theme {
  colors: {
    border: string
    brand: string
    danger: string
    info: string
    success: string
    surface: string
    surfaceMuted: string
    text: string
    textMuted: string
    warning: string
  }
  name: 'dark' | 'light'
}

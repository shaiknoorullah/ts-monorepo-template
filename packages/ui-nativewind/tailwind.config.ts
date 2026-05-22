// packages/ui-nativewind/tailwind.config.ts
//
// Tailwind config mirroring the Tamagui design tokens in @pkg/ui/tokens
// so the two engines stay visually identical. Apps consuming
// @pkg/ui-nativewind should `presets: [require('@pkg/ui-nativewind/tailwind.config')]`
// in their own tailwind.config.

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f6feb',
          dark: '#58a6ff',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f6f8fa',
          dark: '#0d1117',
          'dark-muted': '#161b22',
        },
        border: {
          DEFAULT: '#d0d7de',
          dark: '#30363d',
        },
        fg: {
          DEFAULT: '#0d1117',
          muted: '#57606a',
          dark: '#c9d1d9',
          'dark-muted': '#8b949e',
        },
        success: { DEFAULT: '#1a7f37', dark: '#3fb950' },
        warning: { DEFAULT: '#9a6700', dark: '#d29922' },
        danger: { DEFAULT: '#cf222e', dark: '#f85149' },
        info: { DEFAULT: '#0969da', dark: '#58a6ff' },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '16px',
        full: '9999px',
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        md: '16px',
        lg: '18px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

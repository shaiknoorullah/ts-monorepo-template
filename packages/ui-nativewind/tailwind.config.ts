// packages/ui-nativewind/tailwind.config.ts
//
// Tailwind config mirroring the Tamagui design tokens in @pkg/ui/tokens
// so the two engines stay visually identical. Apps consuming
// @pkg/ui-nativewind should `presets: [require('@pkg/ui-nativewind/tailwind.config')]`
// in their own tailwind.config.

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  plugins: [require('tailwindcss-animate')],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      borderRadius: {
        full: '9999px',
        lg: '16px',
        md: '8px',
        none: '0',
        sm: '4px',
      },
      colors: {
        border: {
          dark: '#30363d',
          DEFAULT: '#d0d7de',
        },
        brand: {
          dark: '#58a6ff',
          DEFAULT: '#1f6feb',
        },
        danger: { dark: '#f85149', DEFAULT: '#cf222e' },
        fg: {
          dark: '#c9d1d9',
          'dark-muted': '#8b949e',
          DEFAULT: '#0d1117',
          muted: '#57606a',
        },
        info: { dark: '#58a6ff', DEFAULT: '#0969da' },
        success: { dark: '#3fb950', DEFAULT: '#1a7f37' },
        surface: {
          dark: '#0d1117',
          'dark-muted': '#161b22',
          DEFAULT: '#ffffff',
          muted: '#f6f8fa',
        },
        warning: { dark: '#d29922', DEFAULT: '#9a6700' },
      },
      fontSize: {
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
        lg: '18px',
        md: '16px',
        sm: '14px',
        xl: '24px',
        xs: '12px',
      },
      spacing: {
        '2xl': '48px',
        '3xl': '64px',
        lg: '24px',
        md: '16px',
        sm: '8px',
        xl: '32px',
        xs: '4px',
      },
    },
  },
}

export default config

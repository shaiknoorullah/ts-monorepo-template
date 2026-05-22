// packages/ui/src/hooks/useColorScheme.ts
//
// Cross-platform color-scheme detection + persisted user override.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ColorScheme } from '../types'

interface SchemeState {
  scheme: ColorScheme
  setScheme: (scheme: ColorScheme) => void
}

export const useColorScheme = create<SchemeState>()(
  persist(
    (set) => ({
      scheme: 'system',
      setScheme: (scheme) => {
        set({ scheme })
      },
    }),
    { name: 'pkg-ui-color-scheme' },
  ),
)

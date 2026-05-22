// packages/consent/src/store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ConsentCategory, ConsentState } from './types'

interface Store extends ConsentState {
  setGranted: (categories: ConsentCategory[]) => void
}

export const useConsent = create<Store>()(
  persist(
    (set) => ({
      granted: ['necessary'],
      decided: false,
      setGranted: (categories): void => set({ granted: categories, decided: true }),
    }),
    { name: 'pkg-consent' },
  ),
)

export function hasConsent(category: ConsentCategory): boolean {
  return useConsent.getState().granted.includes(category)
}

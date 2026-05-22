// packages/consent/src/banner.ts
//
// vanilla-cookieconsent v3 wrapper. Mounts on the page and pipes user choices
// into the Zustand store so the rest of the codebase reads consent in one place.

import * as CookieConsent from 'vanilla-cookieconsent'
import 'vanilla-cookieconsent/dist/cookieconsent.css'

import type { ConsentCategory } from './types'

import { useConsent } from './store'

export interface MountOptions {
  categories: ConsentCategory[]
  defaultGranted?: ConsentCategory[]
}

export function mountConsentBanner(opts: MountOptions): void {
  if (globalThis.window === undefined) return

  const categoryMap: Record<string, { enabled?: boolean; readOnly?: boolean }> = {}
  for (const c of opts.categories) {
    categoryMap[c] = {
      enabled: opts.defaultGranted?.includes(c) ?? c === 'necessary',
      readOnly: c === 'necessary',
    }
  }

  void CookieConsent.run({
    categories: categoryMap,
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            description: 'Necessary cookies keep the site working. Optional categories are opt-in.',
            showPreferencesBtn: 'Manage preferences',
            title: 'We use cookies',
          },
          preferencesModal: {
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            closeIconLabel: 'Close',
            savePreferencesBtn: 'Save',
            sections: opts.categories.map((c) => ({
              description: `${c} cookies`,
              linkedCategory: c,
              title: c[0]!.toUpperCase() + c.slice(1),
            })),
            title: 'Cookie preferences',
          },
        },
      },
    },
    onChange: ({ cookie }) => {
      const granted = (cookie?.categories ?? ['necessary']) as ConsentCategory[]
      useConsent.getState().setGranted(granted)
    },
    onConsent: ({ cookie }) => {
      const granted = (cookie?.categories ?? ['necessary']) as ConsentCategory[]
      useConsent.getState().setGranted(granted)
    },
  })
}

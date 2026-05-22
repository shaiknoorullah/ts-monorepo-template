// packages/consent/src/banner.ts
//
// vanilla-cookieconsent v3 wrapper. Mounts on the page and pipes user choices
// into the Zustand store so the rest of the codebase reads consent in one place.

import * as CookieConsent from 'vanilla-cookieconsent'
import 'vanilla-cookieconsent/dist/cookieconsent.css'
import { useConsent } from './store'
import type { ConsentCategory } from './types'

export interface MountOptions {
  categories: ConsentCategory[]
  defaultGranted?: ConsentCategory[]
}

export function mountConsentBanner(opts: MountOptions): void {
  if (typeof window === 'undefined') return

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
            title: 'We use cookies',
            description:
              'Necessary cookies keep the site working. Optional categories are opt-in.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage preferences',
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save',
            closeIconLabel: 'Close',
            sections: opts.categories.map((c) => ({
              title: c[0]!.toUpperCase() + c.slice(1),
              description: `${c} cookies`,
              linkedCategory: c,
            })),
          },
        },
      },
    },
    onConsent: ({ cookie }) => {
      const granted = (cookie?.categories ?? ['necessary']) as ConsentCategory[]
      useConsent.getState().setGranted(granted)
    },
    onChange: ({ cookie }) => {
      const granted = (cookie?.categories ?? ['necessary']) as ConsentCategory[]
      useConsent.getState().setGranted(granted)
    },
  })
}

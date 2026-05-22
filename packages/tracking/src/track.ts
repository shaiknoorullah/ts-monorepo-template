// packages/tracking/src/track.ts
//
// Consent-gated tracking. Refuses to fire any event without the relevant
// consent category granted.

import type { ConsentCategory } from '@pkg/consent'

import { hasConsent } from '@pkg/consent'

import type { EventProps, TrackingConfig } from './types'

let CONFIG: TrackingConfig = { consentCategory: 'analytics' }

interface UmamiGlobal {
  identify?: (id: string, props?: EventProps) => void
  track?: (name: string, props?: EventProps) => void
}

export function configure(cfg: TrackingConfig): void {
  CONFIG = { consentCategory: 'analytics', ...cfg }
}

function gate(): boolean {
  const category = (CONFIG.consentCategory ?? 'analytics') as ConsentCategory
  return hasConsent(category)
}

declare global {
  interface Window {
    umami?: UmamiGlobal
  }
}

export function identify(id: string, props?: EventProps): void {
  if (!gate()) return
  if (globalThis.window === undefined) return
  globalThis.window.umami?.identify?.(id, props)
}

export function page(path: string): void {
  if (!gate()) return
  if (globalThis.window === undefined) return
  globalThis.window.umami?.track?.('pageview', { path })
}

export function track(name: string, props?: EventProps): void {
  if (!gate()) return
  if (globalThis.window === undefined) return
  globalThis.window.umami?.track?.(name, props)
}

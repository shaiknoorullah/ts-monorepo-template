// packages/tracking/src/track.ts
//
// Consent-gated tracking. Refuses to fire any event without the relevant
// consent category granted.

import { hasConsent } from '@pkg/consent'
import type { ConsentCategory } from '@pkg/consent'
import type { EventProps, TrackingConfig } from './types'

let CONFIG: TrackingConfig = { consentCategory: 'analytics' }

export function configure(cfg: TrackingConfig): void {
  CONFIG = { consentCategory: 'analytics', ...cfg }
}

function gate(): boolean {
  const category = (CONFIG.consentCategory ?? 'analytics') as ConsentCategory
  return hasConsent(category)
}

interface UmamiGlobal {
  track?: (name: string, props?: EventProps) => void
  identify?: (id: string, props?: EventProps) => void
}

declare global {
  interface Window {
    umami?: UmamiGlobal
  }
}

export function track(name: string, props?: EventProps): void {
  if (!gate()) return
  if (typeof window === 'undefined') return
  window.umami?.track?.(name, props)
}

export function identify(id: string, props?: EventProps): void {
  if (!gate()) return
  if (typeof window === 'undefined') return
  window.umami?.identify?.(id, props)
}

export function page(path: string): void {
  if (!gate()) return
  if (typeof window === 'undefined') return
  window.umami?.track?.('pageview', { path })
}

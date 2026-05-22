// packages/tracking/src/types.ts

export type EventProps = Record<string, boolean | null | number | string>

export interface TrackingConfig {
  cloudflareAnalytics?: {
    token: string
  }
  /** Consent category that gates every event. Default 'analytics'. */
  consentCategory?: 'analytics' | 'functional' | 'marketing'
  umami?: {
    src: string
    websiteId: string
  }
}

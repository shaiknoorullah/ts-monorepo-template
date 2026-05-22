// packages/tracking/src/types.ts

export interface TrackingConfig {
  umami?: {
    websiteId: string
    src: string
  }
  cloudflareAnalytics?: {
    token: string
  }
  /** Consent category that gates every event. Default 'analytics'. */
  consentCategory?: 'functional' | 'analytics' | 'marketing'
}

export type EventProps = Record<string, string | number | boolean | null>

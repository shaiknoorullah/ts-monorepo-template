// packages/consent/src/types.ts

export type ConsentCategory = 'analytics' | 'functional' | 'marketing' | 'necessary'

export interface ConsentState {
  decided: boolean
  granted: readonly ConsentCategory[]
}

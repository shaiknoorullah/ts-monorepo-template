// packages/consent/src/types.ts

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing'

export interface ConsentState {
  granted: ReadonlyArray<ConsentCategory>
  decided: boolean
}

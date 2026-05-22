import { describe, expect, it } from 'vitest'
import { hasConsent, useConsent } from '../store'

describe('consent store', () => {
  it('necessary is granted by default', () => {
    expect(hasConsent('necessary')).toBe(true)
  })
  it('analytics is NOT granted by default', () => {
    expect(hasConsent('analytics')).toBe(false)
  })
  it('setGranted updates store and flips decided', () => {
    useConsent.getState().setGranted(['necessary', 'analytics'])
    expect(hasConsent('analytics')).toBe(true)
    expect(useConsent.getState().decided).toBe(true)
  })
})

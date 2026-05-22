import { describe, expect, it } from 'vitest'

describe('mobile-customer', () => {
  it('runtime version policy is appVersion', async () => {
    const cfg = await import('../app.json', { with: { type: 'json' } })
    expect(cfg.default.expo.runtimeVersion).toEqual({ policy: 'appVersion' })
  })
})

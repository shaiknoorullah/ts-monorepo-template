import { describe, expect, it } from 'vitest'

describe('mobile-admin', () => {
  it('bundle id is com.example.admin', async () => {
    const cfg = await import('../app.json', { with: { type: 'json' } })
    expect(cfg.default.expo.ios.bundleIdentifier).toBe('com.example.admin')
  })
})

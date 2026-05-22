import { describe, expect, it } from 'vitest'

// Smoke test that the Astro config still imports cleanly.
describe('docs-public', () => {
  it('astro config imports without error', async () => {
    const mod = await import('../../astro.config.mjs')
    expect(mod.default).toBeDefined()
  })
})

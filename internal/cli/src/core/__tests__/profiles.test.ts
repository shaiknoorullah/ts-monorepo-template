// internal/cli/src/core/__tests__/profiles.test.ts
import { describe, it, expect } from 'vitest'
import { listProfiles, describeProfile, diffProfiles } from '../profiles.js'

describe('listProfiles', () => {
  it('returns exactly the five canonical profile ids', () => {
    const ids = listProfiles().map((p) => p.id)
    expect(ids).toEqual(['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise'])
  })
  it('each profile carries a cost band and tagline', () => {
    for (const p of listProfiles()) {
      expect(p.cost_band_usd_monthly).toMatch(/^\$\d+(-\$?\d+)?(\+)?$/)
      expect(p.tagline.length).toBeGreaterThan(0)
    }
  })
})

describe('describeProfile', () => {
  it('returns full layer matrix for p-solo', () => {
    const p = describeProfile('p-solo')
    expect(p.id).toBe('p-solo')
    expect(p.dimensions.languages).toContain('typescript')
    expect(p.dimensions.languages).toContain('python')
    expect(p.dimensions.languages).not.toContain('rust')
  })
  it('throws on unknown profile', () => {
    expect(() => describeProfile('p-bogus')).toThrow(/unknown profile/)
  })
})

describe('diffProfiles', () => {
  it('returns added/removed/changed buckets', () => {
    const d = diffProfiles('p-solo', 'p-startup-small')
    expect(d.changed.languages.from).toEqual(['typescript', 'python'])
    expect(d.changed.languages.to).toContain('go')
  })
})

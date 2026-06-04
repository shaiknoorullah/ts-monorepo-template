import { describe, expect, it } from 'vitest'
import { simulateCost } from '../simulate'

describe('simulateCost — Section 11.10 output shape', () => {
  it('returns monthly_total_usd, by_layer, by_provider, assumptions, prices_as_of', () => {
    const r = simulateCost({ profile: 'p-startup-small' })
    expect(typeof r.monthly_total_usd).toBe('number')
    expect(r.by_layer).toMatchObject({
      compute: expect.any(Number),
      storage: expect.any(Number),
      egress: expect.any(Number),
      registry: expect.any(Number),
      secrets: expect.any(Number),
      observability_saas: expect.any(Number),
    })
    expect(typeof r.by_provider).toBe('object')
    expect(Array.isArray(r.assumptions)).toBe(true)
    expect(r.prices_as_of).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(r.profile).toBe('p-startup-small')
  })
})

describe('simulateCost — accuracy under 10% error vs known monthly bills', () => {
  // KB1: p-solo on Hetzner cx22 only = €4.59 ≈ $4.96
  it('p-solo (Hetzner cx22 only) ≈ $5 (±10%)', () => {
    const r = simulateCost({ profile: 'p-solo' })
    expect(r.monthly_total_usd).toBeGreaterThan(4.5)
    expect(r.monthly_total_usd).toBeLessThan(5.5)
  })

  // KB2: p-hobby on Hetzner cx32 = €7.59 + 100GB volume = €7.59 + 4.76 = €12.35 ≈ $13.34
  it('p-hobby (Hetzner cx32 + 100GB) ≈ $13 (±10%)', () => {
    const r = simulateCost({ profile: 'p-hobby' })
    expect(r.monthly_total_usd).toBeGreaterThan(12)
    expect(r.monthly_total_usd).toBeLessThan(15)
  })

  // KB3: p-startup-small on 3x Hetzner cx32 = 3 * 7.59 = €22.77 + 100GB volume = €27.53 ≈ $29.73 ish
  it('p-startup-small (3x cx32 + 100GB + 1TB egress within included) ≈ $30 (±10%)', () => {
    const r = simulateCost({ profile: 'p-startup-small' })
    expect(r.monthly_total_usd).toBeGreaterThan(27)
    expect(r.monthly_total_usd).toBeLessThan(34)
  })

  // KB4: p-startup-scale on 5x AWS m7g.large = 5 * 59.86 = $299.30
  //   + 500GB gp3 ($40)
  //   + 2TB egress over 100GB included @ $0.09/GB (~1900 * $0.09 = $171)
  //   ≈ $510 total. Plan's original $340 figure omitted egress; corrected here.
  it('p-startup-scale (5x m7g.large + 500GB gp3 + 2TB egress) ≈ $510 (±10%)', () => {
    const r = simulateCost({ profile: 'p-startup-scale' })
    expect(r.monthly_total_usd).toBeGreaterThan(459)
    expect(r.monthly_total_usd).toBeLessThan(561)
  })

  // KB5: assumptions array always non-empty
  it('always emits at least one assumption row', () => {
    const r = simulateCost({ profile: 'p-startup-small' })
    expect(r.assumptions.length).toBeGreaterThan(0)
  })
})

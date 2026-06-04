import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema as costOut } from '../../src/schemas/simulate_cost.js'
import { outputSchema as tradeoffOut } from '../../src/schemas/explain_tradeoff.js'
import { handler as simulateCost } from '../../src/tools/simulate_cost.js'
import { handler as explainTradeoff } from '../../src/tools/explain_tradeoff.js'

const FIXTURES = join(__dirname, '..', 'fixtures')

const ctx = {
  profilesDir: join(FIXTURES, 'profiles'),
  pricesDir: join(FIXTURES, 'data', 'cloud-prices'),
}

describe('simulate_cost', () => {
  it('matches the spec Section 11.10 example for p-startup-small', async () => {
    const out = await simulateCost({ profile: 'p-startup-small' }, ctx)
    expect(out.profile).toBe('p-startup-small')
    expect(out.monthly_total_usd).toBeGreaterThanOrEqual(60)
    expect(out.monthly_total_usd).toBeLessThanOrEqual(90)
    expect(out.by_layer.observability_saas).toBeCloseTo(29, 0)
    expect(out.by_provider['hetzner']).toBeGreaterThan(0)
    expect(out.by_provider['grafana-cloud']).toBeCloseTo(29, 0)
    expect(out.prices_as_of).toBe('2026-05-28')
  })

  it('output validates against schema', async () => {
    const out = await simulateCost({ profile: 'p-startup-small' }, ctx)
    const validate = compileSchema(costOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })

  it('p-solo costs less than p-enterprise', async () => {
    const solo = await simulateCost({ profile: 'p-solo' }, ctx)
    const ent = await simulateCost({ profile: 'p-enterprise' }, ctx)
    expect(solo.monthly_total_usd).toBeLessThan(ent.monthly_total_usd)
  })
})

describe('explain_tradeoff', () => {
  it('emits cost delta + layer-by-layer change list', async () => {
    const out = await explainTradeoff({ from: 'p-hobby', to: 'p-startup-small' }, ctx)
    expect(out.from).toBe('p-hobby')
    expect(out.to).toBe('p-startup-small')
    expect(typeof out.cost_delta_usd).toBe('number')
    expect(out.changes.length).toBeGreaterThan(0)
    const layers = out.changes.map((c) => c.layer)
    expect(layers).toContain('nx')
  })

  it('output validates against schema', async () => {
    const out = await explainTradeoff({ from: 'p-startup-small', to: 'p-enterprise' }, ctx)
    const validate = compileSchema(tradeoffOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })
})

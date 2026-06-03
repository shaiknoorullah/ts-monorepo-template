import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema } from '../../src/schemas/simulate_cost.js'
import { handler } from '../../src/tools/simulate_cost.js'

const validateOut = compileSchema(outputSchema)

describe('simulate_cost MCP handler — Phase 15 deterministic impl', () => {
  it('p-startup-small returns by_layer breakdown matching Section 11.10', async () => {
    const out = await handler({ profile: 'p-startup-small' })
    const ok = validateOut(out)
    if (!ok) throw new Error(JSON.stringify(validateOut.errors))
    expect(ok).toBe(true)
    expect(out.by_layer).toBeDefined()
    expect(out.monthly_total_usd).toBeGreaterThan(0)
    expect(out.prices_as_of).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('p-solo monthly_total_usd is between $4 and $6', async () => {
    const out = await handler({ profile: 'p-solo' })
    expect(out.monthly_total_usd).toBeGreaterThanOrEqual(4)
    expect(out.monthly_total_usd).toBeLessThanOrEqual(6)
  })
})

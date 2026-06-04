import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { inputSchema, outputSchema } from '../../src/schemas/recommend_profile.js'
import { handler } from '../../src/tools/recommend_profile.js'

const validateIn = compileSchema(inputSchema)
const validateOut = compileSchema(outputSchema)

describe('recommend_profile MCP handler — Phase 15 deterministic impl', () => {
  it('input passes its own JSON Schema', () => {
    const input = {
      answers: {
        team_size: '2-5',
        env_count: 3,
        target_budget_usd: 80,
        compliance_floor: 'none',
      },
    }
    expect(validateIn(input)).toBe(true)
  })

  it('returns output conforming to outputSchema (real impl, no ctx)', async () => {
    const out = await handler({
      answers: {
        team_size: '2-5',
        env_count: 3,
        target_budget_usd: 80,
        compliance_floor: 'none',
      },
    })
    const ok = validateOut(out)
    if (!ok) throw new Error(JSON.stringify(validateOut.errors))
    expect(ok).toBe(true)
    expect(out.ranked.length).toBe(5)
    expect(out.recommended).toBe(out.ranked[0]!.profile)
  })

  it('FedRAMP answer routes recommended to p-enterprise', async () => {
    const out = await handler({
      answers: {
        team_size: '20+',
        env_count: 3,
        target_budget_usd: 5000,
        compliance_floor: 'fedramp',
      },
    })
    expect(out.recommended).toBe('p-enterprise')
  })
})

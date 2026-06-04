// docs/agents/__tests__/aegis.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const raw = readFileSync(resolve(__dirname, '../aegis.md'), 'utf8')

describe('docs/agents/aegis.md', () => {
  const requiredTools = [
    'list_profiles',
    'describe_profile',
    'recommend_profile',
    'list_apps',
    'describe_app',
    'add_app',
    'list_xrds',
    'describe_xrd',
    'claim_infra',
    'simulate_cost',
    'explain_tradeoff',
    'validate_plan',
    'propose_change',
  ]

  it.each(requiredTools)('mentions MCP tool %s', (t) => {
    expect(raw).toContain(t)
  })

  it('states the "never write the tree directly" invariant from spec section 11', () => {
    expect(raw).toMatch(/propose_change/)
    expect(raw).toMatch(/does not write the tree directly/i)
  })
})

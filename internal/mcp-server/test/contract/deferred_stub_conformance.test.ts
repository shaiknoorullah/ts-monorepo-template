import { describe, expect, it } from 'vitest'
import { buildRegistry } from '../../src/registry.js'
import { compileSchema } from '../../src/schemas/_validator.js'
import { STUB_OUTPUT_SCHEMA } from '../../src/schemas/_common.js'

const DEFERRED_TOOLS = [
  'add_app',
  'claim_infra',
  'validate_plan',
  'propose_change',
  'nx_cloud_status',
  'nx_cloud_cache_hit_rate',
  'nx_cloud_recent_runs',
  'nx_cloud_estimate_savings_usd',
] as const

const VALID_INPUTS: Record<(typeof DEFERRED_TOOLS)[number], unknown> = {
  add_app: { name: 'orders', language: 'go' },
  claim_infra: { xrd: 'XPostgresCluster', app: 'orders', env: 'dev' },
  validate_plan: { patch: 'diff' },
  propose_change: { title: 't', rationale: 'r', patch: 'p' },
  nx_cloud_status: {},
  nx_cloud_cache_hit_rate: {},
  nx_cloud_recent_runs: {},
  nx_cloud_estimate_savings_usd: {},
}

describe('deferred-stub conformance gate', () => {
  const registry = buildRegistry()
  const validateStub = compileSchema(STUB_OUTPUT_SCHEMA)

  for (const name of DEFERRED_TOOLS) {
    it(`${name}: outputSchema is exactly STUB_OUTPUT_SCHEMA`, () => {
      expect(registry[name]!.outputSchema).toEqual(STUB_OUTPUT_SCHEMA)
    })

    it(`${name}: handler output validates against STUB_OUTPUT_SCHEMA`, async () => {
      const out = await registry[name]!.handler(VALID_INPUTS[name], {})
      const ok = validateStub(out)
      if (!ok) throw new Error(JSON.stringify(validateStub.errors))
      expect(ok).toBe(true)
    })
  }
})

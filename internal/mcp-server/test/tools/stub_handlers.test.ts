import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { STUB_OUTPUT_SCHEMA } from '../../src/schemas/_common.js'
import { handler as addApp } from '../../src/tools/add_app.js'
import { handler as claimInfra } from '../../src/tools/claim_infra.js'
import { handler as validatePlan } from '../../src/tools/validate_plan.js'
import { handler as proposeChange } from '../../src/tools/propose_change.js'
import { handler as nxStatus } from '../../src/tools/nx_cloud_status.js'
import { handler as nxHit } from '../../src/tools/nx_cloud_cache_hit_rate.js'
import { handler as nxRecent } from '../../src/tools/nx_cloud_recent_runs.js'
import { handler as nxEstimate } from '../../src/tools/nx_cloud_estimate_savings_usd.js'

const validate = compileSchema(STUB_OUTPUT_SCHEMA)

const cases = [
  ['add_app', async () => addApp({ name: 'orders', language: 'go' }, {})],
  [
    'claim_infra',
    async () => claimInfra({ xrd: 'XPostgresCluster', app: 'orders', env: 'dev' }, {}),
  ],
  ['validate_plan', async () => validatePlan({ patch: 'diff' }, {})],
  ['propose_change', async () => proposeChange({ title: 't', rationale: 'r', patch: 'p' }, {})],
  ['nx_cloud_status', async () => nxStatus({}, {})],
  ['nx_cloud_cache_hit_rate', async () => nxHit({}, {})],
  ['nx_cloud_recent_runs', async () => nxRecent({}, {})],
  ['nx_cloud_estimate_savings_usd', async () => nxEstimate({}, {})],
] as const

describe('stub handlers (spec Section 11.8 + Section 3.9)', () => {
  for (const [name, run] of cases) {
    it(`${name} returns the canonical not_yet_implemented payload`, async () => {
      const out = await run()
      const ok = validate(out)
      if (!ok) throw new Error(JSON.stringify(validate.errors))
      expect(ok).toBe(true)
      expect((out as { status: string }).status).toBe('not_yet_implemented')
      expect((out as { schema_stable: boolean }).schema_stable).toBe(true)
      expect((out as { tracking_issue: string }).tracking_issue).toMatch(
        /^https:\/\/github\.com\/ts-monorepo-template\/platform\/issues\/\d+$/,
      )
      expect(['v0.2', 'v0.3']).toContain((out as { expected_milestone: string }).expected_milestone)
    })
  }
})

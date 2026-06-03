import { describe, expect, it } from 'vitest'
import { STUB_OUTPUT_SCHEMA } from '../../src/schemas/_common.js'
import * as addApp from '../../src/schemas/add_app.js'
import * as claimInfra from '../../src/schemas/claim_infra.js'
import * as validatePlan from '../../src/schemas/validate_plan.js'
import * as proposeChange from '../../src/schemas/propose_change.js'
import * as nxStatus from '../../src/schemas/nx_cloud_status.js'
import * as nxHit from '../../src/schemas/nx_cloud_cache_hit_rate.js'
import * as nxRecent from '../../src/schemas/nx_cloud_recent_runs.js'
import * as nxEstimate from '../../src/schemas/nx_cloud_estimate_savings_usd.js'

const stubs = [
  ['add_app', addApp],
  ['claim_infra', claimInfra],
  ['validate_plan', validatePlan],
  ['propose_change', proposeChange],
  ['nx_cloud_status', nxStatus],
  ['nx_cloud_cache_hit_rate', nxHit],
  ['nx_cloud_recent_runs', nxRecent],
  ['nx_cloud_estimate_savings_usd', nxEstimate],
] as const

describe('stub tool schemas conform to spec Section 11.8', () => {
  for (const [name, mod] of stubs) {
    it(`${name} has an inputSchema and the canonical stub outputSchema`, () => {
      expect(mod.inputSchema).toBeDefined()
      expect(mod.outputSchema).toEqual(STUB_OUTPUT_SCHEMA)
    })
  }
})

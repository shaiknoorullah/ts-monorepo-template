import * as listProfilesSchema from './schemas/list_profiles.js'
import * as describeProfileSchema from './schemas/describe_profile.js'
import * as recommendProfileSchema from './schemas/recommend_profile.js'
import * as listAppsSchema from './schemas/list_apps.js'
import * as describeAppSchema from './schemas/describe_app.js'
import * as addAppSchema from './schemas/add_app.js'
import * as listXrdsSchema from './schemas/list_xrds.js'
import * as describeXrdSchema from './schemas/describe_xrd.js'
import * as claimInfraSchema from './schemas/claim_infra.js'
import * as simulateCostSchema from './schemas/simulate_cost.js'
import * as explainTradeoffSchema from './schemas/explain_tradeoff.js'
import * as validatePlanSchema from './schemas/validate_plan.js'
import * as proposeChangeSchema from './schemas/propose_change.js'
import * as nxStatusSchema from './schemas/nx_cloud_status.js'
import * as nxHitSchema from './schemas/nx_cloud_cache_hit_rate.js'
import * as nxRecentSchema from './schemas/nx_cloud_recent_runs.js'
import * as nxEstimateSchema from './schemas/nx_cloud_estimate_savings_usd.js'
import * as nxBackendSchema from './schemas/nx_cloud_recommend_backend.js'

import { handler as listProfiles } from './tools/list_profiles.js'
import { handler as describeProfile } from './tools/describe_profile.js'
import { handler as recommendProfile } from './tools/recommend_profile.js'
import { handler as listApps } from './tools/list_apps.js'
import { handler as describeApp } from './tools/describe_app.js'
import { handler as addApp } from './tools/add_app.js'
import { handler as listXrds } from './tools/list_xrds.js'
import { handler as describeXrd } from './tools/describe_xrd.js'
import { handler as claimInfra } from './tools/claim_infra.js'
import { handler as simulateCost } from './tools/simulate_cost.js'
import { handler as explainTradeoff } from './tools/explain_tradeoff.js'
import { handler as validatePlan } from './tools/validate_plan.js'
import { handler as proposeChange } from './tools/propose_change.js'
import { handler as nxStatus } from './tools/nx_cloud_status.js'
import { handler as nxHit } from './tools/nx_cloud_cache_hit_rate.js'
import { handler as nxRecent } from './tools/nx_cloud_recent_runs.js'
import { handler as nxEstimate } from './tools/nx_cloud_estimate_savings_usd.js'
import { handler as nxBackend } from './tools/nx_cloud_recommend_backend.js'

export interface Tool {
  inputSchema: unknown
  outputSchema: unknown
  handler: (input: any, ctx: any) => Promise<unknown>
}

export type Registry = Record<string, Tool>

export function buildRegistry(): Registry {
  return {
    list_profiles: { ...listProfilesSchema, handler: listProfiles },
    describe_profile: { ...describeProfileSchema, handler: describeProfile },
    recommend_profile: { ...recommendProfileSchema, handler: recommendProfile },
    list_apps: { ...listAppsSchema, handler: listApps },
    describe_app: { ...describeAppSchema, handler: describeApp },
    add_app: { ...addAppSchema, handler: addApp },
    list_xrds: { ...listXrdsSchema, handler: listXrds },
    describe_xrd: { ...describeXrdSchema, handler: describeXrd },
    claim_infra: { ...claimInfraSchema, handler: claimInfra },
    simulate_cost: { ...simulateCostSchema, handler: simulateCost },
    explain_tradeoff: { ...explainTradeoffSchema, handler: explainTradeoff },
    validate_plan: { ...validatePlanSchema, handler: validatePlan },
    propose_change: { ...proposeChangeSchema, handler: proposeChange },
    nx_cloud_status: { ...nxStatusSchema, handler: nxStatus },
    nx_cloud_cache_hit_rate: { ...nxHitSchema, handler: nxHit },
    nx_cloud_recent_runs: { ...nxRecentSchema, handler: nxRecent },
    nx_cloud_estimate_savings_usd: { ...nxEstimateSchema, handler: nxEstimate },
    nx_cloud_recommend_backend: { ...nxBackendSchema, handler: nxBackend },
  }
}

export * as __schema_re_exports from './schemas/index.js'

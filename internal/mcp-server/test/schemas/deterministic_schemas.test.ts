import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import * as listProfiles from '../../src/schemas/list_profiles.js'
import * as describeProfile from '../../src/schemas/describe_profile.js'
import * as recommendProfile from '../../src/schemas/recommend_profile.js'
import * as listApps from '../../src/schemas/list_apps.js'
import * as describeApp from '../../src/schemas/describe_app.js'
import * as listXrds from '../../src/schemas/list_xrds.js'
import * as describeXrd from '../../src/schemas/describe_xrd.js'
import * as simulateCost from '../../src/schemas/simulate_cost.js'
import * as explainTradeoff from '../../src/schemas/explain_tradeoff.js'
import * as nxCloudRecommendBackend from '../../src/schemas/nx_cloud_recommend_backend.js'

const tools = [
  ['list_profiles', listProfiles],
  ['describe_profile', describeProfile],
  ['recommend_profile', recommendProfile],
  ['list_apps', listApps],
  ['describe_app', describeApp],
  ['list_xrds', listXrds],
  ['describe_xrd', describeXrd],
  ['simulate_cost', simulateCost],
  ['explain_tradeoff', explainTradeoff],
  ['nx_cloud_recommend_backend', nxCloudRecommendBackend],
] as const

describe('deterministic tool schemas compile', () => {
  for (const [name, mod] of tools) {
    it(`${name} exports compilable inputSchema + outputSchema`, () => {
      expect(() => compileSchema(mod.inputSchema)).not.toThrow()
      expect(() => compileSchema(mod.outputSchema)).not.toThrow()
    })
  }
})

describe('recommend_profile matches spec Section 11.9', () => {
  it('inputSchema requires team_size + env_count + target_budget_usd + compliance_floor', () => {
    expect(recommendProfile.inputSchema.properties.answers.required).toEqual([
      'team_size',
      'env_count',
      'target_budget_usd',
      'compliance_floor',
    ])
  })

  it('outputSchema enforces sha256 hex on rubric_sha256', () => {
    expect(recommendProfile.outputSchema.properties.rubric_sha256.pattern).toBe('^[0-9a-f]{64}$')
  })

  it('outputSchema constrains profile to the 5 spec IDs', () => {
    const profileEnum =
      recommendProfile.outputSchema.properties.ranked.items.properties.profile.enum
    expect(profileEnum).toEqual([
      'p-solo',
      'p-hobby',
      'p-startup-small',
      'p-startup-scale',
      'p-enterprise',
    ])
  })
})

describe('simulate_cost output matches spec Section 11.10', () => {
  it('outputSchema requires by_layer + by_provider + prices_as_of', () => {
    expect(simulateCost.outputSchema.required).toEqual([
      'profile',
      'monthly_total_usd',
      'by_layer',
      'by_provider',
      'assumptions',
      'prices_as_of',
    ])
  })
})

describe('nx_cloud_recommend_backend matches Section 3.6', () => {
  it('input requires profile + monthly_ci_minutes + compliance_flags', () => {
    expect(nxCloudRecommendBackend.inputSchema.required).toEqual([
      'profile',
      'monthly_ci_minutes',
      'compliance_flags',
    ])
  })

  it('output ranks across SaaS / PowerPack / community', () => {
    const backends =
      nxCloudRecommendBackend.outputSchema.properties.ranked.items.properties.backend.enum
    expect(backends).toEqual(['saas', 'powerpack-self-host', 'community'])
  })
})

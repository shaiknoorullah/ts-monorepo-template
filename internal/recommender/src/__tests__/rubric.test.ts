import { describe, expect, it } from 'vitest'
import { loadRubric } from '../rubric'

describe('loadRubric', () => {
  it('returns version, sha256, weights, profile_priors', () => {
    const r = loadRubric()
    expect(r.version).toBe('1.0.0')
    expect(r.sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(r.weights).toMatchObject({
      team_size: 'high',
      env_count: 'high',
      target_budget_usd: 'high',
      compliance_floor: 'high',
      workload_shape: 'medium',
      ha_level: 'high',
      observability_depth: 'medium',
      secret_backend: 'medium',
      registry: 'low',
      cdn_edge: 'low',
    })
    expect(Object.keys(r.profile_priors)).toEqual([
      'p-solo',
      'p-hobby',
      'p-startup-small',
      'p-startup-scale',
      'p-enterprise',
    ])
  })

  it('sha256 is stable across calls (cached)', () => {
    expect(loadRubric().sha256).toBe(loadRubric().sha256)
  })
})

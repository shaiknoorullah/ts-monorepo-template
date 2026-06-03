import { describe, expect, it } from 'vitest'
import { score, type RecommenderAnswers } from '../score'

const fullAnswers: RecommenderAnswers = {
  team_size: '2-5',
  env_count: 3,
  target_budget_usd: 80,
  compliance_floor: 'none',
  workload_shape: 'stateless-web',
  ha_level: 'single-az',
  observability_depth: 'logs+metrics',
  secret_backend: 'vault',
  registry: 'ghcr',
  cdn_edge: 'cloudflare',
}

describe('score', () => {
  it('returns ranked[], recommended, rubric_version, rubric_sha256', () => {
    const r = score(fullAnswers)
    expect(r.rubric_version).toBe('1.0.0')
    expect(r.rubric_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(r.ranked.length).toBe(5)
    expect(r.recommended).toBe(r.ranked[0]!.profile)
  })

  it('every entry has profile, score in [0,1], non-empty reasons', () => {
    const r = score(fullAnswers)
    for (const row of r.ranked) {
      expect(['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']).toContain(
        row.profile,
      )
      expect(row.score).toBeGreaterThanOrEqual(0)
      expect(row.score).toBeLessThanOrEqual(1)
      expect(row.reasons.length).toBeGreaterThan(0)
    }
  })

  it('is deterministic — same input -> same output', () => {
    const a = score(fullAnswers)
    const b = score(fullAnswers)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('ranks are sorted descending by score', () => {
    const r = score(fullAnswers)
    for (let i = 1; i < r.ranked.length; i++) {
      expect(r.ranked[i - 1]!.score).toBeGreaterThanOrEqual(r.ranked[i]!.score)
    }
  })
})

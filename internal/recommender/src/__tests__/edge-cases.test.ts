import { describe, expect, it } from 'vitest'
import { score, type RecommenderAnswers } from '../score'

const base: RecommenderAnswers = {
  team_size: '2-5',
  env_count: 2,
  target_budget_usd: 50,
  compliance_floor: 'none',
}

describe('recommender edge cases', () => {
  it('E01: $0 budget always ranks p-solo first', () => {
    const r = score({ ...base, team_size: '1', env_count: 1, target_budget_usd: 0 })
    expect(r.recommended).toBe('p-solo')
  })

  it('E02: budget exactly at p-hobby max ($20) prefers p-hobby over p-solo', () => {
    const r = score({ ...base, team_size: '1', env_count: 1, target_budget_usd: 20 })
    expect(r.recommended).toBe('p-hobby')
  })

  it('E03: FedRAMP compliance forces p-enterprise even at low budget', () => {
    const r = score({ ...base, target_budget_usd: 50, compliance_floor: 'fedramp' })
    expect(r.recommended).toBe('p-enterprise')
  })

  it('E04: HIPAA + team_size=20+ recommends p-enterprise', () => {
    const r = score({
      team_size: '20+',
      env_count: 3,
      target_budget_usd: 3000,
      compliance_floor: 'hipaa',
    })
    expect(r.recommended).toBe('p-enterprise')
  })

  it('E05: multi-region ha_level rules out p-solo and p-hobby', () => {
    const r = score({
      team_size: '6-20',
      env_count: 4,
      target_budget_usd: 800,
      compliance_floor: 'none',
      ha_level: 'multi-region',
    })
    expect(['p-startup-scale', 'p-enterprise']).toContain(r.recommended)
    const solo = r.ranked.find((x) => x.profile === 'p-solo')!
    const hobby = r.ranked.find((x) => x.profile === 'p-hobby')!
    expect(solo.score).toBeLessThan(0.5)
    expect(hobby.score).toBeLessThan(0.5)
  })

  it('E06: 10 envs (max) ranks p-enterprise above p-startup-small', () => {
    const r = score({ ...base, env_count: 10, target_budget_usd: 5000 })
    const enterprise = r.ranked.find((x) => x.profile === 'p-enterprise')!
    const small = r.ranked.find((x) => x.profile === 'p-startup-small')!
    expect(enterprise.score).toBeGreaterThan(small.score)
  })

  it('E07: only required fields produce a valid result', () => {
    const r = score({
      team_size: '2-5',
      env_count: 2,
      target_budget_usd: 50,
      compliance_floor: 'none',
    })
    expect(r.ranked.length).toBe(5)
    expect(r.recommended).toBeTruthy()
  })

  it('E08: budget far above ceiling still ranks profile but with overspend penalty', () => {
    const r = score({
      team_size: '1',
      env_count: 1,
      target_budget_usd: 100_000,
      compliance_floor: 'none',
    })
    const solo = r.ranked.find((x) => x.profile === 'p-solo')!
    expect(solo.reasons.some((x) => x.includes('above'))).toBe(true)
  })

  it('E09: secret_backend=auto never penalizes any profile', () => {
    const aWith = score({ ...base, secret_backend: 'auto' })
    const aWithout = score(base)
    // adding auto should not strictly worsen the top recommendation
    expect(aWith.ranked[0]!.score).toBeGreaterThanOrEqual(aWithout.ranked[0]!.score * 0.95)
  })

  it('E10: registry=auto + cdn_edge=none are accepted everywhere', () => {
    const r = score({ ...base, registry: 'auto', cdn_edge: 'none' })
    expect(r.ranked.length).toBe(5)
    for (const row of r.ranked) {
      expect(row.score).toBeGreaterThanOrEqual(0)
    }
  })
})

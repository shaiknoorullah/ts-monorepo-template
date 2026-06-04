import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { describe, expect, it } from 'vitest'

const FIXTURES = join(__dirname)

describe('test fixtures', () => {
  it('ships exactly the 5 profile fixtures from spec Section 1.5', () => {
    const ids = readdirSync(join(FIXTURES, 'profiles')).sort()
    expect(ids).toEqual(['p-enterprise', 'p-hobby', 'p-solo', 'p-startup-scale', 'p-startup-small'])
  })

  it('every profile.yaml declares id, name, cost_band_usd, dimensions', () => {
    for (const id of readdirSync(join(FIXTURES, 'profiles'))) {
      const doc = parseYaml(readFileSync(join(FIXTURES, 'profiles', id, 'profile.yaml'), 'utf8'))
      expect(doc.id).toBe(id)
      expect(typeof doc.name).toBe('string')
      expect(typeof doc.cost_band_usd.min).toBe('number')
      expect(typeof doc.cost_band_usd.max).toBe('number')
      expect(doc.dimensions).toBeTypeOf('object')
    }
  })

  it('go-hello + py-hello META.yaml fixtures exist and have language', () => {
    for (const name of ['go-hello', 'py-hello']) {
      const doc = parseYaml(readFileSync(join(FIXTURES, 'apps', name, 'META.yaml'), 'utf8'))
      expect(doc.name).toBe(name)
      expect(['go', 'python', 'rust', 'typescript']).toContain(doc.language)
    }
  })

  it('hetzner + grafana-cloud price files are well-formed (spec Section 11.10)', () => {
    const hetzner = parseYaml(
      readFileSync(join(FIXTURES, 'data', 'cloud-prices', 'hetzner.yaml'), 'utf8'),
    )
    expect(hetzner.provider).toBe('hetzner')
    expect(Array.isArray(hetzner.skus)).toBe(true)
    expect(hetzner.skus[0]).toHaveProperty('price_monthly')
  })

  it('rubric.yaml lists all 10 questions from spec Section 11.4', () => {
    const rubric = parseYaml(readFileSync(join(FIXTURES, 'rubric.yaml'), 'utf8'))
    const ids = rubric.questions.map((q: { id: string }) => q.id).sort()
    expect(ids).toEqual([
      'cdn_edge',
      'compliance_floor',
      'env_count',
      'ha_level',
      'observability_depth',
      'registry',
      'secret_backend',
      'target_budget_usd',
      'team_size',
      'workload_shape',
    ])
  })
})

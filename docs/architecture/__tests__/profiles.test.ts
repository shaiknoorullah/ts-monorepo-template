// docs/architecture/__tests__/profiles.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const raw = readFileSync(resolve(__dirname, '../profiles.md'), 'utf8')

describe('docs/architecture/profiles.md', () => {
  const ids = ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']
  it.each(ids)('mentions machine ID %s', (id) => {
    expect(raw).toContain(id)
  })

  it('lists all 12 profile axes from spec section 1.6', () => {
    const axes = [
      'team_size',
      'env_count',
      'target_budget_usd',
      'compliance_floor',
      'workload_shape',
      'ha_level',
      'cluster_substrate',
      'mesh',
      'observability_depth',
      'secret_backend',
      'registry',
      'cdn_edge',
    ]
    for (const a of axes) expect(raw).toContain(a)
  })

  it('references spec section 1.5 and 1.6', () => {
    expect(raw).toMatch(/Section 1\.5/)
    expect(raw).toMatch(/Section 1\.6/)
  })
})

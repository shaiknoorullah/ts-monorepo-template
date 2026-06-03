import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema } from '../../src/schemas/recommend_profile.js'
import { handler as recommendProfile } from '../../src/tools/recommend_profile.js'

const FIXTURES = join(__dirname, '..', 'fixtures')

const ctx = {
  profilesDir: join(FIXTURES, 'profiles'),
  rubricPath: join(FIXTURES, 'rubric.yaml'),
}

describe('recommend_profile', () => {
  it('recommends p-solo for solo + $0 + no compliance', async () => {
    const out = await recommendProfile(
      {
        answers: {
          team_size: '1',
          env_count: 1,
          target_budget_usd: 0,
          compliance_floor: 'none',
        },
      },
      ctx,
    )
    expect(out.recommended).toBe('p-solo')
  })

  it('recommends p-startup-small for 2-5 + $80 + none', async () => {
    const out = await recommendProfile(
      {
        answers: {
          team_size: '2-5',
          env_count: 3,
          target_budget_usd: 80,
          compliance_floor: 'none',
        },
      },
      ctx,
    )
    expect(out.recommended).toBe('p-startup-small')
    const top3 = out.ranked.slice(0, 3).map((r) => r.profile)
    expect(top3).toContain('p-startup-small')
  })

  it('output validates against schema + rubric_sha256 matches fixture file', async () => {
    const out = await recommendProfile(
      {
        answers: {
          team_size: '6-20',
          env_count: 3,
          target_budget_usd: 1000,
          compliance_floor: 'soc2',
        },
      },
      ctx,
    )
    const validate = compileSchema(outputSchema)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
    const expected = createHash('sha256').update(readFileSync(ctx.rubricPath)).digest('hex')
    expect(out.rubric_sha256).toBe(expected)
    expect(out.rubric_version).toBe('1.0.0')
  })

  it('ranked entries are sorted by descending score', async () => {
    const out = await recommendProfile(
      {
        answers: {
          team_size: '20+',
          env_count: 5,
          target_budget_usd: 20_000,
          compliance_floor: 'fedramp',
        },
      },
      ctx,
    )
    for (let i = 1; i < out.ranked.length; i++) {
      expect(out.ranked[i - 1]!.score).toBeGreaterThanOrEqual(out.ranked[i]!.score)
    }
    expect(out.recommended).toBe('p-enterprise')
  })
})

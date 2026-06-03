import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema } from '../../src/schemas/nx_cloud_recommend_backend.js'
import { handler } from '../../src/tools/nx_cloud_recommend_backend.js'

describe('nx_cloud_recommend_backend (spec Section 3.7)', () => {
  it('p-solo + 0 CI minutes → community (disabled equivalent)', async () => {
    const out = await handler(
      { profile: 'p-solo', monthly_ci_minutes: 0, compliance_flags: [] },
      {},
    )
    expect(out.recommended).toBe('community')
  })

  it('p-startup-small + 1000 CI minutes + no compliance → saas', async () => {
    const out = await handler(
      {
        profile: 'p-startup-small',
        monthly_ci_minutes: 1000,
        compliance_flags: [],
      },
      {},
    )
    expect(out.recommended).toBe('saas')
  })

  it('p-enterprise + soc2 + data-residency → powerpack-self-host', async () => {
    const out = await handler(
      {
        profile: 'p-enterprise',
        monthly_ci_minutes: 50_000,
        compliance_flags: ['soc2', 'data-residency'],
      },
      {},
    )
    expect(out.recommended).toBe('powerpack-self-host')
  })

  it('output validates against schema + ranked is sorted descending', async () => {
    const out = await handler(
      {
        profile: 'p-startup-scale',
        monthly_ci_minutes: 5000,
        compliance_flags: ['soc2'],
      },
      {},
    )
    const validate = compileSchema(outputSchema)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
    for (let i = 1; i < out.ranked.length; i++) {
      expect(out.ranked[i - 1]!.score).toBeGreaterThanOrEqual(out.ranked[i]!.score)
    }
  })
})

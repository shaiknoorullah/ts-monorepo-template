import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema as listOut } from '../../src/schemas/list_profiles.js'
import { outputSchema as describeOut } from '../../src/schemas/describe_profile.js'
import { handler as listProfiles } from '../../src/tools/list_profiles.js'
import { handler as describeProfile } from '../../src/tools/describe_profile.js'

const FIXTURES = join(__dirname, '..', 'fixtures', 'profiles')

describe('list_profiles', () => {
  it('returns the 5 spec profiles, ordered by ascending cost_band_usd.min', async () => {
    const out = await listProfiles({}, { profilesDir: FIXTURES })
    expect(out.profiles.map((p) => p.id)).toEqual([
      'p-solo',
      'p-hobby',
      'p-startup-small',
      'p-startup-scale',
      'p-enterprise',
    ])
  })

  it('output validates against the schema', async () => {
    const out = await listProfiles({}, { profilesDir: FIXTURES })
    const validate = compileSchema(listOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })
})

describe('describe_profile', () => {
  it('returns full layer_defaults for p-startup-small', async () => {
    const out = await describeProfile({ id: 'p-startup-small' }, { profilesDir: FIXTURES })
    expect(out.id).toBe('p-startup-small')
    expect(out.layer_defaults.nx).toEqual({ cloud: 'saas-enabled' })
    expect(out.layer_defaults.secretspec).toEqual({ provider: 'cloud-kms' })
  })

  it('output validates against the schema', async () => {
    const out = await describeProfile({ id: 'p-enterprise' }, { profilesDir: FIXTURES })
    const validate = compileSchema(describeOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })

  it('throws on unknown profile id', async () => {
    await expect(
      describeProfile({ id: 'p-solo' as const }, { profilesDir: '/does/not/exist' }),
    ).rejects.toThrow(/profile not found/)
  })
})

// internal/cli/src/__tests__/profile-list.test.ts
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { listProfiles, formatProfilesTable } from '../commands/profile/list.js'

const REPO_ROOT = resolve(__dirname, '../../../..')

describe('profile list', () => {
  it('returns 5 named profiles, sorted by cost band min', () => {
    const profiles = listProfiles(resolve(REPO_ROOT, 'profiles'))
    expect(profiles.map((p) => p.machineId)).toEqual([
      'p-solo',
      'p-hobby',
      'p-startup-small',
      'p-startup-scale',
      'p-enterprise',
    ])
  })

  it('every entry has founderLabel and cost band', () => {
    const profiles = listProfiles(resolve(REPO_ROOT, 'profiles'))
    for (const p of profiles) {
      expect(p.founderLabel).toBeTruthy()
      expect(p.costBandUsdMonthly.min).toBeGreaterThanOrEqual(0)
    }
  })

  it('formatProfilesTable contains the $/mo band column and all 5 ids', () => {
    const out = formatProfilesTable(listProfiles(resolve(REPO_ROOT, 'profiles')))
    expect(out).toContain('$/mo')
    for (const id of ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']) {
      expect(out).toContain(id)
    }
  })
})

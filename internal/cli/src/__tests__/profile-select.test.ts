// internal/cli/src/__tests__/profile-select.test.ts
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runSelectCommand } from '../commands/profile/select.js'

let workdir: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'profile-select-'))
  mkdirSync(join(workdir, 'profiles', 'p-hobby'), { recursive: true })
  writeFileSync(
    join(workdir, 'profiles', 'p-hobby', 'profile.env'),
    '# DEVENV_PROFILE=p-hobby\nschemaVersion: profile-v1\nmachineId: p-hobby\nfounderLabel: Side Project\ncostBandUsdMonthly:\n  min: 5\n  max: 20\naxes:\n  team_size: solo\n  env_count: 2\n  target_budget_usd: "<20"\n  compliance_floor: none\n  workload_shape: web-services\n  ha_level: none\n  cluster_substrate: single-VPS\n  mesh: none\n  observability_depth: metrics-only\n  secret_backend: keyring\n  registry: ghcr\n  cdn_edge: cloudflare\n',
  )
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

describe('profile:select', () => {
  it('writes .profile with machine id', () => {
    const code = runSelectCommand('p-hobby', workdir)
    expect(code).toBe(0)
    expect(readFileSync(join(workdir, '.profile'), 'utf8').trim()).toBe('p-hobby')
  })

  it('exits non-zero on unknown profile id', () => {
    const code = runSelectCommand('p-bogus', workdir)
    expect(code).not.toBe(0)
    expect(existsSync(join(workdir, '.profile'))).toBe(false)
  })
})

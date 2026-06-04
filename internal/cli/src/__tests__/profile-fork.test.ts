// internal/cli/src/__tests__/profile-fork.test.ts
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runForkCommand } from '../commands/profile/fork.js'

let workdir: string
const SAMPLE_ENV = `# DEVENV_PROFILE=p-hobby
schemaVersion: profile-v1
machineId: p-hobby
founderLabel: Side Project
costBandUsdMonthly:
  min: 5
  max: 20
axes:
  team_size: solo
  env_count: 2
  target_budget_usd: "<20"
  compliance_floor: none
  workload_shape: web-services
  ha_level: none
  cluster_substrate: single-VPS
  mesh: none
  observability_depth: metrics-only
  secret_backend: keyring
  registry: ghcr
  cdn_edge: cloudflare
`

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'profile-fork-'))
  const src = resolve(workdir, 'profiles', 'p-hobby')
  mkdirSync(src, { recursive: true })
  writeFileSync(resolve(src, 'profile.env'), SAMPLE_ENV)
  mkdirSync(resolve(src, 'helm-values'))
  writeFileSync(
    resolve(src, 'helm-values', 'lib-chart.values.yaml'),
    'image: { registry: ghcr.io }\n',
  )
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

describe('profile:fork', () => {
  it('copies source dir to dst and rewrites machine id', () => {
    const code = runForkCommand('p-hobby', 'p-hobby-noor', workdir)
    expect(code).toBe(0)
    const dst = resolve(workdir, 'profiles', 'p-hobby-noor')
    expect(existsSync(resolve(dst, 'profile.env'))).toBe(true)
    const env = readFileSync(resolve(dst, 'profile.env'), 'utf8')
    expect(env).toContain('machineId: p-hobby-noor')
    expect(env).toContain('# DEVENV_PROFILE=p-hobby-noor')
    expect(existsSync(resolve(dst, 'helm-values', 'lib-chart.values.yaml'))).toBe(true)
  })

  it('refuses to overwrite an existing dst', () => {
    cpSync(resolve(workdir, 'profiles', 'p-hobby'), resolve(workdir, 'profiles', 'p-hobby-noor'), {
      recursive: true,
    })
    const code = runForkCommand('p-hobby', 'p-hobby-noor', workdir)
    expect(code).not.toBe(0)
  })

  it('refuses invalid dst names (must start with p-)', () => {
    const code = runForkCommand('p-hobby', 'bogus', workdir)
    expect(code).not.toBe(0)
  })
})

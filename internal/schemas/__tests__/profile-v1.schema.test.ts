// internal/schemas/__tests__/profile-v1.schema.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'

const schemaPath = resolve(__dirname, '../profile-v1.schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(schema)

const VALID_PROFILE_ENV = {
  schemaVersion: 'profile-v1',
  machineId: 'p-startup-small',
  founderLabel: 'Early Startup',
  costBandUsdMonthly: { min: 30, max: 150 },
  axes: {
    team_size: 'small',
    env_count: 3,
    target_budget_usd: '<500',
    compliance_floor: 'none',
    workload_shape: 'web-services',
    ha_level: 'single-AZ',
    cluster_substrate: 'bare-VM k3s',
    mesh: 'none',
    observability_depth: '+logs',
    secret_backend: 'akv',
    registry: 'ghcr',
    cdn_edge: 'cloudflare',
  },
}

describe('profile-v1 schema', () => {
  it('accepts a fully populated profile.env document', () => {
    expect(validate(VALID_PROFILE_ENV)).toBe(true)
  })

  it('rejects a machineId outside the 5 named profiles', () => {
    const bad = { ...VALID_PROFILE_ENV, machineId: 'p-unknown' }
    expect(validate(bad)).toBe(false)
  })

  it('rejects when an axis is missing', () => {
    const bad = { ...VALID_PROFILE_ENV, axes: { ...VALID_PROFILE_ENV.axes } }
    delete (bad.axes as Record<string, unknown>).mesh
    expect(validate(bad)).toBe(false)
  })

  it('rejects secret_backend values outside the spec enum', () => {
    const bad = {
      ...VALID_PROFILE_ENV,
      axes: { ...VALID_PROFILE_ENV.axes, secret_backend: 'sops' },
    }
    expect(validate(bad)).toBe(false)
  })
})

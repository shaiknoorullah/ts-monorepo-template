// internal/schemas/__tests__/profile-env-fixtures.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '../../..')
const schemaPath = resolve(__dirname, '../profile-v1.schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))

const PROFILES = [
  'p-solo',
  'p-hobby',
  'p-startup-small',
  'p-startup-scale',
  'p-enterprise',
] as const

const ajv = new Ajv2020({ allErrors: true, strict: true })
addFormats(ajv)
const validate = ajv.compile(schema)

describe('profile.env fixtures conform to profile-v1', () => {
  it.each(PROFILES)('profiles/%s/profile.env validates', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'profile.env')
    const doc = parse(readFileSync(path, 'utf8'))
    const ok = validate(doc)
    if (!ok) {
       
      console.error(validate.errors)
    }
    expect(ok).toBe(true)
    expect((doc as { machineId: string }).machineId).toBe(id)
  })

  it('DEVENV_PROFILE marker is the same as machineId for every profile', () => {
    for (const id of PROFILES) {
      const path = resolve(REPO_ROOT, 'profiles', id, 'profile.env')
      const raw = readFileSync(path, 'utf8')
      expect(raw).toMatch(new RegExp(`# DEVENV_PROFILE=${id}`))
    }
  })
})

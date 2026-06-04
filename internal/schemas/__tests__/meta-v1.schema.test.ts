// internal/schemas/__tests__/meta-v1.schema.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'

const schemaPath = resolve(__dirname, '../meta-v1.schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf8'))
const ajv = new Ajv2020({ strict: true, allErrors: true })
const validate = ajv.compile(schema)

describe('meta-v1.schema.json', () => {
  it('declares apiVersion=platform.dev/v1 const', () => {
    expect(schema.properties.apiVersion).toEqual({ const: 'platform.dev/v1' })
  })

  it('allows all 10 kinds from spec §15.5', () => {
    expect(schema.properties.kind.enum).toEqual([
      'App',
      'Library',
      'XRD',
      'Composition',
      'Profile',
      'CloudModule',
      'AnsibleRole',
      'Workflow',
      'Helm',
      'AdrIndex',
    ])
  })

  it('accepts a valid App META (mirrors spec §15.6)', () => {
    const ok = validate({
      apiVersion: 'platform.dev/v1',
      kind: 'App',
      metadata: { name: 'api', owner: 'platform-team', tags: ['http'] },
      spec: { language: 'typescript' },
    })
    expect(validate.errors).toBeNull()
    expect(ok).toBe(true)
  })

  it('rejects metadata.name with uppercase letters', () => {
    const ok = validate({
      apiVersion: 'platform.dev/v1',
      kind: 'App',
      metadata: { name: 'BadName', owner: 'platform-team' },
      spec: {},
    })
    expect(ok).toBe(false)
  })

  it('rejects unknown kind', () => {
    const ok = validate({
      apiVersion: 'platform.dev/v1',
      kind: 'NotAKind',
      metadata: { name: 'x', owner: 'y' },
      spec: {},
    })
    expect(ok).toBe(false)
  })
})

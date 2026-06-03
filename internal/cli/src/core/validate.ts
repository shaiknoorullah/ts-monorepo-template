// internal/cli/src/core/validate.ts
import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { parse } from 'yaml'

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

const META_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://ts-monorepo-template.dev/schemas/meta-app.json',
  type: 'object',
  required: ['apiVersion', 'kind', 'name', 'language', 'profiles'],
  properties: {
    apiVersion: { const: 'meta.platform.dev/v1alpha1' },
    kind: { enum: ['AppDescriptor', 'LibDescriptor', 'XRDDescriptor'] },
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]*$' },
    language: { enum: ['typescript', 'python', 'go', 'rust'] },
    endpoints: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'port'],
        properties: {
          name: { type: 'string' },
          port: { type: 'integer', minimum: 1, maximum: 65_535 },
        },
      },
    },
    profiles: {
      type: 'array',
      minItems: 1,
      items: {
        enum: ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise'],
      },
    },
  },
  additionalProperties: false,
} as const

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(META_SCHEMA)

function fmt(err: ErrorObject): string {
  const path = err.instancePath || '(root)'
  return `${path} ${err.message ?? 'invalid'}`
}

export function validateMetaYaml(yamlText: string): ValidationResult {
  let parsed: unknown
  try {
    parsed = parse(yamlText)
  } catch (error) {
    return { ok: false, errors: [`yaml parse error: ${(error as Error).message}`] }
  }
  const ok = validate(parsed)
  if (ok) return { ok: true, errors: [] }
  return { ok: false, errors: (validate.errors ?? []).map((e) => fmt(e)) }
}

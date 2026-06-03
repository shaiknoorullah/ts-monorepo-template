import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true })
addFormats(ajv)

export function compileSchema<T = unknown>(schema: unknown): ValidateFunction<T> {
  return ajv.compile<T>(schema as object)
}

export function validateOrThrow(schema: unknown, payload: unknown, label: string): void {
  const validate = compileSchema(schema)
  if (validate(payload)) return
  const first = validate.errors?.[0]
  const path = first?.instancePath || '/'
  const message = first?.message ?? 'unknown validation error'
  throw new Error(`${label} input failed validation at ${path}: ${message}`)
}

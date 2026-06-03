import { describe, expect, it } from 'vitest'
import { compileSchema, validateOrThrow } from '../../src/schemas/_validator.js'

describe('schema validator', () => {
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string', minLength: 1 } },
    additionalProperties: false,
  } as const

  it('accepts a valid payload', () => {
    const validate = compileSchema(schema)
    expect(validate({ name: 'go-hello' })).toBe(true)
  })

  it('rejects a payload missing required keys with structured errors', () => {
    const validate = compileSchema(schema)
    expect(validate({})).toBe(false)
    expect(validate.errors?.[0]?.keyword).toBe('required')
    expect(validate.errors?.[0]?.params).toEqual({ missingProperty: 'name' })
  })

  it('validateOrThrow surfaces the failing JSON pointer', () => {
    expect(() => validateOrThrow(schema, { name: '' }, 'test')).toThrow(
      /test input failed validation at \/name: must NOT have fewer than 1 characters/,
    )
  })
})

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { ConfigValidationError, commonSchemas, loadConfig } from '../index.js'

describe('@pkg/config', () => {
  it('returns parsed config when the env is valid', () => {
    const schema = z.object({ PORT: z.coerce.number(), FOO: z.string() })
    const result = loadConfig(schema, { PORT: '3000', FOO: 'bar' })
    expect(result).toEqual({ PORT: 3000, FOO: 'bar' })
  })

  it('throws ConfigValidationError when validation fails', () => {
    const schema = z.object({ PORT: z.coerce.number().min(1024) })
    expect(() => loadConfig(schema, { PORT: '80' })).toThrow(ConfigValidationError)
  })

  it('attaches a list of issues to the error', () => {
    const schema = z.object({
      PORT: z.coerce.number().min(1024),
      DATABASE_URL: z.string().url(),
    })
    try {
      loadConfig(schema, { PORT: '80', DATABASE_URL: 'not-a-url' })
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigValidationError)
      const err = e as ConfigValidationError
      expect(err.issues).toHaveLength(2)
      expect(err.issues.map((i) => i.path).sort()).toEqual(['DATABASE_URL', 'PORT'])
    }
  })

  it('exposes the standard commonSchemas', () => {
    expect(commonSchemas.NODE_ENV.parse(undefined)).toBe('development')
    expect(commonSchemas.LOG_LEVEL.parse(undefined)).toBe('info')
    expect(commonSchemas.PORT.parse('3000')).toBe(3000)
  })
})

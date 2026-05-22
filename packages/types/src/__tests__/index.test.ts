import { describe, expect, it } from 'vitest'

import { err, ok, toError, toIsoDateTime } from '../index.js'

describe('@pkg/types', () => {
  describe('toIsoDateTime', () => {
    it('returns a branded ISO-8601 string', () => {
      const date = new Date('2026-05-22T12:00:00.000Z')
      const result = toIsoDateTime(date)
      expect(result).toBe('2026-05-22T12:00:00.000Z')
    })
  })

  describe('ok / err', () => {
    it('ok wraps a value', () => {
      const r = ok(42)
      expect(r.ok).toBe(true)
      if (r.ok) expect(r.value).toBe(42)
    })

    it('err wraps an error', () => {
      const e = new Error('boom')
      const r = err(e)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.error).toBe(e)
    })
  })

  describe('toError', () => {
    it('passes Error through unchanged', () => {
      const e = new Error('x')
      expect(toError(e)).toBe(e)
    })

    it('wraps strings as Error', () => {
      expect(toError('boom').message).toBe('boom')
    })

    it('wraps arbitrary objects as JSON-encoded Error', () => {
      const result = toError({ code: 'E_THING', detail: 'broke' })
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toContain('E_THING')
    })

    it('handles non-serialisable values without throwing', () => {
      const circular: Record<string, unknown> = {}
      circular['self'] = circular
      const result = toError(circular)
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Unknown error')
    })
  })
})

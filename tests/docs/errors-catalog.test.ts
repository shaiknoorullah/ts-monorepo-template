// tests/docs/errors-catalog.test.ts
// Phase 16 Task 16.10 — top-20 troubleshooting catalog (spec Section 15.3)
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(__dirname, '..', '..')

describe('internal/errors/catalog.yaml (spec Section 15.3)', () => {
  const entries = parseYaml(
    readFileSync(resolve(ROOT, 'internal/errors/catalog.yaml'), 'utf8'),
  ) as { code: string; founder: string; engineer: string; link: string }[]
  it('has exactly 20 entries (spec: top 20)', () => {
    expect(entries.length).toBe(20)
  })
  it('every entry has code + founder + engineer + link', () => {
    for (const e of entries) {
      expect(typeof e.code).toBe('string')
      expect(e.code).toMatch(/^[A-Z][A-Z0-9_]+$/)
      expect(typeof e.founder).toBe('string')
      expect(e.founder.length).toBeGreaterThan(0)
      expect(typeof e.engineer).toBe('string')
      expect(e.engineer.length).toBeGreaterThan(0)
      expect(typeof e.link).toBe('string')
      expect(e.link.startsWith('/troubleshoot/')).toBe(true)
    }
  })
  it('codes are unique', () => {
    const codes = entries.map((e) => e.code)
    expect(new Set(codes).size).toBe(codes.length)
  })
})

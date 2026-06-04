// internal/cli/src/core/__tests__/validate.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateMetaYaml } from '../validate.js'

const FIXTURES = resolve(__dirname, 'fixtures')

describe('validateMetaYaml', () => {
  it('accepts a Phase-1-compliant META.yaml', () => {
    const yaml = readFileSync(resolve(FIXTURES, 'valid-meta.yaml'), 'utf8')
    const r = validateMetaYaml(yaml)
    expect(r.ok).toBe(true)
    expect(r.errors).toEqual([])
  })
  it('rejects a META.yaml missing required keys', () => {
    const yaml = readFileSync(resolve(FIXTURES, 'invalid-meta.yaml'), 'utf8')
    const r = validateMetaYaml(yaml)
    expect(r.ok).toBe(false)
    expect(r.errors.length).toBeGreaterThan(0)
    expect(r.errors[0]).toMatch(/required/)
  })
})

// tests/docs/agents-cascade.test.ts
// Phase 16 Task 16.1 + 16.2 — AGENTS.md cascade (spec Section 15.8)
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')

describe('AGENTS.md cascade (spec Section 15.8)', () => {
  const expected = [
    'AGENTS.md',
    'apps/AGENTS.md',
    'packages/AGENTS.md',
    'internal/AGENTS.md',
    'infra/AGENTS.md',
    'profiles/AGENTS.md',
  ]
  for (const rel of expected) {
    it(`level exists: ${rel}`, () => {
      expect(existsSync(resolve(ROOT, rel))).toBe(true)
    })
  }
  it('root AGENTS.md names all 7 layers (0a, 0b, 1-7)', () => {
    const body = readFileSync(resolve(ROOT, 'AGENTS.md'), 'utf8')
    for (const layer of [
      'Layer 0a',
      'Layer 0b',
      'Layer 1',
      'Layer 2',
      'Layer 3',
      'Layer 4',
      'Layer 5',
      'Layer 6',
      'Layer 7',
    ]) {
      expect(body).toContain(layer)
    }
  })
  it('root AGENTS.md lists the founder-safe verb prefix `task`', () => {
    const body = readFileSync(resolve(ROOT, 'AGENTS.md'), 'utf8')
    expect(body).toMatch(/`task /)
  })
})

describe('per-level AGENTS.md contents (spec Section 15.8)', () => {
  it('apps/AGENTS.md names the per-app override template', () => {
    const body = readFileSync(resolve(ROOT, 'apps/AGENTS.md'), 'utf8')
    expect(body).toMatch(/per-app override/i)
    expect(body).toMatch(/`task build:<svc>`/)
  })
  it('packages/AGENTS.md forbids cross-app imports', () => {
    const body = readFileSync(resolve(ROOT, 'packages/AGENTS.md'), 'utf8')
    expect(body).toMatch(/never import from sibling apps/i)
  })
  it('internal/AGENTS.md describes schemas + glossary editing rules', () => {
    const body = readFileSync(resolve(ROOT, 'internal/AGENTS.md'), 'utf8')
    expect(body).toMatch(/meta-v1\.schema\.json/)
    expect(body).toMatch(/errors\/catalog\.yaml/)
  })
  it('infra/AGENTS.md names Helm + Crossplane + Terraform conventions', () => {
    const body = readFileSync(resolve(ROOT, 'infra/AGENTS.md'), 'utf8')
    for (const word of ['lib-chart', 'XRD', 'ApplicationSet']) {
      expect(body).toContain(word)
    }
  })
  it('profiles/AGENTS.md enumerates the 5 founder labels', () => {
    const body = readFileSync(resolve(ROOT, 'profiles/AGENTS.md'), 'utf8')
    for (const label of [
      'Just Me',
      'Side Project',
      'Early Startup',
      'Scaling Startup',
      'Production at Scale',
    ]) {
      expect(body).toContain(label)
    }
  })
})

// tests/docs/glossary-citations.test.ts
// Phase 16 Task 16.9 — glossary YAML + GLOSSARY.md + CITATIONS.md
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const ROOT = resolve(__dirname, '..', '..')

const REQUIRED_TERMS = [
  'ADR',
  'AGENTS.md',
  'ApplicationSet',
  'cosign',
  'Composition',
  'devenv',
  'ESO',
  'Kargo',
  'MCP',
  'Nx Cloud',
  'secretspec',
  'XR',
  'XRD',
]

describe('glossary + citations (spec Section 18)', () => {
  it('internal/glossary/terms.yaml parses and has every required term', () => {
    const parsed = parseYaml(
      readFileSync(resolve(ROOT, 'internal/glossary/terms.yaml'), 'utf8'),
    ) as { term: string; definition: string; section: string }[]
    expect(Array.isArray(parsed)).toBe(true)
    const seen = new Set(parsed.map((t) => t.term))
    for (const term of REQUIRED_TERMS) {
      expect(seen.has(term)).toBe(true)
    }
  })
  it('docs/CITATIONS.md numbers entries 1..28 (spec Section 18.3)', () => {
    const body = readFileSync(resolve(ROOT, 'docs/CITATIONS.md'), 'utf8')
    for (let n = 1; n <= 28; n++) {
      expect(body).toMatch(new RegExp(`\\|\\s*${n}\\s*\\|`))
    }
  })
  it('docs/GLOSSARY.md points at internal/glossary/terms.yaml', () => {
    const body = readFileSync(resolve(ROOT, 'docs/GLOSSARY.md'), 'utf8')
    expect(body).toContain('internal/glossary/terms.yaml')
  })
})

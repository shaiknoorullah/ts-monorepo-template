// tests/docs/architecture-deepdives.test.ts
// Phase 16 Task 16.3 — engineer-facing architecture deep dives
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '..', '..')

describe('docs/architecture/ deep dives', () => {
  it('seven-layers.md covers every layer 0a, 0b, 1-7 with a section', () => {
    const body = readFileSync(resolve(ROOT, 'docs/architecture/seven-layers.md'), 'utf8')
    for (const heading of [
      '## Layer 0a',
      '## Layer 0b',
      '## Layer 1',
      '## Layer 2',
      '## Layer 3',
      '## Layer 4',
      '## Layer 5',
      '## Layer 6',
      '## Layer 7',
    ]) {
      expect(body).toContain(heading)
    }
  })
  it('profiles.md lists all 5 machine IDs', () => {
    const body = readFileSync(resolve(ROOT, 'docs/architecture/profiles.md'), 'utf8')
    for (const id of ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']) {
      expect(body).toContain(id)
    }
  })
  it('decision-model.md cites ADR system + audit log + recommender', () => {
    const body = readFileSync(resolve(ROOT, 'docs/architecture/decision-model.md'), 'utf8')
    expect(body).toMatch(/docs\/adrs\//)
    expect(body).toMatch(/\.audit\/decisions\.jsonl/)
    expect(body).toMatch(/rubric_sha256/)
  })
})

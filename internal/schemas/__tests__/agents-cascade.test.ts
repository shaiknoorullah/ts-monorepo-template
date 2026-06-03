// internal/schemas/__tests__/agents-cascade.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../..')

const REQUIRED_AGENTS_FILES = [
  'AGENTS.md',
  'apps/AGENTS.md',
  'packages/AGENTS.md',
  'internal/AGENTS.md',
  'infra/AGENTS.md',
  'profiles/AGENTS.md',
]

describe('AGENTS.md cascade (spec section 15.8)', () => {
  it.each(REQUIRED_AGENTS_FILES)('%s exists', (rel) => {
    expect(existsSync(resolve(repoRoot, rel))).toBe(true)
  })

  it('every sub-level AGENTS.md states the child-wins merge rule', () => {
    for (const rel of REQUIRED_AGENTS_FILES) {
      const raw = readFileSync(resolve(repoRoot, rel), 'utf8')
      expect(raw, `${rel} missing child-wins clause`).toMatch(
        /child overrides parent|nearest .* wins/i,
      )
    }
  })

  it('root AGENTS.md points to the platform foundation spec', () => {
    const raw = readFileSync(resolve(repoRoot, 'AGENTS.md'), 'utf8')
    expect(raw).toMatch(/2026-06-03-platform-foundation-design\.md/)
  })
})

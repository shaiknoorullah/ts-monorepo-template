// internal/cli/src/__tests__/setup-doc.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '..', '..', '..', '..')
const doc = readFileSync(resolve(root, 'docs/dev/SETUP.md'), 'utf8')

describe('SETUP.md', () => {
  it('contains exactly the 5 sections required by spec §4.14', () => {
    for (const h of [
      '## 1. Install Nix + direnv',
      '## 2. direnv allow + first task install',
      '## 3. task profile:select',
      '## 4. task secrets:bootstrap',
      '## 5. task dev',
    ]) {
      expect(doc).toContain(h)
    }
  })
  it('lists numbered remediations for known failure modes', () => {
    expect(doc).toMatch(/## Remediations/i)
    expect(doc).toMatch(/R1[.:]/)
    expect(doc).toMatch(/R2[.:]/)
  })
})

// docs/architecture/__tests__/seven-layers.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const docPath = resolve(__dirname, '../seven-layers.md')
const raw = readFileSync(docPath, 'utf8')

describe('docs/architecture/seven-layers.md', () => {
  const requiredHeadings = [
    '## Layer 0a — Launcher CLI + marketing site',
    '## Layer 0b — MCP server',
    '## Layer 1 — Verb surface (Taskfile)',
    '## Layer 2 — Toolchain + secrets',
    '## Layer 3 — Build orchestration (Nx + Nx Cloud)',
    '## Layer 4 — Container build (BuildKit + cosign)',
    '## Layer 5 — App runtime (Helm library chart)',
    '## Layer 6 — Platform infra (Crossplane)',
    '## Layer 7 — Bootstrap (Terraform + Ansible)',
  ]

  it.each(requiredHeadings)('has heading %s', (h) => {
    expect(raw).toContain(h)
  })

  it('references spec section 1.2', () => {
    expect(raw).toMatch(/Section 1\.2/)
  })
})

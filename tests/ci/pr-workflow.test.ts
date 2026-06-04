import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const wf = parseYaml(
  readFileSync(resolve(__dirname, '../../.github/workflows/pr.yml'), 'utf8'),
) as { jobs: Record<string, { steps: Array<{ run?: string; uses?: string }> }> }

describe('PR workflow gates at C4', () => {
  it('declares an nx-affected job that runs lint test build', () => {
    expect(wf.jobs['nx-affected']).toBeTruthy()
    const runs = wf.jobs['nx-affected'].steps.map((s) => s.run ?? '').join('\n')
    expect(runs).toMatch(/nx affected.*-t.*lint.*test.*build/s)
  })

  it('declares a polyglot-typecheck job running tsc + mypy + cargo check + go build', () => {
    expect(wf.jobs['polyglot-typecheck']).toBeTruthy()
    const runs = wf.jobs['polyglot-typecheck'].steps.map((s) => s.run ?? '').join('\n')
    expect(runs).toMatch(/tsc/)
    expect(runs).toMatch(/mypy/)
    expect(runs).toMatch(/cargo check/)
    expect(runs).toMatch(/go build/)
  })

  it('nx-affected uses nrwl/nx-set-shas@v4', () => {
    const uses = wf.jobs['nx-affected'].steps.map((s) => s.uses ?? '').join('\n')
    expect(uses).toMatch(/nrwl\/nx-set-shas@v4/)
  })
})

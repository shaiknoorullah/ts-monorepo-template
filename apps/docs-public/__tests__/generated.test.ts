// apps/docs-public/__tests__/generated.test.ts
// Phase 16 Task 16.8 — verify task docs:gen emits per-layer / per-XRD /
// per-app / per-profile / per-verb reference pages.

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const ROOT = path.resolve(__dirname, '..', '..', '..')
const GEN = path.resolve(ROOT, 'apps/docs-public/src/content/docs/reference')
const GENERATOR = path.resolve(ROOT, 'apps/docs-public/scripts/generate-references.ts')

describe('apps/docs-public generated reference (spec Section 15.4)', () => {
  beforeAll(() => {
    // Execute the generator directly via the workspace-pinned tsx binary so
    // we avoid invoking a shell-resolved pnpm CLI from tests.
    const tsxBin = path.resolve(ROOT, 'node_modules/.bin/tsx')
    const result = spawnSync(tsxBin, [GENERATOR], {
      cwd: ROOT,
      stdio: 'inherit',
    })
    if (result.status !== 0) {
      throw new Error(`docs:gen failed with status ${String(result.status)}`)
    }
  })
  it('emits one page per layer', () => {
    const layers = readdirSync(path.join(GEN, 'layers')).filter((f) => f.endsWith('.md'))
    for (const expected of [
      '00a-launcher.md',
      '00b-mcp.md',
      '01-verbs.md',
      '02-toolchain.md',
      '03-build.md',
      '04-container.md',
      '05-runtime.md',
      '06-platform.md',
      '07-bootstrap.md',
    ]) {
      expect(layers).toContain(expected)
    }
  })
  it('emits one page per profile', () => {
    const profiles = readdirSync(path.join(GEN, 'profiles')).filter((f) => f.endsWith('.md'))
    for (const id of [
      'p-solo.md',
      'p-hobby.md',
      'p-startup-small.md',
      'p-startup-scale.md',
      'p-enterprise.md',
    ]) {
      expect(profiles).toContain(id)
    }
  })
  it('emits one page per Taskfile verb', () => {
    const verbs = readdirSync(path.join(GEN, 'verbs')).filter((f) => f.endsWith('.md'))
    expect(verbs.length).toBeGreaterThan(0)
  })
  it('xrds reference directory is present (may be empty if no XRDs)', () => {
    expect(existsSync(path.join(GEN, 'xrds'))).toBe(true)
  })
  it('apps reference directory is present (may be empty if no app charts)', () => {
    expect(existsSync(path.join(GEN, 'apps'))).toBe(true)
  })
})

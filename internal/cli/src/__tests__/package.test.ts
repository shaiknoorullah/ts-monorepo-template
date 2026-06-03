// internal/cli/src/__tests__/package.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, '..', '..', 'package.json'), 'utf8'),
) as Record<string, unknown>

describe('internal/cli package.json', () => {
  it('declares both bin entries', () => {
    const bin = pkg.bin as Record<string, string>
    expect(bin['create-platform']).toBe('./dist/bin/create-platform.js')
    expect(bin['ts-monorepo']).toBe('./dist/bin/ts-monorepo.js')
  })
  it('pins oclif framework v4 and clack prompts', () => {
    const deps = pkg.dependencies as Record<string, string>
    expect(deps['@oclif/core']).toMatch(/^\^4\./)
    expect(deps['@clack/prompts']).toMatch(/^\^0\.[0-9]+\./)
  })
  it('exposes vitest test script', () => {
    const scripts = pkg.scripts as Record<string, string>
    expect(scripts.test).toContain('vitest')
  })
})

// internal/cli/src/__tests__/dev-shell-files.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkSecretspec } from '../core/secrets.js'

const root = resolve(__dirname, '..', '..', '..', '..')

describe('root dev-shell scaffolding', () => {
  it('.envrc requests devenv + secretspec', () => {
    const t = readFileSync(resolve(root, '.envrc'), 'utf8')
    expect(t).toContain('use devenv')
    expect(t).toContain('secretspec')
  })
  it('Makefile delegates to task', () => {
    const t = readFileSync(resolve(root, 'Makefile'), 'utf8')
    expect(t).toMatch(/TASK\s*:?=\s*\$\(shell\s+command\s+-v\s+task/)
    expect(t).toContain('install:')
  })
  it('secretspec.toml exists and checks clean for p-solo', () => {
    expect(existsSync(resolve(root, 'secretspec.toml'))).toBe(true)
    const t = readFileSync(resolve(root, 'secretspec.toml'), 'utf8')
    const r = checkSecretspec(t, 'p-solo', { DATABASE_URL: 'postgres://x' })
    expect(r.ok).toBe(true)
  })
})

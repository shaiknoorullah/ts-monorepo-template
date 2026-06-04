// internal/cli/src/core/__tests__/secrets.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { checkSecretspec } from '../secrets.js'

const FIX = resolve(__dirname, 'fixtures')

describe('checkSecretspec', () => {
  it('passes when every required secret has a default_dev or env value', () => {
    const toml = readFileSync(resolve(FIX, 'secretspec-ok.toml'), 'utf8')
    const r = checkSecretspec(toml, 'p-solo', { DATABASE_URL: 'postgres://x' })
    expect(r.ok).toBe(true)
    expect(r.missing).toEqual([])
  })
  it('fails when a required secret is missing for the active profile', () => {
    const toml = readFileSync(resolve(FIX, 'secretspec-missing.toml'), 'utf8')
    const r = checkSecretspec(toml, 'p-startup-small', {})
    expect(r.ok).toBe(false)
    expect(r.missing).toContain('OPENAI_API_KEY')
  })
  it('ignores ci_only secrets when not in ci profile', () => {
    const toml = readFileSync(resolve(FIX, 'secretspec-ok.toml'), 'utf8')
    const r = checkSecretspec(toml, 'p-solo', { DATABASE_URL: 'postgres://x' })
    expect(r.missing).not.toContain('GHCR_TOKEN')
    expect(r.ok).toBe(true)
  })
})

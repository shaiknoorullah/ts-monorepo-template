// internal/schemas/__tests__/profile-misc-fixtures.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '../../..')
const PROFILES = [
  'p-solo',
  'p-hobby',
  'p-startup-small',
  'p-startup-scale',
  'p-enterprise',
] as const

const EXPECTED_BACKEND: Record<(typeof PROFILES)[number], string> = {
  'p-solo': 'keyring',
  'p-hobby': 'keyring',
  'p-startup-small': 'akv',
  'p-startup-scale': 'akv',
  'p-enterprise': 'vault',
}

describe('secretspec.toml per profile', () => {
  it.each(PROFILES)('profiles/%s/secretspec.toml declares backend', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'secretspec.toml')
    expect(existsSync(path)).toBe(true)
    const raw = readFileSync(path, 'utf8')
    expect(raw).toMatch(new RegExp(`backend\\s*=\\s*"${EXPECTED_BACKEND[id]}"`))
  })
})

describe('argocd/appset-overrides.yaml per profile', () => {
  it.each(PROFILES)('profiles/%s/argocd/appset-overrides.yaml has envs', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'argocd', 'appset-overrides.yaml')
    expect(existsSync(path)).toBe(true)
    const doc = parseYaml(readFileSync(path, 'utf8')) as {
      profile?: string
      envs?: string[]
    }
    expect(doc.profile).toBe(id)
    expect(Array.isArray(doc.envs)).toBe(true)
    expect(doc.envs!.length).toBeGreaterThan(0)
  })
})

describe('nx/preset.json per profile', () => {
  it.each(PROFILES)('profiles/%s/nx/preset.json declares cacheMode', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'nx', 'preset.json')
    expect(existsSync(path)).toBe(true)
    const doc = JSON.parse(readFileSync(path, 'utf8')) as {
      profile?: string
      cacheMode?: string
    }
    expect(doc.profile).toBe(id)
    expect(doc.cacheMode).toBeDefined()
  })
})

describe('README.md per profile', () => {
  it.each(PROFILES)('profiles/%s/README.md exists and references machine id', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'README.md')
    expect(existsSync(path)).toBe(true)
    expect(readFileSync(path, 'utf8')).toContain(id)
  })
})

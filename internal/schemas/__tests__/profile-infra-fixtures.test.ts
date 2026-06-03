// internal/schemas/__tests__/profile-infra-fixtures.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '../../..')
const PROFILES = [
  'p-solo',
  'p-hobby',
  'p-startup-small',
  'p-startup-scale',
  'p-enterprise',
] as const

describe('terraform.tfvars per profile', () => {
  it.each(PROFILES)('profiles/%s/terraform.tfvars exists and declares profile_id', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'terraform.tfvars')
    expect(existsSync(path)).toBe(true)
    const raw = readFileSync(path, 'utf8')
    expect(raw).toMatch(new RegExp(`profile_id\\s*=\\s*"${id}"`))
    expect(raw).toMatch(/cluster_size\s*=\s*\d+/)
  })
})

describe('ansible group_vars per profile', () => {
  it.each(PROFILES)('profiles/%s/ansible/group_vars.yml parses + has profile_id %s', (id) => {
    const path = resolve(REPO_ROOT, 'profiles', id, 'ansible', 'group_vars.yml')
    expect(existsSync(path)).toBe(true)
    const doc = parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    expect(doc.profile_id).toBe(id)
    expect(doc.cni).toBeDefined()
  })
})

// internal/cli/src/__tests__/profile-validate-ci.test.ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = resolve(__dirname, '../../../..')

describe('profile-validate CI gate', () => {
  it('workflow file exists at the spec-mandated path', () => {
    expect(existsSync(resolve(REPO_ROOT, '.github', 'workflows', 'profile-validate.yml'))).toBe(
      true,
    )
  })

  it('workflow defines a job named profile-validate that iterates the 5 profiles', () => {
    const doc = parse(
      readFileSync(resolve(REPO_ROOT, '.github', 'workflows', 'profile-validate.yml'), 'utf8'),
    ) as {
      jobs: Record<string, { strategy?: { matrix?: { profile?: string[] } } }>
    }
    const job = doc.jobs['profile-validate']
    expect(job).toBeDefined()
    expect(job!.strategy?.matrix?.profile).toEqual([
      'p-solo',
      'p-hobby',
      'p-startup-small',
      'p-startup-scale',
      'p-enterprise',
    ])
  })

  it('tools/ci/profile-validate.sh exists and loops the 5 ids', () => {
    const path = resolve(REPO_ROOT, 'tools', 'ci', 'profile-validate.sh')
    expect(existsSync(path)).toBe(true)
    const raw = readFileSync(path, 'utf8')
    for (const id of ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise']) {
      expect(raw).toContain(id)
    }
  })
})

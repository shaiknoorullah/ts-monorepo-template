// internal/scripts/__tests__/adr-tasks.test.ts
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../..')

describe('task adr:new and task adr:index', () => {
  it('Taskfile.yml exposes adr:new and adr:index targets', () => {
    const tf = readFileSync(resolve(repoRoot, 'Taskfile.yml'), 'utf8')
    expect(tf).toMatch(/^\s{2}adr:new:/m)
    expect(tf).toMatch(/^\s{2}adr:index:/m)
  })

  it('task --list-all reports both verbs', () => {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- fixed command, test-only invocation of the local `task` binary.
    const out = execSync('task --list-all', { cwd: repoRoot, encoding: 'utf8' })
    expect(out).toMatch(/adr:new/)
    expect(out).toMatch(/adr:index/)
  })

  it('docs/adrs/README.md is the regenerable index page', () => {
    expect(existsSync(resolve(repoRoot, 'docs/adrs/README.md'))).toBe(true)
    const raw = readFileSync(resolve(repoRoot, 'docs/adrs/README.md'), 'utf8')
    expect(raw).toMatch(/0001-default-profile-p-hobby/)
  })
})

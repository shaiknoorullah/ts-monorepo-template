// internal/schemas/__tests__/meta-validate-task.test.ts
import { execSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const repoRoot = resolve(__dirname, '../../..')
const fixtureDir = resolve(repoRoot, '.tmp-meta-fixtures')

describe('task meta:validate', () => {
  beforeEach(() => mkdirSync(fixtureDir, { recursive: true }))
  afterEach(() => rmSync(fixtureDir, { recursive: true, force: true }))

  it('passes when META.yaml is valid', () => {
    writeFileSync(
      resolve(fixtureDir, 'META.yaml'),
      [
        'apiVersion: platform.dev/v1',
        'kind: App',
        'metadata:',
        '  name: sample-app',
        '  owner: platform-team',
        'spec: {}',
        '',
      ].join('\n'),
    )
    // eslint-disable-next-line sonarjs/os-command -- fixed `task` invocation, fixture path is test-controlled.
    const out = execSync(`task meta:validate META_GLOB="${fixtureDir}/META.yaml"`, {
      cwd: repoRoot,
      encoding: 'utf8',
    })
    expect(out).toMatch(/valid/i)
  })

  it('fails when META.yaml has uppercase metadata.name', () => {
    writeFileSync(
      resolve(fixtureDir, 'META.yaml'),
      [
        'apiVersion: platform.dev/v1',
        'kind: App',
        'metadata:',
        '  name: BadName',
        '  owner: platform-team',
        'spec: {}',
        '',
      ].join('\n'),
    )
    expect(() =>
      // eslint-disable-next-line sonarjs/os-command -- fixed `task` invocation, fixture path is test-controlled.
      execSync(`task meta:validate META_GLOB="${fixtureDir}/META.yaml"`, {
        cwd: repoRoot,
        encoding: 'utf8',
      }),
    ).toThrow()
  })
})

// internal/cli/src/__tests__/taskfile.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(__dirname, '..', '..', '..', '..')
const tf = parse(readFileSync(resolve(root, 'Taskfile.yml'), 'utf8')) as {
  version: string
  includes: Record<string, unknown>
  tasks: Record<string, unknown>
}

describe('root Taskfile.yml', () => {
  it('uses Task v3 schema', () => {
    expect(tf.version).toBe('3')
  })
  it('declares every verb listed in spec §4.9', () => {
    const required = [
      'install',
      'dev',
      'test',
      'lint',
      'format',
      'ci',
      'clean',
      'data:up',
      'data:up:full',
      'data:up:kafka',
      'data:up:storage',
      'data:down',
      'tools:up',
      'tools:down',
      'db:migrate',
      'db:seed',
      'db:reset',
      'commit',
      'env:reconcile',
      'env:check',
      'secrets:check',
      'secrets:bootstrap',
      'secrets:where',
      'profile:list',
      'profile:select',
      'profile:diff',
      'profile:fork',
      'profile:validate',
      'new:backend',
      'new:lib',
      'new:frontend',
      'init',
      'launch',
    ]
    for (const v of required) {
      expect(tf.tasks).toHaveProperty(v)
    }
  })
  it('mounts per-app sub-Taskfiles via includes', () => {
    expect(tf.includes).toBeDefined()
  })
})

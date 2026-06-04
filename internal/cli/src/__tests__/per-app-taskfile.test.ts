// internal/cli/src/__tests__/per-app-taskfile.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

const root = resolve(__dirname, '..', '..', '..', '..')
const tf = parse(readFileSync(resolve(root, 'internal/templates/Taskfile.app.yml'), 'utf8')) as {
  version: string
  tasks: Record<string, unknown>
}

describe('per-app Taskfile template', () => {
  it('declares dev / test / lint / db:migrate / db:seed minimum', () => {
    for (const v of ['dev', 'test', 'lint', 'db:migrate', 'db:seed']) {
      expect(tf.tasks).toHaveProperty(v)
    }
  })
  it('uses Task v3 schema', () => {
    expect(tf.version).toBe('3')
  })
})

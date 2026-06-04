import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const appDir = resolve(__dirname, '../../apps/rs-hello')

describe('rs-hello metadata files', () => {
  it('project.json declares implicitDependencies on contracts and @monodon/rust executors', () => {
    const pj = JSON.parse(readFileSync(resolve(appDir, 'project.json'), 'utf8'))
    expect(pj.name).toBe('rs-hello')
    expect(pj.implicitDependencies).toContain('contracts')
    expect(pj.targets.build.executor).toBe('@monodon/rust:build')
    expect(pj.targets.test.executor).toBe('@monodon/rust:test')
    expect(pj.targets.lint.executor).toBe('@monodon/rust:lint')
    expect(pj.targets['test:integration']).toBeTruthy()
  })

  it('META.yaml declares XPostgresCluster + XRedisCluster + XKafkaTopic', () => {
    const meta = parseYaml(readFileSync(resolve(appDir, 'META.yaml'), 'utf8'))
    expect(meta.metadata.language).toBe('rust')
    expect(meta.metadata.framework).toBe('axum')
    const kinds = meta.spec.needs.map((n: any) => n.kind)
    expect(kinds).toEqual(
      expect.arrayContaining(['XPostgresCluster', 'XRedisCluster', 'XKafkaTopic']),
    )
  })

  it('AGENTS.md, README.md and per-env values exist', () => {
    for (const f of [
      'AGENTS.md',
      'README.md',
      'values.yaml',
      'values.dev.yaml',
      'values.staging.yaml',
      'values.prod.yaml',
      'Taskfile.yml',
    ]) {
      expect(existsSync(resolve(appDir, f))).toBe(true)
    }
  })
})

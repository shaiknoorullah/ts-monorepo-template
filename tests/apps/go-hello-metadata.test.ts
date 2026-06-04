import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const appDir = resolve(__dirname, '../../apps/go-hello')

describe('go-hello metadata files', () => {
  it('project.json declares implicitDependencies on contracts', () => {
    const pj = JSON.parse(readFileSync(resolve(appDir, 'project.json'), 'utf8'))
    expect(pj.name).toBe('go-hello')
    expect(pj.implicitDependencies).toContain('contracts')
    expect(pj.targets.build).toBeTruthy()
    expect(pj.targets.test).toBeTruthy()
    expect(pj.targets.lint).toBeTruthy()
    expect(pj.targets['test:integration']).toBeTruthy()
    expect(pj.targets.container).toBeTruthy()
  })

  it('META.yaml matches platform.app/v1 schema with required spec.needs', () => {
    const meta = parseYaml(readFileSync(resolve(appDir, 'META.yaml'), 'utf8'))
    expect(meta.apiVersion).toBe('ts-monorepo-template.dev/v1')
    expect(meta.kind).toBe('App')
    expect(meta.metadata.name).toBe('go-hello')
    expect(meta.metadata.language).toBe('go')
    expect(meta.metadata.framework).toBe('chi')
    const needs = meta.spec.needs.map((n: any) => n.kind)
    expect(needs).toEqual(
      expect.arrayContaining(['XPostgresCluster', 'XRedisCluster', 'XKafkaTopic']),
    )
  })

  it('AGENTS.md, README.md, values.yaml and per-env overlays exist', () => {
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

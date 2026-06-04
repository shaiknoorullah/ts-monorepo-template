import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const appDir = resolve(__dirname, '../../apps/py-hello')

describe('py-hello metadata files', () => {
  it('project.json declares implicitDependencies on contracts and @nxlv/python executor', () => {
    const pj = JSON.parse(readFileSync(resolve(appDir, 'project.json'), 'utf8'))
    expect(pj.name).toBe('py-hello')
    expect(pj.implicitDependencies).toContain('contracts')
    expect(pj.targets.build.executor).toBe('@nxlv/python:build')
    expect(pj.targets.test).toBeTruthy()
    expect(pj.targets.lint).toBeTruthy()
    expect(pj.targets['test:integration']).toBeTruthy()
  })

  it('META.yaml declares XPostgresCluster + XRedisCluster + XKafkaTopic', () => {
    const meta = parseYaml(readFileSync(resolve(appDir, 'META.yaml'), 'utf8'))
    expect(meta.metadata.language).toBe('python')
    expect(meta.metadata.framework).toBe('fastapi')
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

import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema as listOut } from '../../src/schemas/list_apps.js'
import { outputSchema as descOut } from '../../src/schemas/describe_app.js'
import { handler as listApps } from '../../src/tools/list_apps.js'
import { handler as describeApp } from '../../src/tools/describe_app.js'

const APPS_DIR = join(__dirname, '..', 'fixtures', 'apps')

describe('list_apps', () => {
  it('returns the two fixture apps sorted by name', async () => {
    const out = await listApps({}, { appsDir: APPS_DIR })
    expect(out.apps.map((a) => a.name)).toEqual(['go-hello', 'py-hello'])
    expect(out.apps[0]).toMatchObject({ name: 'go-hello', language: 'go' })
  })

  it('output validates against schema', async () => {
    const out = await listApps({}, { appsDir: APPS_DIR })
    const validate = compileSchema(listOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })
})

describe('describe_app', () => {
  it('returns capabilities for py-hello', async () => {
    const out = await describeApp({ name: 'py-hello' }, { appsDir: APPS_DIR })
    expect(out.language).toBe('python')
    expect(out.capabilities).toEqual({ http: true, grpc: false, background_jobs: true })
    expect(out.envs).toEqual(['dev', 'staging', 'prod'])
  })

  it('output validates against schema', async () => {
    const out = await describeApp({ name: 'go-hello' }, { appsDir: APPS_DIR })
    const validate = compileSchema(descOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })

  it('throws on unknown app', async () => {
    await expect(describeApp({ name: 'no-such-app' }, { appsDir: APPS_DIR })).rejects.toThrow(
      /app not found/,
    )
  })
})

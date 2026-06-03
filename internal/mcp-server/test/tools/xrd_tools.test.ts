import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compileSchema } from '../../src/schemas/_validator.js'
import { outputSchema as listOut } from '../../src/schemas/list_xrds.js'
import { outputSchema as descOut } from '../../src/schemas/describe_xrd.js'
import { handler as listXrds } from '../../src/tools/list_xrds.js'
import { handler as describeXrd } from '../../src/tools/describe_xrd.js'

const XRD_DIR = join(__dirname, '..', 'fixtures', 'xrds')

describe('list_xrds', () => {
  it('returns the XPostgresCluster fixture', async () => {
    const out = await listXrds({}, { xrdsDir: XRD_DIR })
    expect(out.xrds).toEqual([
      {
        name: 'xpostgresclusters.platform.ts-monorepo-template.dev',
        group: 'platform.ts-monorepo-template.dev',
        kind: 'XPostgresCluster',
        versions: ['v1alpha1'],
      },
    ])
  })

  it('output validates against schema', async () => {
    const out = await listXrds({}, { xrdsDir: XRD_DIR })
    const validate = compileSchema(listOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })
})

describe('describe_xrd', () => {
  it('surfaces the openAPIV3Schema + a synthesized example_claim', async () => {
    const out = await describeXrd(
      { name: 'xpostgresclusters.platform.ts-monorepo-template.dev' },
      { xrdsDir: XRD_DIR },
    )
    expect(out.kind).toBe('XPostgresCluster')
    expect(out.openAPIV3Schema).toBeTypeOf('object')
    expect((out.example_claim as { apiVersion: string }).apiVersion).toBe(
      'platform.ts-monorepo-template.dev/v1alpha1',
    )
    expect((out.example_claim as { kind: string }).kind).toBe('PostgresCluster')
  })

  it('output validates against schema', async () => {
    const out = await describeXrd(
      { name: 'xpostgresclusters.platform.ts-monorepo-template.dev' },
      { xrdsDir: XRD_DIR },
    )
    const validate = compileSchema(descOut)
    const ok = validate(out)
    if (!ok) throw new Error(JSON.stringify(validate.errors))
    expect(ok).toBe(true)
  })

  it('throws on unknown xrd', async () => {
    await expect(describeXrd({ name: 'no-such-xrd' }, { xrdsDir: XRD_DIR })).rejects.toThrow(
      /xrd not found/,
    )
  })
})

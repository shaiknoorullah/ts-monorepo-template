import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('internal/mcp-server package.json', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'))

  it('declares the published name from spec Section 11.2', () => {
    expect(pkg.name).toBe('@ts-monorepo-template/mcp-server')
  })

  it('exposes the ts-monorepo-mcp bin (spec Section 11.2)', () => {
    expect(pkg.bin).toEqual({ 'ts-monorepo-mcp': 'dist/server.js' })
  })

  it('pins @modelcontextprotocol/sdk to a concrete version', () => {
    // Accept exact (`1.18.1`) or caret (`^1.18.1`) — `pnpm.overrides`
    // at the workspace root would clamp either form to the same resolved
    // version. Reject floating tags or catalog refs since the sdk is not
    // managed via the catalog.
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toMatch(/^\^?\d+\.\d+\.\d+$/)
  })

  it('pins ajv 8.x for JSON Schema Draft 2020-12 validation', () => {
    expect(pkg.dependencies['ajv']).toMatch(/^\^?8\.\d+\.\d+$/)
    expect(pkg.dependencies['ajv-formats']).toMatch(/^\^?3\.\d+\.\d+$/)
  })

  it('keeps zod aligned with the workspace catalog', () => {
    // mcp-server itself does not import zod from `src/`; the dep exists
    // because `@modelcontextprotocol/sdk` → `zod-to-json-schema` requires
    // it as a peer. The catalog entry in pnpm-workspace.yaml is the single
    // source of truth for the workspace-wide zod version, so accept
    // `catalog:` here.
    expect(pkg.dependencies['zod']).toMatch(/^(catalog:|\^?\d+\.\d+\.\d+)$/)
  })

  it('declares vitest as devDependency for the mcp-validate gate', () => {
    // `catalog:` resolves to the catalog entry (`vitest: ^4.0.0`) in
    // pnpm-workspace.yaml; semver-shaped pins are still accepted.
    expect(pkg.devDependencies['vitest']).toMatch(/^(catalog:|\^?\d+\.\d+\.\d+)$/)
  })

  it('declares build + test scripts wired to tsc + vitest', () => {
    expect(pkg.scripts.build).toBe('tsc -p tsconfig.json')
    expect(pkg.scripts.test).toBe('vitest run')
  })
})

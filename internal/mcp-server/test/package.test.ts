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
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('pins ajv 8.x for JSON Schema Draft 2020-12 validation', () => {
    expect(pkg.dependencies['ajv']).toMatch(/^8\.\d+\.\d+$/)
    expect(pkg.dependencies['ajv-formats']).toMatch(/^3\.\d+\.\d+$/)
  })

  it('pins zod 3.x for runtime input parsing', () => {
    expect(pkg.dependencies['zod']).toMatch(/^3\.\d+\.\d+$/)
  })

  it('declares vitest as devDependency for the mcp-validate gate', () => {
    expect(pkg.devDependencies['vitest']).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('declares build + test scripts wired to tsc + vitest', () => {
    expect(pkg.scripts.build).toBe('tsc -p tsconfig.json')
    expect(pkg.scripts.test).toBe('vitest run')
  })
})

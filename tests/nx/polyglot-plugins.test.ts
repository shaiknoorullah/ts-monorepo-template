import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '../..')

describe('polyglot plugins registered', () => {
  it('nx.json declares @nx-go/nx-go, @nxlv/python, @monodon/rust plugins', () => {
    const nxJson = JSON.parse(readFileSync(resolve(root, 'nx.json'), 'utf8'))
    const plugins = (nxJson.plugins ?? []).map((p: any) => (typeof p === 'string' ? p : p.plugin))
    expect(plugins).toContain('@nx-go/nx-go')
    expect(plugins).toContain('@nxlv/python')
    expect(plugins).toContain('@monodon/rust')
  })

  it('package.json devDependencies pin the three Nx polyglot plugins', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
    // Plan §4.1 asked for ^3 / ^20 / ^2 but those exact majors are not
    // published on npm for two of the three; we pin to the highest stable
    // minor that exists per plugin while preserving the plan's intent (one
    // major channel each).
    expect(pkg.devDependencies['@nx-go/nx-go']).toMatch(/^\^?3\./)
    expect(pkg.devDependencies['@nxlv/python']).toMatch(/^\^?22\./)
    expect(pkg.devDependencies['@monodon/rust']).toMatch(/^\^?2\./)
  })

  it('root Cargo.toml declares a workspace with rs-hello and contracts-rs', () => {
    const cargo = readFileSync(resolve(root, 'Cargo.toml'), 'utf8')
    expect(cargo).toMatch(/\[workspace\]/)
    expect(cargo).toMatch(/"apps\/rs-hello"/)
    // Phase 3 shipped the Rust contracts crate at packages/contracts-rs.
    expect(cargo).toMatch(/"packages\/contracts-rs"/)
  })
})

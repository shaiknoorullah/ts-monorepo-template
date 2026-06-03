// internal/cli/src/__tests__/devenv.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(__dirname, '..', '..', '..', '..')

describe('devenv shell wiring', () => {
  it('devenv.yaml pins nixpkgs and references devenv inputs', () => {
    const y = readFileSync(resolve(root, 'devenv.yaml'), 'utf8')
    expect(y).toMatch(/inputs:/)
    expect(y).toMatch(/nixpkgs:/)
  })
  it('devenv.nix sources toolchains + pre-commit + processes', () => {
    const n = readFileSync(resolve(root, 'devenv.nix'), 'utf8')
    expect(n).toContain('./devenv/toolchains.nix')
    expect(n).toContain('./devenv/pre-commit.nix')
    expect(n).toContain('./devenv/processes.nix')
  })
  it('toolchains.nix declares languages.{javascript,python,go,rust}', () => {
    const t = readFileSync(resolve(root, 'devenv/toolchains.nix'), 'utf8')
    expect(t).toContain('languages.javascript')
    expect(t).toContain('languages.python')
    expect(t).toContain('languages.go')
    expect(t).toContain('languages.rust')
  })
  it('pre-commit.nix lists all spec §4.4 hook ids', () => {
    const p = readFileSync(resolve(root, 'devenv/pre-commit.nix'), 'utf8')
    for (const h of [
      'nixpkgs-fmt',
      'prettier',
      'eslint',
      'ruff',
      'gofmt',
      'golangci-lint',
      'rustfmt',
      'clippy',
      'shellcheck',
      'commitlint',
      'gitleaks',
    ]) {
      expect(p).toContain(h)
    }
  })
  it('processes.nix exists', () => {
    expect(existsSync(resolve(root, 'devenv/processes.nix'))).toBe(true)
  })
})

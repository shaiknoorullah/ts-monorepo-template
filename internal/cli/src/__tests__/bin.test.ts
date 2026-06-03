// internal/cli/src/__tests__/bin.test.ts
import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const TS_NODE = resolve(__dirname, '..', 'bin', 'ts-monorepo.ts')
const CREATE = resolve(__dirname, '..', 'bin', 'create-platform.ts')

function run(file: string, args: string[]): string {
  // process.execPath = absolute path to current node; avoids PATH lookup (sonarjs/no-os-command-from-path).
   
  return execFileSync(process.execPath, ['--import', 'tsx', file, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

describe('bin entrypoints', () => {
  it('ts-monorepo profile:list prints 5 ids', () => {
    const out = run(TS_NODE, ['profile:list'])
    expect(out).toContain('p-solo')
    expect(out).toContain('p-enterprise')
  })
  it('create-platform --help prints wizard banner', () => {
    const out = run(CREATE, ['--help'])
    expect(out).toContain('create-platform')
  })
})

// internal/cli/src/__tests__/profile-diff.test.ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { runDiffCommand, computeProfileDiff } from '../commands/profile/diff.js'

let workdir: string

beforeEach(() => {
  workdir = mkdtempSync(join(tmpdir(), 'profile-diff-'))
  for (const id of ['p-a', 'p-b']) {
    mkdirSync(resolve(workdir, 'profiles', id), { recursive: true })
  }
  writeFileSync(
    resolve(workdir, 'profiles', 'p-a', 'terraform.tfvars'),
    'profile_id = "p-a"\ncluster_size = 1\n',
  )
  writeFileSync(
    resolve(workdir, 'profiles', 'p-b', 'terraform.tfvars'),
    'profile_id = "p-b"\ncluster_size = 3\n',
  )
})

afterEach(() => {
  rmSync(workdir, { recursive: true, force: true })
})

describe('profile:diff', () => {
  it('computes a structured diff of differing files', () => {
    const diff = computeProfileDiff('p-a', 'p-b', workdir)
    expect(diff.files).toHaveLength(1)
    expect(diff.files[0]!.path).toBe('terraform.tfvars')
    expect(diff.files[0]!.status).toBe('modified')
  })

  it('runs the CLI command and emits JSON when --json is set', () => {
    const captured: string[] = []
    const orig = process.stdout.write.bind(process.stdout)
    process.stdout.write = ((chunk: string | Uint8Array) => {
      captured.push(String(chunk))
      return true
    }) as typeof process.stdout.write
    try {
      const code = runDiffCommand('p-a', 'p-b', { json: true, cwd: workdir })
      expect(code).toBe(0)
      const parsed = JSON.parse(captured.join(''))
      expect(parsed.from).toBe('p-a')
      expect(parsed.to).toBe('p-b')
      expect(parsed.files[0].status).toBe('modified')
    } finally {
      process.stdout.write = orig
    }
  })
})

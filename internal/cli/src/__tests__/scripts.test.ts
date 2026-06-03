// internal/cli/src/__tests__/scripts.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = resolve(__dirname, '..', '..', '..', '..')
const SCRIPTS = [
  'task-commit.sh',
  'bootstrap-secrets.sh',
  'env-reconcile.sh',
  'install.sh',
  'data-up.sh',
  'data-down.sh',
  'tools-up.sh',
  'tools-down.sh',
]

// shellcheck may not be installed outside devenv shell; skip silently when absent.
let hasShellcheck = false
try {
  // eslint-disable-next-line sonarjs/no-os-command-from-path
  execFileSync('shellcheck', ['--version'], { stdio: 'pipe' })
  hasShellcheck = true
} catch {
  hasShellcheck = false
}

describe('scripts/dev/', () => {
  it.each(SCRIPTS)('%s starts with shebang and is shellcheck-clean', (name) => {
    const path = resolve(root, 'scripts/dev', name)
    const text = readFileSync(path, 'utf8')
    expect(text.startsWith('#!/usr/bin/env bash')).toBe(true)
    expect(text).toContain('set -euo pipefail')
    if (hasShellcheck) {
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      execFileSync('shellcheck', ['--severity=warning', path], { stdio: 'pipe' })
    }
  })
  it.each(SCRIPTS)('%s is executable', (name) => {
    const path = resolve(root, 'scripts/dev', name)
    const mode = statSync(path).mode
    // owner exec bit
    expect(mode & 0o100).toBe(0o100)
  })
})

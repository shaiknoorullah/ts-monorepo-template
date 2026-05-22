// internal/cli/src/utils/paths.ts
// Locate the repo root by walking up from cwd until pnpm-workspace.yaml is found.

import { existsSync } from 'node:fs'
import { dirname, resolve } from 'pathe'

export function findRepoRoot(start = process.cwd()): string {
  let dir = resolve(start)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (existsSync(resolve(dir, 'pnpm-workspace.yaml'))) return dir
    const parent = dirname(dir)
    if (parent === dir) {
      throw new Error('Could not find repo root (no pnpm-workspace.yaml found by walking up)')
    }
    dir = parent
  }
}

export function repoPath(...segments: string[]): string {
  return resolve(findRepoRoot(), ...segments)
}

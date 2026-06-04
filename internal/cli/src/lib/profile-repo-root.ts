// internal/cli/src/commands/profile/repo-root.ts
//
// Helper used by every profile:* command: walks up from `start` until a
// `profiles/p-solo/profile.env` is found so the CLI works regardless of cwd
// (e.g. invoked from internal/cli via pnpm).
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export function findRepoRoot(start: string = process.cwd()): string {
  let cur = resolve(start)
  while (true) {
    if (existsSync(resolve(cur, 'profiles', 'p-solo', 'profile.env'))) return cur
    const parent = resolve(cur, '..')
    if (parent === cur) return resolve(start)
    cur = parent
  }
}

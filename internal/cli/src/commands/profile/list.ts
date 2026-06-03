// internal/cli/src/commands/profile/list.ts
//
// `profile:list` — enumerates the curated 5 profiles by reading their
// `profile.env` files from disk (NOT a hardcoded constant) so a `profile:fork`
// of a sixth profile shows up too. Sorted by cost-band min so the table flows
// from "Just Me" -> "Production at Scale".
import { Command } from '@oclif/core'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { parse } from 'yaml'

export interface ProfileDoc {
  schemaVersion: 'profile-v1'
  machineId: string
  founderLabel: string
  costBandUsdMonthly: { min: number; max: number | null }
  axes: Record<string, unknown>
}

// Walk up from `start` until a `profiles/p-solo/profile.env` is found; used so
// `repo profile:list` works regardless of cwd (e.g., invoked from internal/cli).
function findProfilesDir(start: string = process.cwd()): string {
  let cur = resolve(start)
  while (true) {
    const candidate = resolve(cur, 'profiles')
    if (existsSync(resolve(candidate, 'p-solo', 'profile.env'))) return candidate
    const parent = dirname(cur)
    if (parent === cur) {
      // Fall back to cwd-relative path so callers get a clear ENOENT instead of an infinite loop.
      return resolve(start, 'profiles')
    }
    cur = parent
  }
}

export function profilesRoot(): string {
  return findProfilesDir()
}

export function listProfiles(root: string = profilesRoot()): ProfileDoc[] {
  const entries = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('p-'))
    .map((e) => e.name)
  const docs = entries.map((id) => {
    const raw = readFileSync(resolve(root, id, 'profile.env'), 'utf8')
    return parse(raw) as ProfileDoc
  })
  return docs.sort((a, b) => a.costBandUsdMonthly.min - b.costBandUsdMonthly.min)
}

export function formatProfilesTable(profiles: ProfileDoc[]): string {
  const rows = profiles.map((p) => {
    const band =
      p.costBandUsdMonthly.max === null
        ? `$${p.costBandUsdMonthly.min}+`
        : `$${p.costBandUsdMonthly.min}-${p.costBandUsdMonthly.max}`
    return `${p.machineId.padEnd(18)} ${p.founderLabel.padEnd(22)} ${band}`
  })
  return [`${'machineId'.padEnd(18)} ${'founderLabel'.padEnd(22)} $/mo`, ...rows].join('\n')
}

export function runListCommand(cwd: string = process.cwd()): number {
  process.stdout.write(`${formatProfilesTable(listProfiles(resolve(cwd, 'profiles')))}\n`)
  return 0
}

export default class ProfileList extends Command {
  static override readonly description = 'List the 5 profiles with cost bands'
  async run(): Promise<void> {
    const text = formatProfilesTable(listProfiles())
    this.log(text)
  }
}

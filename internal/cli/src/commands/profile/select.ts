// internal/cli/src/commands/profile/select.ts
//
// `profile:select <id>` — writes the active profile marker (`.profile`) at the
// repo root. The 5 named profiles are accepted; custom forked profile IDs must
// exist on disk too. Re-source direnv after running to pick up the new
// DEVENV_PROFILE env var.
import { Args, Command } from '@oclif/core'
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { findRepoRoot } from '../../lib/profile-repo-root.js'

const VALID_IDS = new Set([
  'p-enterprise',
  'p-hobby',
  'p-solo',
  'p-startup-scale',
  'p-startup-small',
])

export function runSelectCommand(profileId: string, cwd: string = process.cwd()): number {
  const profileDir = resolve(cwd, 'profiles', profileId)
  if (!existsSync(profileDir)) {
    process.stderr.write(`profile:select: profile directory not found at ${profileDir}\n`)
    return 1
  }
  if (!VALID_IDS.has(profileId) && !profileId.startsWith('p-')) {
    process.stderr.write(
      `profile:select: '${profileId}' is not one of the 5 named profiles; use task profile:fork first\n`,
    )
    return 2
  }
  writeFileSync(resolve(cwd, '.profile'), `${profileId}\n`)
  process.stdout.write(`profile:select: wrote .profile=${profileId}. Re-source direnv to apply.\n`)
  return 0
}

export default class ProfileSelect extends Command {
  static override readonly description = 'Write .profile and re-source devenv'
  static override readonly args = {
    profile: Args.string({ required: true, description: 'Profile machine id (e.g. p-hobby)' }),
  }
  async run(): Promise<void> {
    const { args } = await this.parse(ProfileSelect)
    const code = runSelectCommand(args.profile, findRepoRoot())
    if (code !== 0) this.exit(code)
  }
}

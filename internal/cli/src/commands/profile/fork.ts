// internal/cli/src/commands/profile/fork.ts
//
// `profile:fork <src> <dst>` — deep-copies a profile directory tree and
// rewrites the DEVENV_PROFILE marker + machineId in `profile.env`. Used to
// derive a custom profile (e.g. p-hobby-noor) from a named one. Refuses to
// clobber existing destinations.
import { Args, Command } from '@oclif/core'
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function runForkCommand(src: string, dst: string, cwd: string = process.cwd()): number {
  if (!/^p-[a-z0-9-]+$/.test(dst)) {
    process.stderr.write(
      `profile:fork: dst '${dst}' must match /^p-[a-z0-9-]+$/ (e.g. p-hobby-noor)\n`,
    )
    return 1
  }
  const srcDir = resolve(cwd, 'profiles', src)
  const dstDir = resolve(cwd, 'profiles', dst)
  if (!existsSync(srcDir)) {
    process.stderr.write(`profile:fork: source profile not found: ${srcDir}\n`)
    return 2
  }
  if (existsSync(dstDir)) {
    process.stderr.write(`profile:fork: destination already exists: ${dstDir}\n`)
    return 3
  }
  cpSync(srcDir, dstDir, { recursive: true })
  const envPath = resolve(dstDir, 'profile.env')
  const env = readFileSync(envPath, 'utf8')
  const rewritten = env
    .replace(/^# DEVENV_PROFILE=.*$/m, `# DEVENV_PROFILE=${dst}`)
    .replace(/^machineId:\s*.*$/m, `machineId: ${dst}`)
  writeFileSync(envPath, rewritten)
  process.stdout.write(`profile:fork: created profiles/${dst} from profiles/${src}\n`)
  return 0
}

export default class ProfileFork extends Command {
  static override readonly description = 'Copy profile dir, rewrite machine ID'
  static override readonly args = {
    src: Args.string({ required: true, description: 'Source profile id (e.g. p-hobby)' }),
    dst: Args.string({ required: true, description: 'Destination profile id (e.g. p-hobby-noor)' }),
  }
  async run(): Promise<void> {
    const { args } = await this.parse(ProfileFork)
    const code = runForkCommand(args.src, args.dst)
    if (code !== 0) this.exit(code)
  }
}

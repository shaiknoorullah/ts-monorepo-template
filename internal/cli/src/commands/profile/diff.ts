// internal/cli/src/commands/profile/diff.ts
import { Args, Command } from '@oclif/core'
import { diffProfiles } from '../../core/profiles.js'
import type { ProfileId } from '../../core/types.js'

export default class ProfileDiff extends Command {
  static override readonly description = 'Diff two profiles'
  static override readonly args = {
    from: Args.string({ required: true }),
    to: Args.string({ required: true }),
  }
  async run(): Promise<void> {
    const { args } = await this.parse(ProfileDiff)
    const d = diffProfiles(args.from as ProfileId, args.to as ProfileId)
    this.log(JSON.stringify(d, null, 2))
  }
}

// internal/cli/src/commands/profile/list.ts
import { Command } from '@oclif/core'
import { listProfiles } from '../../core/profiles.js'

export default class ProfileList extends Command {
  static override readonly description = 'List the 5 profiles with cost bands'
  async run(): Promise<void> {
    const out = listProfiles().map((p) => ({
      id: p.id,
      tagline: p.tagline,
      cost_band: p.cost_band_usd_monthly,
    }))
    this.log(JSON.stringify(out, null, 2))
  }
}

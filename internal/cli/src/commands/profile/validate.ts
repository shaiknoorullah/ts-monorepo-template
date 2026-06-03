// internal/cli/src/commands/profile/validate.ts
import { Args, Command } from '@oclif/core'
import { readFileSync } from 'node:fs'
import { validateMetaYaml } from '../../core/validate.js'

export default class ProfileValidate extends Command {
  static override readonly description = 'Validate a META.yaml against the Phase-1 schema'
  static override readonly args = { path: Args.string({ required: true }) }
  async run(): Promise<void> {
    const { args } = await this.parse(ProfileValidate)
    const text = readFileSync(args.path, 'utf8')
    const r = validateMetaYaml(text)
    this.log(JSON.stringify(r, null, 2))
    if (!r.ok) this.exit(1)
  }
}

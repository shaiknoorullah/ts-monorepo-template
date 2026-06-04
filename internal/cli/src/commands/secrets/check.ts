// internal/cli/src/commands/secrets/check.ts
import { Command, Flags } from '@oclif/core'
import { readFileSync } from 'node:fs'
import { checkSecretspec } from '../../core/secrets.js'

export default class SecretsCheck extends Command {
  static override readonly description = 'Validate secretspec.toml for the active profile'
  static override readonly flags = {
    profile: Flags.string({ default: 'p-solo' }),
    file: Flags.string({ default: 'secretspec.toml' }),
  }
  async run(): Promise<void> {
    const { flags } = await this.parse(SecretsCheck)
    const text = readFileSync(flags.file, 'utf8')
    const r = checkSecretspec(text, flags.profile, process.env as Record<string, string>)
    this.log(JSON.stringify(r, null, 2))
    if (!r.ok) this.exit(2)
  }
}

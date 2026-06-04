// internal/cli/src/commands/install.ts
import { Command } from '@oclif/core'

export default class Install extends Command {
  static override readonly description =
    'Bootstrap the dev shell — devenv + pnpm + uv + go + cargo + pre-commit'
  async run(): Promise<void> {
    this.log('install: this command shells out to scripts/dev/install.sh — see Phase 2.13')
  }
}

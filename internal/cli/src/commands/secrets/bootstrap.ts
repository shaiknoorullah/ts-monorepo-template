// internal/cli/src/commands/secrets/bootstrap.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class SecretsBootstrap extends Command {
  static override readonly description = 'AKV interactive loop'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'secrets:bootstrap',
      plan_phase: 'Phase 10 (Secret backends)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-10',
    })
  }
}

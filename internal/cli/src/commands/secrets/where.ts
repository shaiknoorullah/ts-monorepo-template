// internal/cli/src/commands/secrets/where.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class SecretsWhere extends Command {
  static override readonly description = 'Print active keyring backend'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'secrets:where',
      plan_phase: 'Phase 10 (Secret backends)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-10',
    })
  }
}

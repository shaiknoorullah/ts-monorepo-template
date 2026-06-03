// internal/cli/src/commands/nx-cloud/status.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NxCloudStatus extends Command {
  static override readonly description = 'Print Nx Cloud status'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'nx-cloud:status',
      plan_phase: 'Phase 3 (Nx Cloud)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-3',
    })
  }
}

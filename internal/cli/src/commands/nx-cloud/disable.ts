// internal/cli/src/commands/nx-cloud/disable.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NxCloudDisable extends Command {
  static override readonly description = 'Disable Nx Cloud locally'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'nx-cloud:disable',
      plan_phase: 'Phase 3 (Nx Cloud)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-3',
    })
  }
}

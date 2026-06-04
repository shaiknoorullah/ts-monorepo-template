// internal/cli/src/commands/nx-cloud/warm.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NxCloudWarm extends Command {
  static override readonly description = 'Warm the Nx Cloud cache'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'nx-cloud:warm',
      plan_phase: 'Phase 3 (Nx Cloud)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-3',
    })
  }
}

// internal/cli/src/commands/launch.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../lib/not-implemented.js'

export default class Launch extends Command {
  static override readonly description = 'Provision + deploy the active profile end-to-end'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'launch',
      plan_phase: 'Phase 7 (Argo + Kargo)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-7',
    })
  }
}

// internal/cli/src/commands/env/check.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class EnvCheck extends Command {
  static override readonly description = 'CI-friendly env reconcile; nonzero on drift'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'env:check',
      plan_phase: 'Phase 4 (apps land)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-4',
    })
  }
}

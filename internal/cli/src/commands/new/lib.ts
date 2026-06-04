// internal/cli/src/commands/new/lib.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NewLib extends Command {
  static override readonly description = 'Scaffold a shared library (lang chosen interactively)'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'new:lib',
      plan_phase: 'Phase 4 (Reference apps + generators)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-12',
    })
  }
}

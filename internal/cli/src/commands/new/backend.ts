// internal/cli/src/commands/new/backend.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NewBackend extends Command {
  static override readonly description = 'Scaffold a backend app (TS/Py/Go/Rust)'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'new:backend',
      plan_phase: 'Phase 4 (Reference apps + generators)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-12',
    })
  }
}

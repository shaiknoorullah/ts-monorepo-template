// internal/cli/src/commands/init.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../lib/not-implemented.js'

export default class Init extends Command {
  static override readonly description = 'Wizard — runs in existing checkout'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'init',
      plan_phase: 'Phase 11 (Launcher wizard)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-11',
    })
  }
}

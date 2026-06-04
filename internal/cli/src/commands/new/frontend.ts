// internal/cli/src/commands/new/frontend.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NewFrontend extends Command {
  static override readonly description = 'Scaffold a Next.js 15 frontend with lib-chart wiring'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'new:frontend',
      plan_phase: 'Phase 4 (Reference apps + generators)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-12',
    })
  }
}

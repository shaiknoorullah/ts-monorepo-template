// internal/cli/src/commands/profile/select.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class ProfileSelect extends Command {
  static override readonly description = 'Write .profile and re-source devenv'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'profile:select',
      plan_phase: 'Phase 13 (Profiles)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-1',
    })
  }
}

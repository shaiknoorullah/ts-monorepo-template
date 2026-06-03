// internal/cli/src/commands/profile/fork.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class ProfileFork extends Command {
  static override readonly description = 'Copy profile dir, rewrite machine ID'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'profile:fork',
      plan_phase: 'Phase 13 (Profiles)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-1',
    })
  }
}

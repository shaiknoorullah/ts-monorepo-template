// internal/cli/src/commands/nx-cloud/self-host.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NxCloudSelfHost extends Command {
  static override readonly description = 'Switch to self-hosted Nx Cloud backend'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'nx-cloud:self-host',
      plan_phase: 'Phase 3 (Nx Cloud)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-3',
    })
  }
}

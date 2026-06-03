// internal/cli/src/commands/nx-cloud/setup.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class NxCloudSetup extends Command {
  static override readonly description = 'Initialize Nx Cloud (SaaS default)'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'nx-cloud:setup',
      plan_phase: 'Phase 3 (Nx Cloud)',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-3',
    })
  }
}

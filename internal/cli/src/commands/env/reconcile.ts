// internal/cli/src/commands/env/reconcile.ts
import { Command } from '@oclif/core'
import { emitNotImplemented } from '../../lib/not-implemented.js'

export default class EnvReconcile extends Command {
  static override readonly description = '4-language grep vs secretspec.toml'
  async run(): Promise<void> {
    emitNotImplemented(this, {
      verb: 'env:reconcile',
      plan_phase: 'Phase 4 (apps land) — see scripts/dev/env-reconcile.sh stub',
      tracking: 'docs/superpowers/specs/2026-06-03-platform-foundation-design.md#section-4',
    })
  }
}

// internal/cli/src/lib/not-implemented.ts
import type { Command } from '@oclif/core'

export interface StubMeta {
  verb: string
  plan_phase: string
  tracking: string
}

export function emitNotImplemented(cmd: Command, meta: StubMeta): void {
  const payload = {
    status: 'not_yet_implemented',
    verb: meta.verb,
    message: `${meta.verb} is not yet implemented in this commit, see plan ${meta.plan_phase}`,
    plan_phase: meta.plan_phase,
    tracking_issue: meta.tracking,
    schema_stable: true,
  }
  cmd.log(JSON.stringify(payload, null, 2))
}

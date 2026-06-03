// `repo deps ...` — hygiene quartet wrappers.

import { defineCommand } from 'citty'

import { emit, fail, info } from '../utils/output'
import { run } from '../utils/run'

const check = defineCommand({
  meta: {
    description:
      'Run the full dependency hygiene quartet: syncpack + knip + manypkg + attw + publint + type-coverage.',
    name: 'check',
  },
  async run() {
    const steps: [string, string[]][] = [
      ['pnpm', ['syncpack', 'lint']],
      ['pnpm', ['knip']],
      ['pnpm', ['manypkg', 'check']],
      ['pnpm', ['-r', 'exec', 'attw', '--pack', '.', '--profile', 'esm-only']],
      ['pnpm', ['-r', 'exec', 'publint']],
      ['pnpm', ['type-coverage']],
    ]
    const failures: string[] = []
    for (const [bin, args] of steps) {
      info(`> ${bin} ${args.join(' ')}`)
      const { exitCode } = await run(bin, args)
      if (exitCode !== 0) failures.push(`${bin} ${args.join(' ')}`)
    }
    if (failures.length > 0) {
      fail(`deps check failed: ${failures.length} step(s) failed.`, { failures })
    }
    emit({ message: 'Dependency hygiene checks all passed.', status: 'ok' })
  },
})

const sync = defineCommand({
  meta: { description: 'Auto-fix dependency drift (syncpack fix + format).', name: 'sync' },
  async run() {
    const { exitCode } = await run('pnpm', ['syncpack', 'fix-mismatches'])
    if (exitCode !== 0) fail('syncpack fix-mismatches failed')
    const { exitCode: ec2 } = await run('pnpm', ['syncpack', 'format'])
    if (ec2 !== 0) fail('syncpack format failed')
    emit({ message: 'Dependencies synced.', status: 'ok' })
  },
})

const audit = defineCommand({
  meta: {
    description: 'Run pnpm audit + osv-scanner (if installed) for known-vulnerable deps.',
    name: 'audit',
  },
  async run() {
    const { exitCode } = await run('pnpm', ['audit', '--prod', '--audit-level=high'])
    // osv-scanner is optional; surface its result but don't fail the whole run on its absence.
    const osv = await run('osv-scanner', ['--lockfile', 'pnpm-lock.yaml'])
    emit({
      data: { osvExit: osv.exitCode, pnpmAuditExit: exitCode },
      message: 'Audit complete.',
      status: exitCode === 0 && osv.exitCode === 0 ? 'ok' : 'warning',
    })
  },
})

export const depsCommand = defineCommand({
  meta: { description: 'Dependency hygiene & audit.', name: 'deps' },
  subCommands: { audit, check, sync },
})

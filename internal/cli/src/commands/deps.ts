// `repo deps ...` — hygiene quartet wrappers.

import { defineCommand } from 'citty'
import { emit, fail, info } from '../utils/output'
import { run } from '../utils/run'

const check = defineCommand({
  meta: {
    name: 'check',
    description:
      'Run the full dependency hygiene quartet: syncpack + knip + manypkg + attw + publint + type-coverage.',
  },
  async run() {
    const steps: Array<[string, string[]]> = [
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
    emit({ status: 'ok', message: 'Dependency hygiene checks all passed.' })
  },
})

const sync = defineCommand({
  meta: { name: 'sync', description: 'Auto-fix dependency drift (syncpack fix + format).' },
  async run() {
    const { exitCode } = await run('pnpm', ['syncpack', 'fix-mismatches'])
    if (exitCode !== 0) fail('syncpack fix-mismatches failed')
    const { exitCode: ec2 } = await run('pnpm', ['syncpack', 'format'])
    if (ec2 !== 0) fail('syncpack format failed')
    emit({ status: 'ok', message: 'Dependencies synced.' })
  },
})

const audit = defineCommand({
  meta: {
    name: 'audit',
    description: 'Run pnpm audit + osv-scanner (if installed) for known-vulnerable deps.',
  },
  async run() {
    const { exitCode } = await run('pnpm', ['audit', '--prod', '--audit-level=high'])
    // osv-scanner is optional; surface its result but don't fail the whole run on its absence.
    const osv = await run('osv-scanner', ['--lockfile', 'pnpm-lock.yaml'])
    emit({
      status: exitCode === 0 && osv.exitCode === 0 ? 'ok' : 'warning',
      message: 'Audit complete.',
      data: { pnpmAuditExit: exitCode, osvExit: osv.exitCode },
    })
  },
})

export const depsCommand = defineCommand({
  meta: { name: 'deps', description: 'Dependency hygiene & audit.' },
  subCommands: { check, sync, audit },
})

// `repo type-check` — nx run-many -t type-check.

import { defineCommand } from 'citty'

import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const typeCheckCommand = defineCommand({
  meta: { description: 'tsc -b across project references.', name: 'type-check' },
  async run() {
    const { exitCode } = await run('pnpm', ['nx', 'run-many', '-t', 'type-check'])
    if (exitCode !== 0) fail(`type-check failed (exit ${exitCode})`)
    emit({ message: 'Type-check passed.', status: 'ok' })
  },
})

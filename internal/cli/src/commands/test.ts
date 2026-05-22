// `repo test` — nx run-many -t test.

import { defineCommand } from 'citty'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const testCommand = defineCommand({
  meta: { name: 'test', description: 'Run vitest across all workspace packages.' },
  args: {
    affected: { type: 'boolean', description: 'Use `nx affected` against origin/main.' },
    coverage: { type: 'boolean', description: 'Collect v8 coverage.' },
  },
  async run({ args }) {
    const target = args.affected ? ['affected'] : ['run-many']
    const flags = ['-t', 'test']
    if (args.coverage) flags.push('--', '--coverage')
    const { exitCode } = await run('pnpm', ['nx', ...target, ...flags])
    if (exitCode !== 0) fail(`tests failed (exit ${exitCode})`)
    emit({ status: 'ok', message: 'Tests passed.' })
  },
})

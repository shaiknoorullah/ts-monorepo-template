// `repo test` — nx run-many -t test.

import { defineCommand } from 'citty'

import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const testCommand = defineCommand({
  args: {
    affected: { description: 'Use `nx affected` against origin/main.', type: 'boolean' },
    coverage: { description: 'Collect v8 coverage.', type: 'boolean' },
  },
  meta: { description: 'Run vitest across all workspace packages.', name: 'test' },
  async run({ args }) {
    const target = args.affected ? ['affected'] : ['run-many']
    const flags = ['-t', 'test']
    if (args.coverage) flags.push('--', '--coverage')
    const { exitCode } = await run('pnpm', ['nx', ...target, ...flags])
    if (exitCode !== 0) fail(`tests failed (exit ${exitCode})`)
    emit({ message: 'Tests passed.', status: 'ok' })
  },
})

// `repo build` — nx run-many -t build.

import { defineCommand } from 'citty'

import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const buildCommand = defineCommand({
  args: {
    affected: { description: 'Use `nx affected` against origin/main.', type: 'boolean' },
  },
  meta: { description: 'tsdown bundle + tsc emit across all workspace packages.', name: 'build' },
  async run({ args }) {
    const target = args.affected ? ['affected'] : ['run-many']
    const { exitCode } = await run('pnpm', ['nx', ...target, '-t', 'build'])
    if (exitCode !== 0) fail(`build failed (exit ${exitCode})`)
    emit({ message: 'Build complete.', status: 'ok' })
  },
})

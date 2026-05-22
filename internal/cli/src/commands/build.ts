// `repo build` — nx run-many -t build.

import { defineCommand } from 'citty'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const buildCommand = defineCommand({
  meta: { name: 'build', description: 'tsdown bundle + tsc emit across all workspace packages.' },
  args: {
    affected: { type: 'boolean', description: 'Use `nx affected` against origin/main.' },
  },
  async run({ args }) {
    const target = args.affected ? ['affected'] : ['run-many']
    const { exitCode } = await run('pnpm', ['nx', ...target, '-t', 'build'])
    if (exitCode !== 0) fail(`build failed (exit ${exitCode})`)
    emit({ status: 'ok', message: 'Build complete.' })
  },
})

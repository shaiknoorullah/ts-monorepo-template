// `repo lint` — ESLint + Prettier --check + markdownlint + cspell + yamllint (when present).

import { defineCommand } from 'citty'
import { emit, fail, info } from '../utils/output'
import { run } from '../utils/run'

export const lintCommand = defineCommand({
  meta: { name: 'lint', description: 'ESLint + Prettier --check + markdownlint + cspell.' },
  args: {
    fix: { type: 'boolean', description: 'Apply auto-fixes (eslint --fix + prettier --write).' },
  },
  async run({ args }) {
    if (args.fix) {
      const e = await run('pnpm', ['nx', 'run-many', '-t', 'lint', '--', '--fix'])
      const p = await run('pnpm', ['prettier', '--write', '.'])
      if (e.exitCode !== 0 || p.exitCode !== 0) fail('lint --fix failed')
      emit({ status: 'ok', message: 'Lint fixes applied.' })
      return
    }

    const steps: Array<[string, string[]]> = [
      ['pnpm', ['nx', 'run-many', '-t', 'lint']],
      ['pnpm', ['prettier', '--check', '.']],
      ['pnpm', ['markdownlint-cli2', '**/*.md']],
      ['pnpm', ['cspell', '--no-progress', '.']],
    ]
    const failures: string[] = []
    for (const [bin, a] of steps) {
      info(`> ${bin} ${a.join(' ')}`)
      const { exitCode } = await run(bin, a)
      if (exitCode !== 0) failures.push(`${bin} ${a.join(' ')}`)
    }
    if (failures.length > 0) fail('lint failed', { failures })
    emit({ status: 'ok', message: 'Lint passed.' })
  },
})

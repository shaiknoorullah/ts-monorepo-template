// `repo ci` — run the same gate that CI runs. Used as a pre-push hook.

import { defineCommand } from 'citty'

import { emit, fail, info } from '../utils/output'
import { run } from '../utils/run'

export const ciCommand = defineCommand({
  meta: {
    description: 'Mirror of CI: lint + type-check + test + build + dead + deps + manypkg.',
    name: 'ci',
  },
  async run() {
    const steps: [string, string[]][] = [
      ['pnpm', ['lint']],
      ['pnpm', ['type-check']],
      ['pnpm', ['test']],
      ['pnpm', ['build']],
      ['pnpm', ['dead']],
      ['pnpm', ['deps']],
      ['pnpm', ['manypkg']],
    ]
    for (const [bin, args] of steps) {
      info(`> ${bin} ${args.join(' ')}`)
      const { exitCode } = await run(bin, args)
      if (exitCode !== 0) fail(`${bin} ${args.join(' ')} failed`)
    }
    emit({ message: 'CI gate passed locally. Safe to push.', status: 'ok' })
  },
})

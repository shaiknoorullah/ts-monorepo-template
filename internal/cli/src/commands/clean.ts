// `repo clean` — nx reset + rm -rf node_modules + pnpm install.

import { defineCommand } from 'citty'
import prompts from 'prompts'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const cleanCommand = defineCommand({
  meta: {
    name: 'clean',
    description: 'Reset Nx cache + reinstall node_modules. Destructive — prompts for confirmation.',
  },
  args: {
    yes: { type: 'boolean', description: 'Skip the confirmation prompt.', default: false },
  },
  async run({ args }) {
    if (!args.yes) {
      const { ok } = await prompts({
        type: 'confirm',
        name: 'ok',
        message: 'This will reset Nx cache and reinstall node_modules. Continue?',
        initial: false,
      })
      if (!ok) {
        emit({ status: 'warning', message: 'Aborted.' })
        return
      }
    }
    const a = await run('pnpm', ['nx', 'reset'])
    if (a.exitCode !== 0) fail('nx reset failed')
    const b = await run('pnpm', ['install'])
    if (b.exitCode !== 0) fail('pnpm install failed')
    emit({ status: 'ok', message: 'Clean done.' })
  },
})

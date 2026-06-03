// `repo clean` — nx reset + rm -rf node_modules + pnpm install.

import { defineCommand } from 'citty'
import prompts from 'prompts'

import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const cleanCommand = defineCommand({
  args: {
    yes: { default: false, description: 'Skip the confirmation prompt.', type: 'boolean' },
  },
  meta: {
    description: 'Reset Nx cache + reinstall node_modules. Destructive — prompts for confirmation.',
    name: 'clean',
  },
  async run({ args }) {
    if (!args.yes) {
      const { ok } = await prompts({
        initial: false,
        message: 'This will reset Nx cache and reinstall node_modules. Continue?',
        name: 'ok',
        type: 'confirm',
      })
      if (!ok) {
        emit({ message: 'Aborted.', status: 'warning' })
        return
      }
    }
    const a = await run('pnpm', ['nx', 'reset'])
    if (a.exitCode !== 0) fail('nx reset failed')
    const b = await run('pnpm', ['install'])
    if (b.exitCode !== 0) fail('pnpm install failed')
    emit({ message: 'Clean done.', status: 'ok' })
  },
})

// `repo new changeset` — wraps `pnpm changeset add`.

import { defineCommand } from 'citty'

import { emit } from '../../utils/output'
import { run } from '../../utils/run'

export const newChangeset = defineCommand({
  meta: { description: 'Open the changeset prompt to describe a release.', name: 'changeset' },
  async run() {
    const { exitCode } = await run('pnpm', ['changeset'])
    emit({
      data: { exitCode },
      message: exitCode === 0 ? 'Changeset recorded.' : 'changeset exited non-zero.',
      status: exitCode === 0 ? 'ok' : 'error',
    })
    if (exitCode !== 0) process.exit(exitCode)
  },
})

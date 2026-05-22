// `repo new changeset` — wraps `pnpm changeset add`.

import { defineCommand } from 'citty'
import { run } from '../../utils/run'
import { emit } from '../../utils/output'

export const newChangeset = defineCommand({
  meta: { name: 'changeset', description: 'Open the changeset prompt to describe a release.' },
  async run() {
    const { exitCode } = await run('pnpm', ['changeset'])
    emit({
      status: exitCode === 0 ? 'ok' : 'error',
      message: exitCode === 0 ? 'Changeset recorded.' : 'changeset exited non-zero.',
      data: { exitCode },
    })
    if (exitCode !== 0) process.exit(exitCode)
  },
})

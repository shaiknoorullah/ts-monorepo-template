// `repo format` — auto-fix linting + prettier write.

import { defineCommand } from 'citty'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

export const formatCommand = defineCommand({
  meta: { name: 'format', description: 'Auto-format: eslint --fix + prettier --write.' },
  async run() {
    const e = await run('pnpm', ['nx', 'run-many', '-t', 'lint', '--', '--fix'])
    const p = await run('pnpm', ['prettier', '--write', '.'])
    if (e.exitCode !== 0 || p.exitCode !== 0) fail('format failed')
    emit({ status: 'ok', message: 'Formatted.' })
  },
})

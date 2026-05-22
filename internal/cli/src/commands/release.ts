// `repo release ...` — wraps changesets release flow.

import { defineCommand } from 'citty'

import { emit, fail } from '../utils/output'
import { run } from '../utils/run'
import { newChangeset } from './new/changeset'

const version = defineCommand({
  meta: { description: 'Apply pending changesets (bumps versions, updates CHANGELOG).', name: 'version' },
  async run() {
    const { exitCode } = await run('pnpm', ['changeset', 'version'])
    if (exitCode !== 0) fail('changeset version failed')
    const { exitCode: ec2 } = await run('pnpm', ['install', '--lockfile-only'])
    if (ec2 !== 0) fail('pnpm install --lockfile-only failed')
    emit({ message: 'Versions bumped. Commit + push the result.', status: 'ok' })
  },
})

const publish = defineCommand({
  meta: { description: 'pnpm changeset publish (uses NODE_AUTH_TOKEN from env).', name: 'publish' },
  async run() {
    const { exitCode } = await run('pnpm', ['changeset', 'publish'])
    if (exitCode !== 0) fail('changeset publish failed')
    emit({ message: 'Published.', status: 'ok' })
  },
})

export const releaseCommand = defineCommand({
  meta: { description: 'Changesets release flow.', name: 'release' },
  subCommands: { changeset: newChangeset, publish, version },
})

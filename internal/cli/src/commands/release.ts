// `repo release ...` — wraps changesets release flow.

import { defineCommand } from 'citty'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'
import { newChangeset } from './new/changeset'

const version = defineCommand({
  meta: { name: 'version', description: 'Apply pending changesets (bumps versions, updates CHANGELOG).' },
  async run() {
    const { exitCode } = await run('pnpm', ['changeset', 'version'])
    if (exitCode !== 0) fail('changeset version failed')
    const { exitCode: ec2 } = await run('pnpm', ['install', '--lockfile-only'])
    if (ec2 !== 0) fail('pnpm install --lockfile-only failed')
    emit({ status: 'ok', message: 'Versions bumped. Commit + push the result.' })
  },
})

const publish = defineCommand({
  meta: { name: 'publish', description: 'pnpm changeset publish (uses NODE_AUTH_TOKEN from env).' },
  async run() {
    const { exitCode } = await run('pnpm', ['changeset', 'publish'])
    if (exitCode !== 0) fail('changeset publish failed')
    emit({ status: 'ok', message: 'Published.' })
  },
})

export const releaseCommand = defineCommand({
  meta: { name: 'release', description: 'Changesets release flow.' },
  subCommands: { changeset: newChangeset, version, publish },
})

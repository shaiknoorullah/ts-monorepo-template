// `repo db ...` — DB migration / seed / psql wrappers.
//
// Defaults to Atlas (https://atlasgo.io) but the runner is a thin shell-out, so
// swapping for Prisma/Drizzle migrate is a one-line change.

import { defineCommand } from 'citty'
import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

const migrate = defineCommand({
  meta: { name: 'migrate', description: 'Apply pending migrations (atlas migrate apply).' },
  args: { env: { type: 'string', description: 'Target env name', default: 'dev' } },
  async run({ args }) {
    const { exitCode } = await run('atlas', [
      'migrate',
      'apply',
      '--env',
      String(args.env),
    ])
    if (exitCode !== 0) fail(`atlas migrate apply failed (exit ${exitCode})`)
    emit({ status: 'ok', message: `Migrations applied for ${args.env}.` })
  },
})

const status = defineCommand({
  meta: { name: 'status', description: 'Show migration status (atlas migrate status).' },
  args: { env: { type: 'string', description: 'Target env name', default: 'dev' } },
  async run({ args }) {
    const { exitCode } = await run('atlas', ['migrate', 'status', '--env', String(args.env)])
    if (exitCode !== 0) fail(`atlas migrate status failed (exit ${exitCode})`)
  },
})

const diff = defineCommand({
  meta: { name: 'diff', description: 'Generate a new migration (atlas migrate diff <name>).' },
  args: {
    name: { type: 'positional', description: 'Migration name', required: true },
    env: { type: 'string', description: 'Target env name', default: 'dev' },
  },
  async run({ args }) {
    const { exitCode } = await run('atlas', [
      'migrate',
      'diff',
      String(args.name),
      '--env',
      String(args.env),
    ])
    if (exitCode !== 0) fail(`atlas migrate diff failed (exit ${exitCode})`)
    emit({ status: 'ok', message: `Migration ${args.name} drafted.` })
  },
})

const seed = defineCommand({
  meta: { name: 'seed', description: 'Run seed scripts (delegates to pnpm seed).' },
  async run() {
    const { exitCode } = await run('pnpm', ['-w', 'run', 'seed'])
    if (exitCode !== 0) fail(`seed failed (exit ${exitCode})`)
    emit({ status: 'ok', message: 'Seeded.' })
  },
})

const psql = defineCommand({
  meta: { name: 'psql', description: 'Exec psql inside the local postgres dev container.' },
  args: {
    db: { type: 'positional', description: 'Database name', required: false },
  },
  async run({ args }) {
    const db = args.db ? String(args.db) : 'app'
    const { exitCode } = await run(
      'docker',
      ['compose', '-f', 'docker/compose.dev.yml', 'exec', '-it', 'postgres', 'psql', '-U', 'dev', db],
      { stdio: 'inherit' },
    )
    if (exitCode !== 0) fail(`psql exited ${exitCode}`)
  },
})

export const dbCommand = defineCommand({
  meta: { name: 'db', description: 'Database migrations, seeding, and psql shell.' },
  subCommands: { migrate, status, diff, seed, psql },
})

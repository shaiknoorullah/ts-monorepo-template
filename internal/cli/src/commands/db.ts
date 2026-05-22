// `repo db ...` — DB migration / seed / psql wrappers.
//
// Defaults to Atlas (https://atlasgo.io) but the runner is a thin shell-out, so
// swapping for Prisma/Drizzle migrate is a one-line change.

import { defineCommand } from 'citty'

import { emit, fail } from '../utils/output'
import { run } from '../utils/run'

const migrate = defineCommand({
  args: { env: { default: 'dev', description: 'Target env name', type: 'string' } },
  meta: { description: 'Apply pending migrations (atlas migrate apply).', name: 'migrate' },
  async run({ args }) {
    const { exitCode } = await run('atlas', ['migrate', 'apply', '--env', String(args.env)])
    if (exitCode !== 0) fail(`atlas migrate apply failed (exit ${exitCode})`)
    emit({ message: `Migrations applied for ${args.env}.`, status: 'ok' })
  },
})

const status = defineCommand({
  args: { env: { default: 'dev', description: 'Target env name', type: 'string' } },
  meta: { description: 'Show migration status (atlas migrate status).', name: 'status' },
  async run({ args }) {
    const { exitCode } = await run('atlas', ['migrate', 'status', '--env', String(args.env)])
    if (exitCode !== 0) fail(`atlas migrate status failed (exit ${exitCode})`)
  },
})

const diff = defineCommand({
  args: {
    env: { default: 'dev', description: 'Target env name', type: 'string' },
    name: { description: 'Migration name', required: true, type: 'positional' },
  },
  meta: { description: 'Generate a new migration (atlas migrate diff <name>).', name: 'diff' },
  async run({ args }) {
    const { exitCode } = await run('atlas', [
      'migrate',
      'diff',
      String(args.name),
      '--env',
      String(args.env),
    ])
    if (exitCode !== 0) fail(`atlas migrate diff failed (exit ${exitCode})`)
    emit({ message: `Migration ${args.name} drafted.`, status: 'ok' })
  },
})

const seed = defineCommand({
  meta: { description: 'Run seed scripts (delegates to pnpm seed).', name: 'seed' },
  async run() {
    const { exitCode } = await run('pnpm', ['-w', 'run', 'seed'])
    if (exitCode !== 0) fail(`seed failed (exit ${exitCode})`)
    emit({ message: 'Seeded.', status: 'ok' })
  },
})

const psql = defineCommand({
  args: {
    db: { description: 'Database name', required: false, type: 'positional' },
  },
  meta: { description: 'Exec psql inside the local postgres dev container.', name: 'psql' },
  async run({ args }) {
    const db = args.db ? String(args.db) : 'app'
    const { exitCode } = await run(
      'docker',
      [
        'compose',
        '-f',
        'docker/compose.dev.yml',
        'exec',
        '-it',
        'postgres',
        'psql',
        '-U',
        'dev',
        db,
      ],
      { stdio: 'inherit' },
    )
    if (exitCode !== 0) fail(`psql exited ${exitCode}`)
  },
})

export const dbCommand = defineCommand({
  meta: { description: 'Database migrations, seeding, and psql shell.', name: 'db' },
  subCommands: { diff, migrate, psql, seed, status },
})

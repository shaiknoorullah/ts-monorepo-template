#!/usr/bin/env node
// internal/cli/src/bin/create-platform.ts
import { execute } from '@oclif/core'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..', '..')

// `create-platform` is the wizard entry — it shells into `init` by default.
const args = process.argv.slice(2)
if (args.length === 0 || args[0]?.startsWith('-')) {
  if (args.includes('--help') || args.includes('-h')) {
    process.stdout.write('create-platform — wizard for a new monorepo\n')
    process.stdout.write('usage: create-platform [--profile <id>] [--yes]\n')
    process.exit(0)
  }
  await execute({ dir: root, args: ['init', ...args] })
} else {
  await execute({ dir: root })
}

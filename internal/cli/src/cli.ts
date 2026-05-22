#!/usr/bin/env node
// internal/cli/src/cli.ts
//
// `repo` — the single CLI for everything a developer does in this monorepo
// EXCEPT writing business logic. Built on citty (UnJS) for tree-shake-friendly
// command composition.

import { defineCommand, runMain } from 'citty'
import { setJsonMode } from './utils/output'

// Lazy command imports keep cold-start fast.
import { newCommand } from './commands/new'
import { envCommand } from './commands/env'
import { devCommand } from './commands/dev'
import { dbCommand } from './commands/db'
import { depsCommand } from './commands/deps'
import { releaseCommand } from './commands/release'
import { lintCommand } from './commands/lint'
import { formatCommand } from './commands/format'
import { testCommand } from './commands/test'
import { buildCommand } from './commands/build'
import { typeCheckCommand } from './commands/type-check'
import { ciCommand } from './commands/ci'
import { doctorCommand } from './commands/doctor'
import { cleanCommand } from './commands/clean'
import { versionCommand } from './commands/version'
import { completionCommand } from './commands/completion'

const main = defineCommand({
  meta: {
    name: 'repo',
    version: '0.0.0',
    description:
      'Single entry point for every dev workflow in this monorepo. Scaffold, render config, run dev stack, lint, test, release, audit.',
  },
  args: {
    json: {
      type: 'boolean',
      description: 'Emit machine-readable JSON output instead of pretty logs.',
      default: false,
    },
  },
  setup({ args }) {
    if (args.json) setJsonMode(true)
  },
  subCommands: {
    new: newCommand,
    env: envCommand,
    dev: devCommand,
    db: dbCommand,
    deps: depsCommand,
    release: releaseCommand,
    lint: lintCommand,
    format: formatCommand,
    test: testCommand,
    build: buildCommand,
    'type-check': typeCheckCommand,
    ci: ciCommand,
    doctor: doctorCommand,
    clean: cleanCommand,
    version: versionCommand,
    completion: completionCommand,
  },
})

await runMain(main)

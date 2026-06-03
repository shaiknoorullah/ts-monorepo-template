#!/usr/bin/env node
// internal/cli/src/cli.ts
//
// `repo` — the single CLI for everything a developer does in this monorepo
// EXCEPT writing business logic. Built on citty (UnJS) for tree-shake-friendly
// command composition.

import { defineCommand, runMain } from 'citty'

import { buildCommand } from './repo-commands/build'
import { ciCommand } from './repo-commands/ci'
import { cleanCommand } from './repo-commands/clean'
import { completionCommand } from './repo-commands/completion'
import { dbCommand } from './repo-commands/db'
import { depsCommand } from './repo-commands/deps'
import { devCommand } from './repo-commands/dev'
import { doctorCommand } from './repo-commands/doctor'
import { envCommand } from './repo-commands/env'
import { formatCommand } from './repo-commands/format'
import { lintCommand } from './repo-commands/lint'
// Lazy command imports keep cold-start fast.
import { newCommand } from './repo-commands/new'
import { releaseCommand } from './repo-commands/release'
import { testCommand } from './repo-commands/test'
import { typeCheckCommand } from './repo-commands/type-check'
import { versionCommand } from './repo-commands/version'
import { setJsonMode } from './utils/output'

const main = defineCommand({
  args: {
    json: {
      default: false,
      description: 'Emit machine-readable JSON output instead of pretty logs.',
      type: 'boolean',
    },
  },
  meta: {
    description:
      'Single entry point for every dev workflow in this monorepo. Scaffold, render config, run dev stack, lint, test, release, audit.',
    name: 'repo',
    version: '0.0.0',
  },
  setup({ args }) {
    if (args.json) setJsonMode(true)
  },
  subCommands: {
    build: buildCommand,
    ci: ciCommand,
    clean: cleanCommand,
    completion: completionCommand,
    db: dbCommand,
    deps: depsCommand,
    dev: devCommand,
    doctor: doctorCommand,
    env: envCommand,
    format: formatCommand,
    lint: lintCommand,
    new: newCommand,
    release: releaseCommand,
    test: testCommand,
    'type-check': typeCheckCommand,
    version: versionCommand,
  },
})

await runMain(main)

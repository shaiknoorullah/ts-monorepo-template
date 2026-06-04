// internal/cli/src/commands/new.ts
// `repo new ...` — scaffolding commands.

import { defineCommand } from 'citty'

import { newAdr } from './new/adr'
import { newApp } from './new/app'
import { newChangeset } from './new/changeset'
import { newPackage } from './new/package'
import { newRunbook } from './new/runbook'
import { newWorkflow } from './new/workflow'

export const newCommand = defineCommand({
  meta: {
    description: 'Scaffold new packages, apps, ADRs, changesets, workflows, runbooks.',
    name: 'new',
  },
  subCommands: {
    adr: newAdr,
    app: newApp,
    changeset: newChangeset,
    package: newPackage,
    runbook: newRunbook,
    workflow: newWorkflow,
  },
})

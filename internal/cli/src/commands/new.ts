// internal/cli/src/commands/new.ts
// `repo new ...` — scaffolding commands.

import { defineCommand } from 'citty'
import { newApp } from './new/app'
import { newPackage } from './new/package'
import { newAdr } from './new/adr'
import { newChangeset } from './new/changeset'
import { newWorkflow } from './new/workflow'
import { newRunbook } from './new/runbook'

export const newCommand = defineCommand({
  meta: {
    name: 'new',
    description: 'Scaffold new packages, apps, ADRs, changesets, workflows, runbooks.',
  },
  subCommands: {
    app: newApp,
    package: newPackage,
    adr: newAdr,
    changeset: newChangeset,
    workflow: newWorkflow,
    runbook: newRunbook,
  },
})

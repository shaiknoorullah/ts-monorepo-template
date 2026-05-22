// `repo new workflow <name>` — scaffold .github/workflows/<name>.yml from template.

import { defineCommand } from 'citty'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'pathe'
import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'
import { renderString } from '../../utils/templates'

export const newWorkflow = defineCommand({
  meta: { name: 'workflow', description: 'Scaffold a GitHub Actions workflow.' },
  args: {
    name: { type: 'positional', description: 'Workflow file name (no extension)', required: true },
  },
  run({ args }) {
    const name = String(args.name)
    const dir = repoPath('.github/workflows')
    mkdirSync(dir, { recursive: true })
    const target = resolve(dir, `${name}.yml`)
    if (existsSync(target)) fail(`${name}.yml already exists.`)

    const templatePath = repoPath('internal/templates/workflow/workflow.yml')
    const template = existsSync(templatePath) ? readFileSync(templatePath, 'utf-8') : DEFAULT
    writeFileSync(target, renderString(template, { name }))

    emit({ status: 'ok', message: `Created ${name}.yml`, data: { path: target } })
  },
})

const DEFAULT = `name: {{name}}

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: pnpm
      - name: Install
        run: pnpm install --frozen-lockfile
      - name: Run
        run: echo "AGENT-TODO: implement {{name}} workflow"
`

// `repo new runbook <name>` — scaffold docs/runbooks/<name>.md.

import { defineCommand } from 'citty'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'pathe'

import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'
import { renderString } from '../../utils/templates'

export const newRunbook = defineCommand({
  args: {
    name: { description: 'Runbook slug (kebab-case)', required: true, type: 'positional' },
  },
  meta: { description: 'Scaffold a new ops runbook.', name: 'runbook' },
  run({ args }) {
    const name = String(args.name)
    const dir = repoPath('docs/runbooks')
    mkdirSync(dir, { recursive: true })
    const target = resolve(dir, `${name}.md`)
    if (existsSync(target)) fail(`${name}.md already exists.`)

    const templatePath = repoPath('internal/templates/runbook/runbook.md')
    const template = existsSync(templatePath) ? readFileSync(templatePath, 'utf-8') : DEFAULT
    const today = new Date().toISOString().slice(0, 10)
    writeFileSync(target, renderString(template, { date: today, name }))

    emit({ data: { path: target }, message: `Created runbook ${name}.md`, status: 'ok' })
  },
})

const DEFAULT = `# Runbook — {{name}}

- **Created:** {{date}}
- **Owner:** TBD
- **Severity covered:** SEV-?

## Symptoms

-

## Detection

-

## Triage

1.
2.

## Mitigation

1.
2.

## Resolution

1.

## Post-incident

- Root cause analysis:
- Action items:
`

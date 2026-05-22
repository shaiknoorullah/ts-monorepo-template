// `repo new adr <title>` — scaffold docs/adrs/<NNNN>-<slug>.md from template

import { defineCommand } from 'citty'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'pathe'

import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'
import { renderString } from '../../utils/templates'

function nextNumber(adrDir: string): string {
  if (!existsSync(adrDir)) return '0001'
  const nums = readdirSync(adrDir)
    .map((f) => (/^(\d{4})-/.exec(f))?.[1])
    .filter((n): n is string => !!n)
    .map((n) => Number.parseInt(n, 10))
  const max = nums.length === 0 ? 0 : Math.max(...nums)
  return String(max + 1).padStart(4, '0')
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

export const newAdr = defineCommand({
  args: {
    title: { description: 'ADR title', required: true, type: 'positional' },
  },
  meta: { description: 'Scaffold a new ADR under docs/adrs/.', name: 'adr' },
  run({ args }) {
    const title = String(args.title)
    const adrDir = repoPath('docs/adrs')
    const templatePath = repoPath('internal/templates/adr/template.md')
    mkdirSync(adrDir, { recursive: true })

    const num = nextNumber(adrDir)
    const slug = slugify(title)
    const filename = `${num}-${slug}.md`
    const fullPath = resolve(adrDir, filename)

    if (existsSync(fullPath)) fail(`${filename} already exists.`)

    const today = new Date().toISOString().slice(0, 10)
    const template = existsSync(templatePath)
      ? readFileSync(templatePath, 'utf-8')
      : DEFAULT_ADR_TEMPLATE

    const rendered = renderString(template, {
      date: today,
      number: num,
      slug,
      title,
    })

    writeFileSync(fullPath, rendered)

    emit({
      data: { number: num, path: fullPath, slug },
      message: `Created ${filename}`,
      status: 'ok',
    })
  },
})

const DEFAULT_ADR_TEMPLATE = `# ADR-{{number}}: {{title}}

- **Status:** Proposed
- **Date:** {{date}}
- **Deciders:** TBD

## Context

What problem are we solving? What constraints exist?

## Decision

What did we decide?

## Consequences

### Positive

-

### Negative

-

### Neutral / Follow-up

-

## Alternatives considered

-

## References

-
`

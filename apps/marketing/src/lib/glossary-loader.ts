// apps/marketing/src/lib/glossary-loader.ts
//
// Build-time glossary loader. Source of truth: internal/glossary/terms.yaml.
// Spec Section 18.1.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..')

export interface Term {
  term: string
  definition: string
  section: string
}

/** Read internal/glossary/terms.yaml and return the alphabetically sorted list. */
export async function loadTerms(): Promise<Term[]> {
  const path = resolve(REPO_ROOT, 'internal', 'glossary', 'terms.yaml')
  const raw = await readFile(path, 'utf8')
  const terms = parseYaml(raw) as Term[]
  return [...terms].sort((a, b) => a.term.localeCompare(b.term))
}

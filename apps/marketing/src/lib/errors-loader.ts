// apps/marketing/src/lib/errors-loader.ts
//
// Build-time loader for the top-20 troubleshooting catalog. Source of truth:
// internal/errors/catalog.yaml. Spec Section 15.3.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

const REPO_ROOT = resolve(import.meta.dirname, '..', '..', '..', '..')

export interface ErrorEntry {
  code: string
  founder: string
  engineer: string
  link: string
}

/** Read internal/errors/catalog.yaml and return the typed list. */
export async function loadErrors(): Promise<ErrorEntry[]> {
  const path = resolve(REPO_ROOT, 'internal', 'errors', 'catalog.yaml')
  const raw = await readFile(path, 'utf8')
  return parseYaml(raw) as ErrorEntry[]
}

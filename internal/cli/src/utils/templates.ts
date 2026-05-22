// internal/cli/src/utils/templates.ts
//
// Tiny template engine: copy a directory of {{placeholder}} files to a target
// location, applying simple `{{key}}` -> value substitutions to both filenames
// and file contents.
//
// No Handlebars, no Mustache — regex replace. Deliberate.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve, dirname } from 'pathe'

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g

export function renderString(input: string, vars: Record<string, string>): string {
  return input.replace(PLACEHOLDER, (_, name: string) => {
    if (!(name in vars)) throw new Error(`Template placeholder {{${name}}} has no value`)
    return vars[name]!
  })
}

/**
 * Copy `srcDir` to `destDir`, substituting placeholders in file names and
 * contents. Refuses to overwrite an existing non-empty directory unless
 * `force=true`.
 */
export function renderTemplate(
  srcDir: string,
  destDir: string,
  vars: Record<string, string>,
  opts: { force?: boolean } = {},
): { written: string[] } {
  const src = resolve(srcDir)
  const dest = resolve(destDir)
  if (!existsSync(src)) throw new Error(`Template directory not found: ${src}`)
  if (existsSync(dest) && !opts.force) {
    const entries = readdirSync(dest)
    if (entries.length > 0) {
      throw new Error(`Target exists and is not empty: ${dest} (use --force to overwrite)`)
    }
  }

  const written: string[] = []
  for (const entry of walk(src)) {
    const rel = entry.slice(src.length + 1)
    const renderedRel = renderString(rel, vars)
    const target = join(dest, renderedRel)
    mkdirSync(dirname(target), { recursive: true })
    if (statSync(entry).isDirectory()) {
      mkdirSync(target, { recursive: true })
      continue
    }
    // Binary-ish files (images, etc.) — copy as-is.
    if (isBinary(entry)) {
      copyFileSync(entry, target)
    } else {
      const raw = readFileSync(entry, 'utf-8')
      writeFileSync(target, renderString(raw, vars))
    }
    written.push(target)
  }
  return { written }
}

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e)
    const st = statSync(full)
    if (st.isDirectory()) yield* walk(full)
    else yield full
  }
}

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.gz', '.tgz'])
function isBinary(file: string): boolean {
  const dot = file.lastIndexOf('.')
  if (dot < 0) return false
  return BINARY_EXT.has(file.slice(dot).toLowerCase())
}

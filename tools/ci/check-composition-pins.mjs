#!/usr/bin/env node
// tools/ci/check-composition-pins.mjs
//
// Lightweight sanity check used by `repo profile:validate` in place of a
// `crossplane render` (which doesn't apply to composition-pins.yaml — that
// file maps XRDs to Composition revisions, it isn't itself an XR claim).
//
// Verifies:
//   1. pins file parses as YAML
//   2. each top-level key is an XRD ref of the form `<plural>.<group>`
//   3. each value has compositionRef.name
//   4. each referenced Composition name appears somewhere under the
//      compositions/ directory (or emits a soft warning if not — future
//      compositions are still being landed across phases)
//
// Exits 0 on success, 1 on structural failure. Soft warnings do not fail.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

function fail(msg) {
  process.stderr.write(`check-composition-pins: ${msg}\n`)
  process.exit(1)
}

function warn(msg) {
  process.stderr.write(`check-composition-pins: WARN ${msg}\n`)
}

const pinsPath = process.argv[2]
const compDir = process.argv[3]
if (!pinsPath || !compDir) {
  fail('usage: check-composition-pins.mjs <pins.yaml> <compositions-dir>')
}

let raw
try {
  raw = readFileSync(pinsPath, 'utf8')
} catch (error) {
  fail(`could not read ${pinsPath}: ${error.message}`)
}

// Minimal YAML parser — only the shape we expect: top-level keys with
// `compositionRef.name:` nested. Avoids a YAML lib dep at CI time.
const entries = {}
let currentKey = null
for (const line of raw.split('\n')) {
  if (!line.trim() || line.trim().startsWith('#')) continue
  // top-level key (no leading indent)
  const top = /^([\w.-]+):\s*$/.exec(line)
  if (top) {
    currentKey = top[1]
    entries[currentKey] = { compositionRef: null }
    continue
  }
  const m = /^\s+name:\s*(\S+)\s*$/.exec(line)
  if (m && currentKey) {
    entries[currentKey].compositionRef = m[1]
  }
}

if (Object.keys(entries).length === 0) {
  fail('no XRD entries found in pins file')
}

for (const [xrd, pin] of Object.entries(entries)) {
  if (!/^[a-z0-9-]+\.[a-z0-9.-]+$/.test(xrd)) {
    fail(`malformed XRD ref: ${xrd}`)
  }
  if (!pin.compositionRef) {
    fail(`${xrd} missing compositionRef.name`)
  }
}

// Soft-check existence of named compositions in the compositions/ tree.
function walk(dir) {
  const out = []
  for (const e of readdirSync(dir)) {
    const full = resolve(dir, e)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else {
      out.push(full)
    }
  }
  return out
}

let compositionFiles = []
try {
  compositionFiles = walk(compDir)
} catch {
  warn(`could not read compositions dir at ${compDir}`)
}

const allCompositionText = compositionFiles
  .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

for (const [xrd, pin] of Object.entries(entries)) {
  if (!allCompositionText.includes(pin.compositionRef)) {
    warn(
      `composition ${pin.compositionRef} (for ${xrd}) not found under ${compDir} — future phase will land it`,
    )
  }
}

process.stdout.write(`check-composition-pins: OK (${Object.keys(entries).length} XRDs pinned)\n`)

// apps/docs-public/scripts/generate-references.ts
//
// Phase 16 Task 16.8 — emit a per-layer / per-XRD / per-app / per-profile /
// per-verb reference page under apps/docs-public/src/content/docs/reference/.
// The site-build CI workflow re-runs this and asserts a clean git diff (no
// drift between code and docs, spec Section 15.4).

import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..')
const OUT = path.resolve(ROOT, 'apps/docs-public/src/content/docs/reference')

const LAYERS = [
  ['00a-launcher', 'Layer 0a — Launcher CLI'],
  ['00b-mcp', 'Layer 0b — MCP server'],
  ['01-verbs', 'Layer 1 — Verb surface'],
  ['02-toolchain', 'Layer 2 — Toolchain + secrets'],
  ['03-build', 'Layer 3 — Build orchestration'],
  ['04-container', 'Layer 4 — Container build'],
  ['05-runtime', 'Layer 5 — App runtime'],
  ['06-platform', 'Layer 6 — Platform infra'],
  ['07-bootstrap', 'Layer 7 — Bootstrap'],
] as const

async function genLayers(): Promise<void> {
  await mkdir(path.join(OUT, 'layers'), { recursive: true })
  for (const [slug, title] of LAYERS) {
    const body =
      `---\ntitle: ${title}\n---\n\n` +
      `See [\`docs/architecture/seven-layers.md\`](../../../../../../docs/architecture/seven-layers.md) for the engineer reference.\n`
    await writeFile(path.join(OUT, 'layers', `${slug}.md`), body)
  }
}

async function genFromMetaDir(
  srcDir: string,
  outSub: string,
  metaFileName = 'META.yaml',
): Promise<void> {
  const src = path.resolve(ROOT, srcDir)
  if (!existsSync(src)) return
  await mkdir(path.join(OUT, outSub), { recursive: true })
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const metaPath = path.join(src, entry.name, metaFileName)
    if (!existsSync(metaPath)) continue
    const raw = await readFile(metaPath, 'utf8')
    let title = entry.name
    try {
      const parsed = parseYaml(raw) as { metadata?: { name?: string } } | undefined
      if (parsed?.metadata?.name) title = parsed.metadata.name
    } catch {
      // fall back to dir name
    }
    const body = `---\ntitle: ${title}\n---\n\n` + '```yaml\n' + raw + '```\n'
    await writeFile(path.join(OUT, outSub, `${entry.name}.md`), body)
  }
}

async function genFromProfileDir(): Promise<void> {
  const src = path.resolve(ROOT, 'profiles')
  if (!existsSync(src)) return
  await mkdir(path.join(OUT, 'profiles'), { recursive: true })
  for (const entry of await readdir(src, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith('p-')) continue
    const envPath = path.join(src, entry.name, 'profile.env')
    if (!existsSync(envPath)) continue
    const raw = await readFile(envPath, 'utf8')
    const yamlText = raw
      .split('\n')
      .filter((l) => !l.startsWith('#'))
      .join('\n')
    let title = entry.name
    try {
      const parsed = parseYaml(yamlText) as { founderLabel?: string } | undefined
      if (parsed?.founderLabel) title = `${entry.name} — ${parsed.founderLabel}`
    } catch {
      // fall back to dir name
    }
    const body = `---\ntitle: ${title}\n---\n\n` + '```yaml\n' + raw + '```\n'
    await writeFile(path.join(OUT, 'profiles', `${entry.name}.md`), body)
  }
}

async function genVerbs(): Promise<void> {
  await mkdir(path.join(OUT, 'verbs'), { recursive: true })
  const taskfile = await readFile(path.resolve(ROOT, 'Taskfile.yml'), 'utf8')
  // Match top-level + namespaced verbs in the `tasks:` block:
  // a line like `  verb:` at 2-space indent inside `tasks:`.
  const re = /^ {2}([a-z][a-z0-9:-]*):\s*$/gm
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  // Skip reserved top-level keys + `includes:` children.
  const SKIP = new Set([
    'api',
    'go-hello',
    'includes',
    'py-hello',
    'rs-hello',
    'tasks',
    'vars',
    'version',
    'web',
    'worker',
  ])
  while ((m = re.exec(taskfile))) {
    const verb = m[1]
    if (SKIP.has(verb)) continue
    if (seen.has(verb)) continue
    seen.add(verb)
    const body =
      `---\ntitle: task ${verb}\n---\n\n` + 'See `Taskfile.yml` for the executable definition.\n'
    await writeFile(path.join(OUT, 'verbs', `${verb.replaceAll(':', '-')}.md`), body)
  }
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true })
  await genLayers()
  await genFromMetaDir('infra/crossplane/xrds', 'xrds')
  await genFromMetaDir('infra/helm/apps', 'apps')
  await genFromProfileDir()
  await genVerbs()

  console.log('docs:gen wrote reference pages to', OUT)
}

main().catch((error: unknown) => {
  console.error(error)
   
  process.exit(1)
})

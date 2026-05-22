// Shared helper for per-package vitest configs.
// Resolves `@pkg/*` / `@app/*` workspace deps to their `src/index.{ts,tsx}`
// so `vitest run` works without a prior `tsdown` build.
import { readdirSync, statSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(here, '..')

export function workspaceAliases() {
  const out = []
  for (const [scope, dir] of [
    ['@pkg', resolve(ROOT, 'packages')],
    ['@app', resolve(ROOT, 'apps')],
  ]) {
    if (!existsSync(dir)) continue
    for (const name of readdirSync(dir)) {
      const pkgDir = resolve(dir, name)
      try {
        if (!statSync(pkgDir).isDirectory()) continue
      } catch {
        continue
      }
      const indexTs = resolve(pkgDir, 'src/index.ts')
      const indexTsx = resolve(pkgDir, 'src/index.tsx')
      const target = existsSync(indexTs) ? indexTs : existsSync(indexTsx) ? indexTsx : null
      if (!target) continue
      out.push({ find: `${scope}/${name}`, replacement: target })
    }
  }
  return out
}

// `repo version` — print repo manifest version + key dep versions.

import { defineCommand } from 'citty'
import { readFileSync } from 'node:fs'
import { emit, fail } from '../utils/output'
import { repoPath } from '../utils/paths'

export const versionCommand = defineCommand({
  meta: { name: 'version', description: 'Print repo manifest + key dep versions.' },
  run() {
    try {
      const pkg = JSON.parse(readFileSync(repoPath('package.json'), 'utf-8'))
      emit({
        status: 'ok',
        message: `${pkg.name} ${pkg.version}`,
        data: {
          name: pkg.name,
          version: pkg.version,
          packageManager: pkg.packageManager,
          engines: pkg.engines,
        },
      })
    } catch (e) {
      fail((e as Error).message)
    }
  },
})

// `repo version` — print repo manifest version + key dep versions.

import { defineCommand } from 'citty'
import { readFileSync } from 'node:fs'

import { emit, fail } from '../utils/output'
import { repoPath } from '../utils/paths'

export const versionCommand = defineCommand({
  meta: { description: 'Print repo manifest + key dep versions.', name: 'version' },
  run() {
    try {
      const pkg = JSON.parse(readFileSync(repoPath('package.json'), 'utf-8'))
      emit({
        data: {
          engines: pkg.engines,
          name: pkg.name,
          packageManager: pkg.packageManager,
          version: pkg.version,
        },
        message: `${pkg.name} ${pkg.version}`,
        status: 'ok',
      })
    } catch (error) {
      fail((error as Error).message)
    }
  },
})

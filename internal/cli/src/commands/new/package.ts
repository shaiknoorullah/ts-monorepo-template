// `repo new package <name>` — scaffold packages/<name>/ from internal/templates/package

import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { resolve } from 'pathe'

import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'
import { renderTemplate } from '../../utils/templates'

export const newPackage = defineCommand({
  args: {
    force: { default: false, description: 'Overwrite existing directory', type: 'boolean' },
    name: { description: 'Package name (kebab-case)', required: true, type: 'positional' },
  },
  meta: {
    description: 'Scaffold a new shared library under packages/<name>/.',
    name: 'package',
  },
  run({ args }) {
    const name = String(args.name)
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      fail(`Invalid package name "${name}". Use kebab-case (lowercase, hyphens).`)
    }

    const srcDir = repoPath('internal/templates/package')
    const destDir = repoPath('packages', name)

    if (!existsSync(srcDir)) {
      fail(`Missing template directory: ${srcDir}. Add one before scaffolding.`)
    }
    if (existsSync(resolve(destDir, 'package.json')) && !args.force) {
      fail(`packages/${name} already exists. Pass --force to overwrite.`)
    }

    const result = renderTemplate(
      srcDir,
      destDir,
      { name, scope: '@pkg' },
      { force: Boolean(args.force) },
    )

    emit({
      data: {
        files: result.written.length,
        nextSteps: [
          'pnpm install',
          `add "${name}" to commitlint.config.cjs scope-enum`,
          'pnpm changeset (mark as initial release)',
        ],
        path: destDir,
      },
      message: `Scaffolded packages/${name} (${result.written.length} files).`,
      status: 'ok',
    })
  },
})

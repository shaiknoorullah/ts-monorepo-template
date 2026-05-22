// `repo new app <name>` — scaffold apps/<name>/ from internal/templates/app

import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { resolve } from 'pathe'
import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'
import { renderTemplate } from '../../utils/templates'

export const newApp = defineCommand({
  meta: {
    name: 'app',
    description: 'Scaffold a new microservice under apps/<name>/.',
  },
  args: {
    name: { type: 'positional', description: 'App name (kebab-case)', required: true },
    force: { type: 'boolean', description: 'Overwrite existing directory', default: false },
  },
  run({ args }) {
    const name = String(args.name)
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      fail(`Invalid app name "${name}". Use kebab-case (lowercase, hyphens).`)
    }

    const srcDir = repoPath('internal/templates/app')
    const destDir = repoPath('apps', name)

    if (!existsSync(srcDir)) {
      fail(`Missing template directory: ${srcDir}. Add one before scaffolding.`)
    }
    if (existsSync(resolve(destDir, 'package.json')) && !args.force) {
      fail(`apps/${name} already exists. Pass --force to overwrite.`)
    }

    const result = renderTemplate(
      srcDir,
      destDir,
      { name, scope: '@app' },
      { force: Boolean(args.force) },
    )

    emit({
      status: 'ok',
      message: `Scaffolded apps/${name} (${result.written.length} files).`,
      data: {
        path: destDir,
        files: result.written.length,
        nextSteps: [
          'pnpm install',
          `add "${name}" to commitlint.config.cjs scope-enum`,
          `add "@app/${name}" to .changeset/config.json ignore`,
        ],
      },
    })
  },
})

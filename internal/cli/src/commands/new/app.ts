// `repo new app <archetype> <name>` — scaffold apps/<name>/ from a template
// chosen by archetype. Archetypes:
//   api        Fastify microservice (the original template)
//   worker     Background worker
//   web        Expo + react-native-web multi-tenant web app
//   mobile     Expo native (iOS + Android)
//   marketing  Astro 5 marketing/landing pages
//   docs       Astro Starlight customer-facing docs

import { defineCommand } from 'citty'
import { existsSync } from 'node:fs'
import { resolve } from 'pathe'
import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'
import { renderTemplate } from '../../utils/templates'

const ARCHETYPES = ['api', 'worker', 'web', 'mobile', 'marketing', 'docs'] as const
type Archetype = (typeof ARCHETYPES)[number]

const TEMPLATE_DIR: Record<Archetype, string> = {
  api: 'internal/templates/app',
  worker: 'internal/templates/app',
  web: 'internal/templates/app-web',
  mobile: 'internal/templates/app-mobile',
  marketing: 'internal/templates/app-marketing',
  docs: 'internal/templates/app-docs',
}

function isArchetype(value: string): value is Archetype {
  return (ARCHETYPES as readonly string[]).includes(value)
}

export const newApp = defineCommand({
  meta: {
    name: 'app',
    description:
      'Scaffold a new app under apps/<name>/. First positional is the archetype (api|worker|web|mobile|marketing|docs).',
  },
  args: {
    archetype: {
      type: 'positional',
      description: 'Archetype: api | worker | web | mobile | marketing | docs',
      required: true,
    },
    name: { type: 'positional', description: 'App name (kebab-case)', required: true },
    force: { type: 'boolean', description: 'Overwrite existing directory', default: false },
  },
  run({ args }): void {
    const archetypeArg = String(args.archetype)
    if (!isArchetype(archetypeArg)) {
      fail(`Unknown archetype "${archetypeArg}". Allowed: ${ARCHETYPES.join(', ')}.`)
    }
    const archetype = archetypeArg as Archetype

    const name = String(args.name)
    if (!/^[a-z][a-z0-9-]*$/.test(name)) {
      fail(`Invalid app name "${name}". Use kebab-case (lowercase, hyphens).`)
    }

    const srcDir = repoPath(TEMPLATE_DIR[archetype])
    const destDir = repoPath('apps', name)

    if (!existsSync(srcDir)) {
      fail(
        `Missing template directory: ${srcDir}. Add a scaffold at internal/templates/app-${archetype}/ before retrying.`,
      )
    }
    if (existsSync(resolve(destDir, 'package.json')) && !args.force) {
      fail(`apps/${name} already exists. Pass --force to overwrite.`)
    }

    const result = renderTemplate(
      srcDir,
      destDir,
      { name, scope: '@app', archetype },
      { force: Boolean(args.force) },
    )

    emit({
      status: 'ok',
      message: `Scaffolded apps/${name} from archetype "${archetype}" (${result.written.length} files).`,
      data: {
        path: destDir,
        archetype,
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

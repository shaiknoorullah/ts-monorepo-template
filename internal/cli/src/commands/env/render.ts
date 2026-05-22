// `repo env render <env>` — emit a flat .env from a YAML hierarchy.
//
// REFUSES to emit if any SecretRef is still unresolved or if any ${VAR}
// reference is missing from process.env — forces the caller to wire ESO/Vault
// before any artifact lands on disk.

import { defineCommand } from 'citty'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'pathe'

import { loadEnv } from '../../utils/config-loader'
import { flattenToEnv, formatEnvFile } from '../../utils/flatten'
import { emit, fail } from '../../utils/output'
import { repoPath } from '../../utils/paths'

export const envRender = defineCommand({
  args: {
    'allow-missing-secrets': {
      default: false,
      description:
        'Render anyway even if SecretRefs are unresolved (NOT for production). Useful for dry-runs.',
      type: 'boolean',
    },
    env: { description: 'env name (e.g. dev, staging, prod)', required: true, type: 'positional' },
    out: { default: 'docker/.env.rendered', description: 'Output path', type: 'string' },
    tenant: { description: 'Tenant slug (loads config/tenants/<slug>.yaml)', type: 'string' },
  },
  meta: {
    description: 'Render config/<env>.yaml to a flat .env file for docker-compose.',
    name: 'render',
  },
  async run({ args }) {
    const envName = String(args.env)
    const outPath = resolve(repoPath('.'), String(args.out))
    const tenant = args.tenant ? String(args.tenant) : undefined

    let loaded
    try {
      loaded = await loadEnv(envName, tenant ? { tenant } : {})
    } catch (error) {
      fail((error as Error).message)
    }

    if (loaded.missingEnvVars.length > 0) {
      fail(
        `Missing required env vars referenced by config (\${VAR} substitution):\n  ${loaded.missingEnvVars.join(', ')}\nSet them in your shell or .env before rendering.`,
      )
    }

    if (loaded.unresolvedSecrets.length > 0 && !args['allow-missing-secrets']) {
      fail(
        `Refusing to render: ${loaded.unresolvedSecrets.length} unresolved SecretRef(s).\n` +
          `  ${loaded.unresolvedSecrets.join('\n  ')}\n` +
          `Wire ESO/Vault for these paths, or pass --allow-missing-secrets for a dry run.`,
      )
    }

    const pairs = flattenToEnv(loaded.config)
    const text = formatEnvFile(pairs)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, text)

    emit({
      data: {
        keys: Object.keys(pairs).length,
        path: outPath,
        source: loaded.source,
        unresolvedSecrets: loaded.unresolvedSecrets,
      },
      message: `Rendered ${envName} -> ${outPath}`,
      status: 'ok',
    })
  },
})

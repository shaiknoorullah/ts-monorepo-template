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
  meta: {
    name: 'render',
    description: 'Render config/<env>.yaml to a flat .env file for docker-compose.',
  },
  args: {
    env: { type: 'positional', description: 'env name (e.g. dev, staging, prod)', required: true },
    out: { type: 'string', description: 'Output path', default: 'docker/.env.rendered' },
    tenant: { type: 'string', description: 'Tenant slug (loads config/tenants/<slug>.yaml)' },
    'allow-missing-secrets': {
      type: 'boolean',
      description:
        'Render anyway even if SecretRefs are unresolved (NOT for production). Useful for dry-runs.',
      default: false,
    },
  },
  async run({ args }) {
    const envName = String(args.env)
    const outPath = resolve(repoPath('.'), String(args.out))
    const tenant = args.tenant ? String(args.tenant) : undefined

    let loaded
    try {
      loaded = await loadEnv(envName, tenant ? { tenant } : {})
    } catch (e) {
      fail((e as Error).message)
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
      status: 'ok',
      message: `Rendered ${envName} -> ${outPath}`,
      data: {
        path: outPath,
        keys: Object.keys(pairs).length,
        unresolvedSecrets: loaded.unresolvedSecrets,
        source: loaded.source,
      },
    })
  },
})

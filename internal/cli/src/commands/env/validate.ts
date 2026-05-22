// `repo env validate <env>` — Zod-validate the merged config.

import { defineCommand } from 'citty'
import { loadEnv } from '../../utils/config-loader'
import { emit, fail } from '../../utils/output'

export const envValidate = defineCommand({
  meta: { name: 'validate', description: 'Validate config/<env>.yaml against the Zod schema.' },
  args: {
    env: { type: 'positional', description: 'env name', required: true },
    tenant: { type: 'string', description: 'Tenant slug' },
  },
  async run({ args }) {
    const envName = String(args.env)
    const tenant = args.tenant ? String(args.tenant) : undefined

    try {
      const loaded = await loadEnv(envName, tenant ? { tenant } : {})
      emit({
        status: loaded.unresolvedSecrets.length > 0 ? 'warning' : 'ok',
        message: `${envName} validated (${loaded.unresolvedSecrets.length} unresolved secrets).`,
        data: {
          source: loaded.source,
          missingEnvVars: loaded.missingEnvVars,
          unresolvedSecrets: loaded.unresolvedSecrets,
        },
      })
    } catch (e) {
      fail((e as Error).message)
    }
  },
})

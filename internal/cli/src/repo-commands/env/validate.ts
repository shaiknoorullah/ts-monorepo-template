// `repo env validate <env>` — Zod-validate the merged config.

import { defineCommand } from 'citty'

import { loadEnv } from '../../utils/config-loader'
import { emit, fail } from '../../utils/output'

export const envValidate = defineCommand({
  args: {
    env: { description: 'env name', required: true, type: 'positional' },
    tenant: { description: 'Tenant slug', type: 'string' },
  },
  meta: { description: 'Validate config/<env>.yaml against the Zod schema.', name: 'validate' },
  async run({ args }) {
    const envName = String(args.env)
    const tenant = args.tenant ? String(args.tenant) : undefined

    try {
      const loaded = await loadEnv(envName, tenant ? { tenant } : {})
      emit({
        data: {
          missingEnvVars: loaded.missingEnvVars,
          source: loaded.source,
          unresolvedSecrets: loaded.unresolvedSecrets,
        },
        message: `${envName} validated (${loaded.unresolvedSecrets.length} unresolved secrets).`,
        status: loaded.unresolvedSecrets.length > 0 ? 'warning' : 'ok',
      })
    } catch (error) {
      fail((error as Error).message)
    }
  },
})

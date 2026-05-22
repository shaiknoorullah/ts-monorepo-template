// `repo env show <env>` — pretty-print merged config with SecretRefs redacted.

import { defineCommand } from 'citty'
import { stringify as yamlStringify } from 'yaml'
import { loadEnv, redactSecrets } from '../../utils/config-loader'
import { emit, fail, isJsonMode, logRaw } from '../../utils/output'

export const envShow = defineCommand({
  meta: { name: 'show', description: 'Print the merged config for an env (secrets redacted).' },
  args: {
    env: { type: 'positional', description: 'env name', required: true },
    tenant: { type: 'string', description: 'Tenant slug' },
    format: { type: 'string', description: 'yaml | json', default: 'yaml' },
  },
  async run({ args }) {
    const envName = String(args.env)
    const tenant = args.tenant ? String(args.tenant) : undefined

    try {
      const loaded = await loadEnv(envName, tenant ? { tenant } : {})
      const redacted = redactSecrets(loaded.config)
      if (isJsonMode()) {
        emit({ status: 'ok', message: `Loaded ${envName}`, data: redacted })
        return
      }
      const out =
        args.format === 'json' ? JSON.stringify(redacted, null, 2) : yamlStringify(redacted)
      logRaw(out)
    } catch (e) {
      fail((e as Error).message)
    }
  },
})

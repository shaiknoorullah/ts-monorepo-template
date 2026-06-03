// `repo env show <env>` — pretty-print merged config with SecretRefs redacted.

import { defineCommand } from 'citty'
import { stringify as yamlStringify } from 'yaml'

import { loadEnv, redactSecrets } from '../../utils/config-loader'
import { emit, fail, isJsonMode, logRaw } from '../../utils/output'

export const envShow = defineCommand({
  args: {
    env: { description: 'env name', required: true, type: 'positional' },
    format: { default: 'yaml', description: 'yaml | json', type: 'string' },
    tenant: { description: 'Tenant slug', type: 'string' },
  },
  meta: { description: 'Print the merged config for an env (secrets redacted).', name: 'show' },
  async run({ args }) {
    const envName = String(args.env)
    const tenant = args.tenant ? String(args.tenant) : undefined

    try {
      const loaded = await loadEnv(envName, tenant ? { tenant } : {})
      const redacted = redactSecrets(loaded.config)
      if (isJsonMode()) {
        emit({ data: redacted, message: `Loaded ${envName}`, status: 'ok' })
        return
      }
      const out =
        args.format === 'json' ? JSON.stringify(redacted, null, 2) : yamlStringify(redacted)
      logRaw(out)
    } catch (error) {
      fail((error as Error).message)
    }
  },
})

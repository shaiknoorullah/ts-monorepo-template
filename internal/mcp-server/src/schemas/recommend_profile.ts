import { PROFILE_ID, SHA256_HEX } from './_common.js'

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['answers'],
  properties: {
    answers: {
      type: 'object',
      required: ['team_size', 'env_count', 'target_budget_usd', 'compliance_floor'],
      properties: {
        team_size: { enum: ['1', '2-5', '6-20', '20+'] },
        env_count: { type: 'integer', minimum: 1, maximum: 10 },
        target_budget_usd: { type: 'integer', minimum: 0 },
        compliance_floor: { enum: ['none', 'soc2', 'hipaa', 'fedramp'] },
        workload_shape: { enum: ['stateless-web', 'batch', 'streaming', 'mixed'] },
        ha_level: { enum: ['best-effort', 'single-az', 'multi-az', 'multi-region'] },
        observability_depth: {
          enum: ['logs', 'logs+metrics', 'logs+metrics+traces', '+ebpf'],
        },
        secret_backend: { enum: ['keyring', 'cloud-kms', 'vault', 'auto'] },
        registry: { enum: ['ghcr', 'cloud-native', 'harbor', 'auto'] },
        cdn_edge: { enum: ['none', 'cloudflare', 'cloud-native'] },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['ranked', 'recommended', 'rubric_version', 'rubric_sha256'],
  properties: {
    ranked: {
      type: 'array',
      items: {
        type: 'object',
        required: ['profile', 'score', 'reasons'],
        properties: {
          profile: PROFILE_ID,
          score: { type: 'number', minimum: 0, maximum: 1 },
          reasons: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    recommended: PROFILE_ID,
    rubric_version: { type: 'string' },
    rubric_sha256: SHA256_HEX,
  },
  additionalProperties: false,
} as const

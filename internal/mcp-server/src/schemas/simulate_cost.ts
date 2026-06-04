import { PROFILE_ID } from './_common.js'

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['profile'],
  properties: {
    profile: PROFILE_ID,
    overrides: {
      type: 'object',
      properties: {
        compute_nodes: { type: 'integer', minimum: 0 },
        storage_gb: { type: 'integer', minimum: 0 },
        egress_tb: { type: 'number', minimum: 0 },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: [
    'profile',
    'monthly_total_usd',
    'by_layer',
    'by_provider',
    'assumptions',
    'prices_as_of',
  ],
  properties: {
    profile: PROFILE_ID,
    monthly_total_usd: { type: 'number', minimum: 0 },
    by_layer: {
      type: 'object',
      required: ['compute', 'storage', 'egress', 'registry', 'secrets', 'observability_saas'],
      properties: {
        compute: { type: 'number', minimum: 0 },
        storage: { type: 'number', minimum: 0 },
        egress: { type: 'number', minimum: 0 },
        registry: { type: 'number', minimum: 0 },
        secrets: { type: 'number', minimum: 0 },
        observability_saas: { type: 'number', minimum: 0 },
      },
    },
    by_provider: {
      type: 'object',
      additionalProperties: { type: 'number', minimum: 0 },
    },
    assumptions: { type: 'array', items: { type: 'string' } },
    prices_as_of: { type: 'string', format: 'date' },
  },
  additionalProperties: false,
} as const

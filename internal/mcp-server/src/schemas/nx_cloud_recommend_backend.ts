import { PROFILE_ID } from './_common.js'

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['profile', 'monthly_ci_minutes', 'compliance_flags'],
  properties: {
    profile: PROFILE_ID,
    monthly_ci_minutes: { type: 'integer', minimum: 0 },
    compliance_flags: {
      type: 'array',
      items: { enum: ['soc2', 'hipaa', 'fedramp', 'gdpr', 'data-residency'] },
    },
  },
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['ranked', 'recommended'],
  properties: {
    ranked: {
      type: 'array',
      items: {
        type: 'object',
        required: ['backend', 'score', 'reasons'],
        properties: {
          backend: { enum: ['saas', 'powerpack-self-host', 'community'] },
          score: { type: 'number', minimum: 0, maximum: 1 },
          reasons: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    recommended: { enum: ['saas', 'powerpack-self-host', 'community'] },
  },
  additionalProperties: false,
} as const

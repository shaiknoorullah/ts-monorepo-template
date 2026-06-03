import { PROFILE_ID } from './_common.js'

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['from', 'to'],
  properties: {
    from: PROFILE_ID,
    to: PROFILE_ID,
  },
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['from', 'to', 'cost_delta_usd', 'changes'],
  properties: {
    from: PROFILE_ID,
    to: PROFILE_ID,
    cost_delta_usd: { type: 'number' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['layer', 'before', 'after'],
        properties: {
          layer: {
            enum: [
              'nx',
              'helm',
              'crossplane',
              'terraform',
              'ansible',
              'secretspec',
              'registry',
              'observability',
            ],
          },
          before: { type: 'string' },
          after: { type: 'string' },
        },
      },
    },
  },
  additionalProperties: false,
} as const

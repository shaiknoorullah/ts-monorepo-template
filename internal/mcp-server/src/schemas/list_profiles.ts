import { PROFILE_ID } from './_common.js'

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['profiles'],
  properties: {
    profiles: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'cost_band_usd', 'tagline'],
        properties: {
          id: PROFILE_ID,
          name: { type: 'string' },
          cost_band_usd: {
            type: 'object',
            required: ['min', 'max'],
            properties: {
              min: { type: 'integer', minimum: 0 },
              max: { type: 'integer', minimum: 0 },
            },
          },
          tagline: { type: 'string' },
        },
      },
    },
  },
  additionalProperties: false,
} as const

import { PROFILE_ID } from './_common.js'

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['id'],
  properties: { id: PROFILE_ID },
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['id', 'name', 'tagline', 'cost_band_usd', 'dimensions', 'layer_defaults'],
  properties: {
    id: PROFILE_ID,
    name: { type: 'string' },
    tagline: { type: 'string' },
    cost_band_usd: {
      type: 'object',
      required: ['min', 'max'],
      properties: {
        min: { type: 'integer', minimum: 0 },
        max: { type: 'integer', minimum: 0 },
      },
    },
    dimensions: { type: 'object', additionalProperties: true },
    layer_defaults: {
      type: 'object',
      required: ['nx', 'helm', 'crossplane', 'terraform', 'ansible', 'secretspec'],
      properties: {
        nx: { type: 'object', additionalProperties: true },
        helm: { type: 'object', additionalProperties: true },
        crossplane: { type: 'object', additionalProperties: true },
        terraform: { type: 'object', additionalProperties: true },
        ansible: { type: 'object', additionalProperties: true },
        secretspec: { type: 'object', additionalProperties: true },
      },
    },
  },
  additionalProperties: false,
} as const

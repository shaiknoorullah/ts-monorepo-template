export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['patch'],
  properties: {
    patch: { type: 'string', minLength: 1 },
    layers: {
      type: 'array',
      items: {
        enum: ['nx', 'helm', 'crossplane', 'terraform', 'ansible', 'secretspec', 'docker'],
      },
    },
  },
  additionalProperties: false,
} as const

export { STUB_OUTPUT_SCHEMA as outputSchema } from './_common.js'

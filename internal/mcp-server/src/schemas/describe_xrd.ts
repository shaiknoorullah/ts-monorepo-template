export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['name'],
  properties: { name: { type: 'string', minLength: 1 } },
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['name', 'group', 'kind', 'openAPIV3Schema', 'example_claim'],
  properties: {
    name: { type: 'string' },
    group: { type: 'string' },
    kind: { type: 'string' },
    openAPIV3Schema: { type: 'object', additionalProperties: true },
    example_claim: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
} as const

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['xrds'],
  properties: {
    xrds: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'group', 'kind', 'versions'],
        properties: {
          name: { type: 'string' },
          group: { type: 'string' },
          kind: { type: 'string' },
          versions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  additionalProperties: false,
} as const

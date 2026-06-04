export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['apps'],
  properties: {
    apps: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'language', 'path'],
        properties: {
          name: { type: 'string' },
          language: { enum: ['go', 'python', 'rust', 'typescript'] },
          path: { type: 'string' },
        },
      },
    },
  },
  additionalProperties: false,
} as const

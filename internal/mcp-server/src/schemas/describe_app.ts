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
  required: ['name', 'language', 'path', 'chart', 'envs', 'capabilities'],
  properties: {
    name: { type: 'string' },
    language: { enum: ['go', 'python', 'rust', 'typescript'] },
    path: { type: 'string' },
    chart: { type: 'string' },
    envs: { type: 'array', items: { type: 'string' } },
    capabilities: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
} as const

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['name', 'language'],
  properties: {
    name: { type: 'string', pattern: '^[a-z][a-z0-9-]{1,30}[a-z0-9]$' },
    language: { enum: ['go', 'python', 'rust', 'typescript'] },
    profile: { enum: ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise'] },
  },
  additionalProperties: false,
} as const

export { STUB_OUTPUT_SCHEMA as outputSchema } from './_common.js'

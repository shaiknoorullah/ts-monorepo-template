export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    window: { enum: ['1d', '7d', '30d'] },
  },
  additionalProperties: false,
} as const

export { STUB_OUTPUT_SCHEMA as outputSchema } from './_common.js'

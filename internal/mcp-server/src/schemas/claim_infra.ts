export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['xrd', 'app', 'env'],
  properties: {
    xrd: { type: 'string', minLength: 1 },
    app: { type: 'string', minLength: 1 },
    env: { enum: ['dev', 'staging', 'prod'] },
    spec: { type: 'object', additionalProperties: true },
  },
  additionalProperties: false,
} as const

export { STUB_OUTPUT_SCHEMA as outputSchema } from './_common.js'



export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  properties: {
    limit: { type: 'integer', minimum: 1, maximum: 100 },
  },
  additionalProperties: false,
} as const



export {STUB_OUTPUT_SCHEMA as outputSchema} from './_common.js'
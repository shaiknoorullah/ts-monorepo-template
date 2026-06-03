

export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['title', 'rationale', 'patch'],
  properties: {
    title: { type: 'string', minLength: 1 },
    rationale: { type: 'string', minLength: 1 },
    patch: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const



export {STUB_OUTPUT_SCHEMA as outputSchema} from './_common.js'
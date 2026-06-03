export const PROFILE_ID = {
  enum: ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise'],
} as const

export const SHA256_HEX = {
  type: 'string',
  pattern: '^[0-9a-f]{64}$',
} as const

export const STUB_OUTPUT_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['status', 'tracking_issue', 'expected_milestone', 'schema_stable'],
  properties: {
    status: { const: 'not_yet_implemented' },
    tracking_issue: { type: 'string', format: 'uri' },
    expected_milestone: { type: 'string' },
    schema_stable: { const: true },
  },
  additionalProperties: false,
} as const

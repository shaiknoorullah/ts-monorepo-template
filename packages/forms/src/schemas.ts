// packages/forms/src/schemas.ts
//
// Common Zod schemas used across forms.

import { z } from 'zod'

export const commonSchemas = {
  email: z.string().email(),
  phoneE164: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Use E.164 (+...)'),
  url: z.string().url(),
  nonEmpty: z.string().min(1),
} as const

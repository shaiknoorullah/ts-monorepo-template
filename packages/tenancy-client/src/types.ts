// packages/tenancy-client/src/types.ts

import { z } from 'zod'

export const TenantSlugSchema = z
  .string()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9-]+$/, 'lowercase alphanumeric + hyphen only')

export interface Tenant {
  slug: string
}

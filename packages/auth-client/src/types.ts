// packages/auth-client/src/types.ts

import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  roles: z.array(z.string()).default([]),
})
export type User = z.infer<typeof UserSchema>

export interface Session {
  user: User
  token: string
  expiresAt: string
}

export interface AuthConfig {
  provider: 'ory' | 'keycloak'
  baseUrl: string
  /** Used by Keycloak only */
  realm?: string
  /** Used by Keycloak only */
  clientId?: string
}

export interface AuthClient {
  getSession: () => Promise<Session | null>
  signIn: (input: { email: string; password: string }) => Promise<Session>
  signOut: () => Promise<void>
}

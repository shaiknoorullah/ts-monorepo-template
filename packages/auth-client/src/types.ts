// packages/auth-client/src/types.ts

import { z } from 'zod'

export const UserSchema = z.object({
  email: z.string().email(),
  id: z.string(),
  name: z.string().optional(),
  roles: z.array(z.string()).default([]),
})
export interface AuthClient {
  getSession: () => Promise<null | Session>
  signIn: (input: { email: string; password: string }) => Promise<Session>
  signOut: () => Promise<void>
}

export interface AuthConfig {
  baseUrl: string
  /** Used by Keycloak only */
  clientId?: string
  provider: 'keycloak' | 'ory'
  /** Used by Keycloak only */
  realm?: string
}

export interface Session {
  expiresAt: string
  token: string
  user: User
}

export type User = z.infer<typeof UserSchema>

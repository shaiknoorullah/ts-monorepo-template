// packages/auth-client/src/client.ts
//
// Minimal Ory Kratos REST client. Keycloak provider in a sibling file.

import { UserSchema, type AuthClient, type AuthConfig, type Session } from './types'

export function createAuthClient(cfg: AuthConfig): AuthClient {
  const base = cfg.baseUrl.replace(/\/$/, '')

  async function getSession(): Promise<Session | null> {
    const res = await fetch(`${base}/sessions/whoami`, { credentials: 'include' })
    if (res.status === 401) return null
    if (!res.ok) throw new Error(`whoami failed: ${res.status}`)
    const data = (await res.json()) as { identity?: { id: string; traits: unknown }; expires_at?: string }
    if (!data.identity) return null
    const traits = data.identity.traits as Record<string, unknown>
    const user = UserSchema.parse({
      id: data.identity.id,
      email: String(traits.email ?? ''),
      name: typeof traits.name === 'string' ? traits.name : undefined,
      roles: Array.isArray(traits.roles) ? (traits.roles as string[]) : [],
    })
    return {
      user,
      token: '',
      expiresAt: data.expires_at ?? new Date(Date.now() + 3600_000).toISOString(),
    }
  }

  async function signIn(input: { email: string; password: string }): Promise<Session> {
    // Ory Kratos uses flow tokens; this is a simplified path. Real flows
    // initiate a login-flow first, then submit.
    const res = await fetch(`${base}/self-service/login?flow=api`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ method: 'password', password: input.password, identifier: input.email }),
    })
    if (!res.ok) throw new Error(`sign-in failed: ${res.status}`)
    const session = await getSession()
    if (!session) throw new Error('sign-in succeeded but no session present')
    return session
  }

  async function signOut(): Promise<void> {
    await fetch(`${base}/self-service/logout/browser`, { credentials: 'include' })
  }

  return { getSession, signIn, signOut }
}

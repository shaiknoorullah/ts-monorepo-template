// packages/auth-client/src/index.ts
//
// Backend-agnostic auth client. Defaults to Ory Kratos. Public API is
// stable regardless of provider; provider-specific implementations live in
// ./providers/.

export { createAuthClient } from './client'
export type { AuthClient, AuthConfig, Session, User } from './types'

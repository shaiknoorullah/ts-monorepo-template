# AGENTS.md — packages/auth-client

1. **Same public surface across providers.** Switching Ory↔Keycloak must not change app code.
2. **No tokens in component state.** Use cookies (web) or Secure Store (RN).
3. **No PII in logs.** Email, name etc. are PII.

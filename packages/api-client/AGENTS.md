# AGENTS.md — packages/api-client

1. **Types come from OpenAPI**, generated via `openapi-typescript`. No hand-coded request/response types.
2. **`x-tenant` header is mandatory** when a tenant slug is present.
3. **`ApiError` is the only error type thrown.** Don't `throw new Error(...)`.
4. **No business logic** — this is transport only.

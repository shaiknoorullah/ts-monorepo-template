# AGENTS.md — packages/tenancy-client

1. **Slug validation is canonical** — `^[a-z0-9-]+$`, 2-63 chars. Don't add exceptions.
2. **Reserved subdomains** (`app`, `www`, `api`, `docs`, `admin`, `auth`) must never resolve to a tenant.
3. **Resolver is pure.** No fetches, no I/O.

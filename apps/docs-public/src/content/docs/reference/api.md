---
title: API reference
description: REST + WebSocket APIs.
---

The API is documented as OpenAPI 3.1 at [`/openapi.json`](https://api.example.com/openapi.json).

Render via [Scalar](https://scalar.com/) — embed below or visit <https://api.example.com/docs>.

## Authentication

```http
Authorization: Bearer <session-jwt>
x-tenant: <tenant-slug>
```

Session JWTs are issued by Ory / Keycloak (depending on deploy). See [Authentication](../auth/).

## Rate limits

- Anonymous: 60 req/min.
- Authenticated: 600 req/min.
- Burst: 2× sustained for 10 seconds.

Limits enforced at the Cloudflare edge.

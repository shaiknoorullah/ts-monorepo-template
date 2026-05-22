# @pkg/tenancy-client

Resolve the active tenant from hostname (web) or app state (mobile).

```ts
import { resolveTenantFromHostname } from '@pkg/tenancy-client'

const slug = resolveTenantFromHostname(window.location.hostname, '.app.example.com')
```

See `docs/specs/edge-obs/multi-tenancy-schema-based.md` for the broader multi-tenancy model.

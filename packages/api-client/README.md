# @pkg/api-client

Typed fetch wrapper. Auth + tenancy headers are injected automatically.

```ts
import { createApiClient } from '@pkg/api-client'

const api = createApiClient({
  baseUrl: 'https://api.example.com',
  getAuthToken: () => session?.token ?? null,
  getTenantSlug: () => tenant?.slug ?? null,
})

const user = await api.get<User>('/me')
```

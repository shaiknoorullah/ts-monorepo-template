# @pkg/auth-client

Auth client. Ory Kratos by default; Keycloak provider also supported.

```ts
import { createAuthClient } from '@pkg/auth-client'

const auth = createAuthClient({ provider: 'ory', baseUrl: 'https://auth.example.com' })
const session = await auth.getSession()
```

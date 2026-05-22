# @pkg/cms-client

CMS helpers. Payload CMS by default; Decap CMS as an alternative.

```ts
import { createPayloadClient } from '@pkg/cms-client'
import { z } from 'zod'

const cms = createPayloadClient({ baseUrl: 'https://cms.example.com' })
const PostSchema = z.object({ id: z.string(), title: z.string() })
const posts = await cms.getCollection('posts', PostSchema)
```

See `docs/specs/frontend/marketing-and-landing-pages.md` for the broader CMS strategy.

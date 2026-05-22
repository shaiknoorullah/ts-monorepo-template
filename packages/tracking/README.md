# @pkg/tracking

Unified, consent-gated tracking. Routes to Umami + Cloudflare Web Analytics.

```ts
import { track, identify, page } from '@pkg/tracking'

track('cta_click', { campaign: 'spring-2026' })
identify(userId, { plan: 'pro' })
page('/pricing')
```

No event fires without the relevant consent category granted via `@pkg/consent`.

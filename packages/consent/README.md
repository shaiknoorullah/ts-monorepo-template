# @pkg/consent

Cookie / tracking consent. Wraps vanilla-cookieconsent v3 with a typed API + Zustand store.

```ts
import { mountConsentBanner, hasConsent, useConsent } from '@pkg/consent'

mountConsentBanner({
  categories: ['necessary', 'functional', 'analytics', 'marketing'],
  defaultGranted: ['necessary'],
})

if (hasConsent('analytics')) {
  // safe to fire analytics
}
```

`@pkg/tracking` reads the consent state and refuses to fire events when the relevant category is not granted.

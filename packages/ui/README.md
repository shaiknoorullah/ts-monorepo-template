# @pkg/ui

Cross-platform UI primitives. Tamagui-based.

Consumers: `apps/web-app`, `apps/mobile-customer`, `apps/mobile-admin`, `apps/marketing` (for React islands), `apps/docs-public` (for React islands).

## Public surface

```ts
import { tokens, lightTheme, darkTheme, useColorScheme, useToast } from '@pkg/ui'
import { Search, ChevronRight } from '@pkg/ui/icons'
import { Toaster } from '@pkg/ui/web'  // web only
```

See `docs/specs/frontend/ui-package-shared-components.md`.

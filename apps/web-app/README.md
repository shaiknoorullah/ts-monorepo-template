# @app/web-app

Multi-tenant SaaS — Expo + expo-router + react-native-web.

## Targets

- Web: Cloudflare Pages (primary)
- iOS: EAS Build → App Store
- Android: EAS Build → Play Store

## Local dev

```bash
pnpm --filter @app/web-app web        # web on http://localhost:8081
pnpm --filter @app/web-app ios        # iOS simulator
pnpm --filter @app/web-app android    # Android emulator
```

## Web build + deploy

```bash
pnpm --filter @app/web-app build:web
pnpm --filter @app/web-app exec wrangler pages deploy dist
```

## Native builds

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --latest
eas submit --platform android --latest
```

## Stack

- Expo SDK 53 + expo-router 4 (typed routes)
- `@pkg/ui`, `@pkg/forms`, `@pkg/auth-client`, `@pkg/tenancy-client`, `@pkg/api-client`, `@pkg/tracking`
- Multi-tenant via subdomain → `packages/tenancy-client`

See `docs/specs/frontend/mobile-and-cross-platform.md`.

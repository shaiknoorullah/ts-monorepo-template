# @app/mobile-customer

Customer-facing mobile app. Expo + expo-router. iOS + Android.

```bash
pnpm --filter @app/mobile-customer ios
pnpm --filter @app/mobile-customer android
eas build --platform all --profile production
eas submit --platform all --latest
```

See `docs/specs/frontend/mobile-and-cross-platform.md`.

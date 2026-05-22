# AGENTS.md — apps/mobile-customer

1. **Native-only.** No web target; do not add react-native-web.
2. **All shared logic comes from `packages/*`.** Domain helpers live in this app under `src/` only when they are app-specific.
3. **No Platform.OS checks** — this is a single-platform-class (mobile) app; if you find yourself branching, move logic up to a package.

# AGENTS.md — packages/ui

1. **No business logic.** This package is design primitives. Domain components live in apps.
2. **No web-only globals** in `src/` (only `src/web/`). RN consumers will break.
3. **Tokens are the source of truth.** Don't hard-code colors/spacing in primitives.
4. **Accessibility is non-negotiable** — every interactive primitive carries `accessibilityRole` + `accessibilityLabel`.
5. **No `Platform.OS` in primitives.** Use `.web.ts` / `.native.ts` file variants.
6. **Tests for every primitive** under `src/__tests__/`.

Reading list:
- `docs/specs/frontend/ui-package-shared-components.md`

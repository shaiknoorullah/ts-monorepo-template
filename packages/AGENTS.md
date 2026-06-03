# AGENTS.md — packages/

Cascade rule: nearest `AGENTS.md` wins; child overrides parent.

## What lives here

Shared TypeScript libraries published to npm. Apps depend on these; these never depend on apps.

## Conventions

- Each package owns its `package.json`, `tsconfig.json`, `vitest.config.ts`.
- Public API in `src/index.ts`. Internal helpers under `src/_internal/`.
- Manypkg enforces the one-way dependency direction (spec section 2 reuse rule).
- New shared types go to `packages/types` first; do not duplicate.

# AGENTS.md — `@internal/test-utils`

## What this package is

Test helpers used across the workspace. **Never published** — `"private": true` is enforced by manypkg.

## Invariants

1. `"private": true` — do not remove. Manypkg fails the build if you do.
2. No side effects at import time.
3. Helpers are ergonomic, not full frameworks. If a helper grows >50 LOC, consider promoting it to its own internal package.

## Common tasks

### Add a helper

1. Export from `src/index.ts`.
2. Document with JSDoc — these helpers don't ship API docs but contributors still grep them.
3. Add a usage example in the doc comment.

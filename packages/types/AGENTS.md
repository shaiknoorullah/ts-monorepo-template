# AGENTS.md — `@pkg/types`

## What this package is

Shared TypeScript types. **Zero runtime dependencies**, zero workspace dependencies. It is the leaf of the dependency graph.

## Invariants — do not break

1. **Never import** from another `@pkg/*`, `@app/*`, or `@internal/*`. Period.
2. **No side effects.** `"sideEffects": false` in `package.json` must remain true.
3. **Tree-shakeable.** Every export is named; no default exports.
4. **Pure types where possible.** A tiny number of helpers (`ok`, `err`, `toError`, `toIsoDateTime`) are allowed because they're stateless.
5. **Type coverage target: 100%.** Any `any` in this package is a bug.

## Commands

```bash
pnpm -F @pkg/types build      # tsdown → dist/
pnpm -F @pkg/types test       # vitest
pnpm -F @pkg/types type-check
pnpm -F @pkg/types attw       # @arethetypeswrong/cli on the built package
pnpm -F @pkg/types publint
```

## Common tasks

### Adding a new branded primitive

1. Add `export type FooId = Brand<string, 'FooId'>` to `src/index.ts`.
2. Add a converter if the input shape differs from the brand type.
3. Add tests for round-tripping.
4. Run `pnpm changeset` — this is a minor bump.

### Adding a new shared DTO

1. Declare the interface in `src/index.ts`.
2. The interface must be `readonly` everywhere — these cross service boundaries.
3. Mention the producer/consumer services in the JSDoc.

## Out of scope — escalate

- Adding any runtime dependency.
- Adding validation logic (use `@pkg/config` / zod).
- Anything that would require importing from another workspace package.

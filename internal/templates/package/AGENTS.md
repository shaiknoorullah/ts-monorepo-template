# {{scope}}/{{name}}

> Per-package agent guide. This file overrides parent AGENTS.md for files inside this package.

## Purpose

TODO: describe this package's responsibility in one sentence.

## Public surface

Everything exported from `src/index.ts`. Do not export internal helpers.

## Testing

- Co-locate tests under `src/__tests__/<name>.test.ts`.
- Coverage ≥ 80% lines/functions/statements, ≥ 70% branches.

## Conventions

- Inherits the root `AGENTS.md`. Anything you change here must not contradict the root.

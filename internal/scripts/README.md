# @internal/scripts

Workspace-private scripts. Anything that doesn't belong in a published package and isn't a one-off CI step ends up here.

Conventions:

- One file per script — `kebab-case.ts`.
- Top-of-file JSDoc comment with `Usage:`.
- Invoke via `pnpm tsx internal/scripts/<name>.ts`.

# {{scope}}/{{name}}

> Per-app agent guide. Overrides parent AGENTS.md for files inside this app.

## Purpose

TODO: one sentence describing this service's responsibility.

## Boundaries

- Deployable (containerized). NEVER published to npm.
- May depend on `packages/*`. May NOT depend on other `apps/*`.
- Owns its own database schema (no cross-service writes — use APIs/events).

## Conventions

- Inherits root `AGENTS.md`.
- Config is loaded via `@pkg/config` (from `config/<env>.yaml`).

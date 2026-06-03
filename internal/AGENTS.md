# AGENTS.md — internal/

Cascade rule: nearest `AGENTS.md` wins; child overrides parent.

## What lives here

Workspace-private packages. Always `"private": true`. Never published.

- `internal/schemas/` — JSON Schemas (meta-v1, error-catalog). Source of truth for agent metadata validation.
- `internal/cli/` — launcher (Layer 0a) and audit-verify Go helper (spec section 15.10).
- `internal/templates/` — Dockerfile + Helm app-chart templates.
- `internal/test-utils/` — vitest helpers shared across the repo.
- `internal/eslint-config/`, `internal/tsconfig/` — shared lint + tsc configs.

## Editing rules

- Schema changes are breaking by default. Bump `$id` major (`meta-v2.schema.json`) instead of mutating `meta-v1`.
- New error codes must appear in `internal/errors/catalog.yaml` before any launcher code references them.

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

- JSON Schemas live under `internal/schemas/`. The discriminator on `META.yaml` is `kind`; valid values enumerated in `internal/schemas/meta-v1.schema.json`.
- Adding a new `kind` requires updating the schema, the validator (`task meta:validate`), and the MCP `meta.validate` tool fixtures.
- Schema changes are breaking by default. Bump `$id` major (`meta-v2.schema.json`) instead of mutating `meta-v1`.
- Plain-English errors live in `internal/errors/catalog.yaml`. Every entry has `code`, `founder`, `engineer`, `link`. The launcher renderer and MCP `errors.lookup` both read this file — do not duplicate.
- Glossary terms live in `internal/glossary/terms.yaml`. Each term cross-references the spec section where it is load-bearing.
- New error codes must appear in `internal/errors/catalog.yaml` before any launcher code references them.
- The CLI scaffold lives in `internal/cli/`; the MCP server in `internal/mcp-server/`; the recommender in `internal/recommender/`; the cost simulator in `internal/cost-simulator/`. None are shipped as runtime apps — they are tooling.

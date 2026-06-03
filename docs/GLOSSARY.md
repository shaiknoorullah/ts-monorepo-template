# Glossary

> Source of truth: [`internal/glossary/terms.yaml`](../internal/glossary/terms.yaml). This file is a human-
> readable mirror; the marketing `/glossary` route and the MCP
> `glossary.lookup` tool both read the YAML directly.

Alphabetical. Each entry references the spec section where the term is
load-bearing.

See `internal/glossary/terms.yaml` for the canonical list. To add a term:

1. Append an entry to `internal/glossary/terms.yaml`.
2. Run `task docs:gen` to refresh the public docs site.
3. The marketing `/glossary` route picks up the new term automatically.

For the engineer-facing reference table (preserved for backwards compatibility),
see [`docs/glossary.md`](./glossary.md).

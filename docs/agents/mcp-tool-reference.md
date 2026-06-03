# MCP tool reference

Authoritative sources: spec [Section 1.8](../superpowers/specs/2026-06-03-platform-foundation-design.md) and Section 11.8. Schemas under
`internal/mcp-server/tools/*.schema.json`. Every tool below is exposed by
both the npm package `@ts-monorepo-template/mcp-server` and the in-repo
`internal/mcp-server/`.

## Profile tools

- `list_profiles` — enumerate the 5 named profiles with tradeoff summary.
- `describe_profile` — full per-profile tradeoff structure (12 axes).
- `recommend_profile` — 10 questions in, ranked profile + reasoning out.
  Records `rubric_sha256` in the response so a future audit can replay it.

## App tools

- `list_apps` — inventory current monorepo apps with capability descriptors.
- `describe_app` — `META.yaml` + lib-chart values + claims for one app.
- `add_app` — scaffold a new polyglot app under a profile's constraints.

## Infra tools

- `list_xrds` — enumerate Crossplane platform XRDs.
- `describe_xrd` — schema, capabilities, cost band, composition options.
- `claim_infra` — scaffold an XR claim (e.g. `XPostgresCluster` for `app-foo`)
  under the right env.

## Decision tools

- `simulate_cost` — current state + projected traffic → estimated $/mo per
  layer.
- `explain_tradeoff` — diff (files + resources + cost) of switching from
  one profile to another.
- `validate_plan` — dry-run-validates any proposed change across the seven
  layers (helm template + crossplane render + tf plan + ansible syntax-check).
- `propose_change` — produces a structured patch + ADR draft + audit log
  entry. Does not write the working tree.

## Day-1 implementation status (spec Section 1.10)

Implemented Day-1: `list_profiles`, `describe_profile`, `recommend_profile`,
`list_apps`, `simulate_cost`, `explain_tradeoff`. The remaining tools ship
as scaffolded stubs with stable schemas; bodies land in follow-up PRs.

## How to call these from an MCP client

```bash
# Start the server (uses stdio JSON-RPC by default):
task mcp:serve

# Or wire it into an MCP-capable client (Claude / Cursor / Aegis) by
# pointing the client at the dist'd entrypoint:
# internal/mcp-server/dist/index.mjs
```

Every tool returns `{ status, data, errors? }`. Errors reference the
`internal/errors/catalog.yaml` codes documented at
[`docs/agents/aegis.md`](./aegis.md).

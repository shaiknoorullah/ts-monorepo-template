# Aegis — reference MCP consumer

Aegis is the reference consumer of the platform MCP server (spec [Section 11](../superpowers/specs/2026-06-03-platform-foundation-design.md) and Section 1.8). Any Claude / Codex / Cursor agent that speaks the
Model Context Protocol can drive the same tool surface — Aegis is the
in-house agent we use to validate the contract in CI (spec Section 14.7).
This page documents what Aegis is allowed to do and how it discovers
capabilities.

## Discovery

Aegis discovers tools the standard way: MCP `tools/list` over stdio JSON-RPC. It does not hardcode the tool catalog; the launcher publishes schemas at `internal/mcp-server/src/schemas/` and re-exports them from `@ts-monorepo-template/mcp-server/schemas`.

## Planning tools (read-only)

- `list_profiles`, `describe_profile`, `recommend_profile` — pick a profile from caller-supplied constraints.
- `list_apps`, `describe_app` — current apps in the repo with capability descriptors.
- `list_xrds`, `describe_xrd` — XRDs available at Layer 6.
- `simulate_cost` — per-layer $/mo from `data/cloud-prices/`.
- `explain_tradeoff` — diff between two profiles or two states.

## Mutating path (always via `propose_change`)

Aegis does not write the tree directly. Any mutation goes through:

1. `validate_plan` — dry-run validate the proposed change across all 7 layers.
2. `propose_change` — emit a structured patch, an ADR draft, and an audit-log entry (spec Section 15.10 chain).
3. Human approval (interactive launcher) OR Aegis policy gate (headless mode) applies the patch.

The stubs `add_app`, `claim_infra`, `validate_plan`, `propose_change` ship in C12 with stable JSON schemas; behavior wires up post-Day-1.

## Audit contract

Every Aegis-initiated mutation appends one line to `.audit/decisions.jsonl` with `actor: "aegis"` and the resulting `adr_emitted` ID. `task audit:verify` runs in CI to catch tamper.

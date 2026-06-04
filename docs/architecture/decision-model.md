# Decision model — ADRs, audit log, recommender

Authoritative sources: spec [Section 11.6](../superpowers/specs/2026-06-03-platform-foundation-design.md), Section 15.9, Section 15.10. Engineer-facing
reference for how every architectural fork in this repo is captured.

Every architectural fork emits three artifacts:

1. An ADR under `docs/adrs/NNNN-<topic>.md`.
2. A JSONL line in `.audit/decisions.jsonl` (append-only, SHA-256 chained).
3. For profile selection: a recommender output with `rubric_sha256` so a
   future audit can prove which rubric version produced the recommendation.

## ADR lifecycle

- Statuses: `proposed`, `accepted`, `superseded`, `deprecated`.
- Template at [`docs/adrs/_template.md`](../adrs/_template.md).
- `task adr:new <topic>` scaffolds the next-numbered ADR.
- `task adr:index` regenerates `docs/adrs/README.md`.
- Launcher auto-emits ADRs for each wizard stage (12+ on a default
  `p-hobby` run, per spec Section 15.9 Day-1 inventory).

## Audit log integrity

`.audit/decisions.jsonl` is append-only and SHA-256-chained.

```text
sha256_self = sha256(sha256_prev || canonical_json(line_without_sha256_self))
```

Genesis line has `sha256_prev = "0".repeat(64)`. Verbs (spec Section 15.10):

- `task audit:append` — internal; called by launcher / MCP / CI under flock.
- `task audit:verify` — walks the chain; exits 1 on first break with line number.
- `task audit:export` — renders to `docs/audit/timeline.md`.
- `task audit:diff` — compares two snapshots.

Verify implementation lives at `internal/cli/audit-verify/` (Go, ~80 LOC).

## Profile recommender

Deterministic rubric at `internal/recommender/rubric.yaml`. Pure function
`score(answers, rubric) -> ranked[]`. Output captures `rubric_version` and
`rubric_sha256`. The MCP tool `recommend_profile` wraps the same function
(spec Section 11.4). The recommender's reproducibility guarantee:

- Same `answers` + same `rubric_sha256` always produces the same ranking.
- A future audit can replay any historical recommendation by checking out
  the rubric at the recorded `rubric_sha256` and re-running `score`.

## Audit trail composition

Every fork that the launcher or MCP server emits produces a record that
combines all three. A typical line in `.audit/decisions.jsonl`:

```json
{
  "ts": "2026-06-03T17:00:00Z",
  "actor": "launcher",
  "stage": "profile-recommender",
  "input_hash": "sha256:...",
  "rubric_sha256": "sha256:...",
  "adr_emitted": "0012-profile-recommendation",
  "sha256_prev": "...",
  "sha256_self": "..."
}
```

A line without `adr_emitted` is a tamper signal for an architectural-fork
stage; the `audit-verify` job in CI catches that case.

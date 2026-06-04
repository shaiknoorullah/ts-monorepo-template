---
id: 0001
date: 2026-06-03
status: accepted
context: |
  Founders running `task launch` without a `--profile` flag need a sane default.
  Spec section 1.5 enumerates five profiles; p-solo is dev-only (no public
  surface) and p-startup-small+ require a cloud account. p-hobby — single VPS,
  $5–20/mo, GHCR + ESO + cnpg-single — is the lowest-cost path to a
  publicly-reachable deployment.
decision: |
  `task launch` with no profile flag defaults to `--profile=p-hobby`. The
  launcher CLI (spec section 11) auto-emits ADR-0001 through ADR-0012 on
  the first run, with this ADR as the entry point of that chain.
alternatives:
  - id: p-solo
    rejected_because: 'local-k3d only; no publicly-reachable endpoint.'
  - id: prompt-each-time
    rejected_because: 'breaks `task launch` quickstart in spec section 15.2.'
consequences:
  - 'Founders without a Contabo / Hetzner account see TOOL_MISSING_CLOUD_CREDS during bootstrap; error catalog entry must exist.'
  - 'CI nightly bringup matrix (spec section 14) must keep p-hobby green to protect the default path.'
supersedes: []
supersededBy: null
emitted_by: human
audit_decision_id: null
---

# ADR-0001 — Default profile is p-hobby for `task launch` with no flag

Founder front door must work without flags. p-hobby is the lowest cost band
that produces a publicly-reachable deployment (spec section 1.5). All other
profiles require explicit opt-in via `task launch --profile=<id>`.

See spec section 15.9 for the auto-emit chain (ADR-0001 through ADR-0012)
written by the launcher on first p-hobby run.

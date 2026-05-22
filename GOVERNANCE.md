# Governance

This file is the **top-level pointer** to repo governance. The actual rules live in [`docs/specs/governance-saas/`](./docs/specs/governance-saas/).

## Where the rules live

| Area                                                                                                          | Document                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Conventions (naming, style, TS, API, DB, logging, testing, security, docs, releases, PR/ADR)                  | [`docs/specs/governance-saas/repo-governance.md`](./docs/specs/governance-saas/repo-governance.md)                             |
| Temporal — when to use it, when not, determinism & versioning                                                 | [`docs/specs/governance-saas/temporal-when-and-when-not.md`](./docs/specs/governance-saas/temporal-when-and-when-not.md)       |
| OSS defaults (billing, analytics, identity, flags, search, email, storage, CMS, docs, status, support, audit) | [`docs/specs/governance-saas/saas-commons.md`](./docs/specs/governance-saas/saas-commons.md)                                   |
| Workspace architecture (apps / packages / internal)                                                           | [`docs/specs/governance-saas/package-architecture-rules.md`](./docs/specs/governance-saas/package-architecture-rules.md)       |
| Multi-tenancy isolation rules                                                                                 | [`docs/specs/governance-saas/multi-tenancy-isolation-rules.md`](./docs/specs/governance-saas/multi-tenancy-isolation-rules.md) |
| How these rules evolve                                                                                        | [`docs/specs/governance-saas/governance-process.md`](./docs/specs/governance-saas/governance-process.md)                       |
| Numbered decision records                                                                                     | [`docs/adrs/`](./docs/adrs/)                                                                                                   |

## Authority

The documents in `docs/specs/governance-saas/` are the **single source of truth** for repo conventions. [`AGENTS.md`](./AGENTS.md) and [`CONTRIBUTING.md`](./CONTRIBUTING.md) reference them; if either disagrees with a governance doc, the governance doc wins and the lighthouse file needs updating.

## How to amend a rule

See [`docs/specs/governance-saas/governance-process.md`](./docs/specs/governance-saas/governance-process.md). In short:

1. Open an issue describing the proposed change.
2. Open a PR that updates the governance doc (and tooling, if applicable). If the change has trade-offs, include an ADR in the same PR.
3. Get one reviewer (two for security/multi-tenancy).
4. Merge.

## Quarterly review

A committer walks `docs/specs/governance-saas/` quarterly to verify each rule is still defensible and `saas-commons.md` recommendations still hold (license changes, project-health changes).

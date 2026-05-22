---
title: Governance & SaaS Commons — Index
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
---

# Governance & SaaS Commons

This directory holds the **rule-of-the-road** documents for the `ts-monorepo-template` repo:

- how we name things, write tests, ship releases (`repo-governance.md`),
- when to reach for Temporal vs alternatives (`temporal-when-and-when-not.md`),
- which OSS subsystems we default to and why (`saas-commons.md`),
- what code belongs in shared packages vs apps (`package-architecture-rules.md`),
- how tenant isolation is enforced end-to-end (`multi-tenancy-isolation-rules.md`),
- and how these rules themselves evolve (`governance-process.md`).

## Documents

| Document                                                                 | Purpose                                                                                                                                |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`repo-governance.md`](./repo-governance.md)                             | THE rulebook — naming, style, TypeScript, API, DB, logging, testing, security, docs, releases, PR & ADR processes                      |
| [`temporal-when-and-when-not.md`](./temporal-when-and-when-not.md)       | Decision rule for Temporal vs Kafka vs RPC vs cron; determinism + versioning + worker anatomy + test patterns                          |
| [`saas-commons.md`](./saas-commons.md)                                   | OSS defaults for billing, analytics, identity, flags, search, email, storage, CMS, docs, status, support, audit — with license caveats |
| [`package-architecture-rules.md`](./package-architecture-rules.md)       | What goes in `apps/*` vs `packages/*` vs `internal/*`; forbidden patterns; versioning                                                  |
| [`multi-tenancy-isolation-rules.md`](./multi-tenancy-isolation-rules.md) | Tenant-context propagation, cross-tenant query rules, deletion + migration playbooks, fixtures, audit                                  |
| [`governance-process.md`](./governance-process.md)                       | How to amend the rules, ADR process, review cadence, onboarding                                                                        |

## Reading order

For a new contributor: `repo-governance.md` first, then the topic doc(s) for the area you're working on. For an architect making a tech choice: `governance-process.md` (open an ADR), then the relevant topic doc.

## Authority

These documents are referenced by:

- [`/AGENTS.md`](../../../AGENTS.md) — universal agent spec
- [`/GOVERNANCE.md`](../../../GOVERNANCE.md) — top-level pointer
- [`/CONTRIBUTING.md`](../../../CONTRIBUTING.md) — human contributor guide

When a per-package `AGENTS.md` tightens a rule, it wins for that package. Otherwise the most-specific topic doc here wins.

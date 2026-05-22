---
title: Governance Process — How the Rules Evolve
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://adr.github.io/
  - https://martinfowler.com/articles/dont-decentralize-architecture.html
  - https://www.conventionalcommits.org/en/v1.0.0/
  - https://github.com/changesets/changesets
  - https://agents.md
---

# Governance Process

The governance documents in `docs/specs/governance-saas/` are **living rules**. They are not a manifesto written once and laminated; they evolve as the repo learns. This document is the process by which they evolve, so that "the rules" don't fork into folklore.

---

## 1. The hierarchy

```
GOVERNANCE.md (repo root, top-level pointer)
  └── docs/specs/governance-saas/
       ├── README.md                            (index)
       ├── repo-governance.md                   ★ THE rulebook
       ├── temporal-when-and-when-not.md
       ├── saas-commons.md
       ├── package-architecture-rules.md
       ├── multi-tenancy-isolation-rules.md
       └── governance-process.md                (this file)
  └── docs/adrs/                                (numbered decision records)
```

Rules of precedence:

1. **`repo-governance.md`** is the authoritative rulebook for repo conventions.
2. **Topic-specific governance docs** (Temporal, multi-tenancy, packages, SaaS commons) are authoritative within their topic.
3. **ADRs in `docs/adrs/`** capture _decisions_ — they are point-in-time. When an ADR's outcome is "we now require X", `repo-governance.md` (or the relevant topic doc) is updated **in the same PR** as the ADR. The ADR alone is not a rule.
4. **`AGENTS.md`** is the lighthouse for AI coding assistants — it points at the governance docs. It does not duplicate them.
5. **`CONTRIBUTING.md`** is the lighthouse for human contributors — same role.
6. **Per-package `AGENTS.md`** can **tighten** rules (e.g., raise coverage to 90%) but never loosen.

If two documents disagree, the more specific one wins (per-package > topic > repo > AGENTS.md > README).

---

## 2. ADRs — for new technical decisions

An ADR is required for:

- Adopting a new tool from `saas-commons.md` for the first time.
- Replacing a tool listed in `saas-commons.md` defaults.
- Changing a foundational choice in `AGENTS.md` §1 (package manager, orchestrator, bundler, etc.).
- Introducing a new bounded context / app.
- Anything that changes the dependency direction (`apps/* → packages/*`).
- A breaking change in `@pkg/*` that requires a coordinated multi-app deploy.

An ADR is **not** required for:

- Bug fixes, even non-trivial ones.
- New endpoints within an existing app, matching existing conventions.
- New packages that fit the litmus tests in `package-architecture-rules.md`.
- New events that fit the naming convention.

Format (four sections, ≤ 2 pages):

```markdown
# ADR-NNNN: <Title>

## Status

Proposed | Accepted | Superseded by ADR-MMMM | Deprecated

## Context

What is the problem? What forces are at play?

## Decision

What did we decide? Be specific.

## Consequences

Positive, negative, neutral. The trade-offs.

## References

Links to docs, PRs, tickets.
```

ADRs are numbered sequentially. Numbers are **never reused**. Superseded ADRs are kept in place and referenced by their successor.

---

## 3. Amending a governance doc

To change a rule:

1. **Open an issue** describing the proposed change. Title: `governance: <topic>: <what>`.
2. **Discuss** in the issue. Get at least one other committer's opinion. (Slack discussion ok, but conclusions land in the issue.)
3. **Open a PR** that:
   - Edits the governance doc.
   - Bumps `last_updated:` frontmatter.
   - If the change has tooling impact (lint rules, CI thresholds), updates the tooling too.
   - If the change is non-obvious or breaks prior behavior, opens an ADR in the same PR.
4. **At least one approve reviewer** signs off. For changes to security rules (auth, secrets, audit) or multi-tenancy isolation, **two** approve reviewers, one of whom is a designated owner of the relevant subsystem (see `CODEOWNERS`).
5. **CI must be green.** A governance doc change that breaks lint or CI is a sign the rule isn't well-defined.
6. **Merge.** Squash is acceptable; merge commit also fine.

Disagreements that can't be resolved in PR: escalate via the existing engineering forum (weekly sync, monthly architecture review). Do not let the PR linger >2 weeks — close with a "deferred to next review cycle" comment, file a backlog item.

---

## 4. Review cadence

Quarterly: a committer walks through `docs/specs/governance-saas/` and answers:

- Is each rule still defensible? (If a rule is regularly violated and the violations don't cause harm, the rule is wrong, not the team.)
- Have the tools we recommended in `saas-commons.md` changed their license, fallen out of maintenance, or sprouted a better alternative?
- Are there rules that exist by oral tradition that should be written down here?

The output is a PR or a list of issues. Even if the conclusion is "no changes", the review is recorded as a comment on the latest `governance-process.md` PR.

---

## 5. Onboarding a new contributor

Reading order:

1. **`README.md`** — what is this repo.
2. **`AGENTS.md`** — what you can and can't change without escalation.
3. **`GOVERNANCE.md`** (top-level) — the map of governance docs.
4. **`docs/specs/governance-saas/repo-governance.md`** — the rules.
5. The topic-specific governance doc(s) relevant to the work you're about to do.
6. ADRs touching the area you're working on (`grep -l <topic> docs/adrs/`).

Reading should take an afternoon, not a week. If it takes longer, the docs are too long — file an issue.

---

## 6. AI agent contributions

Per the AGENTS.md convention (see `agents.md`):

- AI assistants read `AGENTS.md` automatically.
- AI assistants follow per-package `AGENTS.md` overrides.
- AI-authored PRs are not exempt from any rule in this document. The human committer is accountable.
- AI agents must cite the governance doc + section when proposing a change to a rule. PRs that say "this is best practice" without a citation are rejected.

---

## 7. Anti-process — what we deliberately don't do

- **No RFC system.** ADRs cover decision records. We do not need a parallel RFC track.
- **No governance committee.** The committers are the governance body, ad hoc per change.
- **No bikeshed-prone style debates.** Prettier config is immutable (`repo-governance.md` §2). Disagreement → ADR-or-drop.
- **No retroactive enforcement.** A new rule applies going forward. Existing violations are tracked in `TODO.md` with an owner and (if material) a migration plan.
- **No "this is how Google does it" arguments.** Cite the trade-off as it applies to _this_ repo's constraints.

---

## 8. The shortest summary

Rules live in `docs/specs/governance-saas/` and `docs/adrs/`. To change a rule, open a PR with a clear rationale and (when the change is technical) an ADR. Quarterly review keeps the rules honest. AI assistants and humans follow the same rules. `repo-governance.md` is the canonical place to look first.

If you're not sure whether something belongs in an ADR or just in the governance doc directly: **if it's a decision with trade-offs, ADR. If it's a rule that follows from the decision, governance doc.** Both can land in the same PR.

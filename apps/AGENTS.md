# AGENTS.md — apps/

Cascade rule: nearest `AGENTS.md` wins; child overrides parent. Per-app `apps/<svc>/AGENTS.md` files override this one.

## What lives here

Deployable microservices. Containerized. Never published to npm. Spec section 1.2 Layer 5.

## Build conventions

- Build: `task build:<svc>`.
- Test: `task test:<svc>`.
- Lint: `task lint:<svc>`.
- Per-app Dockerfile under `apps/<svc>/Dockerfile`; multi-stage per language (spec section 5).

## Architecture invariants

- Apps never import from sibling apps. Use `packages/<lib>` only.
- Database access only via XPostgres claim (Layer 6 XRD). No raw connection strings.
- Outbound HTTP only through the shared logger / http-client packages.

## Out of scope

- Stateful infra provisioning — that is Layer 6 (Crossplane), not the app chart.
- Cross-service orchestration — use a Workflow kind, not an HTTP endpoint chain.

## Per-app override

Each `apps/<svc>/AGENTS.md` is a per-app override of this file. The template
(spec Section 15.8) has 7 sections: What this app is / Build-test-lint /
Architecture invariants / Common tasks / Out of scope / How to claim infra /
How to add a new endpoint. Whole-section replacements win over the parent.

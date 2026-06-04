# ADR 0013 — Payload CMS self-hosted (the one Next.js exception)

**Status:** Accepted
**Date:** 2026-05-22
**Relates to:** ADR 0010 (eliminating-or-limiting-nextjs)

## Context

ADR 0010 carved Next.js out of the frontend tier — Astro for content,
Expo for app shells, Cloudflare Workers for edge. The CMS choice
forced a re-examination.

Considered options:

- **A.** Sanity / Contentful / Hygraph — hosted SaaS.
  Lock-in. Multi-tenant + per-tenant theme + custom auth all cost
  extra. Egress fees on media. No on-prem path.
- **B.** Strapi 5 — Express-based, self-hostable.
  Plugin ecosystem is thinner than Payload 3. TypeScript story is
  weaker. Multi-tenant plugin is community-maintained.
- **C.** Directus — DB-first; great query API; less rich-text +
  workflow than Payload.
- **D.** Payload CMS 3 — TypeScript-first, drizzle-style migrations,
  first-party multi-tenant plugin, S3-compat cloud-storage plugin,
  pluggable auth. Requires bundled Next.js as the admin shell.

## Decision

**Option D — Payload CMS 3, self-hosted.**

This breaks ADR 0010's "no Next.js" rule in exactly one place. The
exception is justified because:

1. Payload's TS-first model and rich-text Lexical editor are
   significantly ahead of the alternatives.
2. Multi-tenant + cloud-storage + access-control are first-party,
   not community plugins.
3. Bundled Next.js is contained — `apps/cms` is the only consumer.
   No other app imports it; no public site is built on Next.js.
4. Self-hosting means no egress fees, no lock-in, and content
   stays inside our tenancy.

## Constraints encoded

- `apps/cms` is the ONLY directory permitted to depend on `next` or
  `react-dom/server` for App Router rendering. A future ESLint rule
  in the workspace will enforce this.
- All other apps remain on Astro / Expo / Workers per ADR 0010.
- Payload's bundled Next.js version is pinned together with Payload —
  bumping one bumps the other in lockstep.

## Auth

Argon2id on top of Payload's built-in auth. `Users` collection has a
`migrationStatus` field tracking per-user cutover to Ory Kratos when
that lands.

## Storage

Media goes to Cloudflare R2 via `@payloadcms/plugin-cloud-storage`
with the S3-compat adapter. Local dev uses MinIO.

## Consequences

**Positive**

- Single source of truth for content + media + tenant theme.
- Owns the schema, owns the data, no egress fees.

**Negative**

- One Next.js surface to keep patched.
- Bundled Next.js version drives Node/React version constraints for
  this one app.
- Migration to Kratos is documented but not automated.

**Mitigations**

- `apps/cms` lives in its own deployment unit (Docker compose +
  Kubernetes manifest). Patching is isolated.
- Renovate auto-PRs on `payload` updates batch the bundled Next.js
  bump alongside.

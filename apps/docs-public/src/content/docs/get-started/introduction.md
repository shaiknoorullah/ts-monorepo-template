---
title: Introduction
description: What Example is and what it isn't.
---

Example is an opinionated, open-source platform for shipping multi-tenant SaaS.

## What's in the box

- Multi-tenant Postgres (schema-per-tenant).
- Authentication via Ory or Keycloak.
- API gateway (Fastify).
- Background workers (BullMQ → migrating to Temporal).
- Marketing site, documentation, mobile + web app — all in one monorepo.
- Edge deployment via Cloudflare (Pages, Workers, R2, D1, KV).

## What's not

- A multi-cloud abstraction layer.
- A no-code builder.
- A managed hosting service. (You run it. The template helps.)

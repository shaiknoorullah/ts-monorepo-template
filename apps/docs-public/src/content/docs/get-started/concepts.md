---
title: Concepts
description: Tenants, projects, environments, roles.
---

- **Tenant** — an isolated customer account. Has its own Postgres schema, blob namespace, and feature flags.
- **Project** — a workspace inside a tenant. Tenants can have many projects.
- **Environment** — a logical deployment slot (dev / staging / prod) per project.
- **Role** — a permission set: `owner`, `admin`, `member`, `viewer`.

See [Multi-tenancy isolation rules](../../reference/multi-tenancy/) for the full model.

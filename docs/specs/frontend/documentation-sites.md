---
title: Documentation sites
status: draft
last_updated: 2026-05-22
owners: ['@shaiknoorullah']
references:
  - https://starlight.astro.build/
  - https://vitepress.dev/
  - https://pagefind.app/
  - https://docs.astro.build/
---

# Documentation sites

Two documentation surfaces. Different audiences, different tools.

| Surface                                                  | Tool                            | Path               | Audience                 |
| -------------------------------------------------------- | ------------------------------- | ------------------ | ------------------------ |
| Customer-facing docs                                     | **Astro Starlight**             | `apps/docs-public` | End-users of the product |
| Internal docs (architecture, ADRs, runbooks, governance) | **VitePress** (already in repo) | `docs/`            | Engineers and operators  |

## Why two

Customer docs need: polish, search, versioning, i18n, dark mode, code blocks with copy buttons, breadcrumbs. Starlight ships all of these on day one.

Internal docs need: be writable in Markdown by engineers, integrate with ADR conventions, live in the same repo as the code, deploy in one click. VitePress (already wired) suffices.

Migrating internal docs to Starlight buys us nothing the team will value.

## Customer docs — `apps/docs-public`

- **Framework:** Astro Starlight. <https://starlight.astro.build/>
- **Content:** `src/content/docs/**/*.{md,mdx}`.
- **Search:** Pagefind (offline-indexed, no server). <https://pagefind.app/>
- **Versioning:** sidebar configured per major version; old versions remain accessible at `/v<major>/`.
- **i18n:** built-in. Default English; structure ready for more locales.
- **Theme:** Starlight default + per-tenant overrides if the operator wants tenant-branded docs (defer).
- **Deploy:** Cloudflare Pages.

### Sidebar structure

```
Get started
  ├── Introduction
  ├── Quickstart
  └── Concepts
Guides
  ├── ...
Reference
  ├── API
  ├── Webhooks
  └── CLI
Operations
  ├── SLA
  ├── Status page
  └── Support
```

### Versioning convention

- `main` branch = current version.
- Past majors live under `apps/docs-public/src/content/docs/v<N>/...` with a per-version sidebar slot.
- The Starlight `versions` config (custom sidebar group) handles UI.

### Performance budgets

- Lighthouse Performance ≥ 95 on docs landing page.
- Pagefind index ≤ 5 MB after gzip.
- Initial JS payload < 30 KB (Starlight is lean).

## Internal docs — `docs/`

VitePress configuration already exists. Keep it. Conventions documented in [governance-saas/repo-governance.md](../governance-saas/repo-governance.md).

## Adding a doc

### Customer doc

```bash
# Manual for now — add a Markdown file under apps/docs-public/src/content/docs/
```

A future `repo new doc <slug>` will scaffold the frontmatter.

### Internal doc

```bash
repo new adr "title"                  # ADR
repo new runbook "incident-name"      # Runbook in docs/runbooks/
```

## Hosting

Customer docs on `docs.example.com` via Cloudflare Pages. Internal docs on `docs.internal.example.com` behind Cloudflare Access (50-user free tier).

## Search

Pagefind for customer docs (client-side, no backend). VitePress has its own search; keep it as-is.

## Deferred

- AGENT-TODO: Algolia DocSearch is not on the table (proprietary; Pagefind is enough).
- AGENT-TODO: Per-tenant doc theming.
- AGENT-TODO: Versioning automation (cut a `vN` snapshot via CLI).

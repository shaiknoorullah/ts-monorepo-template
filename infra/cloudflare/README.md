# infra/cloudflare

Cloudflare configuration: Pages projects, Workers, and DNS notes.

Tooling: **Wrangler v3+** only. We do not use Terraform/Pulumi for CF resources — the free tier's footprint is small enough that wrangler.toml + dashboard-defined DNS is cleaner than IaC overhead.

## Layout

```
infra/cloudflare/
├── README.md           (this file)
├── wrangler/           (project-specific wrangler.toml templates)
│   ├── tenant-router.toml
│   └── webhook-receiver.toml
├── workers/            (Worker source code)
│   ├── tenant-router/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/index.ts
│   └── webhook-receiver/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/index.ts
└── dns/
    └── README.md       (DNS records to add)
```

## Auth

```bash
wrangler login
# Or, for CI:
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_ACCOUNT_ID=...
```

## Deploy

```bash
pnpm --filter @infra/cf-tenant-router deploy
pnpm --filter @infra/cf-webhook-receiver deploy
```

Pages-deployed apps live in `apps/*` with their own `wrangler.toml`.

## Resources

| Resource                                  | Purpose                    | Free-tier limit              |
| ----------------------------------------- | -------------------------- | ---------------------------- |
| Pages (marketing, docs-public, web-app)   | Static + SSR hosting       | Unlimited req, 500 builds/mo |
| Workers (tenant-router, webhook-receiver) | Edge logic                 | 100k req/day                 |
| R2 bucket `marketing-media`               | CMS media                  | 10 GB                        |
| R2 bucket `app-uploads`                   | App user uploads           | shared 10 GB                 |
| KV namespace `edge-config`                | Feature flags, edge config | 1 GB                         |
| D1 database `marketing-forms`             | Contact forms              | 5 GB                         |
| Turnstile site key                        | CAPTCHA                    | Unlimited                    |
| Web Analytics token                       | Page-view analytics        | Unlimited                    |

Create each via `wrangler` CLI or the CF dashboard, then plug IDs into the corresponding `wrangler.toml`.

## Local dev tunnels

```bash
repo dev tunnels
```

See `docs/specs/frontend/cloudflare-deployment.md`.

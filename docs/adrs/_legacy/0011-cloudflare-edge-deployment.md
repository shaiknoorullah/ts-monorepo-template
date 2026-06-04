# ADR-0011: Cloudflare as the default edge deployment target

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** @shaiknoorullah

## Context

The template needs a deploy target for marketing, docs, and the web-app's web build. Requirements:

- Free-tier friendly (operator constraint).
- CDN + edge compute + storage in one account.
- No vendor lock-in beyond what's strictly necessary.
- Wrangler / wrangler-equivalent CLI surface so deploys are scriptable.

Candidates:

- Cloudflare (Pages + Workers + R2 + D1 + KV + Turnstile + Web Analytics + Tunnels + Access)
- Vercel (eliminated alongside Next.js — ADR-0010)
- Netlify (limited free tier in 2026; Functions limited; no R2 equivalent)
- AWS CloudFront + S3 + Lambda@Edge (capable but high integration cost)
- Self-host on the OVH/Contabo cluster (operationally heavy for marketing/docs)

## Decision

**Cloudflare is the default edge deployment target** for everything that goes on the public internet:

- `apps/marketing` → Cloudflare Pages
- `apps/docs-public` → Cloudflare Pages
- `apps/web-app` (web build) → Cloudflare Pages
- Worker-based edge logic (tenant router, webhook receiver, edge auth) → Cloudflare Workers
- Static assets / CMS media → R2 (S3-compatible, zero egress)
- Marketing forms data → D1 (SQLite at edge)
- Edge config / feature flags / session cache → KV
- CAPTCHA → Turnstile
- Page-view analytics → Cloudflare Web Analytics (plus self-hosted Umami)
- Local-dev tunnels → cloudflared

Backend services (api-gateway, worker, temporal-worker) continue to run on the Kubernetes cluster; they're reached through Cloudflare's CDN and (optionally) Cloudflare Tunnel.

## Why Cloudflare

1. **Free tier covers what we need.** Pages: unlimited requests, 500 builds/mo. Workers: 100k req/day. R2: 10 GB + zero egress (this matters — egress fees are how S3 surprises you). D1: 5 GB. KV: 1 GB. Turnstile + Web Analytics + Tunnels: unlimited.
2. **No proprietary build output.** Astro builds standard static HTML + Workers-compatible SSR; Wrangler deploys raw files. There's no "Cloudflare-specific compile target" you can't reproduce elsewhere.
3. **R2 is S3-compatible.** Migration to S3 is `mc mirror` away.
4. **D1 is SQLite.** Migration to Postgres is `sqlite3 .dump` → `psql`.
5. **Workers runtime is V8 isolate.** The runtime spec is documented (`runtime-apis/*`). No undocumented framework-specific behavior.
6. **Turnstile + Web Analytics replace third-party tools** (reCAPTCHA, GA) with privacy-respecting alternatives.
7. **Tunnels** give us free preview URLs for local dev + a way to expose backend services without opening firewall ports.

## Why not the alternatives

- **Vercel** — Next.js gravity (ADR-0010). Free tier is comparable but stops at the framework boundary.
- **Netlify** — adequate for static; functions are limited; no R2/D1 equivalent.
- **AWS** — capable but integration cost (CloudFront + S3 + Lambda@Edge + IAM + Route 53 + WAF + Shield) is high for free-tier-friendly marketing surface.
- **Self-host on the OVH/Contabo cluster** — overkill for marketing/docs. The cluster's CPU/memory is precious; static page serving is what CDNs are for.

## Consequences

### Positive

- Marketing + docs + web-app web builds deploy for free.
- Zero egress on R2 — important when serving image-heavy marketing pages.
- Local-dev tunnels for free (no ngrok subscription).
- Web Analytics + Turnstile remove two third-party dependencies (GA + reCAPTCHA).

### Negative

- Workers' 10 ms CPU per request limit on free tier — viral marketing pages could blow it; upgrade trigger documented in `cloudflare-deployment.md`.
- D1 row-write limit (50k/day on free tier) — fine for marketing forms; not a primary database.
- Some advanced features (Stream, Images at scale, R2 large-object transfer) cost money beyond free tier — we document upgrade triggers.

### Neutral / Follow-up

- DNS records added manually by operator at first deploy.
- Cloudflare Access (50 free users) used to gate internal docs preview deploys.
- An ADR will follow if we move the API gateway behind a Cloudflare Tunnel (currently TBD).

## Alternatives considered

- **Vercel** — see ADR-0010.
- **Netlify** — viable but inferior storage primitives (no R2/D1 equivalent).
- **AWS** — overkill at this scale.
- **Render / Fly.io / Railway** — different category (PaaS for backends), not a direct alternative for CDN + edge compute.

## References

- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
- [R2](https://developers.cloudflare.com/r2/)
- [D1](https://developers.cloudflare.com/d1/)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [Turnstile](https://developers.cloudflare.com/turnstile/)
- [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [Free plan](https://www.cloudflare.com/plans/free/)
- `docs/specs/frontend/cloudflare-deployment.md`
- Research: `~/work/.handoffs/cluster-cpu-overcommit/2026-05-22/research-frontend-stack.md` §7

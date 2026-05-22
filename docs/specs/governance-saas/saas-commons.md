---
title: SaaS Commons — OSS Building Blocks
status: draft
last_updated: 2026-05-22
owners: ["@shaiknoorullah"]
references:
  - https://www.getlago.com/
  - https://github.com/openmeterio/openmeter
  - https://posthog.com/handbook/why-posthog/why-open-source
  - https://openpanel.dev/
  - https://plausible.io/data-policy
  - https://umami.is/
  - https://www.goatcounter.com/
  - https://www.keycloak.org/
  - https://www.ory.sh/
  - https://goauthentik.io/
  - https://www.getunleash.io/
  - https://www.flagsmith.com/
  - https://openfeature.dev/
  - https://www.meilisearch.com/
  - https://typesense.org/
  - https://www.elastic.co/pricing/faq/licensing
  - https://docs.postalserver.io/
  - https://listmonk.app/
  - https://min.io/
  - https://bunny.net/
  - https://strapi.io/
  - https://directus.io/
  - https://payloadcms.com/
  - https://scalar.com/
  - https://redocly.com/
  - https://stoplight.io/
  - https://uptime.kuma.pet/
  - https://www.chatwoot.com/
  - https://cloudevents.io/
  - https://clickhouse.com/
  - https://redis.io/legal/licenses/
  - https://sentry.io/pricing/license/
---

# SaaS Commons

For each SaaS-essential subsystem, the lightest open-source path that gets us to **good-enough-for-production** without lock-in. Every entry includes: tool, license (with caveats — several "open-source" tools have changed licenses recently), what it does, what it replaces, integration approach.

A standing rule for this repo: **prefer the simpler tool with the friendlier license** unless we have a concrete, named requirement the simpler tool cannot meet. "We might need scale later" is not a concrete requirement.

License legend:

- ✅ permissive (MIT, Apache 2.0, BSD)
- ⚠️ copyleft network (AGPL, SSPL, BUSL, FSL) — usable, but read the carve-outs before shipping a multi-tenant SaaS on top
- ❌ proprietary only

---

## 1. Billing / metering

**Primary: [Lago](https://www.getlago.com/)** — ⚠️ AGPL-3.0.

- What: metered + subscription billing engine. Plans, add-ons, coupons, invoices, tax, webhook integrations to Stripe/Adyen.
- Replaces: Stripe Billing (proprietary), Chargebee, Recurly.
- License caveat: AGPL means **if you modify Lago and expose the modified server over a network, you must publish the changes**. Running it unmodified as a backing service is fine; forking it and adding features is the issue.
- Integration: deploy Lago server + Postgres + Redis in `billing` namespace; `@pkg/lago-client` wraps the SDK. Events: when Lago emits `invoice.created`, our `billing.invoice.issued.v1` CloudEvent fans it out.

**Alternative: [OpenMeter](https://github.com/openmeterio/openmeter)** — ✅ Apache 2.0.

- What: usage-based metering only — ingest events, aggregate to meters, expose via API.
- Use it when: you bill on usage and a billing engine (Stripe Billing, Lago) handles invoicing on top.
- Pairs well with Kafka (ingests directly from a topic).

---

## 2. Product analytics

**Note:** PostHog is excellent but ⚠️ AGPL with a notable enterprise carve-out — read [their licensing page](https://posthog.com/handbook/why-posthog/why-open-source) carefully if you plan to embed it. We default to lighter tools below.

**Recommended for product analytics: [OpenPanel](https://openpanel.dev/)** — ✅ AGPL-3.0 currently (verify on the day you deploy; OpenPanel has signalled licensing flexibility for self-hosters).

- What: event analytics, funnels, retention, dashboards.
- Replaces: Mixpanel (proprietary), Amplitude.

**Recommended for web analytics: [Plausible](https://plausible.io/data-policy)** — ✅ AGPL-3.0 (self-hosted CE is free).

- What: privacy-friendly pageview analytics.
- Replaces: Google Analytics. Cookie-free, GDPR-friendly.

**Lighter alternatives:**

- [Umami](https://umami.is/) — ✅ MIT. Cleanest license. Web analytics + simple events. **Pick this if license is the deciding factor.**
- [GoatCounter](https://www.goatcounter.com/) — ✅ EUPL-1.2. Single-binary, minimal.
- [Rybbit](https://rybbit.io/) — ✅ AGPL-3.0. Modern alternative to Plausible.

**Selection rule for this repo:** Umami for marketing site analytics + OpenPanel for in-app product analytics. Both self-hosted next to the workload they serve.

---

## 3. Identity / auth

Two strong paths; pick one per deployment.

**Path A: [Ory](https://www.ory.sh/) stack** — ✅ Apache 2.0.

- Kratos (identity), Hydra (OAuth 2.0/OIDC provider), Keto (authz), Oathkeeper (identity-aware proxy).
- Strengths: modern, API-first, no admin UI dependency (each service is API + CLI), polyglot-friendly, headless.
- Weaknesses: you assemble the pieces; the UI is your problem (Ory ships reference UIs in Node).
- **Pick when:** you want clean separation and you're building a custom UX.

**Path B: [Keycloak](https://www.keycloak.org/)** — ✅ Apache 2.0.

- Single monolith, mature, ships an admin console, SAML + OIDC + LDAP federation out of the box.
- **Pick when:** you need enterprise SSO (SAML federation with corporate IdPs) on day one.

**Alternative: [Authentik](https://goauthentik.io/)** — ✅ MIT (community), proprietary enterprise tier.

- Modern Python/Django stack, nice admin UX, good for internal admin SSO.

**For this template's default:** Ory Kratos + Hydra. The repo includes `@pkg/auth-middleware` that wraps Kratos session cookies; swapping to Keycloak is a 200-line config change.

---

## 4. Feature flags

**Primary: [Unleash](https://www.getunleash.io/)** — ✅ Apache 2.0.

- What: feature flags with environments, gradual rollouts, strategy-based targeting.
- Replaces: LaunchDarkly (proprietary), Split.io.
- Integration: `@pkg/feature-flags` wraps the Unleash Node SDK; provides a typed flag registry so flag names are compile-time-checked.

**Alternative: [Flagsmith](https://www.flagsmith.com/)** — ✅ BSD-3-Clause (core), proprietary enterprise.

- Similar feature set, friendlier UI for non-engineers.

**Abstraction: [OpenFeature](https://openfeature.dev/)** — ✅ Apache 2.0 (CNCF).

- Vendor-neutral SDK; pick a provider behind it (Unleash, Flagsmith, GoFeatureFlag). Use this if you might switch providers.

**Default:** OpenFeature SDK in `@pkg/feature-flags`, Unleash as the provider. Switching to Flagsmith later is a provider config change.

---

## 5. Search

**Default: [Meilisearch](https://www.meilisearch.com/)** — ✅ MIT.

- Single binary, fast, typo-tolerant, simple JSON API. Good up to tens of millions of documents per index.
- **Pick when:** you want zero-fuss full-text search across product data.

**Alternative: [Typesense](https://typesense.org/)** — ✅ GPL-3.0.

- Comparable to Meilisearch in features and ergonomics; slightly different ranking model. License is stronger copyleft — fine for self-host, watch carefully if embedding.

**Caveat: Elasticsearch / OpenSearch**

- Elastic changed Elasticsearch's license to SSPL/Elastic License v2 in 2021; in 2024 added AGPL as a third option. ⚠️ Read [Elastic's licensing FAQ](https://www.elastic.co/pricing/faq/licensing) before deploying. **OpenSearch** (Apache 2.0 fork by AWS) is the safe alternative if you actually need ES-level features.
- **Pick ES/OpenSearch only when:** you need its specific aggregation/percolator features or log search at scale (and even then, prefer Loki or ClickHouse for logs).

---

## 6. Email / transactional

**Marketing + newsletters: [Listmonk](https://listmonk.app/)** — ✅ AGPL-3.0.

- Self-hosted, single binary + Postgres. Lists, templates, campaigns, bounces.

**Transactional MTA: [Postal](https://docs.postalserver.io/)** — ✅ MIT.

- Outbound SMTP + webhook delivery, click/open tracking. Replaces Postmark/SES for self-hosters.
- Pair with a paid relay (Postmark, SES, Mailgun) for actual deliverability — running your own outbound IPs at scale is a deliverability headache.

**Transactional API (paid)**: Postmark or SES for deliverability; abstract behind `@pkg/email` so you can swap providers.

**Default for this template:** Listmonk for any newsletter/campaigns; SMTP relay (Postmark by default, SES alternative) for transactional. Self-hosted Postal only when egress costs justify the operations burden.

---

## 7. File storage / CDN

**Object storage: [MinIO](https://min.io/)** — ⚠️ AGPL-3.0 (since 2021).

- S3-compatible API, single binary, distributed mode for HA. License caveat applies — running it as a backing service is fine; redistributing modified is the issue.
- For private artifacts within the cluster, MinIO is the default. For SaaS user content, see CDN below.

**CDN**: there is no first-rate OSS CDN. Realistic options:

- **[Bunny.net](https://bunny.net/)** — cheap (~$0.005/GB egress), great EU/India presence. Proprietary but ~10x cheaper than CloudFront.
- **CloudFront** if you're already in AWS.
- **Cloudflare R2 + Cache** for free egress within Cloudflare.

**Default:** MinIO for internal object storage; Bunny.net CDN for user-facing assets.

---

## 8. Job queues

**This repo's stance:** we use **Temporal** for durable, multi-step processes and **Kafka** for everything else. We are deliberately **not** adopting BullMQ/Sidekiq alternatives:

- BullMQ on Redis is fine for single-app, ephemeral jobs but offers nothing Temporal+Kafka don't, and adds a third infrastructure dependency.
- See `temporal-when-and-when-not.md` §1 and §2 for the decision rule.

**If you must use a Redis-backed queue** (e.g., for retrofit into a legacy app), [BullMQ](https://docs.bullmq.io/) (✅ MIT) is the choice. Document the exception in an ADR.

⚠️ Redis itself: in 2024 it relicensed to SSPL/RSALv2 dual; the OSS fork **Valkey** (BSD-3) is the drop-in replacement and what we deploy. See `redis.io/legal/licenses` and the Valkey project at <https://valkey.io>.

---

## 9. CMS / headless content

For when product-team content (marketing site copy, blog, in-app help) must be editable without a deploy:

**[PayloadCMS](https://payloadcms.com/)** — ✅ MIT.

- TypeScript-native, code-first schema, great DX, Next.js admin out of the box.
- **Pick when:** your team is TS-fluent and wants type-safe content models.

**[Directus](https://directus.io/)** — ⚠️ BUSL-1.1 (converts to GPL after 3 years).

- Database-first; point at any SQL DB and get an admin UI and REST/GraphQL APIs.

**[Strapi](https://strapi.io/)** — ✅ MIT (community), proprietary enterprise.

- Established, big plugin ecosystem, slightly slower DX than Payload.

**Default:** PayloadCMS for any new content-heavy front-end.

---

## 10. API documentation

**[Scalar](https://scalar.com/)** — ✅ MIT.

- Modern OpenAPI viewer + interactive playground. Drop a single component into your docs site pointing at `openapi.yaml`.

**[Redocly](https://redocly.com/) (Redoc)** — ✅ MIT (Redoc core), proprietary CLI extras.

- Mature; static docs generator.

**[Stoplight Elements](https://stoplight.io/open-source/elements)** — ✅ Apache 2.0.

- React component, full API explorer.

**Default:** Scalar embedded in the VitePress docs site (`docs/.vitepress/`), one Scalar instance per OpenAPI spec.

---

## 11. Status page

**[Uptime Kuma](https://uptime.kuma.pet/)** — ✅ MIT.

- Self-hosted status + uptime monitoring; push/pull checks; webhook notifications.

**[Statping-ng](https://github.com/statping-ng/statping-ng)** — ✅ GPL-3.0.

- Statuspage-style public status page.

**Default:** Uptime Kuma — single container, gets you 90% of what statuspage.io offers, hosted on the same cluster but in its own namespace + alert path so a cluster-wide outage doesn't blind the status page (deploy it in `pn-ops` cluster, not in the user-facing cluster).

---

## 12. Customer support / in-app feedback

**[Chatwoot](https://www.chatwoot.com/)** — ⚠️ MIT (core) with proprietary enterprise add-ons; some Chatwoot features moved behind a commercial license in 2024 — verify each feature you need.

- Live chat + ticketing + multi-channel inbox.

**Alternative: [Plain](https://plain.com/)** — ❌ proprietary, but excellent if you want managed.

**Default:** Chatwoot OSS edition for early-stage; revisit once you have >5 support agents.

---

## 13. Audit log

**Roll-our-own pattern**: every state change emits a `*.audited.v1` CloudEvent → Kafka topic `audit.events` → ClickHouse sink. See `data-eventing/` and `multi-tenancy-isolation-rules.md`.

- ClickHouse (✅ Apache 2.0) is the analytical store; cheap, fast, retains 1y+ at low cost.
- A second sink writes to immutable object storage (MinIO, WORM bucket) for tamper-evidence (we hash-chain audit events; see `repo-governance.md` §6).

**Hosted alternative**: [Auditr](https://www.auditr.com/) (proprietary). Useful if compliance review demands "third-party-attested audit log".

**Default:** in-house CloudEvents → Kafka → ClickHouse + WORM. Auditr only when an enterprise customer demands it in writing.

---

## 14. Observability — already decided

Covered in `edge-obs/` specs:

- Logs → Loki (✅ AGPL-3.0).
- Metrics → Prometheus + Grafana Mimir (✅ AGPL-3.0).
- Traces → Tempo (✅ AGPL-3.0).
- Profiles → Pyroscope (✅ Apache 2.0).
- Frontend → Grafana (⚠️ AGPL-3.0 since 2021).

See ADR-NNNN-grafana-stack.md (TBD) for the rationale.

---

## 15. License-change watch-list

Tools that relicensed in recent years — re-evaluate any of these before adopting:

| Tool | Old license | New license | Workaround |
|---|---|---|---|
| Elasticsearch | Apache 2.0 | SSPL/Elastic v2 (AGPL added 2024) | OpenSearch |
| MongoDB | AGPL | SSPL | Postgres + JSONB, or FerretDB |
| Redis | BSD | SSPL/RSALv2 (2024) | Valkey (BSD-3) |
| Terraform | MPL | BSL 1.1 (2023) | OpenTofu (MPL-2.0) |
| Sentry | BSD | FSL (2023) | GlitchTip (MIT) — partial drop-in |
| Grafana | Apache 2.0 | AGPL-3.0 (2021) | Stay on AGPL; we accept the obligation as a self-host |
| HashiCorp Vault | MPL | BSL 1.1 (2023) | OpenBao (MPL fork) — emerging |

Rule: when a license changes, **do not panic-rip**. Assess: are you modifying and redistributing? Usually no. Self-host of an unmodified backing service almost always remains acceptable. But for any tool you *embed* in a product, double-check.

---

## 16. Summary defaults (the cheat sheet)

| Subsystem | Default | License |
|---|---|---|
| Billing | Lago | AGPL-3.0 ⚠️ |
| Metering | OpenMeter (with Lago) | Apache 2.0 ✅ |
| Product analytics | OpenPanel | AGPL-3.0 ⚠️ |
| Web analytics | Umami | MIT ✅ |
| Identity | Ory (Kratos + Hydra) | Apache 2.0 ✅ |
| Feature flags | OpenFeature SDK + Unleash provider | Apache 2.0 ✅ |
| Search | Meilisearch | MIT ✅ |
| Email — transactional | SMTP relay (Postmark/SES) behind `@pkg/email` | proprietary |
| Email — campaigns | Listmonk | AGPL-3.0 ⚠️ |
| Object storage | MinIO | AGPL-3.0 ⚠️ |
| CDN | Bunny.net | proprietary |
| CMS | PayloadCMS | MIT ✅ |
| API docs | Scalar | MIT ✅ |
| Status page | Uptime Kuma | MIT ✅ |
| Support / chat | Chatwoot CE | MIT ⚠️ |
| Audit log | in-house Kafka → ClickHouse | Apache 2.0 ✅ |
| Cache / queue (legacy only) | Valkey + BullMQ | BSD-3 / MIT ✅ |

Every default above is overridable per app with an ADR. Do not vary defaults silently.

---

## 17. Compose recipes

Self-host recipes for the seven foundational tools above. Each file is independently runnable and composable with the rest of the stack (see [docker-compose-variants.md](../edge-obs/docker-compose-variants.md)).

| Tool | Purpose | File | Default host port |
|---|---|---|---|
| Lago | Billing & metering | [lago.compose.yml](../../../docker/lago.compose.yml) | 8101 (UI), 8102 (API) |
| Umami | Web analytics | [umami.compose.yml](../../../docker/umami.compose.yml) | 8103 |
| Keycloak | Identity / OIDC | [keycloak.compose.yml](../../../docker/keycloak.compose.yml) | 8104 |
| Unleash | Feature flags | [unleash.compose.yml](../../../docker/unleash.compose.yml) | 4242 |
| Meilisearch | Search | [meilisearch.compose.yml](../../../docker/meilisearch.compose.yml) | 7700 |
| Uptime Kuma | Status page | [uptime-kuma.compose.yml](../../../docker/uptime-kuma.compose.yml) | 8105 |
| Chatwoot | Customer support | [chatwoot.compose.yml](../../../docker/chatwoot.compose.yml) | 8106 |
| **Master** | Includes all seven | [compose.saas-commons.yml](../../../docker/compose.saas-commons.yml) | — |

Common conventions:

- All services join the shared external network `saas-commons`; HTTP-exposing services additionally attach to `obs` so the OTel collector / Prometheus exporters can reach them.
- Each tool with state owns a dedicated Postgres/Redis instance — they pin to specific upstream versions (Lago → PG 14, Chatwoot → PG 12, others → PG 16) and bundle migrations that own the schema. Sharing the app's Patroni-managed PG 16 cluster is not supported.
- Required secrets fail-fast via `${VAR:?msg}`. See [`.env.saas-commons.example`](../../../.env.saas-commons.example) for the full list (Lago RSA key + 3 encryption keys, Chatwoot/Lago Rails `SECRET_KEY_BASE`, Meilisearch master key, Keycloak admin bootstrap password, Umami JWT secret).
- Volumes named `<tool>-<role>` (e.g., `lago-postgres-data`, `keycloak-postgres-data`, `meilisearch-data`, `uptime-kuma-data`, `chatwoot-storage`).
- Conservative `deploy.resources.limits` sized for a 16-32 GiB single-host dev machine — bump per upstream recommendation when scaling out.

Run the full SaaS-commons stack:

```bash
cp .env.saas-commons.example .env.saas-commons   # fill in REQUIRED secrets
docker network create saas-commons
docker compose -f docker/compose.saas-commons.yml --env-file .env.saas-commons up -d
```

OIDC wiring: Unleash speaks OIDC natively (configure via UI → Identity Providers → OIDC with Keycloak's `.well-known` URL). Chatwoot CE does not — front it with `oauth2-proxy` against Keycloak, or use SAML.


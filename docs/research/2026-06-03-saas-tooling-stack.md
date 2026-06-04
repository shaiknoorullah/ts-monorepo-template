---
title: OSS SaaS tooling stack research (feature flags / analytics / CDP / billing / support / CRM / marketing / SEO / live chat / session recording / auth)
date: 2026-06-03
status: research output (advisory; not yet folded into spec/plan)
authors: claude-opus-4-7 via 12 teams of Feynman research agents (48 angle + 12 synthesis = 60 agents)
spec_reference: docs/superpowers/specs/2026-06-03-platform-foundation-design.md
plan_reference: docs/superpowers/plans/2026-06-03-platform-foundation.md
---

# OSS SaaS tooling stack research

> Twelve teams of Feynman research agents surveyed the 2026 state of OSS tooling
> across feature flags, analytics, CDP, billing, support, CRM, marketing, SEO,
> live chat, session recording, and auth. Each team ran four angle agents
> (tool landscape, integration, license deep-dive, recommendation) plus one
> synthesizer.

## TL;DR — verdict table

| #   | Category                        | Verdict                  | Fit / 100 | Top pick                                  | License                    | Default profile bundles |
| --- | ------------------------------- | ------------------------ | --------- | ----------------------------------------- | -------------------------- | ----------------------- |
| 1   | Feature flags + experimentation | `include-day-1`          | 90        | **OpenFeature + flagd + GrowthBook**      | Apache-2.0 + MIT           | all 5 profiles          |
| 2   | Product analytics               | `include-day-1`          | 86        | **PostHog (FOSS image)**                  | MIT                        | all 5 profiles          |
| 3   | Web analytics                   | `include-day-1`          | 90        | **Umami**                                 | MIT                        | all 5 profiles          |
| 4   | CDP + event stream              | `include-day-2`          | 82        | **Jitsu**                                 | MIT                        | hobby + above           |
| 5   | Customer support                | `include-only-on-demand` | 82        | **Chatwoot CE**                           | MIT (core)                 | startup-small + above   |
| 6   | Marketing automation + email    | `include-day-2`          | 82        | **Listmonk**                              | AGPL-3.0                   | hobby + above           |
| 7   | CRM                             | `include-only-on-demand` | 78        | **Twenty CRM**                            | AGPL-3.0 + EE              | startup-small + above   |
| 8   | Billing + subscription          | `include-day-2`          | 78        | **OpenMeter**                             | Apache-2.0                 | startup-small + above   |
| 9   | SEO + GTM + landing             | `include-day-1`          | 92        | **Astro 5 + sitemap + astro-seo + Umami** | MIT / Apache-2.0 / MPL-2.0 | all 5 profiles          |
| 10  | Live chat + community           | `include-day-2`          | 82        | **Chatwoot CE**                           | MIT (core)                 | startup-small + above   |
| 11  | Session recording               | `include-day-2`          | 78        | **PostHog session replay**                | MIT                        | hobby + above           |
| 12  | Auth + user mgmt                | `include-day-1`          | 92        | **Keycloak** (CONFIRMS spec choice)       | Apache-2.0                 | startup-small + above   |

5 categories ship Day-1; 5 ship Day-2; 2 are on-demand only. No category was rejected entirely.

## Headline recommendations (cross-team)

1. **PostHog FOSS image is a force-multiplier.** It wins product analytics AND session recording outright, and can also serve as feature-flag and experimentation backend (the launcher should bundle `posthog-foss` as a single Helm chart that toggles flags/analytics/replay modules per profile). The non-OSS `ee/` directory MUST be excluded — use the official `posthog-foss` mirror image.

2. **License safety: 8 of 12 top picks are fully permissive** (MIT / Apache-2.0 / MPL-2.0). Three picks have a CAUTION flag: Listmonk (AGPL-3.0 for marketing automation), Twenty CRM (AGPL + Enterprise License). Chatwoot is MIT core but has a proprietary `enterprise/` directory we must exclude. Only one angle returned a SAFE flag uniformly — most categories required active license vetting per pick.

3. **Spec validation: Keycloak (Apache-2.0) is the right auth choice.** The auth team explicitly evaluated Ory, Authentik, ZITADEL, Logto, FusionAuth — and confirmed Keycloak fits ts-monorepo-template better than any alternative as of 2026. No spec change needed.

4. **OpenFeature is the only correct integration surface for feature flags.** Don't couple the launcher CLI to one vendor SDK. Ship OpenFeature SDKs in the Go/Python/Rust/TS apps with flagd as the default backend for Just Me / Side Project tiers, and GrowthBook as the optional experimentation backend for Scaling Startup / Production at Scale.

5. **The 5 Day-1 categories deserve XRD claims** in a follow-up to Phase 8/9: `XFeatureFlag` (wraps flagd or GrowthBook Composition), `XProductAnalytics` (wraps PostHog FOSS), `XWebAnalytics` (wraps Umami), `XSEOSitePack` (wraps Astro + astro-seo configs), `XAuth` (wraps Keycloak — already partly in `XKeycloakClient`). Add to spec Section 8 — Bundle E: SaaS surface XRDs.

6. **Day-2 categories** (CDP, billing, marketing, session recording, live chat) ship as Helm charts referenced from per-app `values.{env}.yaml` and as `task setup:<tool>` launcher verbs. No XRD until adoption demands one.

7. **On-demand categories** (customer support, CRM) get scaffold-only treatment — `task setup:chatwoot` writes a values.yaml stub but doesn't bundle the chart by default. Founders who need these enable explicitly.

## Cross-team fold-ins (for a follow-up PR to spec/plan)

- Spec Section 8 — Bundle E (5 new XRDs): `XFeatureFlag`, `XProductAnalytics`, `XWebAnalytics`, `XSEOSitePack`, `XAuth`.
- Spec Section 11 — MCP server: add tools `recommend_saas_stack` (input: profile + needs; output: subset of these 12 categories with picks), `apply_saas_recommendation` (claims an XRD or installs a Helm release per category), `audit_licenses` (scans installed Helm charts for license-flag distribution).
- Spec Section 2.5 — Launcher CLI verbs: `task setup:posthog`, `task setup:umami`, `task setup:keycloak`, `task setup:flagd`, `task setup:openmeter`, `task setup:chatwoot`, `task setup:twenty`, `task setup:listmonk`, `task setup:jitsu`.
- Spec Section 17 — Non-goals revised: explicitly DO NOT bundle Unleash (AGPL contagion risk for managed offerings).
- Spec Section 18 — Glossary additions: OpenFeature, flagd, PostHog FOSS image, AGPL contagion, SSPL trap.
- New ADR: `docs/adrs/0015-saas-tooling-license-policy.md` — SAFE / CAUTION / AVOID license matrix.
- New ADR: `docs/adrs/0016-posthog-as-shared-analytics-and-replay-backend.md` — single PostHog deployment serves analytics + replay + feature flags.

---

## Team 1 — Feature flags + experimentation

### Synthesized verdict

- **Verdict:** `include-day-1`
- **Fit score:** 90 / 100
- **Top pick:** **OpenFeature (spec + SDKs) with flagd as default backend and GrowthBook OSS core as opt-in for experimentation**
- **License:** `Apache-2.0 (OpenFeature + flagd); GrowthBook core is MIT (Expat) with isolated enterprise/ dirs excluded`
- **Default profile bundles:** `p-solo`, `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angle reports converge on the same architecture: OpenFeature as the SDK contract at the call site, plus a swappable backend chosen per profile. This is the only design that is unambiguously license-safe for a commercial open-core template across all five revenue tiers. OpenFeature is CNCF Incubating, Apache-2.0, polyglot (TS/Go/Python/Rust/Java/.NET) — a natural fit beside the template's existing OTel + Crossplane + Argo stack, and it decouples app code from any specific vendor. flagd (Apache-2.0, OpenFeature reference daemon) is the GitOps-native default for tiers 1-2: a single Go binary, flags live as JSON/YAML in a ConfigMap or Git, reconciled by the existing Argo CD + ApplicationSet spine with zero new DB. For tiers 3-5 where real experimentation matters, GrowthBook OSS core (MIT, with three clearly-fenced enterprise/ directories that we never bundle) brings a Bayesian + frequentist + CUPED A/B engine, an official Helm chart, edge SDKs for Workers/Lambda/Fastly, and — critically for the Aegis MCP audience — an official MCP server with 14 tools for create_flag / set_targeting_rule / create_experiment. Unleash is the market leader by stars but is rejected as default because its server is AGPL-3.0 (the marketing 'Apache 2.0' claim is wrong — verified against the actual LICENSE file), its OSS Edge proxy reaches EOL Dec 31 2026, and its Enterprise build enters read-only mode without a license key — all three create traps for a sold-and-operated template. Flipt's server is GPL-3.0 (only the client is MIT) and is excluded from default bundling for the same reason. PostHog (MIT core, ee/ under ELv2) and Flagsmith (BSD-3 core, separate proprietary EE repo) are documented as first-class swap-in providers via OpenFeature but not bundled by default — PostHog only when the analytics team's pick is also PostHog (one Compose stack covers three categories), Flagsmith for users who want a flag-only UI without the GrowthBook Mongo dependency. SaaS-only candidates (Statsig, ConfigCat, Hypertune, Bucket/Reflag, LaunchDarkly) are supported as opt-in OpenFeature providers — they cannot anchor a self-host-first template but matter as paid upgrade paths. The single biggest license trap in this category is the casual misclaim that Unleash is Apache-2.0; the team verdict treats that as AVOID for bundling, CAUTION for user-installable, and explicitly pins the default to AGPL-free components. Profile mapping is honest: Just Me / Side Project get OpenFeature + flagd (zero infra, flags-as-files in Git); Early Startup adds GrowthBook with its UI + experimentation; Scaling Startup adds the GrowthBook proxy for SSE streaming + edge eval; Production at Scale runs GrowthBook HA + flagd sidecars via the OpenFeature Operator for sub-ms in-process evaluation, with a documented one-line provider swap to LaunchDarkly/Statsig for teams that want hosted.

**Integration outline:**

1. Create `packages/flags` workspace exporting a single typed `flag(key, defaultValue, ctx)` helper built on `@openfeature/server-sdk` (Apache-2.0) + `@vercel/flags-sdk` with `@flags-sdk/openfeature` adapter for the Next.js marketing site + launcher UI (server-only evaluation, no FOUC). Every TS/Go/Python/Rust app calls only this helper — backend is swappable. 2) Ship one `XFeatureFlagBackend` XRD with three composition variants: `flagd` (default tiers 1-2), `growthbook` (default tiers 3-5), `unleash` (opt-in only). Each composition installs the appropriate Helm release via provider-helm and wires provider-terraform to the matching upstream Terraform provider (Unleash/terraform-provider-unleash, GrowthBook via REST) so individual flags become Crossplane claims — not just the install. Pin GrowthBook chart to `oci://ghcr.io/growthbook/charts/growthbook` and Unleash chart to the OSS image (`unleashorg/unleash-server`), never `unleash-enterprise`. 3) flagd path: deploy OpenFeature Operator (pin to v0.5+ with v1beta1 CRDs), use `flagd-proxy` sync mode (not raw Kubernetes API polling), scaffold a `flags/` directory in the template that Argo CD reconciles as `FeatureFlag` CRs. 4) GrowthBook path: bundle Helm chart but `.helmignore` / build-step-exclude the `packages/back-end/src/enterprise`, `packages/front-end/enterprise`, `packages/shared/src/enterprise` directories so vendored source stays MIT-clean. Document that bandits / CUPED / sequential testing require a paid GrowthBook Enterprise license — do not ship those features by default. 5) Launcher CLI verb `task setup:flags <provider>` writes the OpenFeature provider config, installs the right Helm release, and registers a Kargo-promotable `flags-config` ConfigMap so flag rollouts follow the same promotion path as other config. 6) Phase 12 Aegis MCP wiring: when GrowthBook is selected, re-export GrowthBook's official MCP server (14 tools) — scope the admin API key per-environment via existing provider-keycloak role mappings, never grant production-write by default. When flagd is selected, write a thin wrapper that exposes `FeatureFlag` CRD CRUD as MCP tools (create / list / patch rules / delete). Either way, Aegis learns one OpenFeature evaluation context schema. 7) Ship `docs/LICENSE-COMPATIBILITY.md` mapping every supported backend to its license, calling out the AGPL/GPL trap for users who self-host Unleash/Flipt as part of their own SaaS offering, and listing PostHog ee/ + Flagsmith EE + GrowthBook enterprise/ as do-not-bundle paths. 8) Default CI policy: lockfile + Docker image scan in CI to fail-fast if any forbidden path (Unleash Enterprise image, GrowthBook enterprise/ dir, PostHog ee/ dir) sneaks into the final artifact.

**Risks:**

- AGPL trap on Unleash: marketing pages and many secondary sources misclaim Apache-2.0; the actual LICENSE file is AGPL-3.0. Anyone reading a summary will misclassify it. Lock the template defaults to flagd / GrowthBook and require explicit user opt-in for Unleash with a launcher warning.
- GrowthBook's enterprise/ directories live inside the same Git repo as the MIT core — pnpm / npm / Docker multi-stage builds can accidentally vendor them via lockfiles or naive Dockerfiles. Final container images must be scanned to ensure no enterprise/ paths are shipped; prefer consuming GrowthBook only as a pre-built Helm chart and never git-submodule the source.
- Unleash Edge OSS reaches EOL Dec 31 2026; anyone bootstrapping self-hosted Unleash at scale today faces a forced migration to Enterprise Edge (paid) or back to flagd/Flagsmith. This is a hard deadline that weakens Unleash as a 2026+ default even if AGPL were not a concern.
- Unleash v6.7+ Enterprise self-hosted enters READ-ONLY mode without a valid license key — pinning to the OSS Apache-2.0 image (`unleashorg/unleash-server`) is mandatory; an accidental flip to `unleash-enterprise` in Helm values would brick customer deployments.
- MongoDB dependency: GrowthBook requires Mongo, which conflicts with the otherwise PG-everywhere posture of the template. Adds a new database to operate at the Early Startup tier and above — document the ops surface honestly.
- OpenFeature Operator default sync mode polls the Kubernetes API for FeatureFlag CRs from every pod; at scale this hits the API server hard. Compositions must use `flagd-proxy` sync mode for any tier above Side Project.
- AGPL §13 network-use is a legal gray zone when WE operate flag infrastructure as part of a managed/SaaS offering — even if customers run it themselves on our charts. The safe stance is: bundle nothing AGPL/GPL on the server side; document Unleash/Flipt as user-installable only with a license warning.
- Statsig was acquired by OpenAI for $1.1B in 2025 — roadmap and licensing for the OSS SDKs is now uncertain. Support as an OpenFeature provider but never make it a default for an open-source-first template.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **OpenFeature (spec + SDKs)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **flagd (OpenFeature reference daemon)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **GrowthBook** — `MIT (core) + GrowthBook Enterprise License (enterprise dirs)` — self-host: yes — maturity: production-grade
- **Flagsmith** — `BSD-3-Clause` — self-host: yes — maturity: production-grade
- **PostHog (feature flags module)** — `MIT (core) + ee dir license` — self-host: yes — maturity: production-grade
- **Flipt v2** — `Apache-2.0 (server) + MIT (clients)` — self-host: yes — maturity: production-grade
- **GO Feature Flag** — `Apache-2.0` — self-host: yes — maturity: usable
- **Unleash** — `AGPL-3.0 (OSS) + commercial Enterprise` — self-host: yes — maturity: production-grade

A feature flag is a runtime switch: instead of `if (true)` baked into your binary, your code asks a rules engine "should user X see feature Y right now?" and the engine answers based on a config you can change without redeploying. That single primitive unlocks gradual rollouts (10% then 50% then 100%), kill switches (flip a bad release off in seconds), audience targeting (beta-list, region, plan tier), and A/B tests (variant A vs B, then measure conversions).

In 2026 the landscape has cleanly split into four shapes, and which one you bundle into a commercial template depends almost entirely on **license** and **who runs the control plane**.

1. **The standard, not a product** — OpenFeature is a CNCF Incubating spec (Apache-2.0) that defines a vendor-neutral SDK API. You write `client.getBooleanFlag("new-checkout", false, ctx)` once and swap providers later. Every serious flag vendor now ships an OpenFeature provider — Flagsmith, Unleash, GrowthBook, ConfigCat, Split, Statsig, PostHog, flagd, GO Feature Flag, Hypertune, DevCycle. For a template that needs to support all five revenue tiers (USD 0 → USD 2k+), OpenFeature is the _only_ sane integration surface.

2. **GitOps-native, zero control plane** — flagd (Apache-2.0, OpenFeature reference impl) and GO Feature Flag (Apache-2.0). Flags live as JSON/YAML in a Git repo or ConfigMap; a tiny Go binary evaluates them. No DB, no UI required, perfect for "Just Me" / "Side Project" tiers where the user already has Argo CD.

3. **Full open-source platforms with UIs** — Flagsmith (BSD-3), GrowthBook (MIT core + Enterprise dirs), PostHog (MIT, includes flags + analytics + replays), FeatBit (MIT), Flipt (Apache-2.0, now Git-native v2). These run as Docker/Helm, have admin UIs, support targeting + percentage rollouts. SAFE to bundle.

4. **The AGPL trap** — Unleash is the market leader by stars (13.5k) and enterprise adoption, but its OSS core is **AGPL-3.0**, and its Edge proxy goes EOL Dec 31 2026 (Enterprise-only after that). For a commercial template, AGPL is CAUTION: if you bundle the Unleash server _and run it as part of your managed offering_, the network-copyleft clause attaches to anything linked into it. If customers deploy Unleash themselves it's fine — but then you can't promise drop-in support without legal review.

The experimentation angle (A/B tests with statistical rigour — CUPED, sequential testing, Bayesian, multi-armed bandits) is dominated by **GrowthBook** (MIT core, bandits in the paid Enterprise dir) and **PostHog** (MIT, simpler stats but unified with replays + analytics). Statsig is best-in-class but SaaS-only and now OpenAI-owned.

Practical recipe for the ts-monorepo-template: ship an **OpenFeature SDK** at every tier, default to **flagd** (Argo-CD friendly, zero ops) for tiers 1-2, **GrowthBook** (MIT) for tiers 3-5 when experimentation is required, and **PostHog** if the user already adopted PostHog for analytics. Document Unleash and Flagsmith as supported swap-in providers but do not bundle Unleash by default.

**Key findings:**

- OpenFeature is a CNCF Incubating project (since Nov 2023) and the de-facto vendor-neutral SDK standard in 2026 — every major provider ships an OpenFeature adapter, including Flagsmith, Unleash, GrowthBook, ConfigCat, Split, Statsig, PostHog, flagd, GO Feature Flag, Hypertune, DevCycle, Kameleoon. SDK spec is Apache-2.0. Use it as the integration surface; never couple application code to a specific vendor SDK.
- Unleash core is AGPL-3.0 (not Apache-2.0 as some blogs claim) — 13.5k GitHub stars, latest v7.6.4 (May 2026). AGPL is CAUTION for commercial bundling: if the template deploys Unleash as part of a managed offering, the network-copyleft clause attaches. Self-host by the end customer is fine.
- Unleash Edge OSS reaches end-of-life Dec 31 2026 — after that, scaled self-hosters need Enterprise Edge (paid). This materially weakens Unleash's free-tier story for any new adoption in 2026+.
- GrowthBook is MIT-licensed at its core with a separate GrowthBook Enterprise License covering specific `enterprise/` directories (CUPED, multi-armed bandits, sequential tests, sticky bucketing). 7.8k stars, 584 commits in last year, last updated Jun 2 2026 — actively developed.
- Flagsmith is BSD-3-Clause (most permissive of the platforms in this comparison), free to self-host with no feature limits, no request caps, no user caps. Best 'no surprises' license profile for a commercial template.
- PostHog is MIT (with an `ee/` dir under separate license) and bundles feature flags + analytics + session replay + experiments in one Docker Compose stack — single most efficient way to cover multiple SaaS-tooling categories at once if the team already adopted PostHog.
- Flipt v2 (Apache-2.0) is now Git-native: flags live as files in your repo, evaluated by a single Go binary with SQLite. Zero DB, single binary — strongest fit for the 'Just Me' tier alongside flagd.
- flagd (Apache-2.0, OpenFeature reference implementation) is the canonical GitOps flag daemon — JSON in a ConfigMap or HTTP endpoint, evaluated by 925-star Go binary, latest v0.16.0 (Jun 1 2026). Ideal default for tiers 1-2 because it requires no control plane UI.
- FeatBit (MIT, 1.8k stars, latest v5.3.6 May 2026) is an enterprise-grade self-host platform built in C# — viable but smaller community than Flagsmith/GrowthBook; mention as alternative, not primary.
- Statsig was acquired by OpenAI for USD 1.1B (2025) — SaaS-only, has OSS SDKs but not OSS server. Don't bundle but support via OpenFeature provider.
- Hypertune is SaaS-only with type-safe codegen and tight Vercel/Next.js Edge integration — relevant only if the template adopter is Vercel-shop; not OSS server.
- Bucket.co rebranded to Reflag in 2026; it's SaaS-only and B2B-SaaS-focused, no OSS server. Skip for self-host story.

**Gotchas:**

- AGPL contagion risk: Unleash server linked into a managed offering can force source disclosure of the whole stack. Docker isolation helps but is not a clean legal answer — get review before bundling Unleash in a paid template tier.
- Unleash Edge OSS EOL Dec 31 2026 is a real deadline — anyone bootstrapping a self-hosted Unleash today must plan a forced migration to Enterprise Edge or back away to flagd / Flagsmith.
- GrowthBook's bandits / CUPED / sequential tests live in `packages/*/enterprise/` directories under a non-OSS Enterprise License — you can use the MIT core for free, but advanced experimentation features require a paid license, and bundling those dirs into a redistributed template is a license violation.
- PostHog's `ee/` directory is non-OSS. The core (MIT) includes flags + analytics + replay — but if you fork and ship advanced features (like Cohorts on Demand) you cross into the ee/ license.
- OpenFeature is a spec, not a runtime — every adopter still needs an evaluation backend. Don't promise 'no vendor' just because you adopted OpenFeature; you still pick flagd/GrowthBook/etc. underneath.
- Bucket.co rebrand to Reflag means stale documentation and SDK names; package names may still be @bucketco/\* in npm — verify before linking.
- Statsig under OpenAI ownership has uncertain roadmap for the OSS SDKs — fine as a supported provider via OpenFeature, but don't make it the default for an open-source-first template.
- FF4j is Java-only (Spring Boot) — not suitable as the default for a polyglot Nx monorepo template that also serves Go/Python/Rust/TS apps.

**Recommendation (this angle):** For the ts-monorepo-template: **Adopt OpenFeature (Apache-2.0) as the single SDK surface across all five revenue tiers.** It costs nothing, has zero license risk, and decouples application code from any specific backend so the founder/junior-engineer audience can swap providers as they grow.

Bundle two evaluation backends by default:

- **flagd (Apache-2.0)** for tiers 1-2 (Just Me / Side Project) — single Go binary, flags live in Git/ConfigMap, integrates with the Argo CD + ApplicationSet pattern the template already ships. Zero ops surface.
- **GrowthBook OSS core (MIT)** for tiers 3-5 (Early Startup / Scaling / Production at Scale) — provides the full UI, percentage rollouts, audience targeting, and basic A/B testing under MIT. Document that advanced stats (CUPED, bandits, sequential) require GrowthBook's commercial Enterprise license — do NOT bundle the `enterprise/` directories.

Document **Flagsmith (BSD-3)** and **PostHog (MIT)** as first-class swap-in providers via OpenFeature — PostHog especially when the user also picks PostHog for analytics/session-replay (single Docker Compose serves three SaaS-tooling categories).

**Explicitly do not bundle Unleash by default** despite its market leadership. AGPL-3.0 + the Dec 31 2026 Edge OSS EOL combine into a poor base for a commercial template. Support it as an OpenFeature-discoverable provider users can opt into, but make the default safer.

For the Aegis MCP audience: expose flag CRUD via the same OpenFeature evaluation context shape regardless of backend, so the AI agent only learns one schema.

**Citations:**

- [Unleash GitHub (license, version, stars)](https://github.com/Unleash/unleash)
- [Unleash LICENSE — AGPL-3.0](https://github.com/Unleash/unleash/blob/main/LICENSE)
- [Unleash Edge OSS Deprecation Before Dec 31 2026](https://pocketlantern.dev/briefs/unleash-edge-oss-deprecation-before-december-31-2026)
- [Unleash Enterprise Edge overview](https://docs.getunleash.io/unleash-edge)
- [OpenFeature CNCF project page](https://www.cncf.io/projects/openfeature/)
- [OpenFeature becomes a CNCF incubating project (2023)](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/)
- [GrowthBook GitHub](https://github.com/growthbook/growthbook)
- [GrowthBook LICENSE — MIT + Enterprise](https://github.com/growthbook/growthbook/blob/main/LICENSE)
- [Flagsmith GitHub](https://github.com/Flagsmith/flagsmith)
- [Flagsmith LICENSE — BSD-3-Clause](https://github.com/Flagsmith/flagsmith/blob/main/LICENSE.md)
- [flagd GitHub (Apache-2.0, v0.16.0)](https://github.com/open-feature/flagd)
- [PostHog GitHub (MIT + ee dir)](https://github.com/posthog/posthog)
- [Flipt GitHub (Apache-2.0, Git-native v2)](https://github.com/flipt-io/flipt)
- [FeatBit GitHub (MIT)](https://github.com/featbit/featbit)
- [GO Feature Flag GitHub (Apache-2.0)](https://github.com/thomaspoignant/go-feature-flag)

### Angle: Integration mechanics

**License flag:** `SAFE`

**Top picks:**

- **OpenFeature (spec + SDK)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **flagd + OpenFeature Operator** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **GrowthBook (open-core)** — `MIT (core) + proprietary enterprise dir` — self-host: yes — maturity: production-grade
- **Unleash (OSS edition)** — `Apache-2.0 (core) + proprietary Enterprise image` — self-host: yes — maturity: production-grade
- **Flagsmith** — `BSD-3-Clause (core) + proprietary EE` — self-host: yes — maturity: production-grade
- **Vercel Flags SDK** — `Apache-2.0` — self-host: yes — maturity: production-grade

A feature flag is just a boolean (or string, or JSON) you can flip at runtime without redeploying — "show new dashboard for 10% of users who are on Pro plan and live in EU." The tricky parts are: (1) evaluating the flag the same way on the server and the client without a flash of wrong content, (2) shipping flag changes safely with audit + rollback, (3) doing real statistical experimentation (A/B + multi-armed bandits) on top of the same primitive, and (4) giving AI agents a typed API so they can read/create flags without scraping a UI.

For our open-core template that ships to founders, vibe-coders, and an Aegis MCP agent, you want exactly one abstraction at the call site and freedom to swap the backend per profile. That abstraction is **OpenFeature** (CNCF incubating, Apache-2.0). OpenFeature is a spec + SDK. You call `client.getBooleanValue("new-checkout", false, ctx)` once; underneath, a "provider" plugs in whichever backend the user picked — flagd (free, in-cluster), Unleash (self-hosted), GrowthBook (open core, MIT + experimentation), or a SaaS like LaunchDarkly later. Switching backends becomes a one-line config change. That is _the_ integration story for a polyglot template.

Underneath OpenFeature, the template should ship **two opinionated backends**, one per cost profile:

1. **flagd + OpenFeature Operator** for "Just Me / Side Project" (USD 0). flagd is a tiny Go daemon. The Operator parses a `FeatureFlag` CRD (a Kubernetes-native JSON spec) and either runs flagd centrally or injects it as a sidecar. Because it's a CRD, you can manage flags via _git_ — which means our launcher can scaffold a `flags/` directory and Argo CD reconciles flag changes the same way it reconciles Deployments. No DB, no UI, $0.

2. **GrowthBook** for "Early Startup / Scaling Startup" (USD 30-1500). Open-core MIT (with a separate `packages/enterprise` directory under a proprietary licence — we never bundle that). MongoDB-backed. Has an official Helm chart, an official OpenFeature provider, _and_ an official MCP server with 14 tools that Aegis can call directly to create flags, set targeting rules, and analyse experiments. Crucially it ships **multi-armed bandits, CUPED, sequential testing, Bayesian + frequentist** as core features — so users grow from kill-switches into proper experimentation without buying a second product.

Unleash is the obvious third option (Apache-2.0 OSS core + proprietary Enterprise images), and we ship an OpenFeature provider for it too — but we don't make it the default because its experimentation/bandit story is weaker than GrowthBook's and its strategy-extension model is less git-friendly than flagd's CRDs.

The wiring into our monorepo is mechanical: one `packages/flags` workspace exposes a typed `flag(...)` helper built on `@openfeature/server-sdk` + `@vercel/flags-sdk` (server-only evaluation, no FOUC). One `task setup:flags <provider>` verb in the launcher CLI writes the provider config, installs the right Helm chart via our existing XRD layer, and registers a Kargo-promotable `flags-config` ConfigMap. The MCP server (Phase 12) re-exports GrowthBook's MCP tools when GrowthBook is selected; for flagd we wrap the CRD CRUD as MCP tools ourselves. All three options are commercial-friendly to bundle.

**Key findings:**

- OpenFeature is CNCF Incubating (since Nov 2023), Apache-2.0, and is THE abstraction layer to call. It lets us swap providers (flagd/Unleash/GrowthBook/Flagsmith/LaunchDarkly) without touching app code — exactly what an open-core multi-profile template needs.
- Vercel Flags SDK now ships an official OpenFeature adapter (`@flags-sdk/openfeature`). For our Next.js marketing site + launcher UI it gives server-only evaluation (no FOUC), edge compatibility, and a Flags Explorer panel — all Apache-2.0.
- flagd is a tiny Go daemon (Apache-2.0). The OpenFeature Operator injects it as a sidecar via `FeatureFlag` and `FeatureFlagSource` CRDs (v1beta1). This makes flags _gitops-native_: edit YAML → Argo CD reconciles. Perfect default for `Just Me` profile (USD 0, no DB, no UI).
- GrowthBook core is MIT; the `packages/enterprise` directory is under a separate GrowthBook Enterprise License — we must NOT bundle that directory. Core has bandits, CUPED, Bayesian + frequentist + sequential testing as standard features (not paywalled), per the public docs.
- GrowthBook ships an official MCP server (github.com/growthbook/growthbook-mcp, 14 tools) — drop-in for Phase 12 Aegis integration. Tools include create_flag, set_targeting_rule, create_experiment, search_docs. This is one of the strongest agent stories in the OSS flag space.
- Unleash is Apache-2.0 for the OSS image only; the Enterprise image at `unleash-enterprise` is a proprietary licensed binary that requires UNLEASH_LICENSE env var, and the instance enters read-only mode when the licence expires. The Helm chart defaults to OSS image — keep it that way to stay license-safe.
- Both Unleash and GrowthBook have official Helm charts (artifacthub: `unleash/unleash` and `growthbook/growthbook`). Both have official Terraform providers (`Unleash/terraform-provider-unleash`, GrowthBook via REST). That means our existing provider-terraform Crossplane bridge can manage _flags themselves_ as XRD claims — not just the install.
- Flagsmith is BSD-3-Clause core + proprietary EE for RBAC/SAML. Helm chart at `flagsmith/flagsmith-charts`. Solid alternative but its OpenFeature provider is community-grade and its bandit story is missing — so it slots as a third tier, not a default.
- PostHog feature flags piggyback on PostHog itself (MIT for core, but the cloud bits and some self-host extras vary). For our template we route PostHog to the Analytics team's recommendation, not the Flags team — coupling flags to the analytics DB is a footgun for the Side Project profile.
- ConfigCat, Hypertune, Bucket.co are SaaS-only (or essentially SaaS-only). Cannot self-host = cannot be the default for Just Me / Side Project. They remain available via OpenFeature providers if a user opts in, but not bundled.
- Unleash Edge (Rust, Apache-2.0) is the successor to unleash-proxy and is what we should expose as the ingress for browser SDKs when Unleash is selected — single binary, scales horizontally, caches in memory.
- FF4j is essentially dormant for 2026 use (Java-centric, last meaningful release activity not matching our TS-first launcher audience). Skip.

**Gotchas:**

- GrowthBook's `packages/enterprise` directory is NOT MIT — if you `git submodule` or copy the whole monorepo, you inherit a proprietary licence. Only bundle MIT-licensed paths or, safer, consume GrowthBook only as a pre-built Helm chart and never vendor its source.
- Unleash Helm chart `values.yaml` defaults can be flipped to `unleash-enterprise` images. That image is proprietary and requires a paid licence to function past expiry. Pin the default values to the OSS image and add a launcher prompt before any user opts into Enterprise.
- OpenFeature Operator CRDs migrated to `v1beta1` at operator v0.5.0 — older `v1alpha1` examples on the internet will silently fail. Pin to operator >=v0.5 and to the v1beta1 schema in our XRD compositions.
- Vercel Flags SDK is server-only by design (no client evaluation) to prevent FOUC. If a user wants pure SPA evaluation they need Unleash Edge or flagd's HTTP/gRPC endpoint exposed to the browser — don't bundle the SDK assuming SPA works.
- Crossplane provider-terraform can wrap the Unleash/GrowthBook Terraform providers, but Terraform state lives inside the Workspace CR. Use management-policies + `forProvider.source: Inline` to keep state per-claim; otherwise multiple flag claims will race on a shared state file.
- The default OpenFeature Operator sync mode polls the Kubernetes API for FeatureFlag CRs from every pod — at scale this hits the API server. Use the `flagd-proxy` sync mode in any composition we ship for >Side Project profile.
- GrowthBook's MCP server requires an admin API key with broad scopes. For Aegis integration scope the key per-environment and never give it production-write by default — wrap it in our existing Crossplane provider-keycloak role mapping.
- Flagsmith's BSD core does not include their Edge Proxy in some packaging — verify which charts you actually pull. Their Edge product is a separate SaaS tier.

**Recommendation (this angle):** Ship a layered default: (1) **OpenFeature** as the only call-site API across all our TS/Go/Python/Rust apps — a `packages/flags` workspace re-exports the typed `flag()` helper built on `@openfeature/server-sdk` + Vercel `@flags-sdk/openfeature`. (2) Two profile-keyed backends behind the same OpenFeature interface, scaffolded by `task setup:flags <provider>`: **flagd + OpenFeature Operator** for `Just Me` / `Side Project` (zero infra, FeatureFlag CRDs in git, reconciled by Argo CD — fits our existing GitOps spine perfectly); and **GrowthBook** (MIT core only — never bundle `packages/enterprise`) for `Early Startup` upward, because it gives bandits + CUPED + Bayesian/frequentist _and_ ships the strongest MCP server in the space (14 tools, official). (3) **Unleash** as the third, opt-in option for teams that already standardised on it — we ship the Helm chart and an OpenFeature provider wiring, pin to the OSS image, and put a launcher warning before any switch to the Enterprise image. (4) For Phase 12 MCP wiring: re-export GrowthBook's MCP tools when GrowthBook is the backend, and write a thin wrapper that exposes flagd's FeatureFlag CRD CRUD as MCP tools when flagd is the backend (Aegis can then create/flip flags via either). (5) For the XRD layer: write one `XFeatureFlagBackend` claim with three composition variants (flagd, unleash, growthbook); each composition installs the right Helm release via provider-helm and configures provider-terraform with the matching upstream TF provider so individual flags become XRD claims too. License posture: **SAFE** — every component bundled is Apache-2.0, MIT, or BSD-3-Clause, with two explicit carve-outs (GrowthBook `packages/enterprise` and Unleash Enterprise image) that we never ship by default.

**Citations:**

- [OpenFeature — CNCF Incubating Project](https://www.cncf.io/projects/openfeature/)
- [OpenFeature Spec on GitHub](https://github.com/open-feature/spec)
- [Vercel Flags SDK — OpenFeature Adapter (Vercel changelog)](https://vercel.com/changelog/flags-sdk-now-supports-openfeature)
- [Vercel Flags SDK OpenFeature Adapter — OpenFeature blog](https://openfeature.dev/blog/vercel-flags-sdk-adapter/)
- [OpenFeature Operator (flagd, FeatureFlag CRD)](https://github.com/open-feature/open-feature-operator)
- [flagd — OpenFeature Operator overview](https://flagd.dev/reference/openfeature-operator/overview/)
- [Unleash — Self-hosting with Helm Charts](https://www.getunleash.io/blog/self-hosting-feature-flags-helm-charts)
- [Unleash Helm Charts repository](https://github.com/Unleash/helm-charts)
- [Unleash License Keys (Enterprise read-only mode on expiry)](https://docs.getunleash.io/using-unleash/deploy/license-keys)
- [Unleash Terraform Provider (official)](https://github.com/Unleash/terraform-provider-unleash)
- [GrowthBook GitHub (MIT core + Enterprise directory)](https://github.com/growthbook/growthbook)
- [GrowthBook Official MCP Server (14 tools, agentic workflows)](https://github.com/growthbook/growthbook-mcp)
- [GrowthBook Helm chart on Artifact Hub](https://artifacthub.io/packages/helm/growthbook/growthbook)
- [Flagsmith Helm Charts (BSD-3-Clause core)](https://github.com/Flagsmith/flagsmith-charts)
- [Crossplane provider-terraform (wraps Unleash/GrowthBook TF providers)](https://github.com/crossplane-contrib/provider-terraform)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **OpenFeature (spec + SDKs, CNCF)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **GrowthBook (core)** — `MIT (Expat) + separate Enterprise dir under commercial license` — self-host: yes — maturity: production-grade
- **flagd (OpenFeature reference daemon)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **PostHog feature flags (core)** — `MIT outside ee/ directory; ee/ under ELv2 (source-available, anti-SaaS)` — self-host: yes — maturity: production-grade
- **Flagsmith (core)** — `BSD-3-Clause core; separate Enterprise Edition repo under commercial license` — self-host: yes — maturity: production-grade
- **Unleash** — `AGPL-3.0 (server) — marketing pages misleadingly call it 'Apache 2.0'` — self-host: yes — maturity: production-grade
- **Flipt** — `GPL-3.0 (server) + MIT (Go SDK/clients)` — self-host: yes — maturity: production-grade
- **FF4j** — `Apache-2.0` — self-host: yes — maturity: usable

Imagine you are building a Lego set that you plan to sell at a store. Some Lego bricks come with a sticker that says "use this however you want, just put my name on the box" (MIT, Apache-2.0, BSD). Other bricks come with a sticker that says "if you put me in your set, your whole set has to be free, and you must hand over the instructions to anyone who plays with it over the internet" (AGPL). And some come with a sticker that says "you can't put me in any set that competes with the brick-maker's own kit" (BUSL, SSPL, Commons Clause).

Feature-flag tools are server software. They run as a daemon that your apps query at runtime to ask "should I show the new checkout flow to this user?" The license matters because we are going to bundle our template as a commercial product, and one Helm chart pointing at the "wrong" Docker image can rope our whole product into an obligation we did not sign up for.

Here is the trap: the marketing pages for Unleash say "open source" everywhere, and casually-sourced AI summaries even claim it is "Apache 2.0". But the LICENSE file in the actual repo is the GNU Affero General Public License v3. That is the strongest copyleft license in common use, and it has a network-use clause: if you modify Unleash and let anyone use it over the network (which a managed SaaS template definitely does), you must publish your modifications under AGPL too. The same is true for Flipt's server (GPL-3.0) — only its Go client SDK is MIT. So merely "shipping a values.yaml that references the Unleash image" is fine — that is mere aggregation — but if our template's installer modifies Unleash, or if we operate it as part of our managed offering, AGPL bites.

The safe candidates fall into three buckets. First, OpenFeature: it is a CNCF spec plus a family of SDKs, all Apache-2.0. It is not a flag store; it is the abstraction layer so you can swap providers later. Bundle it freely. Second, GrowthBook: open-core under MIT for everything that matters (flags, A/B tests, bandits), with a clearly-fenced `packages/*/enterprise` directory under a separate commercial license. As long as we do not include those enterprise folders, we are safe — and they are physically separable. Third, flagd: the OpenFeature reference daemon, fully Apache-2.0, no enterprise carve-out at all.

PostHog and Flagsmith are usable but require more care. PostHog is MIT outside the `ee/` directory but has an `ee/` carve-out under ELv2 (a source-available license that bans offering it as a managed service to third parties). Flagsmith is BSD-3-Clause for the core but has a separate Enterprise Edition repo with production-use restrictions.

So the rule for our template: prefer "abstraction + permissive backend" — wire OpenFeature SDKs into every app, then default the launcher CLI to provision either flagd (zero-cost, Apache-2.0) or GrowthBook (MIT, with bandits + experimentation). Document Unleash and Flipt as user-installable backends but do not bundle their server images in our default values. That way our customers can choose copyleft if they want, but we ship nothing that obligates us.

**Key findings:**

- Unleash server is AGPL-3.0, NOT Apache-2.0 — the LICENSE file at github.com/Unleash/unleash is unambiguously GNU AGPLv3. The README badge and multiple secondary sources (blog posts, AI summaries) misstate the license as 'Apache 2.0'. Always verify LICENSE file directly.
- Flipt has a split license: server is GPL-3.0, but the Go SDK and gRPC client code are MIT. This is deliberate — you can embed the MIT client in proprietary code, but the daemon itself is copyleft.
- OpenFeature is the only candidate that is unambiguously safe to bundle: CNCF-governed, Apache-2.0 across spec + every SDK + flagd reference daemon. CNCF IP policy requires permissive licensing for graduated/incubating projects.
- GrowthBook uses the cleanest open-core split in the category: MIT for everything outside three specific enterprise directories (packages/back-end/src/enterprise, packages/front-end/enterprise, packages/shared/src/enterprise). Excluding those directories at build time is mechanically possible.
- PostHog applies the same pattern as GrowthBook but uses the ELv2 (Elastic License v2) for its ee/ directory — ELv2 is source-available, not OSI-approved, and explicitly forbids 'providing the software to third parties as a managed service.' Bundling ee/ in a sold template is a hard NO.
- Flagsmith core is BSD-3-Clause (clean, permissive, commercial-bundle-friendly) but the Enterprise Edition is in a separate repo with explicit 'cannot be used in production without an Enterprise license' language.
- FF4j is Apache-2.0 and actively maintained (last update May 2026) but is Java-only — not aligned with our polyglot Go/Python/Rust/TS stack as a default. Useful as an OpenFeature provider for Java microservices only.
- Major license-shift precedent: HashiCorp BUSL (2023), Elastic SSPL (2021, then added AGPLv3 in 2024), Redis SSPL (2024, then added AGPLv3 in 2025), MongoDB SSPL (2018). Pattern: vendor adopts permissive license → cloud provider hyperscales it → vendor relicenses to source-available → community forks (OpenTofu, OpenSearch, Valkey). Trust does not recover after relicensing.
- AGPL-3.0 in a self-hosted scenario where the END USER (our customer) operates it is generally fine — the obligation runs to whoever modifies+serves. But if WE operate the flag service AS PART of a managed/SaaS template offering, we trigger AGPL §13 (network-use disclosure). This is the trap for Unleash and Flipt server.
- ConfigCat and Hypertune are SaaS-only — no self-hostable OSS server. Cannot be bundled in a self-host-first template; suitable only as optional OpenFeature providers customers can opt into.
- OpenFeature has official providers for both GrowthBook and Unleash, meaning the abstraction works regardless of backend choice. This makes 'OpenFeature SDK + swappable backend' the canonically safe architecture: we never directly bundle the AGPL/GPL server, we only ship the Apache-2.0 SDK and let users choose.
- Bucket.co is SaaS-only with no self-host option; license-irrelevant for bundling but cannot be a default.

**Gotchas:**

- The 'Apache 2.0' claim for Unleash is wrong everywhere except its own marketing pages — the actual LICENSE file is AGPL-3.0. Anyone reading a summary instead of the raw LICENSE file will get this wrong. Cross-check with git blame on the LICENSE file.
- AGPL §13 network-use clause is triggered by 'interacting with the program through a computer network' — even an internal SaaS-style deployment to our paying customers may count. Legal gray zone; treat AGPL as RED for hosted offerings.
- Open-core 'enterprise' directories are NOT bundled if you build only the OSS targets, but pnpm/npm/Docker multi-stage builds can accidentally vendor them via lockfiles or default Dockerfiles. Audit the final container image for enterprise/ paths.
- ELv2 (PostHog ee/) and BUSL (HashiCorp, Sentry historically) are 'source-available' not 'open source'. They allow viewing source but forbid commercial managed-service use. Easy to misclassify as 'OSS'.
- Unleash announced sunsetting OSS Edge on Dec 31, 2026 — after that, self-hosters at scale need Enterprise Edge, adding a paid dependency. The core Unleash server stays AGPL but the edge proxy story is changing.
- Flagsmith ToS may have additional clauses beyond LICENSE.md — always read TOS + LICENSE together for dual-license projects.
- OpenFeature SDK is safe but the choice of PROVIDER you wire it to determines your exposure. Documenting 'use OpenFeature' is not enough — also pin the default provider's license in the template's README.
- Forking AGPL software to remove the AGPL bits is not legally clean — derivatives inherit the license. Don't try to 'strip AGPL from Unleash' as a workaround.

**Recommendation (this angle):** Default to OpenFeature SDK + flagd (Apache-2.0) as the bundled out-of-the-box backend for Free / Just Me / Side Project tiers — zero license obligation, CNCF-governed, fits the template's polyglot story. Offer GrowthBook (MIT core, excluding `packages/*/enterprise` directories at chart-build time) as the Early Startup / Scaling Startup tier default — it adds the bandits + experimentation + analytics that justify a paid tier. Document Unleash and Flipt as user-installable alternatives but DO NOT bundle their server images in our default Helm values — AGPL/GPL on the server is incompatible with a sold-and-operated managed offering. For PostHog, allow optional integration via OpenFeature provider, but build the default Docker image WITHOUT the `ee/` directory (which is ELv2 source-available and bans managed service use). Avoid ConfigCat / Hypertune / Bucket.co as defaults — SaaS-only candidates that cannot be bundled in a self-host-first template, though they can be optional providers wired via OpenFeature. Ship a one-page LICENSE-COMPATIBILITY.md in the template that maps every bundled backend to its license and explicitly calls out the AGPL/GPL trap for users who self-host Unleash/Flipt as part of their own SaaS offering. License flag for the team's overall pick (OpenFeature + flagd + GrowthBook OSS core): SAFE. License flag for Unleash and Flipt-server: AVOID for bundling, CAUTION for user-installable. License flag for PostHog ee/ and Flagsmith Enterprise: AVOID. License flag for ConfigCat / Hypertune / Bucket.co: irrelevant (SaaS-only).

**Citations:**

- [Unleash LICENSE file (raw GitHub) — confirms AGPL-3.0](https://raw.githubusercontent.com/Unleash/unleash/main/LICENSE)
- [GrowthBook LICENSE file — MIT + enterprise dir carve-out](https://github.com/growthbook/growthbook/blob/main/LICENSE)
- [Flagsmith LICENSE.md — BSD-3-Clause](https://github.com/Flagsmith/flagsmith/blob/main/LICENSE.md)
- [Flipt LICENSE — GPL-3.0 server](https://raw.githubusercontent.com/flipt-io/flipt/main/LICENSE)
- [OpenFeature CNCF project page — Apache-2.0](https://www.cncf.io/projects/openfeature/)
- [flagd LICENSE — Apache-2.0](https://raw.githubusercontent.com/open-feature/flagd/main/LICENSE)
- [PostHog self-host disclaimer (MIT + ee/ carve-out)](https://posthog.com/docs/self-host/open-source/disclaimer)
- [Flagsmith Enterprise Edition restrictions (Help Desk)](https://help.flagsmith.com/en/article/does-the-open-source-version-of-flagsmith-have-any-restrictions-vffxnz/)
- [Unleash feature availability & EOL of OSS Edge Dec 2026](https://docs.getunleash.io/support/availability)
- [Open-source relicensing 2026 timeline (HashiCorp/Elastic/Redis/MongoDB)](https://www.flowverify.co/blog/open-source-relicensing-2026-what-happened)
- [Redis license shift / Valkey community fork analysis](https://socket.dev/blog/redis-license-shift-splits-community)
- [OpenFeature Vendors / provider catalog](https://openfeature.dev/community/VENDORS)
- [FF4j GitHub — Apache-2.0, active 2026](https://github.com/ff4j/ff4j)
- [OSI BSD-3-Clause text](https://opensource.org/license/bsd-3-clause)
- [FlagShark 2026 OSS feature-flag comparison](https://flagshark.com/blog/open-source-feature-flag-tools-compared-2026/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **OpenFeature (spec + SDKs)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **GrowthBook** — `MIT (with enterprise/ dirs under commercial license)` — self-host: yes — maturity: production-grade
- **Vercel Flags SDK** — `MIT (Apache-2.0 compatible, open-source)` — self-host: yes — maturity: production-grade
- **Flagsmith** — `BSD-3-Clause` — self-host: yes — maturity: production-grade
- **Unleash (OSS only)** — `Apache-2.0 (Enterprise build is proprietary + license-keyed)` — self-host: yes — maturity: production-grade
- **flagd + OpenFeature Operator** — `Apache-2.0` — self-host: yes — maturity: usable
- **PostHog feature flags** — `MIT (ee/ dir proprietary)` — self-host: yes — maturity: production-grade
- **Flipt** — `GPL-3.0 (server) + MIT (gRPC client)` — self-host: yes — maturity: production-grade

Imagine you're shipping a new "AI suggestions" panel in your app. You want to: turn it on for 5% of users, ramp to 50%, kill it instantly if it breaks, and measure whether it actually improves conversion. That's the feature-flags + experimentation problem. Three things have to happen: (1) somewhere stores the rule "5% of users with email ending @acme.com see panel=true"; (2) each running app — server, browser, mobile, edge — asks "should this user see it?" with microsecond latency; (3) you collect events and run statistics to decide if the variant won.

There are two architectural choices a startup founder has to make in 2026, and they're independent.

**Choice 1 — The SDK shape.** Either you couple your code directly to one vendor's SDK (LaunchDarkly, GrowthBook, Unleash), or you write your code against **OpenFeature**, the CNCF standard. OpenFeature is to feature flags what OpenTelemetry is to observability: a thin Apache-2.0 spec + SDKs in TS/Go/Python/Rust/Java, with "providers" that plug in any backend. If your stack already commits to OTel and Crossplane, OpenFeature is the obvious match. You can start with a local file provider and swap in GrowthBook, Flagsmith, or LaunchDarkly later without touching app code.

**Choice 2 — The backend.** This is where money + license safety matter. The leaderboard:

- **GrowthBook (MIT)** — feature flags + full experimentation (Bayesian, frequentist, CUPED variance reduction, sequential testing, multi-arm bandits, SRM checks). Self-hostable via official Helm chart. Dropbox runs 3B+ daily evaluations on self-hosted GrowthBook. The enterprise directories sit in clearly-marked folders, so the MIT core is unambiguous.
- **Unleash (Apache-2.0 core)** — solid OSS core, but as of v6.7 the _Enterprise_ self-hosted build enters read-only mode without a valid license key. The pure OSS Apache-2.0 build is fine, but the dual-product story can confuse founders downstream.
- **Flagsmith (BSD-3)** — clean license, RBAC + SSO gated as closed-source EE. Mature, but no native experimentation engine; relies on third-party tools.
- **Flipt (GPL-3.0)** — Git-native, beautiful for GitOps, but GPL-3.0 is a caution flag for a commercial template we'll resell. Server is GPL-3, only client gRPC code is MIT.
- **PostHog (MIT)** — feature flags bundled inside a 12-product analytics monolith. Good when you also want analytics; overkill if you only want flags.
- **Bucket.co → Reflag** — rebranded; SaaS only, no self-host.
- **LaunchDarkly / ConfigCat / Hypertune** — SaaS-only; for the "Just Me / Side Project" tier they're too expensive ($12/seat + MAU surcharges).

For the ts-monorepo-template, the winning architecture is **OpenFeature SDK as the interface layer** + **GrowthBook as the bundled backend for self-hosted profiles** + **Vercel Flags SDK (free, MIT) as the Next.js framework integration that adapts to OpenFeature**. That gives founders flag-flip in dev with zero infrastructure, server+client rendering with no flicker, an upgrade path to LaunchDarkly if they ever want to, and a real experimentation engine the day they need A/B tests.

**Key findings:**

- OpenFeature is the de-facto standard in 2026: CNCF Incubating since Nov 2023, Apache-2.0 spec + SDKs for TS/Go/Python/Rust/Java/.NET/PHP/Ruby. Vendor-agnostic API means we can swap backends without touching app code — perfect fit for a template sold to many customers with different preferences.
- GrowthBook is MIT-licensed at the core with a clearly-isolated enterprise directory; ships an official Helm chart (oci://ghcr.io/growthbook/charts/growthbook). Bundles a full experimentation engine: Bayesian + frequentist + CUPED + sequential testing + multi-arm bandits + SRM checks — every other open-source option requires bolt-on stats.
- Unleash v6.7+ Enterprise self-hosted enters READ-ONLY mode without a valid license key — the OSS Apache-2.0 build is unaffected, but this dual-product line creates a footgun for downstream customers who upgrade thinking it's all free. We must pin to the OSS distribution and document it explicitly, or skip Unleash.
- Flipt is GPL-3.0 on the server (only gRPC client is MIT). For an open-core template we plan to sell, GPL-3.0 next to our own code is a CAUTION flag — using it as a separate sidecar is fine, but bundling it into our build artifacts requires legal scrutiny.
- Vercel's Flags SDK is MIT and ships an OpenFeature adapter. Server-side-only evaluation, native to Next.js App Router + Pages Router + Middleware + SvelteKit, with the precompute pattern for static pages. Free regardless of where the flag backend lives.
- Bucket.co rebranded to Reflag in 2026; SaaS-only, no self-host option — useful as a paid upgrade path but disqualified as a bundled OSS choice.
- LaunchDarkly 2026 pricing: $12/seat/month Pro + $10/1k client-side MAU + $3/1k MAU for experimentation. A 10-person team at modest scale hits ~$2k+/month easily. GrowthBook self-hosted is ~1/5th the TCO for teams above 20 seats according to Vendr benchmark data.
- CNCF flagd + OpenFeature Operator is the cloud-native option: Apache-2.0, injects sidecar into pods, supports in-process evaluation with zero network I/O. Best fit for the Scaling Startup / Production at Scale profiles, but heavier ops surface than GrowthBook for early stages.
- PostHog feature flags are MIT but live inside a giant analytics platform — duplicating choice when paired with our analytics team's pick. Better surfaced via OpenFeature provider than as the primary flag tool.
- GrowthBook supports SSE streaming and edge SDKs (Cloudflare Workers, Lambda@Edge, Fastly Compute) — covers the polyglot runtime targets in our template (Next.js + Go + Python + Rust).
- Self-hosted GrowthBook architecture is small (Mongo + Node app + optional proxy); the proxy adds caching, streaming, security. Comfortable to bundle alongside our existing Helm library chart.
- Flagsmith BSD-3 is the cleanest license but lacks a native experimentation engine — A/B testing requires integrating Mixpanel/Amplitude/PostHog. Acceptable for flag-only customers; weaker than GrowthBook for our default.

**Gotchas:**

- Unleash Enterprise self-hosted v6.7+ goes read-only without a license key — bundling Enterprise by mistake would brick customer deployments. Pin to the OSS Apache-2.0 image (unleashorg/unleash-server, not unleash-enterprise) and document the boundary.
- GrowthBook has three enterprise directories (packages/back-end/src/enterprise, packages/front-end/enterprise, packages/shared/src/enterprise). Customers compiling from source must exclude these to stay MIT-clean; the official Docker image bundles them with a runtime license check.
- Flipt GPL-3.0 on the server means if we modify Flipt and redistribute, we must release our changes. As a sidecar consumed over gRPC this is usually fine, but legal should still bless it before we ship.
- OpenFeature spec v0.8 evaluation context is mutable per-request — naive caching of evaluation results across requests will leak data between users. Use the per-request evaluation context pattern documented in the OFREP spec.
- flagd in-process providers require the SDK to load the entire flagset; for very large flag catalogs (>10k flags) memory grows linearly. RPC mode trades latency for memory.
- Vercel Flags SDK evaluates server-side only by design (to avoid layout shift and flicker). Pure client-rendered flag-flips need a separate client-side OpenFeature provider — don't assume one SDK covers both.
- GrowthBook's bandit + sequential testing features sit in the enterprise directory. The MIT core has Bayesian/frequentist A/B but you'll need to install or license enterprise for bandits.
- PostHog feature flags are tied to PostHog's events pipeline; if you self-host PostHog only for flags, you pay for the entire ClickHouse + Kafka stack. Use only if analytics team also picks PostHog.

**Recommendation (this angle):** DECISION: Adopt OpenFeature as the SDK contract (Day 1), bundle GrowthBook OSS as the default self-hosted backend (Day 2 default; opt-out for Just Me), wire Vercel Flags SDK as the Next.js framework adapter (Day 1, free).\n\nProfile mapping:\n- **Just Me ($0)**: OpenFeature SDK + local-file/env-var provider only. No backend. Zero infra. Flag-flips by editing flags.json in repo.\n- **Side Project ($5-20)**: Same as Just Me; offer an optional one-command GrowthBook docker-compose for hobbyists who want a UI.\n- **Early Startup ($30-150)**: include-day-1 — bundle GrowthBook (self-hosted via our Helm library chart) + OpenFeature SDK. Comes with experimentation out of the box.\n- **Scaling Startup ($300-1500)**: Same as Early Startup; add GrowthBook proxy for SSE streaming + edge evaluation.\n- **Production at Scale ($2k+)**: include-day-1 — GrowthBook (HA Mongo) + flagd sidecars via OpenFeature Operator for sub-ms in-process evaluation in hot paths. Document the LaunchDarkly migration path (swap the OpenFeature provider, no app-code changes).\n\nThree reasons FOR GrowthBook as the bundled default:\n1. Real experimentation engine (Bayesian + bandits + CUPED) is in the box — no other OSS option matches this without bolt-ons.\n2. MIT core with isolated enterprise dirs is the cleanest license posture among contenders we can sell our template alongside.\n3. Official Helm chart + edge SDK matrix (Workers, Lambda@Edge, Fastly) maps cleanly onto our polyglot, multi-runtime template.\n\nThree reasons AGAINST GrowthBook:\n1. MongoDB dependency (we're otherwise PG-everywhere) adds a database we don't already operate.\n2. Bandits + sequential testing live in the enterprise directory — true bandits cost money at scale.\n3. UI is less polished than LaunchDarkly's; founders may still upgrade to a SaaS for the editing experience.\n\nCommercial upgrade path documented in template: keep OpenFeature contract; swap provider from GrowthBook to LaunchDarkly (~$12/seat/mo + MAU) or Statsig if the team wants a hosted experience. Zero app-code changes.\n\nEXCLUDE Flipt from the default bundle (GPL-3.0 caution for our open-core template — offer as opt-in for GitOps-purists only). EXCLUDE Bucket/Reflag, ConfigCat, Hypertune (SaaS-only). Treat Unleash as a switchable provider behind OpenFeature, not the default — its Enterprise read-only-without-license behavior is too easy to step on.

**Citations:**

- [OpenFeature — CNCF Incubating](https://www.cncf.io/projects/openfeature/)
- [OpenFeature spec (Apache-2.0)](https://github.com/open-feature/spec)
- [OpenFeature Web SDK reference](https://openfeature.dev/docs/reference/sdks/client/web/)
- [GrowthBook GitHub (MIT + Enterprise dirs)](https://github.com/growthbook/growthbook)
- [GrowthBook official Helm chart](https://artifacthub.io/packages/helm/growthbook/growthbook)
- [GrowthBook Proxy (SSE streaming)](https://github.com/growthbook/growthbook-proxy)
- [Unleash license keys + read-only mode](https://docs.getunleash.io/using-unleash/deploy/license-keys)
- [Unleash v6.7 release notes](https://www.getunleash.io/blog/unleash-6-7)
- [Flagsmith open-source FAQ (BSD-3)](https://docs.flagsmith.com/support/faq/open-source-self-hosted)
- [Flipt GitHub (GPL-3.0 server, MIT client)](https://github.com/flipt-io/flipt)
- [Vercel Flags SDK + OpenFeature adapter](https://vercel.com/changelog/flags-sdk-now-supports-openfeature)
- [flagd in-process evaluation](https://flagd.dev/reference/openfeature-operator/overview/)
- [PostHog feature flags self-host](https://posthog.com/docs/feature-flags)
- [LaunchDarkly 2026 pricing](https://launchdarkly.com/pricing/)
- [Open Source Feature Flag Tools Compared 2026](https://flagshark.com/blog/open-source-feature-flag-tools-compared-2026/)

---

## Team 2 — Product analytics

### Synthesized verdict

- **Verdict:** `include-day-1`
- **Fit score:** 86 / 100
- **Top pick:** **PostHog (FOSS image / posthog-foss)**
- **License:** `MIT (core, posthog-foss image strips proprietary ee/)`
- **Default profile bundles:** `p-solo`, `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angles converged on PostHog as the default product-analytics layer, but each surfaced a different sharp edge that must be reconciled. The license deep-dive's most load-bearing finding: the default posthog/posthog Docker image bundles the proprietary ee/ directory under a "free for development" license that requires a paid Enterprise key for production. Naively pointing customers at it ships them into a license breach. The fix is trivial and non-negotiable: the launcher must default to posthog/posthog-foss (or the posthog-foss mirror) and CI must include a license-scan that fails if ee/\*_ ever lands in the template image. With that one guardrail in place, PostHog core is genuinely MIT and safe to bundle.\n\nThe tradeoffs angle flagged the second real risk: PostHog officially calls self-hosted a "hobby" build (~100k–300k events/month) and ships features to Cloud first. That means the honest profile mapping is NOT "self-host PostHog everywhere." It is "PostHog Cloud free tier for the bottom three profiles (1M events/mo covers Just Me through most Early Startup users at $0); self-host on the existing Argo CD + ClickHouse infra becomes available at Scaling Startup with a documented scaling cliff; at Production at Scale either PostHog Cloud Enterprise or self-host with a dedicated ClickHouse cluster, with the explicit warning that >300k events/mo self-host is officially unsupported."\n\nPostHog also gives us two near-zero-cost wins the other candidates can't match: (a) an official MCP server at mcp.posthog.com that Phase 12 MCP for Aegis can proxy to directly, and (b) MIT-licensed SDKs across TS/Node, Python, Go, Rust-compatible — which drops cleanly into our polyglot apps/_ tree with zero copyleft contamination.\n\nWhy not the AGPL alternatives (Plausible CE, OpenPanel, Umami-MIT)? Plausible and Umami are web analytics, not product analytics — no funnels/cohorts/retention/paths at the depth founders need for Job B (the conversion-funnel question). They are excellent companions for the marketing site, not replacements. OpenPanel has the right feature shape but is still small (low-hundreds of stars, not production-grade in 2026) and AGPL — fine for customer self-host, but it would lose the "single default that scales across all 5 profiles" property. Jitsu (MIT) is a pure CDP/event pipeline with no analytics UI — useful as an opt-in routing layer in front of PostHog, not as the default.\n\nHard excludes confirmed across all four angles: Snowplow upstream (SLULA forbids production use post-Jan-2024 — OpenSnowcat is the Apache-2.0 escape hatch), RudderStack server (ELv2 — can't be in our managed path, only customer self-host), Countly Lite (modified-AGPL §7 explicitly bans SaaS-style redistribution), Matomo Funnels (paid InnoCraft EULA — must not be marketed as part of the free Matomo bundle), PostHog ee/ image in production without a key.\n\nNet: PostHog (FOSS image) is include-day-1, mapped across all five profiles via the Cloud-first → self-host upgrade ladder, with Umami (MIT) as the marketing-site companion and Jitsu (MIT) as an opt-in CDP layer. License posture is clean for resale provided the ee/ guardrail is enforced.

**Integration outline:**

1. Launcher verb: `task setup:analytics --tool=posthog [--mode=cloud|self-host] --env=<env>` (default: cloud for p-solo/p-hobby/p-startup-small; self-host opt-in for p-startup-scale; mode required for p-enterprise).\n\n2. SDK wiring (ships in template, all MIT): posthog-js in apps/web (Next.js), posthog-node in apps/api (TS services), posthog-python in py-hello, posthog-go in go-hello. Wrap behind a thin `@template/analytics` package so the endpoint is env-var-configurable (`POSTHOG_HOST`, `POSTHOG_KEY`) — lets customers swap to self-host, EU residency, or even Mixpanel later without touching app code.\n\n3. Cloud mode (default for p-solo through p-startup-small): launcher prompts for PostHog Cloud project key, writes to secretspec → ESO → app env. Zero infra. No Crossplane composition needed. Free tier covers 1M events/mo.\n\n4. Self-host mode (p-startup-scale opt-in, p-enterprise on-demand): new XRD `XProductAnalytics` composes provider-helm (mayflower/posthog-helm or charts-clickhouse, version-pinned, image override → posthog/posthog-foss) + provider-kubernetes (bootstrap secrets, org/project seed). Claim YAML lives in k8s/claims/<env>/analytics.yaml. Argo CD ApplicationSet picks it up. Uses existing template ClickHouse storage class.\n\n5. Bootstrap step: `task analytics:bootstrap-project` calls PostHog REST API to create org+project, writes project token back into the app's env secret via ESO PushSecret. `task analytics:verify` fires a test event and asserts ingestion.\n\n6. MCP integration (Phase 12 / Aegis): proxy directly to mcp.posthog.com for Cloud tenants (zero custom code, exposes feature flags + HogQL + insights + CDP destinations). For self-host, ship a thin wrapper that takes a Personal API key + self-host URL override and forwards the same tool surface.\n\n7. CI guardrail (non-negotiable): add a license-scan job (Trivy + SPDX glob) that fails the build if `ee/**` appears in any template artifact or container layer. Re-validate on every PostHog version pin bump because PostHog has historically moved features in and out of ee/.\n\n8. Marketing-site companion (optional, all profiles): bolt Umami (MIT) Helm chart for cookie-free pageview stats on the public marketing site. Tracker is MIT, server is MIT — no AGPL infection. Plausible CE is the AGPL alternative if the customer prefers it (server AGPL but tracker is MIT, so embedding in customer marketing code is safe).\n\n9. Opt-in escape hatches: Jitsu (MIT) as event-routing/CDP layer in front of PostHog for fan-out to warehouses; OpenSnowcat (Apache-2.0) for teams that already speak Snowplow schemas. Both behind explicit `--tool=` flags, never default.\n\n10. Documentation must explicitly state: (a) the PostHog Cloud free-tier numbers, (b) the ~300k events/mo self-host scaling cliff, (c) the EU/US-only Cloud residency limitation (India/APAC customers must self-host), (d) the AGPL contagion myth for the marketing-site Plausible option (network calls do NOT propagate AGPL), (e) the upgrade ladder: Cloud free → Cloud paid → self-host or migrate to Mixpanel/Amplitude at very high event volumes.

**Risks:**

- PostHog ee/ directory boundary changes between releases (features have historically moved in and out); CI license-scan + version-pin discipline is mandatory or we silently ship proprietary code to customers.
- PostHog self-host is officially 'hobby' (~300k events/mo cap, features ship cloud-first); customers who scale past this on self-host will hit unsupported territory and blame the template if we don't document the cliff loudly.
- Default posthog/posthog Docker image bundles proprietary ee/ — if launcher or Helm values ever forget the posthog-foss override, every customer using it in prod is in license breach.
- PostHog Cloud data residency is US/EU only in 2026 — customers in India/APAC who need data residency are forced onto self-host (with its scaling cliff) or a different backend entirely.
- Self-host stack pulls in ClickHouse (~6 GB RAM idle) — not viable on the Side Project profile; the launcher must hard-gate self-host away from low-tier profiles or vibe-coders will OOM their hobby VPSes.
- AGPL companion tools (Plausible CE marketing-site option, OpenPanel opt-in) are safe only when the customer self-hosts; if we ever build a managed flavor of the template that hosts these in our service boundary, the AGPL network-use clause bites us.
- PostHog MCP server authenticates against PostHog Cloud by default — self-host mode requires a Personal API key + URL override; Phase 12 MCP must support both modes or self-host customers lose Aegis integration.
- If we don't surface the upgrade ladder (PostHog Cloud free → paid → migrate to Mixpanel/Amplitude around 10M events/mo when costs cross parity), customers will hit unexpected bills and view the template as the cause.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **PostHog (FOSS / core)** — `MIT` — self-host: yes — maturity: production-grade
- **Jitsu (jitsucom/jitsu)** — `MIT` — self-host: yes — maturity: production-grade
- **OpenSnowcat (Snowplow fork)** — `Apache-2.0` — self-host: yes — maturity: usable
- **OpenPanel** — `AGPL-3.0 (SDK: MIT)` — self-host: yes — maturity: usable
- **Plausible CE (marketing-site only)** — `AGPL-3.0 (tracker: MIT)` — self-host: yes — maturity: production-grade
- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **RudderStack OSS (rudder-server)** — `Elastic License 2.0` — self-host: yes — maturity: production-grade
- **Matomo (core)** — `GPL-3.0 (Funnels plugin: InnoCraft EULA, paid)` — self-host: yes — maturity: production-grade

Product analytics tracks what users actually do inside your app — clicks, sign-ups, "added to cart", "ran inference". The four jobs every team needs covered: (1) events — capture a typed payload from web/server/mobile, (2) funnels — what % of users complete step 1 → 2 → 3, (3) retention/cohorts — do users who signed up in week 1 come back in week 3, (4) paths — what sequence of screens precedes a conversion or a churn. This is distinct from "web analytics" (Plausible/Umami/GoatCounter), which only counts pageviews and referrers and cannot do funnels-on-events properly.

For an open-core monorepo template we will sell, three forces collide. First, license safety — anything we ship to the customer's repo as code must be MIT/Apache/BSD/MPL so it doesn't infect their proprietary apps; anything they self-host on their own infra can be AGPL because AGPL's network clause is triggered by the deploying party, not by us shipping templates. Second, two-audience design — vibe-coders need a one-Helm-chart self-host story plus a 30-second SDK install; AI-agent consumers (Aegis) need a typed event schema and an MCP-ish API. Third, "scale gracefully" — Just Me should pay USD 0 with hosted free tier OR self-host on the cluster, Production at Scale should not need to rip-and-replace.

The 2026 landscape sorted itself out: PostHog won the all-in-one developer-product-analytics slot — MIT-licensed core (the `ee/` directory is the only proprietary bit and you can delete it or use the `posthog-foss` mirror), 29k+ GitHub stars by late 2025, 100k+ installed companies, native Vercel marketplace integration, ClickHouse-backed funnels/retention/cohorts/paths/session-replay/feature-flags/experiments/error-tracking in one platform. Snowplow blew itself up in Jan 2024 by switching from Apache-2.0 to SLULA (no production use without a paid license); the community forked it as OpenSnowcat (Apache-2.0) — viable but heavy (Collector + Enrich + Iglu + warehouse + your own BI). Jitsu is the lightweight MIT alternative for the "Segment-replacement / CDP" job — pure event pipeline, no built-in analytics UI. RudderStack is similar in scope to Jitsu but switched to Elastic License 2.0 — you can ship it inside your SaaS as long as you don't resell it as a managed service, so it's CAUTION for our template. Matomo has funnels but they are a paid InnoCraft plugin (€229/yr on self-host) and core is GPL-3.0 — heavy AGPL-style obligations if we bundle. Countly Lite is AGPL-3 with a modified Section 7 that explicitly bans "providing Countly as a service" — that is exactly what bundling-into-a-template-for-customers risks, so AVOID. Plausible/Umami/GoatCounter are web-analytics-only — no proper event funnels — useful as a "marketing site" companion but not the product-analytics layer. OpenPanel is the newest entrant (AGPL-3.0, MIT SDK), explicitly positioned as a Mixpanel clone with funnels/retention/cohorts but it's still small (low-hundreds of stars) — usable for hobby tier, not production-grade in 2026.

Net recommendation: PostHog as the default product-analytics layer (ship the FOSS mirror or delete `ee/`), Jitsu as the optional MIT-licensed CDP/event-routing layer in front of it, OpenSnowcat as the escape hatch for data teams that already speak the Snowplow schema dialect. Plausible CE bolted on the marketing site for cookie-free pageview stats.

**Key findings:**

- PostHog core is MIT (Expat) outside the ee/ directory; the posthog-foss mirror is a pre-stripped MIT-only build. 29k+ stars by Sep 2025, 108k+ company installs, native Vercel Marketplace integration since 2024-25. This is the de-facto open-core product-analytics platform in 2026.
- Snowplow flipped from Apache-2.0 to SLULA (Snowplow Limited Use License) in Jan 2024; v1.1 in Dec 2024 explicitly bans production / commercial use without a paid commercial license. AVOID for our template.
- OpenSnowcat is the community Apache-2.0 fork created in direct response to the SLULA change; backed by Snowcat Cloud and intentionally maintains Snowplow tracker compatibility. Safe to bundle but heavier ops (Collector + Enrich + Iglu + your warehouse).
- Jitsu (jitsucom/jitsu) is MIT-licensed and is the best 'pure CDP / event-pipeline' option — Segment-style ingestion + routing to ClickHouse/Snowflake/warehouse. No built-in UI for funnels/retention; pair with PostHog or BI.
- RudderStack rudder-server is Elastic License 2.0 (ELv2) — non-copyleft but source-available; explicitly bans offering RudderStack itself as a managed service. CAUTION for a sold template: customers can self-host fine, but we cannot include it in our own managed-tier offering.
- Matomo core is GPL-3.0 (free, unlimited self-host) but Funnels, Heatmaps, A/B Testing are InnoCraft-EULA paid plugins (~€229/yr each). The 'free open-source Matomo with funnels' claim is misleading.
- Countly Lite is AGPL-3.0 with a modified Section 7 that explicitly forbids 'providing Countly as a service to your customers'. AVOID for any bundled-template scenario.
- OpenPanel (AGPL-3.0 server, MIT SDK) is the freshest Mixpanel-clone OSS in 2026 — events, funnels, retention, cohorts, profiles. Small community (low-hundreds of stars, ~750k events tracked publicly) — viable for hobby/side-project tier, not yet production-grade.
- Plausible CE is AGPL-3.0 but the JS tracker is MIT — so embedding the tracker in customer apps is license-safe. Pageviews + custom events only; no proper funnels/retention. Best as marketing-site analytics, not product analytics.
- Umami is MIT, lightweight (Postgres + single Node container), and now has funnels + retention + cohort UI as of 2026. Best 'small-scale product analytics' fit when PostHog's ClickHouse ops are too heavy.
- PostHog officially recommends its self-host build only up to ~300k events/month; above that they push customers to PostHog Cloud. The template must surface this scaling cliff in docs (else customers blame us).
- GoatCounter is EUPL-1.2 (modified compatible-licenses appendix) — fine for self-host marketing-site analytics; not a product-analytics tool (no funnels, no cohorts, no event-level identity).

**Gotchas:**

- PostHog 'self-host' bundles ClickHouse — operating ClickHouse at scale is non-trivial; the launcher must warn vibe-coders and offer 'PostHog Cloud free tier' as the Just-Me default.
- If we ship the main PostHog repo as-is, the ee/ directory carries a proprietary license. Either ship the posthog-foss mirror or have the launcher delete ee/ on init — document this clearly.
- Snowplow's SLULA is retroactive on new versions; any pre-Jan-2024 Apache-licensed Snowplow binary is fine to run forever, but upgrades pull in SLULA-licensed artifacts. Pin versions if you must use the original repo.
- RudderStack ELv2 'cannot provide as a managed service' is binary — there is no grace period or revenue threshold. Safe for self-host-by-customer; unsafe for our hosted offering.
- Matomo Funnels are NOT in the GPL core. Don't market 'free Matomo with funnels' — that ships customers into an InnoCraft EULA seat purchase.
- Countly Lite's Section-7 modification looks like AGPL but specifically forbids SaaS-style redistribution; treat it as a Commons-Clause-equivalent for our purposes.
- AGPL self-hosted-by-customer is usually fine (the network clause binds the deployer, not us shipping templates), but if our launcher includes the AGPL server image in our managed-tier image, the obligation lands on us.
- Plausible/Umami/GoatCounter all market themselves as 'analytics' — they are web analytics, not product analytics. Don't let founders confuse 'pageviews + outbound clicks' with 'funnel from signup to first-paid-invoice'.

**Recommendation (this angle):** Default the template to PostHog (FOSS mirror or `ee/`-stripped main) as the single product-analytics layer across all five profiles. (1) Just Me — PostHog Cloud free tier (1M events/mo free); zero infra. (2) Side Project — same Cloud free tier, just add the JS + server SDK. (3) Early Startup — still PostHog Cloud (paid as needed) OR self-host hobby Docker Compose for ≤300k events/mo. (4) Scaling Startup — self-host PostHog on the existing Argo CD + Helm + ClickHouse infra (template already ships ClickHouse-friendly storage class), or stay on Cloud. (5) Production at Scale — PostHog Cloud Enterprise, or self-host with a dedicated ClickHouse cluster + the warning that PostHog's self-host >300k events/mo is officially unsupported. Offer Jitsu (MIT) as an opt-in event-routing/CDP layer in front of PostHog for teams that need to fan events out to warehouses + downstream tools without the ELv2 trap of RudderStack. Offer OpenSnowcat (Apache-2.0) as an escape hatch only for teams already using Snowplow schemas. Bolt Plausible CE (AGPL server, MIT tracker) onto the public marketing site for cookie-free pageview stats — the MIT tracker means we can embed it in customer marketing-site code without AGPL infection. EXPLICITLY EXCLUDE Snowplow (SLULA), RudderStack (ELv2 — caution-only for hosted), Countly Lite (modified-AGPL Section 7), and Matomo Funnels (InnoCraft EULA) from the bundled defaults. Document the PostHog ee/ directory removal step in the launcher's `init` flow so customers see they're shipping pure MIT.

**Citations:**

- [PostHog GitHub — root LICENSE (MIT Expat outside ee/)](https://github.com/PostHog/posthog/blob/master/LICENSE)
- [PostHog GitHub — ee/LICENSE (Enterprise)](https://github.com/PostHog/posthog/blob/master/ee/LICENSE)
- [PostHog self-host docs (scale caveats)](https://posthog.com/docs/self-host)
- [PostHog × Vercel Marketplace integration](https://vercel.com/marketplace/posthog)
- [PostHog business breakdown (Contrary Research, 2025)](https://research.contrary.com/company/posthog)
- [Snowplow Limited Use License Agreement (SLULA) FAQ](https://docs.snowplow.io/docs/resources/limited-use-license-faq/)
- [Snowplow OSS license change announcement](https://snowplow.io/snowplow-oss-license-change)
- [OpenSnowcat — Apache-2.0 fork of Snowplow](https://www.snowcatcloud.com/snowplow/license-change/)
- [Jitsu — open-source MIT Segment alternative](https://github.com/jitsucom/jitsu)
- [RudderStack rudder-server — Elastic License 2.0](https://github.com/rudderlabs/rudder-server)
- [Elastic License 2.0 FAQ (SaaS restriction)](https://www.elastic.co/licensing/elastic-license/faq)
- [OpenPanel GitHub (AGPL-3.0 server)](https://github.com/Openpanel-dev/openpanel)
- [Plausible — introducing Community Edition (AGPL)](https://plausible.io/blog/community-edition)
- [Countly Lite (Licensing) FAQ — modified AGPLv3 Section 7](https://support.countly.com/hc/en-us/articles/360037501312-Countly-Lite-Licensing-FAQ)
- [Matomo licences for core, tracker, plugins (InnoCraft EULA for Funnels)](https://matomo.org/faq/general/matomo-analytics-licences-for-core-tracker-and-plugins/)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **PostHog (core)** — `MIT (core) + PostHog Enterprise license for /ee folder` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **GoatCounter** — `EUPL-1.2` — self-host: yes — maturity: production-grade
- **OpenPanel** — `AGPL-3.0` — self-host: yes — maturity: usable
- **OpenSnowcat (Snowplow fork)** — `Apache-2.0` — self-host: yes — maturity: usable

Product analytics tools answer one question: "what did people actually do in my product?" — clicks, signups, drop-offs, retention. Two architectural shapes exist in the wild. The "lite web analytics" shape (Plausible, GoatCounter, Umami) ships a single binary or small Docker image, stores pageviews + a few custom events in Postgres/SQLite, and gives you dashboards. The "fat event-based product analytics" shape (PostHog, Mixpanel, Amplitude, Snowplow, OpenPanel) stores every event in a columnar store (ClickHouse) and offers funnels, retention curves, cohort SQL, session replay, feature flags, and experiments. For an open-core monorepo template that has to scale from a USD-0 hobbyist to a USD-2k+ production SaaS, you need both shapes available behind a single launcher verb so the user can pick by profile.

The tricky bit for our template is license and operational fit. PostHog's core is MIT (the only "fat" analytics tool with a permissive license at scale), but PostHog officially sunset Kubernetes/Helm support in May 2023 — you can still run their community charts-clickhouse Helm chart, but you are on your own for upgrades and there is no Crossplane provider for it. Plausible Community Edition is AGPL-3.0; that is fine for us because the user self-hosts it, but if we bundle it into our managed cloud offering, the AGPL network-use clause kicks in. Snowplow flipped most of its OSS to the Snowplow Limited Use License (SLULA / Snowplow Community License) in 2024, which forbids HA production use without a commercial deal — that is an AVOID for a template we will resell. The Apache-2.0 fork OpenSnowcat exists but is a single small vendor. GoatCounter is EUPL-1.2 (OSI approved, commercial-friendly, weak copyleft like LGPL).

So the integration story is: PostHog for "Early Startup → Production at Scale" profiles (it is the only OSS that genuinely competes with Amplitude/Mixpanel feature-by-feature and has an official MCP server at mcp.posthog.com — Phase 12 MCP wraps that for free), Plausible CE for "Side Project → Early Startup" (cookie-free, 2-page dashboard, GDPR by default), and GoatCounter for "Just Me" (single Go binary, fits a 1 GB VPS).

Crossplane reality check: there is no provider-posthog, no provider-plausible. The right pattern is a Composition that uses provider-helm to install the chart and provider-kubernetes to seed bootstrap secrets/orgs/projects, fronted by an XRD called e.g. XProductAnalytics. For PostHog that means wrapping mayflower/posthog-helm (the maintained community chart) or charts-clickhouse with provider-helm. For Plausible CE there is no official Helm chart — only docker-compose — so we'd publish our own thin Helm chart in the library chart repo. A `task setup:posthog` / `task setup:plausible` / `task setup:goatcounter` launcher verb writes the XRD claim into the env overlay and Argo CD reconciles it. The Phase 12 MCP server proxies to mcp.posthog.com for PostHog tenants (no custom code) and exposes a thin tool surface over Plausible's Stats API for the lite tier.

**Key findings:**

- PostHog core is MIT-licensed (commercial-friendly), but the /ee directory carries the PostHog Enterprise proprietary license — bundle only the core, never the /ee folder, to stay clean for resale.
- PostHog officially sunset Kubernetes/Helm support on 31 May 2023 — Docker Compose is the only blessed self-host path. The charts-clickhouse repo still exists but receives no feature updates; mayflower/posthog-helm is the leading community-maintained alternative.
- PostHog ships an official MCP server at https://mcp.posthog.com/mcp that already exposes feature flags, HogQL queries, insights, and CDP destinations — Phase 12 MCP for Aegis can proxy to it instead of reimplementing.
- posthog-node is fully TypeScript (v2.x rewrite), uses non-blocking batched flush, and works with Lambda when flushAt=1/flushInterval=0 + posthog.shutdown() — drops cleanly into our apps/\* TS/Next.js services and into go-hello/py-hello/rs-hello via their respective official SDKs.
- Plausible CE is AGPL-3.0; the official self-host ships as docker-compose only (web app + Postgres + ClickHouse). No official Helm chart — we publish our own thin chart in the helm library to expose it via Crossplane.
- Plausible CE 2.2 (March 2026) is feature-incomplete vs Cloud: Funnels, GA4 import, team SSO are Cloud-only. For 'paths/cohorts/retention' user stories the Side Project tier still needs PostHog.
- Snowplow flipped to the Snowplow Limited Use License in 2024 (formerly SCL) which forbids HA production use and competing offerings — AVOID for our resold template; OpenSnowcat (Apache-2.0 fork) is the SAFE alternative if anyone needs Snowplow-shape event pipelines.
- GoatCounter is EUPL-1.2 (OSI-approved, weak copyleft like LGPL, commercial fork allowed under same license), single Go binary, SQLite or Postgres — perfect for the 'Just Me / USD 0' profile.
- RudderStack-style CDP is out of scope here (separate team), but Rudder's open-source server is AGPLv3 since 2022 — same network-use trap as Plausible.
- No Crossplane provider-posthog or provider-plausible exists today (June 2026). Integration must compose provider-helm + provider-kubernetes inside an XRD (e.g. XProductAnalytics) — same pattern we already use for 28 other XRDs.
- PostHog Cloud also offers managed EU residency; for templates aimed at GDPR-bound customers, exposing a `mode: cloud | self-host` switch in the XRD claim is cheaper than self-hosting ClickHouse.

**Gotchas:**

- AGPL trap: if we ourselves host Plausible CE / OpenPanel / RudderStack OSS as part of our managed offering, the network-use clause forces us to publish modifications. Safe only when the END USER self-hosts. Document loudly.
- PostHog charts-clickhouse Helm chart is unmaintained — pinning a version is mandatory. Better path: mayflower/posthog-helm (modern, MIT, actively maintained) or our own composition.
- PostHog /ee directory is proprietary. CI must verify we never copy /ee into the template or container image — add a license-scan job (Trivy + custom SPDX glob) that fails the build if /ee/\*\* appears.
- Plausible CE has no official Helm chart — we must author our own. Keep it minimal (StatefulSet + PVC for Postgres + ClickHouse subchart) to avoid forking the whole charts-clickhouse beast.
- Snowplow Community License (SLULA) is NOT OSI open source and bans HA production — do not bundle. If a Snowplow-shape pipeline is required, use OpenSnowcat (Apache-2.0).
- PostHog ClickHouse subchart consumes ~6 GB RAM at idle — that is way beyond the 'Side Project' (USD 5-20) profile. Route Side Project users to Plausible CE or PostHog Cloud free tier instead.
- GoatCounter has no event funnels / cohort retention — it is page+event counts only. Don't oversell it to users asking for product-analytics-grade insight.
- PostHog MCP authenticates against PostHog Cloud — for self-hosted PostHog the MCP server requires a Personal API key and a self-host URL override; Phase 12 MCP must support both modes.

**Recommendation (this angle):** Adopt a tiered three-tool strategy behind a single `task setup:analytics` launcher verb that takes a `--tool=posthog|plausible|goatcounter` flag (default chosen by profile). (1) GoatCounter (EUPL-1.2, single binary) for 'Just Me' — ship a 30-line Helm chart in our library, claim via XGoatCounter XRD. (2) Plausible CE (AGPL-3.0) for 'Side Project / Early Startup' — author our own thin Helm chart wrapping the official docker-compose images, claim via XPlausible XRD, expose Stats API key as a sealed-secret. (3) PostHog core MIT for 'Scaling / Production at Scale' — compose provider-helm around mayflower/posthog-helm, claim via XPostHog XRD, hard-gate the /ee folder in CI to keep the resale story clean. For Phase 12 MCP, proxy directly to mcp.posthog.com when the tenant runs PostHog (zero custom code) and ship a thin MCP wrapper over Plausible's Stats API and GoatCounter's /api/v0 for the lite tiers. Day-1 wiring per profile is 5–7 commands: (a) `task setup:analytics --tool=posthog --env=dev` writes claim YAML to k8s/claims/<env>/analytics.yaml, (b) `task secrets:seed analytics` puts bootstrap creds via secretspec → External Secrets, (c) `argocd app sync analytics-<env>`, (d) `task analytics:bootstrap-project` calls the chosen tool's REST API to create the org/project and writes the project token back into the app's env secret, (e) `task analytics:verify` fires a test event and asserts it appears. Snowplow stays OFF the menu (license risk) — if a heavy event pipeline is needed later, surface OpenSnowcat as an opt-in Apache-2.0 path. RudderStack is out of scope for this team but flag to the CDP team that its AGPL status mirrors Plausible.

**Citations:**

- [PostHog LICENSE (MIT for core, separate for /ee)](https://github.com/PostHog/posthog/blob/master/LICENSE)
- [Sunsetting Kubernetes/Helm support for PostHog (PostHog blog)](https://posthog.com/blog/sunsetting-helm-support-posthog)
- [PostHog charts-clickhouse Helm chart (community-maintained, unsupported)](https://github.com/PostHog/charts-clickhouse)
- [mayflower/posthog-helm — modern community Helm chart for PostHog on K8s](https://github.com/mayflower/posthog-helm)
- [PostHog Model Context Protocol (MCP) docs](https://posthog.com/docs/model-context-protocol)
- [PostHog Node.js SDK docs](https://posthog.com/docs/libraries/node)
- [Plausible Community Edition GitHub (AGPL-3.0, docker-compose)](https://github.com/plausible/community-edition)
- [Introducing Plausible Community Edition (license + scope)](https://plausible.io/blog/community-edition)
- [Plausible self-hosted docs](https://plausible.io/docs/plausible-analytics-self-hosted-guides)
- [Snowplow Limited Use License announcement](https://snowplow.io/blog/introducing-snowplow-limited-use-license)
- [OpenSnowcat — Apache-2.0 Snowplow fork](https://opensnowcat.io/)
- [GoatCounter — EUPL-1.2 self-hosted web analytics](https://github.com/arp242/goatcounter)
- [OpenPanel — AGPL-3.0 product analytics](https://github.com/Openpanel-dev/openpanel)
- [Crossplane provider-kubernetes (used by composition pattern)](https://github.com/crossplane-contrib/provider-kubernetes)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **PostHog (posthog-foss image)** — `MIT` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **OpenSnowcat (Collector + Enrich fork)** — `Apache-2.0` — self-host: yes — maturity: usable
- **OpenPanel** — `AGPL-3.0` — self-host: yes — maturity: usable
- **GoatCounter** — `EUPL-1.2` — self-host: yes — maturity: production-grade
- **Matomo (core)** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Snowplow upstream (post-2024 SLULA)** — `SLULA-1.1` — self-host: partial — maturity: production-grade

Imagine you're selling a recipe book to a friend. Inside, you say "for the gravy, use Brand X gravy mix — you can buy it at any store." You aren't selling Brand X gravy. You're telling the reader how to make a meal that uses it. That's exactly what our ts-monorepo-template does with analytics: we ship Helm values and ArgoCD ApplicationSets that REFERENCE a public Docker image (e.g. posthog/posthog:1.x), and the CUSTOMER pulls it onto THEIR cluster. We never operate the analytics service for them.

That distinction is the whole license game. Open-source licenses worry about two acts: (1) DISTRIBUTING the software ("are you handing out copies?") and (2) MAKING IT AVAILABLE OVER A NETWORK ("are you running it as a service?"). Referencing a Docker tag in YAML is neither — it's just a pointer. The image registry distributes; the customer hosts.

So which licenses are scary for our use case?

MIT and Apache-2.0 are boring-safe. Attribution. Done. PostHog's core repo (everything outside ee/) is MIT Expat. Umami is MIT. PostHog's JavaScript SDK (posthog-js) is MIT. Embedding these SDKs in our reference apps puts ZERO obligation on our customers' proprietary code.

AGPL-3.0 (Plausible Community Edition, OpenPanel, Matomo core) is famous for the "network use" trigger. If our customer modifies Plausible and exposes it over a network, they must offer the source. If they just run the upstream Docker image unmodified, they're fine. The AGPL does NOT reach across process boundaries — so a Next.js app that fires events at a Plausible container is unaffected. Plausible Community Edition is fine as a default IF we tell customers clearly: "AGPL service, don't fork it into your monolith."

SSPL (MongoDB, Elastic for some history, Redis post-2024) is the nuclear option — it tries to force you to open-source your ENTIRE management stack if you offer the software as a service. None of the top product-analytics candidates ship under SSPL. Good.

Then come the source-available traps. Snowplow flipped its collector and enricher to SLULA in January 2024 — "no production use, no commercial use, period, unless you pay." This is AVOID for default bundling. The community forked it as OpenSnowcat (Apache-2.0) which IS safe but is a smaller, younger project.

PostHog's "ee/" directory is proprietary. Their main Docker image (posthog/posthog) bundles ee code with a "free for development" license that REQUIRES a paid Enterprise key for production with seats. So if we point customers at posthog/posthog, we're pointing them at code they can't legally run in prod without buying a license — unless we explicitly point them at posthog/posthog-foss, the proprietary-stripped image. THIS is the trap to call out.

Recommendation: PostHog (FOSS image) as default, Plausible CE as the lighter alternative, OpenSnowcat for heavy CDP needs. Mark SLULA Snowplow and PostHog-EE-image as AVOID-by-default in the launcher.

**Key findings:**

- PostHog uses split licensing: root LICENSE = MIT Expat for everything outside ee/; ee/LICENSE is proprietary requiring a paid Enterprise key for production use with seats. The default Docker image posthog/posthog BUNDLES ee/ code; only posthog/posthog-foss is purged of proprietary code. The launcher MUST default to posthog-foss if shipping PostHog or it walks customers into a license violation.
- PostHog client SDKs (posthog-js, posthog-node, posthog-python, posthog-go) are MIT-licensed and embed-safe in customer apps with zero copyleft contamination.
- Plausible Community Edition v2.2 (March 2026) is AGPL-3.0 with full feature parity vs Plausible Cloud. AGPL network-use clause applies only to whoever modifies the code; an unmodified upstream Docker deployment by our customer triggers zero source-disclosure obligation on the customer's proprietary app code as long as analytics runs as a separate service.
- Umami is MIT-licensed (copyright Umami Software, Inc. 2022) with full feature parity between self-hosted and cloud. Safest default for shops that refuse AGPL on policy grounds.
- Snowplow shifted Collector, Enrich, Iglu Server, and loaders to SLULA v1.1 on 2024-01-08. SLULA explicitly forbids production and commercial use without a paid Snowplow BDP contract. Bundling Snowplow Docker images in our template would route customers toward a license breach by default. AVOID upstream.
- OpenSnowcat (opensnowcat/opensnowcat-collector and opensnowcat-enrich) is a community Apache-2.0 fork of pre-SLULA Snowplow, SDK-compatible with Snowplow/Segment/Amplitude. Safe substitute for behavioral-CDP customers.
- OpenPanel is AGPL-3.0 with feature parity between cloud and self-host. Same AGPL analysis as Plausible. Smaller community, less battle-tested.
- GoatCounter is EUPL-1.2 — weak copyleft. The HOSTED service has a non-commercial 'honor-system' restriction, but the SELF-HOSTED binary has no commercial restriction.
- Matomo Core is GPL-3.0 and safe to bundle as a separate service; InnoCraft-EULA premium plugins (heatmaps, session recording, A/B testing, funnels-pro) are paid even on self-host — do not reference these in default values.
- No product-analytics candidate in this set ships under SSPL as of 2026-06. The MongoDB/Redis-style anti-SaaS trap does not apply to this category.
- Trademark layer matters: even AGPL Plausible CE's TRADEMARKS are NOT under AGPL — Plausible Insights OÜ holds them. Our marketing site can SAY 'works with Plausible' (nominative fair use) but cannot brand a fork as 'Plausible-flavored analytics' without permission.
- PostHog ee/ boundary changes over time (RBAC, SAML moved from OSS to ee/ historically). The launcher must re-validate the ee/ inventory on each upgrade pin.

**Gotchas:**

- POSTHOG IMAGE TRAP: posthog/posthog Docker image includes ee/ code under proprietary license — production use without a paid key is a contract breach. Always point to posthog/posthog-foss in default Helm values, or document the license-key requirement loudly.
- AGPL contagion myth: AGPL does NOT reach across a network boundary into the calling application. Our customer's Next.js app calling Plausible's /api/event endpoint does not become AGPL. AGPL only applies if the customer forks Plausible itself and ships a derivative.
- SLULA Snowplow is a legal landmine if a customer pulls the official Snowplow image in production: NO PRODUCTION/COMMERCIAL USE without a paid Snowplow BDP contract. Default to OpenSnowcat instead.
- Matomo premium plugins (heatmaps, session recording, A/B test, funnels-pro) are NOT GPL — they're under InnoCraft EULA, paid per-instance even on self-host. Do not reference these in default values.
- Plausible trademark: AGPL covers code, NOT the name 'Plausible' — we may say 'compatible with Plausible' but cannot brand a fork with the Plausible mark. Same trap applies to PostHog, Snowplow, Matomo trademarks.
- GoatCounter hosted-service 'no commercial use' rule is an HONOR-SYSTEM marketing claim, NOT a license condition — the binary itself under EUPL-1.2 has no such restriction. Don't conflate the two when documenting.
- EUPL-1.2 is 'compatible' with AGPL/GPL but is itself weak copyleft — if a customer modifies GoatCounter and distributes the fork, they must release source under EUPL or a compatible license. For unmodified Docker bundling, irrelevant.
- PostHog's MIT applies as of Copyright 2020-2025 — verify ee/ LICENSE boundary on every upgrade because PostHog has historically moved features into and out of ee/.

**Recommendation (this angle):** DEFAULT for ts-monorepo-template launcher: ship Plausible Community Edition (AGPL-3.0) for "Just Me" + "Side Project" profiles (light footprint, single container, full feature parity) and PostHog FOSS image (MIT) starting at "Early Startup" profile (richer product-analytics: funnels, cohorts, paths, session replay). EXPLICITLY use posthog/posthog-foss in default Helm values, NOT posthog/posthog — the latter bundles proprietary ee/ code that requires a paid Enterprise key for production use, and we must not silently route customers into that. Provide Umami (MIT) as the conservative permissive-license alternative for shops that refuse AGPL on policy grounds. Offer OpenSnowcat (Apache-2.0 fork of pre-SLULA Snowplow) as an OPT-IN for "Scaling Startup" + "Production at Scale" profiles that need behavioral CDP with Snowplow-shape schemas, and DEFAULT TO BLOCK the upstream Snowplow Docker images in the launcher's image-allowlist (SLULA forbids production/commercial use). Mark Snowplow upstream and PostHog-EE-image as AVOID-by-default. Mark Matomo premium plugins as REQUIRES-EXPLICIT-OPT-IN (paid InnoCraft EULA even on self-host). For documentation: clearly state that AGPL applies to the analytics CONTAINER, not to the customer's calling application — this is the #1 misunderstanding that scares founders away from Plausible unnecessarily. Aegis MCP server tooling should refuse to generate manifests that pull SLULA-licensed Snowplow images or PostHog-EE images into a "production" environment without an explicit license-acceptance flag.

**Citations:**

- [PostHog root LICENSE (MIT + ee/ split)](https://github.com/PostHog/posthog/blob/master/LICENSE)
- [PostHog ee/LICENSE (proprietary Enterprise terms)](https://github.com/PostHog/posthog/blob/master/ee/LICENSE)
- [PostHog posthog-foss Docker Image (FOSS-only, ee/ stripped)](https://hub.docker.com/r/posthog/posthog-foss)
- [PostHog posthog-go LICENSE.md (MIT)](https://github.com/PostHog/posthog-go/blob/main/LICENSE.md)
- [Plausible — Why we're changing to AGPL](https://plausible.io/blog/open-source-licenses)
- [Introducing Plausible Community Edition (AGPL-3.0, full feature parity)](https://plausible.io/blog/community-edition)
- [Plausible Analytics Trademark Guidelines](https://plausible.io/trademark)
- [Snowplow — Introducing the Snowplow Limited Use License (SLULA)](https://snowplow.io/blog/introducing-snowplow-limited-use-license)
- [Snowplow Limited Use License v1.1 (full text)](https://docs.snowplow.io/limited-use-license-1.1/)
- [Snowplow Community License FAQ](https://docs.snowplow.io/docs/resources/community-license-faq/)
- [OpenSnowcat Collector (Apache-2.0 fork)](https://github.com/opensnowcat/opensnowcat-collector)
- [OpenSnowcat Enrich (Apache-2.0 fork)](https://github.com/opensnowcat/opensnowcat-enrich)
- [Umami LICENSE (MIT)](https://github.com/umami-software/umami/blob/master/LICENSE)
- [OpenPanel (AGPL-3.0) repo](https://github.com/Openpanel-dev/openpanel)
- [GoatCounter LICENSE (EUPL-1.2) + author rationale](https://www.arp242.net/license.html)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **PostHog (SDK + Cloud-first, hobby self-host optional)** — `MIT (core) / ELv2 (enterprise features)` — self-host: partial — maturity: production-grade
- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **OpenPanel** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Plausible Community Edition** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Jitsu (event collection layer)** — `MIT` — self-host: yes — maturity: usable
- **GoatCounter** — `EUPL-1.2` — self-host: yes — maturity: usable
- **OpenSnowcat (Snowplow fork)** — `Apache-2.0` — self-host: yes — maturity: usable

Picture two different jobs you want analytics to do. Job A is "tell me how many people visited my landing page yesterday" — that's web analytics. Job B is "of the founders who signed up last Tuesday, how many created an org, invited a teammate, and were still active 14 days later?" — that's product analytics, the world of events, funnels, retention, cohorts, and user paths. The ts-monorepo-template is a backend-heavy SaaS scaffold for founders. They mostly need Job B, with a little Job A on the marketing site.

Now, the field of OSS product analytics in 2026 sorts into three buckets. Bucket 1 is the giants: PostHog is the closest open-source clone of Mixpanel/Amplitude with funnels, retention, paths, session replay, feature flags, and a generous MIT license for the core. The trap: PostHog officially calls its self-hosted version a "hobby" build that tops out around 100k events/month, and new features ship to PostHog Cloud first. So shipping PostHog as a self-hosted default for paying customers is risky. PostHog Cloud, however, has a 1M-event/month free tier, which covers most founders for a very long time.

Bucket 2 is the lite web-analytics tools — Plausible (AGPL-3.0), Umami (MIT), GoatCounter (EUPL-1.2). These are wonderful for the marketing site and small dashboards but do not give you funnels, cohorts, or retention. They are Job A only.

Bucket 3 is the warehouse-native / collector world — Snowplow and RudderStack. Snowplow moved its core to SLULA in 2024, which forbids production commercial use without a paid contract, so it's effectively avoid for us (OpenSnowcat is the Apache-2.0 fork if anyone really wants the Snowplow design). RudderStack server is AGPL-3.0, which is loaded for a managed offering. There is also OpenPanel (AGPL-3.0) — a young Mixpanel-style tool that is honestly self-hostable with no feature gates.

So how do you pick? The deciding question is: who runs the analytics backend?

If the customer self-hosts the whole template on their own infra, AGPL is fine for them — the AGPL "network use" clause only bites the entity that runs the modified server and offers it to the public. The template authors (us) are not running it; the customer is. That makes AGPL tools like Plausible, OpenPanel, and Umami (which is MIT anyway) safe to bundle as opt-in Helm charts.

If we ever run a managed flavor of the template (a hosted "Aegis Cloud"), AGPL deps in our service path become a problem unless we keep them in the customer's tenant, not ours.

Concrete recommendation for the template: ship PostHog Cloud as the day-1 default (SDK + env var pointing at a configurable host), and offer a self-hosted alternative (PostHog hobby Helm chart for tinkerers, plus Umami for marketing-site web analytics). Keep OpenPanel as an "include-on-demand" Crossplane composition for founders who insist on no third party. Do not bundle Snowplow. Do not put RudderStack server in our managed path.

**Key findings:**

- PostHog core (product analytics, session replay, feature flags, A/B, funnels, retention, cohorts) is MIT-licensed and safe to bundle SDKs for; enterprise extras (SAML, SCIM, advanced perms) are ELv2 and not shippable to customers as our own code.
- PostHog officially deprecated production Kubernetes self-hosting — the OSS build is positioned as 'hobby' capped near 100k events/month and ships features cloud-first; bundling it as the default self-hosted backend for paying customers is risky.
- PostHog Cloud free tier in 2026 = 1M product analytics events, 5K session recordings, 1M feature-flag requests/month — this covers Just Me, Side Project, and most Early Startup users at $0.
- Mixpanel free tier = 1M events/month; Growth ≈ $0.28/1K events after, so 10M events ≈ $2,520/month — clear upgrade target once PostHog gets expensive.
- Amplitude Starter is free for 10K MTU / 2M events; Plus starts $49/mo; Startup Scholarship gives qualifying startups (<$10M raised, <20 FTE, or YC/Sequoia/AWS) 1 year free on Growth.
- Umami is MIT and the cleanest 'web analytics on your own Postgres' option — perfect for marketing site + simple custom events, but no funnels/retention/cohorts.
- OpenPanel (AGPL-3.0) is the best Mixpanel-shaped self-hostable in 2026 with funnels/retention/cohorts and no feature gating between cloud and self-hosted — but the AGPL bites if WE run it as part of a managed offering.
- Plausible CE is AGPL-3.0 and excellent for privacy-first web analytics; same AGPL caveat as OpenPanel for managed-SaaS use.
- Snowplow flipped its core (Collector, Enrich, Iglu, loaders) to SLULA in 2024 — non-commercial only without a paid contract — effectively AVOID for a sold commercial template.
- OpenSnowcat is the Apache-2.0 community fork of pre-SLULA Snowplow — viable if a customer genuinely wants the collector+enricher data-engineering architecture, but high operational cost.
- RudderStack server is AGPL-3.0 (SDKs MIT) — fine for customers self-hosting, problematic in our managed path; main value is warehouse-native CDP, which most ts-monorepo-template users do not need on day one.
- Jitsu (MIT) is the best license-clean event-collection layer if a customer wants Segment-style routing without committing to a full analytics product.

**Gotchas:**

- PostHog 'self-hosted' on production K8s is officially unsupported in 2026 — do not promise customers a production-grade self-hosted PostHog without warning; route them to PostHog Cloud or a different backend.
- AGPL-3.0 network-use clause: if WE ever offer a managed flavor of the template that includes Plausible/OpenPanel/RudderStack-server in OUR service boundary, we must release the entire interacting service under AGPL — keep AGPL deps in the customer's tenant, not ours.
- Snowplow SLULA explicitly forbids production/commercial use of post-Jan-2024 versions without a paid Snowplow contract — bundling old Apache-2.0 versions creates a stale-software trap; use OpenSnowcat instead if Snowplow design is required.
- PostHog ELv2 features (SAML SSO, SCIM, advanced perms) cannot be redistributed as part of a commercial template — make sure the launcher CLI ships only the MIT-licensed PostHog SDK and config, not bundled ELv2 modules.
- Mixpanel/Amplitude SDKs are proprietary client libraries — fine to call from a customer app, but never vendor their code into the template repo; load via package manager.
- Web-analytics-lite tools (Plausible/Umami/GoatCounter) do not give you funnels/retention/cohorts — do not let founders pick them as their product-analytics tool by mistake; segregate web vs product analytics in the launcher UX.
- PostHog Cloud data residency is US or EU only in 2026 — customers needing India/APAC residency must self-host (hobby build) or pick OpenPanel/Umami self-hosted; surface this trade-off in the launcher.
- OpenPanel is young (small team, lower star count than PostHog) — flag it as 'usable, not production-grade for high-scale' and recommend it only for Side Project / Early Startup self-host scenarios.

**Recommendation (this angle):** Ship a thin abstraction (analytics SDK wrapper + env-var-configurable endpoint) and pre-wire PostHog as the default. Decision matrix by profile:\n\n- Just Me ($0): include-day-1 — PostHog Cloud free tier (1M events/mo), zero infra. Launcher pre-fills POSTHOG_KEY env. No self-host.\n- Side Project ($5-20): include-day-1 — PostHog Cloud free tier still covers this; offer Umami self-host (MIT, single Postgres) as an opt-in for the marketing site analytics. Skip product-analytics self-host.\n- Early Startup ($30-150): include-day-1 — PostHog Cloud (paid pay-as-you-go kicks in past 1M events) OR Amplitude Startup Scholarship (1 year free Growth) — surface both in launcher with a clear 'apply for scholarship' link. OpenPanel becomes include-on-demand for founders who want self-host with funnels.\n- Scaling Startup ($300-1500): include-day-2 — Crossplane composition for OpenPanel self-host (AGPL — customer runs it, license stays clean). PostHog Cloud still recommended as primary; self-host is for data residency / cost-ceiling cases.\n- Production at Scale ($2k+): include-on-demand — OpenSnowcat (Apache-2.0) + warehouse (ClickHouse/BigQuery) for warehouse-native; or Mixpanel/Amplitude commercial if customer prefers managed. We provide the IaC, customer picks.\n\nHard excludes: Snowplow proper (SLULA — production-forbidden), RudderStack-server-in-our-managed-path (AGPL bite). Never bundle PostHog ELv2 features. Never vendor Mixpanel/Amplitude SDK code into the template.\n\nUpgrade path narrative for founders: PostHog Cloud free → PostHog Cloud paid (at ~5M events, costs cross Mixpanel parity around 10M events) → migrate to Mixpanel Growth ($0.28/1K events) or Amplitude (Scholarship if eligible) → at 50M+ events/month, warehouse-native (OpenSnowcat → ClickHouse → Cube/Metabase). Document this ladder in the launcher.\n\nLicense-safety verdict for the bundle: SAFE if we ship PostHog SDK (MIT) + Umami Helm chart (MIT) + Jitsu collector (MIT) by default and gate Plausible/OpenPanel/RudderStack behind explicit 'customer-self-hosts' Crossplane compositions. The template as sold to commercial customers carries no copyleft obligations.

**Citations:**

- [PostHog Self-Host Docs (hobby-only positioning, 100k events ceiling)](https://posthog.com/docs/self-host)
- [PostHog Pricing — 1M events free tier](https://posthog.com/pricing)
- [PostHog GitHub repo (MIT core / ELv2 enterprise split)](https://github.com/PostHog/posthog)
- [Mixpanel Pricing 2026 (1M free, $0.28/1K after)](https://mixpanel.com/pricing/)
- [Amplitude Startups program (1 year free Growth scholarship)](https://amplitude.com/startups)
- [Amplitude Pricing (Starter free, Plus $49/mo)](https://amplitude.com/pricing)
- [Snowplow Limited Use License Agreement FAQ (no production use)](https://docs.snowplow.io/docs/resources/limited-use-license-faq/)
- [OpenSnowcat — Apache-2.0 fork of pre-SLULA Snowplow](https://opensnowcat.io/manifesto)
- [Plausible Community Edition (AGPL-3.0)](https://plausible.io/blog/community-edition)
- [Plausible AGPL license rationale](https://plausible.io/blog/open-source-licenses)
- [Umami GitHub (MIT, privacy-first self-host)](https://github.com/umami-software/umami)
- [OpenPanel GitHub (AGPL-3.0, Mixpanel-style funnels/retention/cohorts)](https://github.com/Openpanel-dev/openpanel)
- [GoatCounter GitHub (EUPL-1.2, single-binary self-host)](https://github.com/arp242/goatcounter)
- [Jitsu GitHub (MIT, Segment-style event collection)](https://github.com/jitsucom/jitsu)
- [RudderStack Open Source overview (AGPL server / MIT SDKs)](https://www.rudderstack.com/docs/get-started/rudderstack-open-source/)

---

## Team 3 — Web analytics (privacy-first)

### Synthesized verdict

- **Verdict:** `include-day-1`
- **Fit score:** 90 / 100
- **Top pick:** **Umami**
- **License:** `MIT`
- **Default profile bundles:** `p-solo`, `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angles converged on Umami as the unambiguous default. License: MIT (Umami Software, Inc.) — zero copyleft, zero network-use clause, white-label and bundle freely. This is the decisive factor for a commercial open-core template that may later offer a managed/hosted variant — every other top-tier option in this category (Plausible CE, Rybbit, OpenPanel, Aptabase, Counter.dev, Pirsch) is AGPL-3.0, which is fine for customer-self-host but triggers §13 obligations if we ever modify and host it as part of our offering. Operationally Umami is the lightest credible deploy: single Node container + Postgres (reuses our existing pg-tenant XRD, no new database primitive, no ClickHouse SSE 4.2 trap), runs on a 1 vCPU / 1 GB VPS so Profile 1 'Just Me' works. v3.1 (April 2026) closed the historical feature gap vs Plausible — cohorts, segments, funnels, journeys, regex filters, Web Vitals, Boards custom dashboards, Session Replay — so we don't need a graduation story until very late. The integration shape fits our existing Crossplane pattern cleanly (provider-helm Release + provider-kubernetes Object + provider-keycloak Client + pg-tenant Database/Role via a new XWebAnalytics XRD). The REST API (/api/send, /api/websites, /api/websites/:id/stats) is clean enough for the Phase 12 MCP server to wrap as 4 tools — exactly what Aegis needs to answer page-level questions and fire server-side events. Plausible CE is the runner-up for credibility (Hugging Face, MongoDB, PSF customers) but it's AGPL, needs ClickHouse + Postgres, and disqualifies Profile 1 — it belongs as an opt-in overlay, not the default.

**Integration outline:**

Ship a new XRD `XWebAnalytics` (claim kind `WebAnalytics`) composed via the existing Crossplane stack: (1) `provider-helm` Release for the christianhuth/umami chart pinned to a known-good v7.9.x; (2) `provider-kubernetes` Object for the Ingress (TLS via cert-manager, host umami.<env>.<domain>); (3) `provider-keycloak` Client for SSO into the Umami admin UI (group-based RBAC reusing the platform's Developers group); (4) `pg-tenant` Database + Role pair (Umami is Postgres-native — no second DB engine). Launcher CLI verb: `task setup:analytics umami` writes claims/web-analytics-umami.yaml, kubectl-applies it, waits Synced/Ready, then patches the marketing-site Helm values with UMAMI_WEBSITE_ID + UMAMI_SCRIPT_URL and triggers `task helm:upgrade marketing-site`. Tracker integration: single `<script data-website-id data-host-url data-do-not-track=true>` tag in the Nx web app's root layout; programmatic `umami.track()` / `umami.identify()` exposed via a thin `@template/analytics` wrapper package so polyglot services (Go/Python/Rust workers) get a typed client for server-side events (always set User-Agent header — /api/send 400s on empty UA). MCP server (Phase 12) exposes 4 tools wrapping `/api/websites/:id/stats`, `/api/websites/:id/pageviews`, `/api/websites/:id/events`, and `/api/send` with personal-access-token auth surfaced as a Kubernetes Secret synced via ESO from the platform AKV. Ship a `LICENSE-NOTES.md` in the analytics overlay clarifying: we reference upstream images unmodified, customer self-hosts, no copyleft flows to either party. Day-2 opt-in overlay: `task setup:analytics plausible` swaps the Composition to deploy Plausible CE (8gears chart) with its bundled ClickHouse — same XRD, same claim shape, different Composition; launcher TUI shows an AGPL-3.0 §13 advisory before applying. Document `default-deny` NetworkPolicy with explicit egress from marketing-site pods to the Umami Service only.

**Risks:**

- UMAMI_CLOUD_DRIFT: Umami Software sells a paid Cloud; some flagship marketing (streaming API, email digests, Slack reports) is Cloud-only. Founders comparing screenshots will assume self-host = Cloud; document the feature delta in launcher TUI and steer to the Docker image, not the Cloud signup.
- AGPL_BAIT_AND_SWITCH: if we ever offer a managed/hosted ts-monorepo-template variant that bundles Plausible CE (or any AGPL analytics) as part of our SaaS, §13 forces source disclosure for modifications. Hard guardrail: managed offering uses Umami only; AGPL overlays are customer-self-host only.
- USER_AGENT_400: Umami's /api/send silently rejects requests with an empty User-Agent — server-side events from Go/Python/Rust workers must set a UA header explicitly. Bake this into the @template/analytics wrapper and a smoke test.
- IDENTIFY_GDPR_TRAP: Umami's identify() API attaches a stable user_id and silently converts cookieless Umami into a personal-data processor. Default data-do-not-track=true and require an explicit opt-in flag before exposing identify() in the wrapper.
- COMMUNITY_CHART_CVE_BLINDSPOT: christianhuth/umami and 8gears/plausible Helm charts are community-maintained and NOT covered by upstream security disclosure. Pin chart versions, mirror to our internal OCI registry, and watch the chart repos (not just the app repos) for advisories.
- POSTGRES_NOISY_NEIGHBOR: defaulting Umami onto the platform's shared pg-tenant means analytics writes compete with app workloads — document upgrade path to a dedicated pg-tenant Database from Profile 3 up, and surface event/sec metrics in the platform dashboard.
- BRAND_RECOGNITION_GAP: non-technical founders trust the Plausible brand more than Umami for 'show this dashboard to my investor' moments — mitigate by shipping a polished default Boards layout and offering the Plausible CE overlay as a one-command swap.
- FEATURE_REGRESSION_RISK: Umami v3.x is young; the funnels/journeys/Web Vitals additions have shorter battle-testing than Plausible CE or Matomo. Pin to a tagged release, run a synthetic smoke test in CI for each version bump, and don't auto-upgrade chart appVersion.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Matomo** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **PostHog (core)** — `MIT` — self-host: yes — maturity: production-grade
- **GoatCounter** — `EUPL-1.2` — self-host: yes — maturity: usable
- **Rybbit** — `AGPL-3.0` — self-host: yes — maturity: usable
- **OpenPanel** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Shynet** — `Apache-2.0` — self-host: yes — maturity: usable

Think of web analytics as a counter at a museum entrance. Google Analytics is a counter that also reads everyone's wallet, photographs their face, and sells the photos to advertisers. The privacy-first OSS tools just count people coming in and note what page they walked to next — no photos, no wallets, no cookies. That's the whole pitch: "page views, referrers, geo, devices — minus the surveillance."

In 2026, the landscape sorts cleanly into three tiers.

Tier 1 (production-grade, the ones founders actually pick): Plausible CE, Umami, Matomo, PostHog. These have full-time companies behind them, weekly releases, and marquee customers you can name-drop. Plausible (~26.6k stars) is used by Hugging Face, Basecamp, Ghost, MongoDB, the Python Software Foundation. Umami (~22k stars, latest v3.1.0 April 2026) is the easiest single-Postgres single-Node deploy. Matomo is the 19-year-old Swiss-army-knife — heavy, PHP, but the only one with full GA4 feature parity, e-commerce, heatmaps. PostHog is the all-in-one beast (analytics + session replay + flags) but recommends Cloud above 300k events/month for self-host.

Tier 2 (usable, indie-friendly): GoatCounter (single 25MB Go binary, SQLite — ridiculously simple), Rybbit (the new hotness — ClickHouse-backed, ships session replay + funnels in the OSS build, unlike Plausible CE which gates them), OpenPanel (Mixpanel-style product analytics, full feature parity in self-host).

Tier 3 (SaaS-mostly or experimental): Pirsch (open-core, but self-host requires a paid enterprise license — effectively SaaS-only), Fathom (SaaS-only, no self-host), Shynet (Apache-2.0, community-maintained, sleepy), Counter.dev (minimalist, AGPL).

The license picture is the big trap. AGPL-3.0 dominates this category — Plausible CE, Aptabase, OpenPanel, Rybbit, Pirsch, Counter.dev are all AGPL. That's FINE if your customers self-host their own instance (they take on the obligation). It's a PROBLEM if you bundle and host it as part of your SaaS — the network-use clause means you'd have to open-source your modifications.

The two safe-license winners for a commercial template are Umami (MIT — do anything you want) and Shynet (Apache-2.0). PostHog's core is MIT-licensed too, but its enterprise features are under a separate non-OSS license, so be careful which parts you ship.

For this template (5 spend profiles, founder + agent audience), the right pattern is: ship Umami as the default in the Side-Project / Early-Startup profiles (one Postgres + one Node container, zero license risk), document Plausible CE as an opt-in for the Scaling profile (most polished UI, marquee credibility, AGPL is fine because the customer runs it themselves), and offer PostHog Cloud as the upgrade path when they want product analytics + session replay without operating ClickHouse themselves. Avoid bundling Matomo by default — PHP-ops is a tax junior engineers don't want.

**Key findings:**

- Umami v3.1.0 (April 2026) is the safest MIT-licensed default for a commercial template — single Postgres + Node deploy, ~22k stars, runs on a USD 5 VPS, and v3.x added Boards, Session Replay, and Web Vitals so it's no longer just a counter.
- Plausible Community Edition is AGPL-3.0 and remains the marquee-credible choice (Hugging Face, Basecamp, Ghost, MongoDB, Python Software Foundation, Open Source Initiative all paying customers); ~26.6k stars; the JS tracker is separately MIT-licensed to avoid AGPL virality on customer sites.
- Matomo (GPL-3.0, ~20k stars, project started 2007 as Piwik) is the only OSS option with true GA4 feature parity including e-commerce, heatmaps, A/B testing — but PHP 8.1+ / MySQL stack is heavy and premium plugins cost extra even on On-Premise.
- PostHog core is MIT but their self-host docs explicitly warn it's only suitable up to ~300k events/month; above that they steer you to Cloud — meaning bundling PostHog self-host as a 'scale' default would mis-set expectations.
- Rybbit (AGPL-3.0, ClickHouse-backed, Node/Koa + React) is the standout 2026 newcomer — ships session replay, funnels, retention, Web Vitals in the OSS build, which Plausible CE deliberately gates to Cloud-only.
- GoatCounter (EUPL-1.2, single 25MB Go binary + SQLite) is the lightest deploy in the category — ideal for the 'Just Me' USD 0 profile where running a Postgres is overkill; actively maintained by Martin Tournoij since 2019.
- Pirsch is misleading as 'open source' — the core is AGPL but self-hosting requires a separately negotiated paid enterprise license, so it's effectively SaaS-only for any non-trivial use; do not list as a self-host candidate.
- Aptabase (AGPL-3.0 server, MIT SDKs) is the only credible OSS choice for desktop/mobile-app analytics — relevant if the template's launcher CLI ever ships analytics for Tauri/Electron apps.
- Shynet (Apache-2.0) is license-safest after Umami but is community-maintained with sleepier release cadence than Plausible/Umami — usable but not the recommended default.
- Counter.dev (AGPL-3.0) and Fathom (SaaS-only, proprietary) are real but niche — Counter for ultra-minimalist needs, Fathom for teams that don't want to self-host at all.
- The license landscape is dominated by AGPL-3.0 (Plausible, Aptabase, OpenPanel, Rybbit, Pirsch, Counter.dev) — bundling any of these as part of a managed offering triggers the network-use clause; shipping them as opt-in for customer self-host is fine.
- OpenPanel is positioned as the Mixpanel-OSS replacement with full feature parity between self-hosted and cloud (unlike PostHog and Plausible CE) — relevant for product analytics, less so for pure page-view dashboards.

**Gotchas:**

- AGPL network-use trap: if you bundle Plausible CE / Rybbit / OpenPanel / Aptabase INTO your hosted SaaS, you owe source for your modifications. Shipping them as customer-deployed components in their cluster is the safe pattern.
- Plausible CE is intentionally feature-gated below Plausible Cloud — funnels, goals as conversions, some segmentations are Cloud-only. Don't promise founders 'self-host = full Plausible'.
- PostHog self-host is officially 'not recommended above ~300k events/month' per their own docs — bundling it as the Scaling-profile default mis-sets expectations; route Scaling users to PostHog Cloud instead.
- Matomo's 'free forever' marketing hides that several premium plugins (Media Analytics, Heatmaps, Funnels, SEO Reports) cost real money even On-Premise — junior engineers get burned when they discover this mid-rollout.
- Pirsch markets as open source but self-hosting requires a paid enterprise license — treat Pirsch as a SaaS-only candidate, not a self-host one.
- Umami's MIT license has zero restrictions but the company sells a paid Cloud — make sure docs steer customers to the open-source Docker image, not the 'Umami Cloud' signup, to avoid surprise vendor lock-in.
- GoatCounter's EUPL-1.2 is GPL-compatible and commercial-friendly but less recognized than MIT/Apache — some corporate legal teams will flag it for review even though it's safe; budget for the legal-review conversation.
- Counter.dev has conflicting license signals across docs (some say MIT, some say AGPL-v3) — confirm AGPL-3.0 from the GitHub LICENSE file before shipping; do not trust marketing pages.

**Recommendation (this angle):** Default the template to Umami (MIT, Postgres + Node, ~22k stars) for the Side-Project and Early-Startup profiles — zero license risk, founder-readable dashboards out of the box, runs on a single VPS. Offer GoatCounter (EUPL-1.2, single Go binary + SQLite) as the Just-Me USD 0 profile preset since it eliminates the Postgres dependency. Document Plausible CE (AGPL-3.0) as an opt-in for the Scaling-Startup profile — its marquee credibility (Hugging Face, MongoDB, PSF) sells the template to discerning founders, and AGPL is fine because the customer runs the instance, not us. For the Production-at-Scale profile, document PostHog Cloud as the recommended upgrade rather than self-host PostHog (their own docs warn self-host doesn't scale past ~300k events/month). Explicitly exclude Matomo from defaults (PHP-ops tax + premium-plugin paywall) and Pirsch (not truly self-hostable). Keep Rybbit on a watchlist — it ships features Plausible CE gates, but at ~1 year old it's not yet proven at scale. Avoid bundling any AGPL tool inside the template's own managed services to prevent the network-use clause from biting.

**Citations:**

- [Plausible analytics GitHub repo (license, stars)](https://github.com/plausible/analytics)
- [Plausible — Open source licensing and AGPL change](https://plausible.io/blog/open-source-licenses)
- [Plausible Community Edition announcement](https://plausible.io/blog/community-edition)
- [Plausible Self-Hosted page (customers: Hugging Face, Basecamp, MongoDB, PSF)](https://plausible.io/self-hosted-web-analytics)
- [Umami GitHub repo (MIT license)](https://github.com/umami-software/umami)
- [Umami releases (v3.1.0 April 2026)](https://github.com/umami-software/umami/releases)
- [Matomo GitHub repo (GPL-3.0)](https://github.com/matomo-org/matomo)
- [GoatCounter GitHub repo + LICENSE (EUPL-1.2)](https://github.com/arp242/goatcounter/blob/main/LICENSE)
- [Martin Tournoij — Choosing a license for GoatCounter](https://www.arp242.net/license.html)
- [Shynet GitHub repo (Apache-2.0)](https://github.com/milesmcc/shynet/blob/master/LICENSE)
- [Aptabase GitHub repo + LICENSE (AGPL-3.0 server, MIT SDKs)](https://github.com/aptabase/aptabase/blob/main/LICENSE)
- [Rybbit GitHub repo (AGPL-3.0)](https://github.com/rybbit-io/rybbit)
- [OpenPanel GitHub repo (AGPL-3.0)](https://github.com/Openpanel-dev/openpanel)
- [PostHog self-host disclaimer (300k events/mo limit)](https://posthog.com/docs/self-host/open-source/disclaimer)
- [Pirsch self-hosting requires enterprise license](https://docs.pirsch.io/faq)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **GoatCounter** — `EUPL-1.2` — self-host: yes — maturity: usable
- **Matomo (On-Premise)** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Aptabase** — `AGPL-3.0` — self-host: yes — maturity: usable

Web analytics for a commercial open-core template has one job: tell the founder "did anyone visit my marketing site, what country are they from, which page won". Cookies and consent banners scare junior devs, so the privacy-first cohort (Plausible, Umami, Matomo, GoatCounter, Aptabase) all do the same trick: hash IP + UA into a salted daily key, count once, throw the key away. No persistent identifier, no GDPR consent banner needed in most EU jurisdictions.

For OUR template, license is the gating question before features. We sell this template. If we BUNDLE an analytics service and run it as part of our offering, AGPL-3.0 (Plausible, Aptabase) is risky — section 13 says network users get the right to the source of the running modified version. That is fine if the CUSTOMER self-hosts the OSS binary unchanged (no obligation to anyone), but if we fork the code, the obligation propagates. Matomo is GPL-3.0 — same family, slightly weaker because GPL only triggers on distribution, not network use, but the Marketplace plugin terms are a separate commercial contract you have to read. GoatCounter is EUPL-1.2 — copyleft but with a European-court compatibility table; safer than AGPL for our use case. Umami is plain MIT — zero strings attached, white-label legal.

The integration shape is the same for all three top picks:

1. Helm chart exists (community-maintained for Plausible/Umami, Bitnami for Matomo).
2. NO dedicated Crossplane provider exists for any of them — but provider-helm + provider-kubernetes can wrap the Helm release and create the Secret/ConfigMap. Our XRD claim becomes "XWebAnalytics" → composes a `helm.crossplane.io/Release` + `kubernetes.crossplane.io/Object` for the Ingress + a `provider-keycloak` Client for OIDC SSO on the admin dashboard.
3. The launcher CLI verb `task setup:analytics` writes a claim YAML, kubectl-applies it, then injects the website-ID + tracker-host env vars into the marketing-site app's `values.yaml`.
4. For the Phase 12 MCP server: Umami's REST API (`/api/send`, `/api/websites`, `/api/websites/:id/stats`) is the cleanest wrap — token auth, JSON, OpenAPI-ish. Plausible's Stats API is also stable but more limited. Matomo's API is huge but XML-by-default and PHP-flavoured.

Recommendation: ship Umami as the default for "Side Project" and "Early Startup" tiers (MIT, lightweight, $5 VPS-friendly, Postgres reuses the platform's pg-tenant), offer Plausible CE as an opt-in for users who want the polished UI and accept AGPL self-host obligations, skip Matomo unless a customer specifically asks (heavy PHP stack, premium plugins gated, brand fit wrong for AI-agent users).

**Key findings:**

- Umami is MIT-licensed end-to-end (server + tracker), making it the only top-3 candidate with zero copyleft obligations for our commercial template — white-label and bundle freely.
- Plausible CE is AGPL-3.0 since Oct 2020 (relicensed from MIT specifically to block SaaS competitors); CUSTOMER self-hosting unmodified is fine, but if WE ship a managed-Plausible offering we trigger §13 network-use obligations.
- No dedicated Crossplane provider exists for Plausible, Umami, Matomo, or GoatCounter. Integration must go through provider-helm (Release CR) + provider-kubernetes (Ingress/Secret) — fits the existing 24-provider, 28-XRD pattern with a new XWebAnalytics XRD.
- Umami Helm chart: christianhuth/umami v7.9.2 actively maintained on ArtifactHub, plus mt190502/umami v8.1.4. Plausible Helm: 8gears/plausible-analytics-helm-chart + IMIO/helm-plausible-analytics (community, not official). Matomo: Bitnami official chart with bundled MariaDB.
- Umami exposes a stable REST API at /api/send (event ingest, no auth, just User-Agent header) + /api/websites + /api/websites/:id/stats with personal access token auth — clean wrap surface for the Phase 12 MCP server.
- Umami JS tracker: single <script> tag with data-website-id + data-host-url + data-auto-track + data-do-not-track + data-domains; programmatic API umami.track(event, data) and umami.identify(uid, data). No official @umami/react but community next-umami package updated May 2026.
- Plausible CE stack = Elixir/Phoenix app + PostgreSQL + ClickHouse, needs ≥2 GB RAM for ClickHouse alone — heavier than Umami (Node + Postgres or MySQL) which runs on $5 VPS.
- GoatCounter is a single Go binary + SQLite (or Postgres), ~1KB tracker, EUPL-1.2 — strongest privacy story but smallest feature set (no funnels, no UTM analysis, no custom dimensions).
- Matomo's Bitnami chart is production-grade but bundles MariaDB (we already standardize on Postgres via pg-tenant XRD), and premium features (heatmaps, A/B testing, funnels) are paid plugins under separate EULA — schema drift risk for our Helm library chart.
- Aptabase is AGPL-3.0 like Plausible BUT its scope is mobile/desktop app analytics (not pageviews); SDKs are MIT-licensed separately — useful for the Tauri/RN reference apps but not the marketing site.
- Plausible offers public-share embed links for dashboards — useful as a founder-readable view in the launcher TUI without building our own.
- Tier mapping: Just Me (USD 0) → Umami on the same Postgres as the platform; Side Project → Umami dedicated DB; Early Startup → Plausible CE or Umami + Loki backup; Scaling/Production → Plausible CE with ClickHouse on dedicated node or Plausible Cloud (managed).

**Gotchas:**

- AGPL-3.0 §13 triggers on network interaction, not distribution — if our managed offering modifies Plausible source and exposes it to users, we must publish the modified source to those users. The safest path is: ship UNMODIFIED upstream images, no patches, no Dockerfile changes.
- Plausible Community Edition uses BOTH PostgreSQL and ClickHouse — incompatible with our pg-tenant-only data plane assumption. Need to add a chi-audit (ClickHouse) compositional dependency or live with a Plausible-internal ClickHouse pod.
- Umami /api/send requires a valid User-Agent header — server-side event POSTs from Go/Python/Rust workers will silently 400 if they default to empty UA. Document this in the SDK wrapper.
- Matomo's Bitnami chart bundles MariaDB by default; you must explicitly disable it and point to an externalDatabase to reuse pg-tenant — but Matomo doesn't support Postgres natively (MySQL/MariaDB only), so it forces a second DB engine into the stack.
- GoatCounter's EUPL-1.2 has a custom 'Compatible Licenses' appendix that REMOVES some standard licenses from the EUPL-1.2 list — a fork-and-relicense escape hatch exists but is narrower than vanilla EUPL.
- Community Helm charts (christianhuth, 8gears, IMIO) are NOT covered by the upstream project's security disclosure process — a CVE in the chart's image-pinning or RBAC will not be announced by Plausible/Umami themselves. Pin chart versions and watch the chart repo, not the app repo.
- Plausible CE shares the SAME code as Plausible Cloud but is released on a delay (~6 months) and lacks some Cloud-only features (funnels v2, custom properties UI). Founders comparing screenshots to plausible.io will see drift.
- Umami's 'identify' API lets you attach a stable user_id to a session — convenient for product analytics, but if mis-used it converts cookie-less Umami into a personal-data processor under GDPR. Default the launcher to data-do-not-track=true and document identify() as opt-in.

**Recommendation (this angle):** DEFAULT: Umami (MIT). Ship a new XRD `XWebAnalytics` that composes (a) a `helm.crossplane.io/Release` for the christianhuth/umami chart pinned to a known-good version, (b) a `kubernetes.crossplane.io/Object` for the marketing-site Ingress with the tracker script injected via Helm values, (c) a `provider-keycloak` Client for SSO into the Umami admin dashboard, (d) a postgres Database/Role pair via the existing pg-tenant XRD (Umami supports Postgres natively — no second DB engine needed). Wire `task setup:analytics` to write the claim, wait for Synced/Ready, then patch the marketing-site `values.yaml` with UMAMI_WEBSITE_ID + UMAMI_SCRIPT_URL. For the Phase 12 MCP server, wrap `/api/websites/:id/stats`, `/api/websites/:id/pageviews`, `/api/websites/:id/events`, and `/api/send` as four MCP tools — this is enough for Aegis to answer 'how many people visited /pricing last week' and to fire server-side events from agent workflows. OFFER as opt-in: Plausible CE for users who want the polished UI and accept AGPL — same XRD shape, different Composition, and a clear note in the launcher TUI: 'Plausible is AGPL-3.0; if you modify the source and offer it as a network service, you must share your modifications with users.' SKIP: Matomo (Postgres-incompatible + premium-plugin license drift), GoatCounter (too thin for founder-readable dashboards), Fathom (SaaS-only — out of scope). Day-1 wiring (after `task setup:analytics umami`): (1) `kubectl apply -f claims/web-analytics-umami.yaml`, (2) `kubectl wait --for=condition=Ready xwebanalytics/marketing-site --timeout=300s`, (3) `kubectl -n analytics get secret umami-admin -o jsonpath='{.data.password}' | base64 -d`, (4) browser to https://umami.<env>.<domain>, log in via Keycloak SSO, copy website-ID, (5) `task launcher:config set analytics.umami.websiteId=<id>`, (6) `task helm:upgrade marketing-site` (re-renders with the script tag), (7) `curl -A 'test' https://umami.<env>.<domain>/api/send -d @event.json` to smoke-test ingestion, (8) `task mcp:test analytics.stats --website=marketing-site --range=24h` to confirm MCP wrap.

**Citations:**

- [umami-software/umami GitHub (MIT license, repo)](https://github.com/umami-software/umami)
- [Umami LICENSE (MIT)](https://github.com/umami-software/umami/blob/master/LICENSE)
- [Umami API docs (endpoints + auth)](https://docs.umami.is/docs/api)
- [Umami tracker functions (umami.track / identify / data-\* attrs)](https://docs.umami.is/docs/tracker-functions)
- [Umami send-server-side-events guide (/api/send, User-Agent gotcha)](https://docs.umami.is/docs/guides/send-server-side-events)
- [christianhuth Umami Helm chart on ArtifactHub](https://artifacthub.io/packages/helm/christianhuth/umami)
- [mt190502 Umami Helm chart v8.1.4 on ArtifactHub](https://artifacthub.io/packages/helm/mt190502/umami)
- [Plausible Community Edition (AGPL announcement)](https://plausible.io/blog/community-edition)
- [Plausible community-edition docker-compose repo](https://github.com/plausible/community-edition/)
- [8gears Plausible Helm chart](https://github.com/8gears/plausible-analytics-helm-chart)
- [Crossplane provider-helm (Release CR for Umami/Plausible install)](https://github.com/crossplane-contrib/provider-helm)
- [GoatCounter LICENSE (modified EUPL-1.2)](https://github.com/arp242/goatcounter/blob/main/LICENSE)
- [aptabase/aptabase GitHub (AGPL-3.0 server, MIT SDKs)](https://github.com/aptabase/aptabase)
- [Bitnami Matomo Helm chart README (MariaDB bundled)](https://github.com/bitnami/charts/blob/main/bitnami/matomo/README.md)
- [Self-Hosted Web Analytics 2026 comparison (Plausible vs Matomo vs Umami)](https://openpanel.dev/articles/self-hosted-web-analytics)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0-or-later` — self-host: yes — maturity: production-grade
- **PostHog (core)** — `MIT (ee/ dir under PostHog EE proprietary)` — self-host: yes — maturity: production-grade
- **GoatCounter** — `EUPL-1.2 (modified Compatible-Licenses appendix); count.js is ISC` — self-host: yes — maturity: production-grade
- **Matomo (core + free plugins)** — `GPL-3.0-or-later (premium plugins under InnoCraft EULA)` — self-host: yes — maturity: production-grade
- **Aptabase** — `AGPL-3.0 (SDKs MIT)` — self-host: yes — maturity: usable
- **Shynet** — `Apache-2.0` — self-host: yes — maturity: usable
- **Rybbit** — `AGPL-3.0` — self-host: yes — maturity: usable

Imagine you're selling a kitchen-knife set. Inside the box, you include a card that says "we recommend this brand of cutting board — here's the URL." You're not making the cutting board, you're not modifying it; you're just pointing customers at it. That's the legal posture our template should aim for when it ships analytics: a values.yaml that points at an upstream Docker image, with the actual SaaS run by our customer on their own cluster. We never deploy it as part of OUR managed service.

That posture matters because web-analytics tools cluster into three license buckets, and the bucket determines whether we (the template authors) or our paying customers get caught by obligations.

Bucket 1 — Permissive (MIT, Apache-2.0): Umami (MIT), PostHog core (MIT, with a separate ee/ dir under a proprietary "EE" license), Shynet (Apache-2.0), Fathom Lite (MIT, maintenance-only). You can do anything: bundle, fork, white-label, sell. Zero obligations beyond preserving the copyright notice. These are SAFE for any commercial bundling scenario.

Bucket 2 — Strong copyleft with network clause (AGPL-3.0): Plausible CE, Aptabase, Counter.dev, Rybbit, Pirsch (the open core; self-host needs an Enterprise license — a commercial trap). AGPL Section 13 only triggers when YOU modify the program AND run it as a network service. The FSF's own guidance and kemitchell's "Reading AGPL" both agree: an unmodified Docker image you reference (not modify, not redistribute repackaged) does NOT pull copyleft into adjacent code in a Helm chart. The container is the process boundary; the chart is a deployment descriptor, not a derivative work. Our customers self-host on their own cluster — so even if THEY hit Section 13 obligations, those obligations stay with them, not us. CAUTION (not AVOID) because: (a) if we ever fork and ship modified images, we owe source disclosure; (b) Plausible's trademark guidelines are AGPL-independent and forbid us calling our distribution "Plausible"; (c) Pirsch's self-host gate is contractual, not AGPL — read carefully before recommending.

Bucket 3 — Reciprocal-but-friendlier (EUPL-1.2, GPL-3.0): GoatCounter is EUPL-1.2 (with a tiny modification to the Compatible Licenses appendix; the count.js tracker is ISC — that's the part embedded in customer pages, which is the whole reason it's permissive). Matomo is GPL-3.0, with premium plugins under InnoCraft's proprietary EULA. EUPL is interesting because under EU law, dynamic linking is explicitly NOT viral; GPL-3.0 has no network clause, so a SaaS using Matomo doesn't owe source disclosure. Both SAFE for our reference-by-image pattern.

The license traps to know: SSPL (MongoDB, Elastic, Redis post-2024) — none of our analytics candidates use it, but always check. BUSL (HashiCorp) — none use it. Pirsch's "open core but Enterprise license required to self-host" is the closest thing to a trap in this list; it's effectively source-available, not OSS, and we should NOT recommend it.

**Key findings:**

- Umami is MIT (Copyright Umami Software, Inc. 2022). Zero obligations on us beyond preserving the copyright notice. SAFE for any bundling pattern — direct embed, fork, white-label.
- Plausible CE is AGPL-3.0-or-later (LICENSE.md, master). Section 13 (network use) only triggers if we MODIFY the program AND run it as a network service. Customer-self-hosted unmodified image → no obligation flows to us.
- PostHog core is MIT (Expat); the ee/ directory carries a separate PostHog EE proprietary license. Bundle ONLY the non-ee parts and confirm Docker tags exclude EE features, or pay for an EE license.
- GoatCounter is EUPL-1.2 with a slightly modified Compatible-Licenses appendix; the JS tracker (public/count.js) is ISC — critical because that's the code that embeds in customer pages.
- Matomo is GPL-3.0-or-later for core/tracker/free plugins. No network-use clause (it's GPL not AGPL). Premium plugins are InnoCraft EULA — never bundle those without a license.
- AGPL Docker containers are widely treated as a process boundary: an unmodified upstream image referenced from a Helm values file is NOT a derivative work of the chart. FSF + kemitchell both consistent on this.
- Pirsch is AGPL for the OSS core BUT self-hosting the actual product requires a paid Enterprise License — this is effectively source-available, not freely self-hostable. AVOID for the template's self-host-by-default story.
- Fathom Lite is MIT but in maintenance-only mode (no new features). Safe to bundle but recommend the maintained alternatives (Umami, Plausible CE) instead.
- Counter.dev and Rybbit are AGPL-3.0; Aptabase is AGPL-3.0 with MIT SDKs. Same analysis as Plausible CE — CAUTION if we modify and redistribute.
- Plausible's TRADEMARK guidelines are independent of AGPL and forbid using the 'Plausible' name on a distribution we modify and host — name the product something else if we ever fork.
- Shynet is Apache-2.0 — fully SAFE including patent grant. Good fit if the template ever ships a 'bundled' (not just referenced) analytics container.
- None of the leading candidates use SSPL, BUSL, FSL, or Commons Clause. The license landscape in this category is unusually clean compared to the database tooling category.

**Gotchas:**

- AGPL Section 13 misconception: many engineers think 'AGPL anywhere in the cluster = full source disclosure for everything.' Wrong. It triggers only on modified-and-served. Document this clearly in our template's LICENSE-NOTES so customers don't panic.
- PostHog has TWO licenses in one repo. If we pull tagged Docker images that include ee/ binaries, the EE license terms apply to those bits. Use the FOSS-only image tag or pin to a commit known to exclude ee/.
- Plausible CE's trademark is NOT covered by AGPL. We cannot publish a fork or re-tagged image called 'Plausible' without written permission. If we modify, rename.
- GoatCounter's hosted SaaS has a non-commercial free tier — that's a SaaS-side ToS, not a license obligation. Self-hosted EUPL-1.2 deployment has no such restriction. Don't conflate the two when recommending.
- Pirsch's 'open source' marketing is misleading for our use case — the GitHub repo is AGPL but the actual self-host product requires an Enterprise license agreement. Confusing for vibe-coders; we should explicitly flag this.
- Matomo premium plugins (Heatmap, Form Analytics, A/B Testing) are InnoCraft EULA, NOT GPL. If a customer enables them in our chart, that's THEIR contract with InnoCraft, but we should not ship values referencing them by default.
- EUPL-1.2 commercial-bundling analysis varies by jurisdiction: under EU law dynamic linking is explicitly non-viral, but US courts have not tested EUPL. Low risk for reference-by-image, but get legal review if we ever statically link GoatCounter as a library.
- Fathom Lite is in maintenance mode — DO NOT recommend as a primary pick even though MIT is the cleanest license; the upstream is effectively abandoned for new development.

**Recommendation (this angle):** For commercial open-core safety, ship Umami (MIT) as the default 'Just Me' / 'Side Project' tier — zero license risk for us or our customers, runs on a $5 VPS, has feature parity between cloud and self-host. For 'Early Startup' and up, also ship a values overlay for Plausible Community Edition (AGPL-3.0) as an opt-in — flag clearly in our docs that AGPL Section 13 only triggers on modification, and that referencing the upstream image carries zero copyleft obligation to the customer's surrounding code. For 'Production at Scale', offer PostHog (MIT core) as a third option but ship ONLY the FOSS image tags and document the ee/ boundary. AVOID Pirsch entirely (self-host requires paid Enterprise license — not OSS in practice). DEMOTE Fathom Lite (MIT but maintenance-mode upstream). Matomo and GoatCounter are SAFE secondary options but second-fiddle to Umami on simplicity and to Plausible on founder-readable UX. Never ship a fork rebranded as 'Plausible' (trademark) or modify any AGPL image inside our own SaaS-managed offering. Add a one-page LICENSE-NOTES.md to the analytics overlay that explicitly says: (a) we reference, do not modify, (b) customer self-hosts on their own cluster, (c) AGPL obligations sit with the customer if and only if they modify, (d) trademarks are separate from copyright licenses.

**Citations:**

- [Plausible LICENSE.md (AGPL-3.0)](https://github.com/plausible/analytics/blob/master/LICENSE.md)
- [Plausible blog — why we changed to AGPL](https://plausible.io/blog/open-source-licenses)
- [Plausible Trademark Guidelines](https://plausible.io/trademark)
- [Umami LICENSE (MIT)](https://github.com/umami-software/umami/blob/master/LICENSE)
- [Matomo Licenses page](https://matomo.org/licences/)
- [Matomo LICENSE on 5.x-dev (GPL-3.0)](https://github.com/matomo-org/matomo/blob/5.x-dev/LICENSE)
- [GoatCounter LICENSE (EUPL-1.2 modified)](https://github.com/arp242/goatcounter/blob/main/LICENSE)
- [GoatCounter author — choosing a license](https://www.arp242.net/license.html)
- [PostHog LICENSE (MIT + ee/)](https://github.com/PostHog/posthog/blob/master/LICENSE)
- [Shynet LICENSE (Apache-2.0)](https://github.com/milesmcc/shynet/blob/master/LICENSE)
- [Aptabase repo (AGPL-3.0, SDKs MIT)](https://github.com/aptabase/aptabase)
- [Pirsch self-host docs (Enterprise license required)](https://docs.pirsch.io/faq)
- [Reading AGPL — kemitchell (Section 13 analysis)](https://writing.kemitchell.com/2021/01/24/Reading-AGPL)
- [FSF — fundamentals of AGPLv3](https://www.fsf.org/bulletin/2021/fall/the-fundamentals-of-the-agplv3)
- [Containers, the GPL, and copyleft — opensource.com](https://opensource.com/article/18/1/containers-gpl-and-copyleft)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Umami** — `MIT` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Matomo (On-Premise)** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **GoatCounter** — `EUPL-1.2` — self-host: yes — maturity: production-grade
- **Shynet** — `Apache-2.0` — self-host: yes — maturity: usable
- **Aptabase (server)** — `AGPL-3.0` — self-host: yes — maturity: usable

Imagine you launch ts-monorepo-template and a junior dev clones it on a Friday night. They want to see, by Monday, how many people visited the marketing site, where they came from, and which CTA they clicked — without pasting a Google Analytics tag, without a cookie banner, and without paying anyone. That is the entire job for the "web analytics" slot.

Two simplifications make this slot small. (1) We do NOT need product analytics here (funnels, retention, identified user journeys) — that is a separate slot (PostHog / OpenPanel) in our 12-team study. We need _page-level_ analytics: page views, sessions, referrers, geo, device, top pages. (2) We do NOT need to ingest 100M events/day for a free template — even Profile 5 ("Production at Scale") realistically peaks at a few million pageviews/month for the marketing surface, because the SaaS app surface is measured separately by product analytics.

That collapses the field into three real contenders and two also-rans.

The three real contenders are Umami (MIT), Plausible Community Edition (AGPL-3.0), and Matomo (GPL-3.0). All three are cookieless, GDPR-friendly, actively maintained in 2026, and run in Docker. The differentiator for _us_ (a commercial template author) is license risk plus operational footprint.

Plausible CE and Matomo both copyleft. AGPL/GPL are fine when the _end user self-hosts on their own server_ — the network-use clause of AGPL only binds the operator (the customer), not the upstream template author. So we can legally ship Helm values that point at Plausible CE and our customers can run it. BUT the moment we, the template author, offer a "hosted starter pack" or a managed multi-tenant control plane that includes a Plausible instance servicing customer X's site, AGPL §13 kicks in and we owe source for any modification we made. Matomo (GPL-3.0 core) is technically safer because GPL only triggers on _distribution_, not network use — but Matomo's "Premium Plugins" (Heatmaps, A/B, SAML) are proprietary InnoCraft EULA, and people confuse the two constantly.

Umami is MIT. Zero license friction. We can fork it, white-label it, embed it in a managed offering, never publish a line of source. Its v3 (Oct 2025) and v3.1 (April 2026) added cohorts, segments, funnels, journeys, regex filters, Web Vitals, and a custom-dashboard "Boards" system — closing 80% of the historical "Plausible has nicer charts" complaint. It runs on a 1 vCPU / 1 GB VPS against Postgres or MySQL. We _already_ run Postgres in every profile, so Umami adds one container — no ClickHouse, no second database.

Plausible CE forces ClickHouse + Postgres. ClickHouse needs ≥2 GB RAM at idle and SSE 4.2 / NEON CPU. That alone disqualifies Profile 1 (Just Me, USD 0, often a 1 GB Hetzner box) and strains Profile 2 (Side Project, USD 5-20).

So: Umami is the right default. Plausible CE is the right "promote me on day 2 if the founder hates Umami's UX". Matomo is the right "regulated-industry / heatmaps + session-recording" upgrade for Profile 4-5.

**Key findings:**

- Umami v3.1 (April 2026, MIT, 37k stars, actively maintained) ships cohorts, segments, funnels, user journeys, regex filters, Web Vitals, and the 'Boards' custom-dashboard builder — feature gap vs Plausible is now small.
- Umami runs on Postgres or MySQL with a single Node container — ~1 vCPU / 1 GB VPS. Reuses the Postgres we already provision; adds zero new infra primitives.
- Plausible relicensed from MIT to AGPL-3.0 on 12 Oct 2020 _specifically to block commercial bundling/SaaS-ification_ — this is exactly the use case the license is hostile to for a commercial template author offering managed instances.
- Plausible CE requires both Postgres AND ClickHouse (≥2 GB RAM idle, SSE 4.2 / NEON CPU). Disqualifies Profile 1 and strains Profile 2 — wrong default.
- Matomo On-Premise is GPL-3.0 (network-use safe) but its competitive features (Heatmaps, A/B, Form Analytics, SAML, Roll-Up) are proprietary 'Premium Plugins' under InnoCraft EULA (~$999/yr bundle) — not OSS.
- GoatCounter (EUPL-1.2, Go single binary + SQLite or Postgres, 5.7k stars, v2.7.0 Dec 2025) is the lightest option but explicitly lacks funnels/conversions/API — perfect for Profile 1, undersized from Profile 3 up.
- Shynet (Apache-2.0, 3.1k stars, v0.14.0 Mar 2026) is alive but single-maintainer; pick it only if Apache-2.0 is a hard requirement.
- Aptabase server is AGPL-3.0 (SDKs MIT) and is optimized for mobile/desktop apps, not web marketing sites — wrong fit for this slot but reasonable for the Tauri/Expo apps slot.
- Cookieless, server-side-hashed analytics is exempt from GDPR consent banners per CNIL and German DSK guidance — Umami, Plausible, GoatCounter, Matomo all qualify when configured correctly.
- Pirsch and Fathom are SaaS-only (Pirsch self-host requires paid Enterprise license) — exclude from default bundle but list as upgrade path.
- Closest commercial alternative to Umami is Plausible Cloud: $9/mo at 10k pv (Starter), $14/mo at growth tier — Umami Cloud's free tier is 100k events/mo (or 1M depending on source), then ~$20 per additional 1M events. Both are reasonable upgrade paths if the founder doesn't want to operate.
- Umami exposes a clean REST API + script tag <2 KB; integrates with Nx web apps via a one-line <script> in the root layout — no SDK fan-out needed across our polyglot stack.

**Gotchas:**

- AGPL §13 'network use' clause: if WE (the template author) ever offer a managed/hosted variant that bundles Plausible CE serving a customer's pageviews, we owe source for any modification. Customer self-hosting is fine. This is the trap to avoid.
- Matomo core GPL-3.0 ≠ Matomo Premium Plugins. The marketing pages show Heatmaps and Session Recording on the same screen; founders assume they are FOSS. They are proprietary EULA-licensed add-ons that cost ~$999/yr bundled.
- Umami Cloud streaming-API and email-report features are NOT in the self-hosted MIT build — be clear in docs which subset customers get.
- GoatCounter has no funnels, no conversion tracking, no proper API. Don't recommend it as a graduation target — it's a starter ramp only.
- Plausible CE needs CPU with SSE 4.2 or NEON for ClickHouse — silent failure on some low-end ARM and old VPS hardware.
- Pirsch self-hosting is gated behind a paid Enterprise License negotiation; the public GitHub repo is the _Go library_, not the full app. Easy to misread.
- Shynet's last meaningful feature work pre-dates 2024; v0.14.0 (Mar 2026) was security + deps only. Treat it as maintenance-mode, not roadmapped.
- Don't auto-bundle Aptabase into the web-analytics slot — it's for mobile/desktop telemetry. Put it in the mobile-analytics slot for the Expo/RN reference app.

**Recommendation (this angle):** DEFAULT: bundle Umami as the day-1 web analytics tool. Three reasons for: (1) MIT license — zero risk for our commercial template AND zero risk for any customer who later wants to white-label, embed, or build a hosted offering; (2) reuses our existing Postgres — no new database primitive, no ClickHouse SSE 4.2 trap, runs on a 1 GB VPS so Profile 1 'Just Me' works; (3) v3.1 closed the historical feature gap (cohorts, funnels, journeys, segments, Boards, Web Vitals) so we don't need a graduation story until ~Profile 4. Three reasons against: (a) UI is denser than Plausible's famously clean single page — founders coming from Plausible Cloud will notice; (b) no built-in email/Slack weekly digests in the OSS build (Umami Cloud only); (c) Umami's brand recognition with non-technical founders is lower than Plausible's, which can hurt 'show this dashboard to my investor' moments. PROFILE MAPPING: Just Me — include-day-1 (Umami on the same Postgres). Side Project — include-day-1 (Umami). Early Startup — include-day-1 (Umami) + offer Plausible CE as an opt-in Crossplane claim for founders who want the prettier UI. Scaling Startup — keep Umami default; add Matomo On-Premise as on-demand for regulated-industry customers needing heatmaps/A-B (with clear EULA warning on Premium Plugins). Production at Scale — Umami default; document migration to Plausible Cloud ($9-19/mo) or Fathom (~$15/mo) as zero-ops upgrade. EXCLUDE from defaults: Pirsch (paid self-host), Fathom (SaaS only), Shynet (maintenance-mode), Aptabase (wrong slot — belongs to mobile-analytics), GoatCounter (too feature-thin to graduate). LICENSE GUARDRAIL: never include Plausible CE in any future 'managed ts-monorepo-template hosted offering' — AGPL §13 will bite. Customers self-hosting Plausible CE on their own cluster: safe.

**Citations:**

- [Umami Software GitHub repo (MIT, v3.1.0)](https://github.com/umami-software/umami)
- [Umami v3.1.0 release notes — funnels, journeys, cohorts, regex, Web Vitals](https://github.com/umami-software/umami/discussions/4167)
- [Umami v3 launch — cohorts and advanced segmentation](https://www.opensourceforu.com/2025/11/umami-v3-launches-with-new-interface-cohorts-and-advanced-segmentation/)
- [Umami Pricing (Cloud)](https://umami.is/pricing)
- [Plausible: open-source licensing and why we’re changing to AGPL (Oct 2020)](https://plausible.io/blog/open-source-licenses)
- [Plausible Community Edition repo + requirements](https://github.com/plausible/community-edition/)
- [Plausible Cloud pricing 2026](https://plausible.io/docs/subscription-plans)
- [Matomo licences (Core GPLv3 vs Premium Plugin EULA)](https://matomo.org/faq/general/matomo-analytics-licences-for-core-tracker-and-plugins/)
- [Matomo GitHub](https://github.com/matomo-org/matomo)
- [GoatCounter GitHub (EUPL-1.2)](https://github.com/arp242/goatcounter)
- [Shynet GitHub (Apache-2.0)](https://github.com/milesmcc/shynet)
- [Aptabase GitHub (server AGPL-3.0, SDKs MIT)](https://github.com/aptabase/aptabase)
- [Self-Hosted Web Analytics 2026 comparison (Plausible/Matomo/Umami/OpenPanel)](https://openpanel.dev/articles/self-hosted-web-analytics)
- [AGPL license analysis (FOSSA)](https://fossa.com/blog/open-source-software-licenses-101-agpl-license/)
- [GNU AGPL-3.0 official text (network-use clause §13)](https://www.gnu.org/licenses/agpl-3.0.en.html)

---

## Team 4 — CDP + event stream

### Synthesized verdict

- **Verdict:** `include-day-2`
- **Fit score:** 82 / 100
- **Top pick:** **Jitsu (newjitsu)**
- **License:** `MIT`
- **Default profile bundles:** `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angle reports converge on the same conclusion: Jitsu is the only mature CDP whose license (straight MIT, verified directly from the newjitsu LICENSE file, not stale marketing pages) imposes ZERO downstream obligations on us as commercial template authors AND on customers who self-host OR resell as a managed service. Every other major candidate has a disqualifying license issue for our open-core commercial model: RudderStack moved to ELv2 in Sept 2023 (commit dd4dd3d3) which explicitly forbids offering the software as a managed/hosted service to third parties — fine for customer self-host, fatal for any future "managed template" tier we run; Snowplow upstream moved to SLULA v1.1 in Jan 2024 which prohibits both production use AND high-availability multi-replica deployments without a paid license; TRACARDI is MIT+Commons Clause (Commons Clause strips the sell right); Hightouch is fully proprietary; Castled.io is dormant. PostHog is a strong runner-up (MIT core, excellent ergonomics, bundles CDP+analytics+replay+flags) but PostHog itself recommends migrating to Cloud above ~300k events/month, which caps it at our lower profiles and would force a hostile migration on Scaling/Production-at-Scale users — so it ships as an opt-in companion, not the default. Jitsu is actively maintained (v2.11.0 Aug 2025, commits through June 2026), speaks the Segment v1 wire protocol so customers can swap engines without rewriting clients, and has first-class ClickHouse output which dovetails with the analytics stack already in the template. The verdict is include-day-2 (not day-1) because Profile 1 "Just Me" should not pay the operational cost of running a CDP at all — a generic Segment-shaped webhook + OTel spans is enough until there is real signal to capture. Day-1 from Profile 2 (Side Project) onward.

**Integration outline:**

1. Vendor-neutral client wrapper: ship a `@template/tracking` package implementing the Segment v1 API surface (track/identify/group/page/alias). All app code calls only this wrapper, so the engine is swappable without app changes. Wrapper emits both an HTTP POST to the configured CDP and an OTel span (already wired through Tempo).

2. Single XRD `XCustomerDataPlatform` with engine discriminator `engine: jitsu | posthog | rudderstack` and shared fields (writeKeySecretRef, destinations[], retention, identityStitching, controlPlane: lite). Three Compositions, each composed of providers we already have: provider-helm (Release CR for the chart) + provider-kubernetes (Secret for write key + destination API tokens) + provider-keycloak (OIDC client for the CDP UI). No new Crossplane provider needed; uses 3 of our existing 24.

3. Helm story: Jitsu has no official chart, so fork a community chart (stafftastic/jitsu-chart is the best starting point) into `infra/helm/jitsu/`, pin it, and own the maintenance. License-audit the chart in CI to flag any drift toward ELv2/SLULA/AGPL/SSPL/Commons-Clause images. Default Jitsu engine wires to the existing ClickHouse instance for event storage and Postgres for metadata.

4. Launcher CLI verb `task setup:cdp -- --engine=jitsu --profile=<profile>` does: (a) write a CDP claim YAML to `infra/claims/dev/`, (b) wait for Crossplane to reconcile the XR, (c) extract the write key from the rendered Secret, (d) inject it as `CDP_WRITE_KEY` + `CDP_INGEST_URL` into `apps/*/.env` via secretspec, (e) print the ingest URL for the SDK to use.

5. MCP server (Phase 12) is engine-agnostic: it reads a `CDPWriteKey` Secret + endpoint URL from the cluster and forwards Aegis-emitted events as Segment-shaped JSON to `POST /v1/track`. This keeps Aegis vendor-neutral — users can swap to PostHog/RudderStack without touching agent code.

6. Profile bundling matrix:
   - p-solo: no CDP bundled; ship the wrapper + a webhook destination only. Optional opt-in to PostHog Cloud free tier (1M events/mo free).
   - p-hobby: Jitsu single container alongside ClickHouse already in stack. Default.
   - p-startup-small: Jitsu as default; PostHog self-host as opt-in (still under ~300k events/mo).
   - p-startup-scale: Jitsu as default; RudderStack as opt-in for customers who self-host on THEIR cluster — explicitly forbidden in any managed-by-us tier; Hightouch documented as commercial reverse-ETL upgrade.
   - p-enterprise: Jitsu as default; PostHog Cloud / Segment / Hightouch flagged as commercial alternatives once events exceed Jitsu's comfort zone or warehouse-native reverse-ETL becomes critical. Multiwoven (AGPL-3.0, customer-self-host only) recommended as reverse-ETL companion.

7. ADR + governance: write an ADR documenting (a) the MIT-default rationale, (b) the "no managed RudderStack/Snowplow/TRACARDI in any tier we operate" policy, (c) how to detect license-drift in PRs (SBOM step in CI flagging ELv2/SLULA/AGPL/SSPL/BUSL/Commons-Clause images in managed-tier Helm values), (d) PostHog ee/ exclusion rules — only files outside `ee/` are MIT, naive `git subtree` would pull in enterprise-licensed code.

8. Identity stitching documentation: be explicit that Jitsu stitches downstream in the warehouse via SQL models (anonymous_id↔user_id joins), PostHog stitches server-side via distinct_id + alias, RudderStack stitches server-side on userId. Normalize on the Segment `alias` verb at the wrapper layer and document the mapping per engine.

9. Day-1 wiring smoke test (5 commands): (a) `task setup:cdp -- --engine=jitsu`, (b) wait for XR Ready, (c) `kubectl -n cdp get secret jitsu-write-key -o jsonpath='{.data.key}' | base64 -d`, (d) inject via secretspec into apps/\*/.env, (e) `curl -u $KEY: $INGEST_URL/api/s/track -d '{"event":"test"}'` and verify the event lands in ClickHouse.

**Risks:**

- License drift / stale-doc trap — multiple 2025/2026 articles AND vendor blogs still describe rudder-server as AGPL when it's been ELv2 since Sept 2023. Mitigation: CI SBOM step that fetches the LICENSE file directly via GitHub API (not the badge, not the README) for every CDP-related image and flags any introduction of ELv2/SLULA/AGPL/SSPL/BUSL/Commons-Clause into managed-tier Helm values.
- Jitsu has NO official Helm chart (issue #880 confirms) — we depend on a community chart (stafftastic/jitsu-chart or similar) which can go stale or shift license. Mitigation: fork into infra/helm/jitsu/, pin, own maintenance, license-audit on every bump.
- ELv2 'managed service' boundary is fuzzy. If our future revenue model includes 'we host the template's CDP for you' and a customer opts into RudderStack, we are in breach the moment we sign the cloud bill. Mitigation: explicit policy in docs + a CI check on the managed-tier Helm values; RudderStack stays opt-in-self-host-only.
- Jitsu's connector catalog is materially thinner than RudderStack/Segment (no Marketo, Iterable, etc. out of the box). Customers needing exotic destinations will either build webhook destinations or feel pressured to migrate. Mitigation: document Hightouch + Segment as the commercial upgrade ladder; ship a generic HTTP webhook destination as part of the wrapper.
- Jitsu's language SDK coverage outside JS/Python is uneven — Go/Rust backends will need the generic HTTP API. Mitigation: the @template/tracking wrapper exposes the Segment HTTP shape as the lowest common denominator; per-language SDKs are optional sugar.
- PostHog self-host scaling ceiling (~300k events/month) makes the 'CDP + analytics in one box' story brittle at Scaling/Production-at-Scale profiles. Mitigation: surface this clearly in launcher docs; default Scaling+ to Jitsu, not PostHog.
- Identity stitching semantics differ across engines (warehouse SQL vs server-side distinctId vs server-side userId). Customers WILL get this wrong if undocumented. Mitigation: normalize on Segment alias at the wrapper layer, document the per-engine mapping with examples.
- PostHog mixed-license repo — ee/ subtree is PostHog Enterprise License, NOT MIT. A naive git subtree or Helm values bump can silently pull in enterprise-licensed code. Mitigation: pin PostHog images to non-ee community-build tags only, document the exclusion rule in the ADR, add a CI check that fails the build if any ee/ path is referenced.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Jitsu** — `MIT` — self-host: yes — maturity: production-grade
- **PostHog (with CDP module)** — `MIT (core) + ELv2 (ee/ dir)` — self-host: yes — maturity: production-grade
- **OpenSnowcat** — `Apache-2.0` — self-host: yes — maturity: usable
- **RudderStack (rudder-server)** — `Elastic License 2.0 (ELv2)` — self-host: yes — maturity: production-grade
- **Snowplow (Community/SLULA)** — `SLULA 1.1 (Snowplow Limited Use License)` — self-host: partial — maturity: production-grade
- **Multiwoven (reverse-ETL, by AI Squared)** — `AGPL-3.0 (core) + MIT (connectors)` — self-host: yes — maturity: usable
- **OpenPanel** — `AGPL-3.0` — self-host: yes — maturity: usable

Think of a Customer Data Platform (CDP) like a switchboard at an old telephone exchange. Your apps (web, mobile, backend) all dial into ONE wire — the CDP — and say things like "user_42 just signed up" or "user_42 clicked Buy". The CDP operator then plugs that call through to every tool that needs it: Mixpanel for analytics, Slack for sales alerts, Segment for the marketing team, your warehouse for the finance team. The win is that your apps only learn one phone number (one SDK), and the routing is configured centrally — no more re-instrumenting every app every time the marketing team adds Mailchimp.

CDPs have three jobs: (1) ingest events from clients via a thin SDK and from servers via HTTP, (2) stitch identities — match anonymous_id "abc" to user_id 42 when the user logs in, so events before and after login look like one person, and (3) fan out to N destinations in real time or batch, with retry, transformation, and PII-stripping along the way.

In 2026 the OSS landscape is mostly the same names as 2022 — RudderStack, Snowplow, Jitsu, PostHog — but the licenses have moved. This matters enormously for a template we plan to SELL. There are two failure modes:

1. The tool relicensed to something hostile to commercial bundling. Snowplow did this in Jan 2024 (SLULA — "you cannot run this in production or commercial environments without a paid license"). RudderStack's server moved from AGPL-3.0 to Elastic License v2 (ELv2), which says "you cannot offer this as a managed service to third parties" — fine if the customer runs it themselves on their cluster, NOT fine if we bake it into a hosted-by-us product.

2. The tool is technically AGPL but the user self-hosts. AGPL's network clause only triggers for the entity running the SaaS. Multiwoven, OpenPanel, and the original Snowplow community edition fall here. Safe for our customers to self-host. Less safe if we ever host on their behalf.

The clean choices for a self-hostable template in 2026 are:

- Jitsu (MIT) — the only major event collector with a no-strings-attached license. The natural default.
- OpenSnowcat (Apache-2.0) — a community fork of Snowplow that picks up where Snowplow's Apache 2.0 lineage stopped. Backed by SnowcatCloud, used in their managed offering. Use this if customers want Snowplow's schema-strict event model without SLULA.
- PostHog (MIT core, ELv2 for enterprise dir) — not a pure CDP but ships destinations, identity stitching, batch exports, AND product analytics in one. Often replaces 3-4 tools.
- RudderStack-server (ELv2) — fine for customers self-hosting, NOT fine if we offer hosted. Note SDKs are still MIT, so client-side instrumentation is reusable independently of where the server runs.

Skip Snowplow upstream (SLULA blocks production). Skip Hightouch (proprietary). Apache Hop is data orchestration, not a CDP — wrong tool.

**Key findings:**

- RudderStack's rudder-server is now Elastic License 2.0 (ELv2) — verified at github.com/rudderlabs/rudder-server/blob/master/LICENSE — NOT AGPL-3.0 as widely reported by older comparison blogs. ELv2 prohibits offering rudder-server 'as a hosted or managed service' to third parties. SAFE for customers self-hosting; AVOID for our managed-by-us tier.
- RudderStack SDKs and instrumentation libraries remain MIT licensed (per RudderStack's own licensing-explained post) — so client-side tracking code can be bundled regardless of which server backend the customer picks.
- Snowplow upstream relicensed in Jan 2024 to SLULA 1.1 — which explicitly forbids 'Production Use' and 'Commercial Use' without a paid contract. This is the strictest restriction in the category. AVOID for any bundled offering.
- OpenSnowcat (github.com/opensnowcat) is the Apache-2.0 community fork of Snowplow, maintained by SnowcatCloud (SOC2 Type 2). Compatible with Snowplow + Segment + Amplitude SDKs. Best path if customers want Snowplow-style schema-strict tracking without SLULA.
- Jitsu (github.com/jitsucom/jitsu, ~4.8k stars, MIT license, latest v2.11.0 Aug 2025, recent commits through 2026) is the only major OSS CDP with an unencumbered permissive license. TypeScript + Go core, ClickHouse-friendly. The safest default for a commercial template.
- PostHog (34.8k stars, MIT core + ELv2 ee/ dir) added a full CDP module (posthog.com/docs/cdp) with destinations, batch exports to Snowflake/BigQuery/Redshift, identity resolution. Caveat: self-host is officially recommended only up to ~100-300k events/month before PostHog Cloud is suggested.
- RudderStack v1.76.1 shipped June 2, 2026 — actively maintained. Production users named in their own materials: Mattermost, IFTTT, Grofers, 1mg, OnceHub.
- Multiwoven (AGPL-3.0 core, MIT connectors) was acquired by AI Squared in May 2024. It is reverse-ETL (warehouse-to-app), not event-collection — pair it with Jitsu/OpenSnowcat, don't replace them with it.
- Hightouch is proprietary SaaS — there is no OSS version. Do not include in bundle. Customers can integrate it externally if they pay Hightouch.
- Apache Hop is Apache-2.0 data ORCHESTRATION (Beam-based ETL pipelines), not a CDP. Wrong tool for this category despite the name showing up in some lists.
- REES46 'Open CDP' exists but is positioned as a data-science-team tool, not a developer-first event SDK. Niche fit — skip for the launcher path.

**Gotchas:**

- RudderStack license change is widely missed — many 2025/2026 comparison blogs still say 'AGPL'. Always check the LICENSE file in master, not the marketing page. If you ship a hosted RudderStack-backed offering, you are violating ELv2.
- Snowplow's SLULA is structured so that even running it in production for your OWN company without paying is a violation. This is harsher than AGPL or ELv2. Don't bundle Snowplow upstream — bundle OpenSnowcat or use the SLULA only for test environments.
- PostHog enterprise features (SAML SSO, SCIM, advanced permissions) live in the ee/ directory under ELv2. The MIT-only build is called 'FOSS-only' and requires a separate build path. Document this clearly so customers don't accidentally enable ee/ features and trip the license.
- PostHog self-hosting has soft scaling limits — they themselves recommend Cloud above ~300k events/month. Set customer expectations: PostHog is great until you hit volume.
- AGPL tools (Multiwoven, OpenPanel) are fine for the CUSTOMER to self-host. They are NOT fine if our managed offering hosts them on behalf of customers — the network-use clause forces source disclosure.
- Jitsu's 'Cloud' version and 'Open Source' (classic.jitsu.com) version diverged. Make sure docs point at the v2 OSS line (github.com/jitsucom/jitsu) not the deprecated classic.jitsu.com codebase.
- Identity stitching quality varies wildly: Jitsu uses anonymous_id↔user_id table joins, OpenSnowcat/Snowplow uses domain_userid + network_userid + user_id triplet, PostHog uses distinct_id with alias() merging. Document the model — customers WILL get this wrong if you don't.
- Server-side delivery requires either a sidecar (Jitsu bulker) or HTTP API client. Don't pretend the client SDK alone is a CDP — that's a tracker.

**Recommendation (this angle):** DEFAULT pick: Jitsu (MIT) as the bundled event-collection + fan-out CDP. It is the only mature option whose license imposes ZERO downstream obligations on us as commercial template authors or on customers running a managed service on top. Wire it in for all 5 profiles (Just-Me through Production-at-Scale) with a ClickHouse-or-Postgres backing store and connectors to Slack / Mixpanel / warehouse exports.

SECOND pick (optional add-on, schema-strict track): OpenSnowcat (Apache-2.0) for customers who need Snowplow-grade behavioral data modeling. Document as an opt-in replacement for Jitsu, not a parallel install.

POWER-USER ADD-ON: PostHog (MIT core only — disable ee/) for customers who want CDP + product analytics + session replay + flags in one binary. Ship as a separate Crossplane claim, not the default — its scaling story limits the 'Production at Scale' fit.

AVOID bundling: Snowplow upstream (SLULA prohibits commercial/production use), Hightouch (proprietary, no OSS path), Apache Hop (wrong category).

CAUTION on bundling: RudderStack — fine to support as a customer-managed backend, but do NOT include it in any hosted/managed tier we operate. Provide a Helm-only path, not a 'hosted by us' path. RudderStack SDKs (MIT) can be used freely on the client.

For the 'reverse-ETL warehouse→app' side of CDP, recommend Multiwoven as a self-hosted companion to Jitsu in the Scaling-Startup and Production-at-Scale profiles. AGPL is fine because the customer hosts it, not us.

**Citations:**

- [rudder-server LICENSE (Elastic License 2.0)](https://github.com/rudderlabs/rudder-server/blob/master/LICENSE)
- [RudderStack rudder-server GitHub repo](https://github.com/rudderlabs/rudder-server)
- [RudderStack's Licensing Explained (Feb 2021 — AGPL era, pre-change)](https://www.rudderstack.com/blog/rudderstacks-licensing-explained/)
- [Jitsu GitHub repo (MIT, v2.11.0, 4.8k stars)](https://github.com/jitsucom/jitsu)
- [Snowplow Limited Use License FAQ (SLULA — bans production/commercial)](https://docs.snowplow.io/docs/resources/limited-use-license-faq/)
- [Snowplow license change announcement (Jan 2024)](https://snowplow.io/blog/introducing-snowplow-limited-use-license)
- [OpenSnowcat (Apache-2.0 fork of Snowplow)](https://github.com/opensnowcat/opensnowcat-collector)
- [SnowcatCloud — why OpenSnowcat exists](https://www.snowcatcloud.com/snowplow/license-change/)
- [PostHog GitHub repo (MIT + ELv2 for ee/)](https://github.com/PostHog/posthog)
- [PostHog CDP destinations documentation](https://posthog.com/docs/cdp)
- [Multiwoven (AGPL-3.0 core, MIT connectors) — open-source reverse ETL](https://github.com/Multiwoven/multiwoven)
- [AI Squared acquires Multiwoven (May 2024)](https://www.prnewswire.com/news-releases/ai-squared-acquires-multiwoven-to-accelerate-delivery-of-data-and-ai-insights-into-business-applications-302141224.html)
- [OpenPanel GitHub repo (AGPL-3.0)](https://github.com/Openpanel-dev/openpanel)
- [Improvado — 7 Best Open Source Segment Alternatives 2026](https://improvado.io/blog/open-source-segment-alternative)
- [Elastic License 2.0 FAQ (SaaS/managed-service restriction)](https://www.elastic.co/licensing/elastic-license/faq)

### Angle: Integration mechanics

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Jitsu (newjitsu)** — `MIT` — self-host: yes — maturity: production-grade
- **PostHog (core, excluding ee/)** — `MIT-Expat (ee/ is PostHog Enterprise License)` — self-host: yes — maturity: production-grade
- **OpenSnowcat (Apache-2.0 fork of Snowplow)** — `Apache-2.0` — self-host: yes — maturity: usable
- **Apache Unomi** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **RudderStack (rudder-server)** — `Elastic License 2.0 (ELv2)` — self-host: yes — maturity: production-grade
- **Snowplow (pipeline apps: Collector, Enrich, Loaders)** — `Snowplow Limited Use License Agreement (SLULA v1.1)` — self-host: partial — maturity: production-grade

Picture our ts-monorepo-template as a recipe book we're selling to startup founders. Each "tool" we recommend is an ingredient. For CDP/event-stream — the thing that catches a user click on the client and fans it out to Mixpanel + Slack + Posthog + warehouse — the ingredient label (license) matters more than the taste, because some ingredients legally infect the rest of the dish.

There are three license shapes to know:

1. Permissive (MIT, Apache-2.0, BSD): "use this however, just keep my copyright." Safe to bundle, sell, modify, even fork into a paid product. This is what we want.

2. Strong copyleft (AGPL-3.0): "use this however, but if anyone touches your product over a network, you must release ALL the source code of YOUR product under AGPL too." This is a viral license. If our template ships AGPL software AS PART of the managed service we sell to customers, our customers' code might also need to be open-sourced. Catastrophic for an open-core commercial product. AGPL is fine if the END USER self-hosts it themselves — they take the obligation, not us — but it's risky to bake in by default.

3. Source-available (ELv2, BUSL, SLULA, SSPL, Commons Clause): "you can read and modify the code, but you can't compete with us by offering it as a managed service." Each has its own twist. The trap is that some of these prohibit exactly the thing a SaaS template does: shipping the software as part of a paid offering.

Now the CDP landscape:

- **RudderStack (rudder-server)** — used to be SSPL (Sept 2019), then AGPL, then in **Sept 2023** switched to **Elastic License 2.0 (ELv2)**. ELv2's killer clause: "you may not provide the software to third parties as a hosted or managed service." If we ship a Helm chart that deploys RudderStack into a customer's own cluster and they run it themselves — fine. If we offer "managed RudderStack" as part of our SaaS — NOT fine. CAUTION.

- **Jitsu** — straight **MIT**. No catch. The newjitsu repo's LICENSE file says "MIT License, Copyright (c) 2021 Jitsu Labs, Inc." Bundle freely, sell freely, fork freely. SAFE.

- **Snowplow** — moved in **Jan 2024** to the Snowplow Limited Use License Agreement (SLULA v1.1). It prohibits production use AND high-availability deployments without a paid commercial license. Pipeline apps (Collector, Enrich, Iglu Server, all the Loaders) are SLULA. AVOID for our use case. Good news: there's an Apache-2.0 fork called **OpenSnowcat** maintained by Snowcat Cloud, Inc. — that's the safe escape hatch if a customer wants Snowplow's data model.

- **Hightouch** — proprietary SaaS, no OSS distribution. AVOID for bundling (out of scope; can list as integration).

- **Castled.io** — mostly stale; no clear OSS license signal in 2026. Skip.

- **Apache Hop** — Apache-2.0, but it's an ETL orchestrator, not a client-side CDP. Wrong tool.

- **Apache Unomi** — Apache-2.0, ASF-governed, actively releasing (3.0 shipped). Heavyweight Java/Karaf stack. SAFE but high integration cost.

- **PostHog (CDP module)** — main repo is MIT-Expat; only the `ee/` directory is the Enterprise License. The CDP/destinations feature lives in the MIT-licensed code path. SAFE and ergonomic for our audience.

So for a sellable open-core template the picks are: PostHog (MIT) as default, Jitsu (MIT) as Segment-shaped alternative, OpenSnowcat (Apache-2.0) for warehouse-first behavioral teams. RudderStack stays on the table but only as a self-host instruction in docs, never bundled into a managed offering.

**Key findings:**

- RudderStack rudder-server is Elastic License 2.0 (ELv2), NOT AGPL. Direct fetch of the LICENSE file via GitHub API confirms ELv2. The license file history shows: SSPL (Sept 2019) -> AGPL -> ELv2 (Sept 2023, commit dd4dd3d3). Many blog posts (including RudderStack's own) still reference the older AGPL state and are stale.
- ELv2 has THREE limitations: (a) no offering the software as a managed/hosted service to third parties, (b) no circumventing license keys, (c) no removing notices. For our template: customers can self-host RudderStack from our Helm chart; we cannot offer 'managed RudderStack' as part of our SaaS without violating ELv2.
- Jitsu (newjitsu repo) is straight MIT. LICENSE file fetched and verified: 'MIT License, Copyright (c) 2021 Jitsu Labs, Inc'. Latest release v2.11.0 (Aug 2025), 331 releases total, actively maintained. Zero license risk for commercial bundling.
- PostHog core (everything outside the ee/ directory) is MIT-Expat. The CDP module (transformations, Hog functions, destination webhooks to Slack/Braze/Customer.io) lives in the MIT-licensed code path. Only the ee/ directory enterprise features are under the PostHog Enterprise License. Safe to bundle and sell.
- Snowplow switched from Apache-2.0 to Snowplow Limited Use License Agreement (SLULA v1.1) on Jan 8 2024. SLULA prohibits BOTH production use AND high-availability deployments without a paid commercial license. It also prohibits 'Competing Use'. AVOID for any commercial bundling.
- OpenSnowcat is a clean Apache-2.0 fork of the last Apache-licensed Snowplow release. Maintained by Snowcat Cloud, Inc., which runs production workloads on it. Production-grade, Snowplow-tracker-SDK compatible. Safe alternative for teams that want Snowplow's behavioral data model.
- Apache Unomi is Apache-2.0, ASF-governed, with active releases (3.0 with Karaf upgrade + ES v9). Heavy Java/Karaf stack — high integration cost — but legally bulletproof for commercial bundling.
- Apache Hop is Apache-2.0 but is an ETL orchestrator, not a CDP/event stream. Wrong tool for this team's intent; SAFE but off-scope.
- Hightouch is fully proprietary SaaS — no OSS distribution. Cannot be bundled into the template; only referenced as an external integration destination.
- TRACARDI (sometimes surfaced as an OSS CDP) is 'MIT with Commons Clause' — Commons Clause is an AVOID category because it explicitly bans commercial sale of the software or substantial functionality derived from it.
- Castled.io has no clearly active OSS distribution in 2026 and unclear per-module licensing. Not recommend.
- License-shift precedent matters: HashiCorp (Terraform -> BUSL 2023), Elastic (ES/Kibana -> SSPL 2021, then ELv2/AGPL added 2024), MongoDB (-> SSPL 2018), Redis (-> SSPL 2024), Snowplow (-> SLULA 2024), RudderStack (-> ELv2 2023). Any open-core CDP vendor is a candidate for future license tightening. Apache Foundation projects (Unomi, Hop) and MIT-licensed projects with no single corporate owner with revenue at risk (Jitsu, PostHog community edition) are structurally safer long-term bets.

**Gotchas:**

- Stale documentation trap: Multiple 2024-2026 articles AND RudderStack's own blog say 'rudder-server is AGPL-3.0'. The actual LICENSE file in the repo is ELv2 since Sept 2023. ALWAYS fetch the LICENSE file directly via GitHub API — do not trust marketing pages or third-party comparison posts.
- ELv2 'managed service' definition is fuzzy. Shipping a Helm chart customers deploy themselves = OK. Operating that Helm chart on behalf of customers as part of our SaaS = NOT OK. The boundary is whoever clicks 'kubectl apply' / signs the cloud bill. Document this clearly for customers in our template's CDP module.
- Snowplow's SLULA v1.1 'Non-Production Use' clause is widely misread. It explicitly bans high-availability (multi-instance) deployments. A single-instance dev/staging Snowplow is allowed; anything multi-replica for failover is NOT, regardless of traffic.
- PostHog mixed-license repo: do NOT blindly copy directories from PostHog into the template. Only files outside ee/ are MIT. The ee/ subtree carries the PostHog Enterprise License (proprietary-ish, source-available). A naive `git subtree` would pull in enterprise-licensed code.
- TRACARDI shows up in 'OSS CDP comparison' lists as 'MIT', but the real license is 'MIT with Commons Clause' — Commons Clause makes it AVOID for commercial bundling because it strips the 'sell' right.
- AGPL-3.0 reverse trap: if a customer self-hosts an AGPL CDP themselves, THEY bear the AGPL obligations, not us. But if our template ships an example deployment that we operate on their behalf (managed offering tier), the network-use clause attaches to our managed code. Keep AGPL components in 'self-host only' deployment profiles.
- Hightouch repositioning: it moved from 'reverse ETL' (2021) -> 'composable CDP' (2022) -> 'agentic marketing platform' (2025). It's proprietary SaaS throughout — fine as a destination integration via API, never as a bundled dependency.
- Apache Unomi requires Apache Karaf + Elasticsearch/OpenSearch — large operational surface. License-safe but the runtime cost is the gotcha. Don't pick it just for the license unless the team already runs Karaf.

**Recommendation (this angle):** For ts-monorepo-template commercial bundling, ship TWO CDP options by default, both license-safe:

(1) PRIMARY: PostHog (MIT-Expat, core only — exclude ee/). Best ergonomic fit for the 'Just Me' / 'Side Project' / 'Early Startup' profiles because it bundles product analytics + CDP + feature flags + session replay in one MIT-licensed binary. Destinations include Slack, Mixpanel-style webhooks, Customer.io, Braze. Document explicitly that the template's Helm values reference the MIT-licensed image tag and do NOT include ee/ paths.

(2) ALTERNATIVE: Jitsu (newjitsu, MIT). Best fit when the user wants a strict Segment-shape architecture (single client SDK -> server -> N destinations) without the analytics/replay surface area. MIT throughout, zero bundling risk.

(3) ESCAPE HATCH for behavioral/warehouse-first teams: OpenSnowcat (Apache-2.0 fork of Snowplow). Wire it into the 'Scaling Startup' profile only — it has higher operational complexity but is the only license-safe path to the Snowplow data model.

DO NOT BUNDLE: RudderStack (ELv2 prohibits managed-service offering), Snowplow pipeline apps (SLULA prohibits production + HA), TRACARDI (MIT + Commons Clause), Hightouch (proprietary).

OPTIONAL BUT NOT DEFAULT: Apache Unomi (Apache-2.0, license-safe but heavyweight Karaf stack — offer as advanced option in 'Production at Scale' profile).

For RudderStack specifically: include a docs page explaining how to wire up a self-hosted RudderStack instance the customer operates themselves, but never bake it into a deployment manifest the template itself operates. The ELv2 managed-service clause makes it legally hostile to our open-core commercial model.

Concrete deliverables for the template's CDP module: (a) Helm chart values for posthog-community + jitsu, both pinning to non-ee/non-enterprise tags; (b) Crossplane Composition for posthog-cdp XR; (c) ADR documenting license rationale and the 'no managed RudderStack' policy; (d) a SBOM step in CI that flags any introduction of ELv2/SLULA/AGPL/SSPL/BUSL/Commons-Clause images into our managed-tier Helm values.

**Citations:**

- [RudderStack rudder-server LICENSE file (Elastic License 2.0) — direct GitHub source](https://github.com/rudderlabs/rudder-server/blob/master/LICENSE)
- [RudderStack LICENSE commit history (SSPL -> AGPL -> ELv2 in Sept 2023)](https://github.com/rudderlabs/rudder-server/commits/master/LICENSE)
- [Elastic License 2.0 (ELv2) full text](https://www.elastic.co/licensing/elastic-license)
- [Elastic License 2.0 (ELv2) FAQ — managed service definition](https://www.elastic.co/licensing/elastic-license/faq)
- [Jitsu LICENSE file (MIT)](https://github.com/jitsucom/jitsu/blob/newjitsu/LICENSE)
- [PostHog LICENSE file (MIT-Expat with ee/ exception)](https://github.com/PostHog/posthog/blob/master/LICENSE)
- [PostHog Enterprise License (ee/ directory)](https://github.com/PostHog/posthog/blob/master/ee/LICENSE)
- [Snowplow Limited Use License Agreement (SLULA v1.1) — full text](https://docs.snowplow.io/limited-use-license-1.1/)
- [Snowplow Limited Use License Agreement FAQ](https://docs.snowplow.io/docs/resources/limited-use-license-faq/)
- [Snowplow component license matrix (Apache 2.0 / BSD 3 / Community / Limited Use / SPAL)](https://docs.snowplow.io/docs/licensing/)
- [OpenSnowcat — Apache-2.0 fork of Snowplow](https://opensnowcat.io/manifesto)
- [OpenSnowcat Collector GitHub repo (Apache 2.0)](https://github.com/opensnowcat/opensnowcat-collector)
- [Apache Unomi LICENSE (Apache-2.0)](https://unomi.apache.org/)
- [Apache Hop LICENSE (Apache-2.0)](https://github.com/apache/hop/blob/main/LICENSE)
- [RudderStack licensing blog (now-outdated re: AGPL — useful as historical context)](https://www.rudderstack.com/blog/rudderstacks-licensing-explained/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Jitsu** — `MIT` — self-host: yes — maturity: production-grade
- **PostHog (CDP module)** — `MIT` — self-host: yes — maturity: production-grade
- **RudderStack (opt-in, customer self-host only)** — `Elastic-2.0` — self-host: yes — maturity: production-grade
- **Segment (commercial upgrade path)** — `Proprietary SaaS` — self-host: no — maturity: production-grade
- **Hightouch (reverse-ETL upgrade path)** — `Proprietary SaaS` — self-host: no — maturity: production-grade

A Customer Data Platform (CDP) is the plumbing between "user did a thing" and "every tool that cares about user-did-a-thing." Think of it as a USB-C hub: you fire one event from your frontend or backend (`track('SignedUp', {plan: 'pro'})`), and the CDP fans it out to Slack, Mixpanel, PostHog, your warehouse, a webhook, the marketing email tool, your billing system — without you writing N HTTP calls or N SDKs. It also stitches identities (anon visitor → logged-in user → paying customer is the same person) and gives you a single profile per user.

For a startup founder shipping a SaaS today, the question is not "do I need a CDP" — it's "when do I bite the operational cost?" Because every CDP, even the open-source ones, is an extra service to run: a write pipeline, a queue, often a worker pool, and a database. The win is downstream: you stop rewriting analytics every quarter.

The candidates split into three tribes by license, which is the deciding factor for a template we sell:

1. **MIT/Apache safe**: Jitsu (MIT), PostHog core (MIT). These you can bundle, embed, run as part of your managed offering — no obligations leak onto you or your customers.

2. **Source-available, "no managed competitor" licenses**: RudderStack (Elastic License 2.0 server, ELv2 SDKs). ELv2 explicitly forbids "hosting the software as a managed service for third parties." If you sell a managed RudderStack, you're in breach. If your customer self-hosts, fine. For a template, the line is fuzzy: bundling is OK, hosting RudderStack ON BEHALF of paying customers is not.

3. **Effectively proprietary**: Snowplow's Community/SPAL licenses are PolyForm Noncommercial-derived — non-commercial use only without a paid license. Castled.io's repo is dormant. Hightouch is fully proprietary. Apache Hop is ETL, not a CDP.

The shape of the recommendation: for the template, ship a **vendor-neutral client SDK** (Segment spec — `track`/`identify`/`group`/`page`) wired through OpenTelemetry tracing, then provide **Jitsu** as the default bundled fan-out engine because (a) MIT, (b) one Docker container, (c) ClickHouse-friendly which matches what's already in the stack, (d) actively maintained (v2.11 in Aug 2025). For founders who outgrow Jitsu's smaller catalog, PostHog gives analytics+replay+CDP-in-one (still MIT-safe), and RudderStack stays available as an opt-in for self-hosted customers who want warehouse-native + a huge connector catalog. We never deploy RudderStack as part of OUR managed offering — only the customer's. Snowplow is out: the SPAL/Community licenses are non-starters for a commercial template even with the rights we hold over our own work. Castled is out: abandoned. Hightouch is the recommended upgrade path for reverse-ETL on profile 5.

**Key findings:**

- Jitsu is MIT-licensed end-to-end, single Docker deployment, actively maintained (v2.11.0 released Aug 2025) — the only obviously commercial-safe full CDP in the pool.
- RudderStack server moved to Elastic License 2.0 (ELv2) — ELv2 explicitly prohibits offering the software as a managed service to third parties, which means we cannot run RudderStack as part of OUR SaaS but customers can self-host freely.
- RudderStack's npm SDK shows MIT + Elastic-2.0 + Apache-2.0 across components — embedding the client SDK in a customer browser is fine; bundling the server is the risk vector.
- PostHog core (including CDP, ingestion, basic analytics) is MIT; self-hosted recommendation caps at ~100k-300k events/month before Cloud migration is recommended — fine for Just Me / Side Project profiles, not for Scaling/Production.
- Snowplow has three license tiers: Apache-2.0 for some components, Snowplow Community License (SCL), Snowplow Limited Use License (SLULA), and Snowplow Personal/Academic License (SPAL, based on PolyForm Noncommercial) — the commercial-use surface is restricted and a non-starter for a sold template.
- Castled.io's GitHub repo activity has effectively stalled since 2022-2023; treating it as production-grade in 2026 is risky.
- Hightouch is closed-source SaaS — not bundleable, but the obvious commercial upgrade target for reverse-ETL on Scaling+ profiles.
- Apache Hop is an Apache-licensed orchestration/ETL tool, not a CDP — wrong category for this team's intent (client SDK + identity stitching + fan-out).
- OpenCDP shows minimal traction and no clear license/maintenance signal in 2026 — exclude.
- Resource profile: Jitsu single container fits within Side Project budget (USD 5-20); PostHog self-host needs 4 vCPU/16 GB RAM minimum which pushes it into Early Startup (USD 30-150); RudderStack at scale typically wants a small cluster (worker + jobsdb + scheduler).
- Existing stack alignment: Jitsu has first-class ClickHouse output, which dovetails with the ClickHouse audit layer already in pn-cluster-ap-south-1.
- Identity stitching: PostHog and RudderStack both do server-side identity resolution; Jitsu is more of an event pipeline (identity stitching is downstream in the warehouse) — call this out so founders know what they're picking.

**Gotchas:**

- ELv2 'no managed service' clause is the trap — if our launcher CLI or marketing site offers 'managed RudderStack' as a tier, we're in breach. Customer-self-hosted RudderStack is fine; we-host-for-customers is not.
- Snowplow SPAL is based on PolyForm Noncommercial — even internal experimentation by us (the template authors) for commercial purposes triggers the need for a commercial license. Do not casually drop Snowplow components into the template.
- Jitsu's connector catalog is materially smaller than RudderStack's or Segment's — founders bundling Jitsu must accept that exotic destinations (e.g. Marketo, Iterable) may need custom HTTP/webhook destinations or a self-built connector.
- PostHog self-host is officially recommended up to ~300k events/month; above that PostHog itself routes you to Cloud. If we bundle PostHog as default on Production-at-Scale, we are setting users up for a forced cloud migration.
- RudderStack's JavaScript SDK package on npm shows mixed licenses (MIT + Elastic-2.0 + Apache-2.0); audit the transitive license before shipping it in the launcher CLI, especially if the CLI is also Elastic-incompatible.
- Identity stitching is not free — Jitsu pushes that work into the warehouse (SQL models), PostHog/RudderStack do it server-side. Founders who don't have a warehouse yet will get a worse experience with Jitsu than with PostHog.
- Castled.io and OpenCDP have low maintenance signal — do not propose either as a default. If a customer asks specifically, route them to Hightouch (proprietary) or Grouparoo successor projects.
- Server-side delivery from Go/Python/Rust backends needs SDKs in each language. RudderStack and PostHog have official multi-language SDKs; Jitsu's coverage is thinner outside JS/Python — verify SDK availability per language before commitment.

**Recommendation (this angle):** Adopt a layered, license-safe strategy mapped to the 5 profiles:\n\n**Default architecture (all profiles)**: Ship a vendor-neutral `@template/tracking` client package that wraps the Segment-style API (`track`/`identify`/`group`/`page`) and emits both (a) OTel spans for first-party observability and (b) a generic HTTP webhook the user configures. This means the template never hard-couples to one CDP vendor.\n\n**Profile mapping**:\n- **Just Me (USD 0)**: include-on-demand-only. Direct webhook to Slack + Discord; no CDP. PostHog Cloud free tier (1M events/mo free) recommended as opt-in.\n- **Side Project (USD 5-20)**: include-day-2 — Jitsu in a single Docker container alongside the app, ClickHouse output reuses the existing CH instance. MIT license, single-container ops.\n- **Early Startup (USD 30-150)**: include-day-1 — Jitsu as default; PostHog self-host as opt-in for product analytics + session replay (still under the ~300k events ceiling).\n- **Scaling Startup (USD 300-1500)**: include-day-1 — Jitsu remains default; offer RudderStack as opt-in (customer self-host on their cluster — never as our managed service); document Hightouch + Segment as the commercial upgrade paths.\n- **Production at Scale (USD 2k+)**: include-day-1 — same Jitsu default; flag PostHog Cloud / Segment / Hightouch as recommended commercial alternatives once events exceed Jitsu's comfort zone or when warehouse-native reverse-ETL becomes critical.\n\n**Top choice — Jitsu** — 3 reasons FOR: (1) MIT license, zero commercial-use friction in a sold template; (2) single-container deployment that fits the launcher CLI's 'just works' promise; (3) native ClickHouse output aligns with the existing analytics stack. 3 reasons AGAINST: (1) smaller built-in connector catalog vs. RudderStack/Segment; (2) identity stitching pushed to the warehouse layer rather than handled server-side; (3) language SDK coverage is uneven outside JS/Python — Go/Rust backends will need the generic HTTP API.\n\n**Commercial upgrade comparison**: Segment Team plan starts ~USD 120/month for 10k MTUs but scales steeply (USD 1k+ at 100k MTUs); Hightouch starts ~USD 350/month for reverse-ETL. The Jitsu→PostHog Cloud→Segment+Hightouch ladder gives founders a clear $0 → $0-200 → $1k+/month progression without ever rewriting their tracking code, because the `@template/tracking` wrapper isolates the change.\n\n**Explicitly exclude**: Snowplow (SPAL/Community licenses block commercial bundling), Castled.io (abandoned), Apache Hop (wrong category — ETL not CDP), OpenCDP (no maintenance signal).

**Citations:**

- [GitHub - rudderlabs/rudder-server (ELv2 license)](https://github.com/rudderlabs/rudder-server)
- [RudderStack Open Source Docs](https://www.rudderstack.com/docs/get-started/rudderstack-open-source/)
- [RudderStack Licensing Explained](https://www.rudderstack.com/blog/rudderstacks-licensing-explained/)
- [Elastic License 2.0 FAQ](https://www.elastic.co/licensing/elastic-license/faq)
- [GitHub - jitsucom/jitsu (MIT license)](https://github.com/jitsucom/jitsu)
- [Jitsu official site](https://jitsu.com/)
- [GitHub - PostHog/posthog (MIT core)](https://github.com/PostHog/posthog)
- [PostHog self-host support docs](https://posthog.com/docs/self-host/open-source/support)
- [Snowplow licenses overview](https://docs.snowplow.io/docs/licensing/)
- [Snowplow Limited Use License intro](https://snowplow.io/blog/introducing-snowplow-limited-use-license)
- [Snowplow Personal and Academic License FAQ](https://docs.snowplow.io/docs/licensing/personal-and-academic-license-faq/)
- [Castled.io site / repo](https://github.com/spatialy/castled0)
- [Castled Launch HN (YC W22)](https://news.ycombinator.com/item?id=30072244)
- [7 Best Open Source Segment Alternatives 2026](https://improvado.io/blog/open-source-segment-alternative)
- [Best CDPs for developers (PostHog blog)](https://posthog.com/blog/best-customer-data-platforms-for-developers)

---

## Team 5 — Customer support

### Synthesized verdict

- **Verdict:** `include-only-on-demand`
- **Fit score:** 82 / 100
- **Top pick:** **Chatwoot (Community Edition)**
- **License:** `MIT (core only; /enterprise directory is proprietary source-available and must be excluded/feature-flagged-off in template builds)`
- **Default profile bundles:** `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angle reports converge on the same top pick: Chatwoot Community Edition. It is the ONLY OSS customer-support tool in 2026 with a permissive (MIT) core, which is the decisive factor for a commercial open-core template that may one day include a managed-SaaS tier. Every plausible runner-up (Zammad, FreeScout, Erxes) is AGPL-3.0 — workable when the customer self-hosts unmodified images, but a footgun the moment we (the template authors) run a hosted demo or managed offering, because AGPL §13 network-use kicks in on modifications. Erxes additionally carries a non-OSI Commons-Clause-style "no SaaS competing with Erxes Inc" restriction (AVOID). UVdesk is OSL-3.0 (legal-review friction; AVOID). osTicket is GPL-2.0 but stagnant, UX from 2010, no native chat. Helpy is MIT but abandoned since March 2023. Papercups is maintenance-only. Plain/Linear are proprietary SaaS — irrelevant for a self-host bundle (but worth naming as the graduation path).

Chatwoot is also operationally ready for our existing stack: official Helm chart (chatwoot/charts v2.0.23, active), clean REST API with HMAC-signed webhooks (perfect substrate for the Phase 12 MCP server and Aegis), three independent community Chatwoot MCP servers already exist (hugoblanc, fazer-ai, gobenpark), and the chart fits the Crossplane provider-helm + provider-kubernetes + provider-terraform pattern we already use for Keycloak realm seeding. 29.9k stars, daily commits, v4.14.1 shipped 2026-05-29.

Why include-only-on-demand rather than day-1: Just-Me and Side-Project tiers have no support volume — forcing them to operate Rails + Postgres + Redis + Sidekiq + uploads PVC purely for a chat widget is wasteful and contradicts the "USD 0 / USD 5-20" profile economics. The right default is opt-in via the launcher CLI starting at Early Startup, and default-ON only at Scaling Startup and Production at Scale where there are actual paying customers and agents.

Fit score 82 (not higher) because: (a) Chatwoot is Ruby on Rails, the only Rails runtime in an otherwise Go/Python/Rust/TS template — operational surface mismatch; (b) the most-wanted features (SLA management, audit logs, Captain AI) are in the proprietary /enterprise dir and we must strip them at build time, which means the "free forever" pitch has a real ceiling; (c) the MIT/proprietary split in a single repo creates a sharp build-time discipline requirement (use chatwoot/chatwoot-ce image, never chatwoot/chatwoot, or strip /enterprise in our own build).

**Integration outline:**

Ship as an opt-in `support/` pillar in the launcher CLI, default-ON from Early Startup ($30-150) upward.

1. Container/image discipline (license-safety gate):
   - Default to upstream image `chatwoot/chatwoot-ce:v4.14.x` (CE-only build, no /enterprise). NEVER reference `chatwoot/chatwoot:*` in template defaults.
   - If we maintain our own image, strip `/enterprise` at build time and set INSTALLATION_PRO_USED=false explicitly.

2. Crossplane wiring (matches existing pattern used for Keycloak):
   - New XRD: `XCustomerSupport` (kind: `CustomerSupportClaim`) under apis/platform.
   - Composition fans out to: (a) `provider-helm` Release targeting `chatwoot/charts` v2.0.23+ with `postgresql.enabled=false`, `redis.enabled=false`, `image.repository=chatwoot/chatwoot-ce`, pinned `image.tag`; (b) `provider-kubernetes` Object for Ingress + Keycloak OIDC ExternalSecret/PushSecret; (c) `provider-terraform` Workspace wrapping the Chatwoot REST API to seed a default Website inbox, default Agent (from Keycloak), and a signed Webhook pointed at the Phase 12 MCP server.

3. Shared-infra reuse (avoid orphan Postgres/Redis):
   - External Postgres: connect to the shared pg-tenant CNPG cluster via ExternalSecret (`POSTGRES_HOST/PORT/USERNAME/PASSWORD/DATABASE`). Ensure WAL-G PITR posture covers the new database.
   - External Redis: point at the existing Dragonfly/Redis platform service.
   - Uploads: configure ActiveStorage to S3-compatible backend (MinIO on platform), not a chart-bundled PVC.

4. Identity + access:
   - OIDC SSO via Keycloak (already in stack). Realm + client seeded by the existing provider-keycloak Composition; client credentials projected into Chatwoot via ExternalSecret.

5. Observability:
   - Sidecar OTel collector scraping Chatwoot's Prometheus exporter; logs to Loki via Promtail; traces via Tempo. Add a Grafana dashboard from chatwoot/charts contrib.

6. Webhook reliability:
   - Chatwoot webhook delivery is best-effort with no DLQ. Subscribe a tiny relay that mirrors webhooks into the existing Strimzi Kafka cluster (`chatwoot.events` topic), and have the MCP server + backend consume from Kafka — survives outages and replays.

7. MCP server (Phase 12 / Aegis):
   - Fork or wrap `hugoblanc/chatwoot-mcp` (TypeScript, OpenAPI-typed) since it matches our TS/Nx stack. Expose a `chatwoot` tool namespace: `create_conversation`, `send_message`, `list_inboxes`, `assign_conversation`, `create_webhook`, `search_contacts`. HMAC-verify inbound webhook signatures.

8. Marketing-site widget:
   - During `task setup:chatwoot`, launcher CLI calls the Chatwoot API to create a Website inbox, fetches the generated JS snippet, and writes it into the marketing site's `_document.tsx` (or equivalent) behind a feature flag.

9. Profile defaults:
   - Just Me / Side Project: off (docs only). Early Startup: opt-in, default-on after `task setup:support`. Scaling Startup / Production at Scale: default-on, with documented upgrade ladder to Chatwoot Cloud ($19/agent), then Plain ($35/agent, 50% off VC-backed) or Intercom ($29/seat) as graduation paths.

10. Day-1 commands (~7):
    `task crossplane:install:provider-helm` → `task crossplane:install:provider-terraform` → `kubectl apply -f xrds/customer-support.yaml` → `kubectl apply -f compositions/chatwoot.yaml` → `kubectl apply -f claims/$ENV/customer-support.yaml` → `task setup:chatwoot:seed` → `task argocd:sync --app=customer-support-$ENV`.

11. Documentation must explicitly state:
    - The bundled image is CE-only (MIT). Customers who want SLA/Audit/Captain AI must purchase a Chatwoot self-hosted EE license; we do not bundle EE.
    - Graduation ladder: Chatwoot CE (self-host, free) → Chatwoot Cloud ($19/agent) → Plain ($35/agent, 50% off for VC-backed <$5M) or Intercom.
    - For users who explicitly want classical ticketing (German/EU GDPR-strict, regulated): Zammad (AGPL-3.0) is documented as an alternative, with the §13 warning, and is NOT available on any cluster we manage.

**Risks:**

- License split inside one repo: Chatwoot's /enterprise directory ships in the same git repo as the MIT core. A misconfigured Helm values.yaml or a docker pull of chatwoot/chatwoot:_ (instead of chatwoot/chatwoot-ce:_) silently bundles proprietary EE code into customer deployments without a paid license. Mitigation: pin image.repository=chatwoot/chatwoot-ce in template defaults; CI guard that fails the build if 'chatwoot/chatwoot:' appears in any values file.
- AGPL trap for managed-tier ambition: if we ever offer a hosted/managed flavor of the template, ONLY Chatwoot CE (MIT) is safe. Zammad/FreeScout/Erxes self-hosted by customers is fine, but on our own cluster they would force source disclosure under §13. Document this in the architectural ADR so a future product decision doesn't accidentally bring Zammad into a managed offering.
- Runtime mismatch: Chatwoot is Ruby on Rails + Sidekiq, the only Rails workload in an otherwise Go/Python/Rust/TS template. Adds ops surface (Ruby buildpacks, gem CVEs, Sidekiq monitoring). Mitigation: treat it as a black-box upstream image; never patch in-tree.
- Chart-bundled Postgres/Redis create orphans: the default chatwoot/charts values enable subchart Postgres + Redis. Without `postgresql.enabled=false` + `redis.enabled=false` + ExternalSecret wiring to the shared CNPG cluster, customers end up with a second, unbacked-up Postgres holding PII. Mitigation: enforce external DB in our Composition; CI test that asserts subcharts are disabled.
- Webhook delivery is best-effort with no DLQ: a Chatwoot → MCP outage during a burst loses events. Mitigation: Kafka relay (Strimzi) between Chatwoot and the MCP/backend.
- Erxes license ambiguity (NOASSERTION + 'no SaaS competing with Erxes Inc' clause) is a Commons-Clause-style restriction that violates OSI principles. Easy to mistake for plain AGPL on a quick scan. Mitigation: explicitly blacklist Erxes in the launcher's tool catalog with a comment.
- UVdesk's OSL-3.0 patent-termination clause is broad enough that any patent litigation by the licensor's customer terminates the license — most enterprise legal teams flag it. Mitigation: do not include UVdesk even as an option.
- Helm chart subchart migration (Bitnami → Cloudpirates for Zammad v16; Chatwoot ActiveStorage v2→v3 migration) means unpinned `helm upgrade` can silently break. Mitigation: pin chart and app versions in our ApplicationSet; staged ApplicationSet bumps with a canary env.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Chatwoot (community/MIT core)** — `MIT (core) + proprietary enterprise/ dir` — self-host: yes — maturity: production-grade
- **Zammad** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **FreeScout** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **osTicket** — `GPL-2.0` — self-host: yes — maturity: usable
- **Erxes** — `AGPL-3.0 / source-available (NOASSERTION on repo)` — self-host: yes — maturity: usable
- **UVdesk Community** — `OSL-3.0` — self-host: yes — maturity: usable
- **Plain.com** — `Proprietary SaaS` — self-host: no — maturity: production-grade
- **Papercups** — `MIT` — self-host: yes — maturity: abandoned

Customer support tooling boils down to three jobs: (1) collect inbound from any channel (email, chat widget, Slack, Twitter/X, WhatsApp), (2) route it into a unified inbox where agents can reply, assign, and add notes, and (3) measure it (SLAs, response times, CSAT) plus serve self-help (knowledge base). Imagine an old-school post office that now also accepts texts, DMs, and walk-ups — same back room, more mail slots out front.

In 2026, the OSS landscape sorts cleanly by which problem the tool was originally trying to solve.

The "modern omnichannel" bucket is dominated by Chatwoot. It started life as an Intercom clone, is built in Rails + Vue, and has crossed 50k self-hosted installs plus ~30k GitHub stars. Critically, the core is MIT — everything in the top-level repo except the `enterprise/` directory. That `enterprise/` dir is source-available under a separate proprietary license and contains SLA management, custom dashboards, audit logs, and agent capacity policies. If we bundle the MIT bits and leave the EE folder untouched (or instruct users to opt-in with their own paid license), we're commercially clean. Chatwoot just shipped v4.14.1 (May 2026) and 4.3+ has the new advanced search and conversation-workflows engine.

The "modernized helpdesk" bucket is Zammad and FreeScout. Both are AGPL-3.0. Zammad is Ruby on Rails, Postgres + Elasticsearch, and just shipped 7.0 (March 2026) with an AI add-on. It's the cleanest enterprise-feeling product — multi-channel (email, chat, Twitter, Telegram, SMS), real SLA engine, knowledge base. FreeScout is the lean PHP/Laravel option, built as a Help Scout clone, shipping bug-fix releases roughly weekly (latest 1.8.223 on 2026-06-03). FreeScout's core is AGPL but its premium modules are sold under a "trust-based" model — still AGPL legally, but you buy a license key to receive the source.

The "legacy but still alive" bucket is osTicket. Still maintained (v1.18.3 in Jan 2026), still GPL-2.0, used at universities and government IT desks, but the UI is from 2010, there's no native chat, and the plugin ecosystem has thinned out.

Avoid: Helpy.io (last commit March 2023 — abandoned despite being MIT), Papercups (in declared maintenance-only mode), and UVdesk (OSL-3.0 license, which has unusual patent-termination clauses and is considered FSF-incompatible — risky to ship in a commercial template).

SaaS-only proprietary players worth knowing for "we don't want to self-host" customers: Plain.com (B2B-focused, $35/seat/mo Foundation tier, AI-first) and Linear's customer-support layer (closed source). Both excellent but not options for our bundle.

For our template: ship Chatwoot (MIT core only) as the default and document a Crossplane composition path for it; offer Zammad as an "if you need real SLA + ITIL-lean" alternative, with the AGPL caveat called out for users who plan to wrap it inside their own SaaS.

**Key findings:**

- Chatwoot is the clear MIT-licensed leader: v4.14.1 released 2026-05-29, ~29.9k GitHub stars, 50k+ self-hosted installations claimed by vendor, last commit 2026-06-03. Core is MIT but enterprise/ folder is proprietary — bundling the MIT core is commercially safe; bundling enterprise features is NOT.
- Zammad 7.0 shipped 2026-03-04 (AGPL-3.0), 5.6k stars, ~daily commits. v7.2.0-alpha already tagged. AI add-on is optional and supports BYO model (Ollama/OpenAI/Anthropic/Mistral/Azure). Most full-featured AGPL option.
- FreeScout is the most actively released (v1.8.223 on 2026-06-03, weekly cadence), AGPL-3.0, PHP/Laravel, 4.3k stars. Lightest to deploy — runs on shared hosting. Premium modules sold via trust-based license-key model that is still AGPL-compliant.
- osTicket v1.18.3 (2026-01-15), GPL-2.0, 3.7k stars. Still maintained but stagnant — last push 2026-01-28. UX from 2010 era, no native chat, plugin ecosystem thinning. Acceptable for legacy/email-only use cases.
- Helpy.io is effectively abandoned despite MIT license — last repo push 2023-03-08. Do not recommend.
- Papercups is in declared maintenance-only mode (no new features, only PRs and major bug fixes). Avoid for new deployments.
- UVdesk Community ships under OSL-3.0, which is FSF-incompatible-ish and has aggressive patent-termination clauses. AVOID bundling in a commercial template — pick a different PHP option (FreeScout) instead. Repo last pushed 2025-10-01, slowing.
- Erxes positions as an open-source HubSpot+Zendesk+Linear replacement but the GitHub LICENSE is NOASSERTION (no detected SPDX) — must read their dual-license terms before bundling. Treat as CAUTION until verified.
- Plain.com and Linear's customer-support module are the modern proprietary SaaS leaders ($35/seat/mo and up). No self-host. Mention as 'graduate to this if you outgrow Chatwoot.'
- Maturity tiering: Chatwoot, Zammad, FreeScout are production-grade in 2026. osTicket, Erxes, UVdesk are usable but not first-pick. Helpy and Papercups are abandoned/frozen.
- Marquee Chatwoot adopters (per TheirStack): 114 publicly identified companies on cloud; 50k+ self-hosted installs as of vendor announcement. Zammad's customer list includes the German Federal Press Office and multiple EU government agencies (GDPR-compliant default).
- AGPL impact summary: for users self-hosting Zammad/FreeScout/Erxes for THEIR OWN customer support, AGPL imposes nothing extra. AGPL only bites if the template's commercial SaaS offering exposes the support tool as a network-accessible service to third parties — which is not our model.

**Gotchas:**

- Chatwoot's enterprise/ directory is NOT MIT — it's source-available proprietary. Our template scaffolding must explicitly exclude or feature-flag-off enterprise features, and the launcher CLI must NOT enable SLA Management, Agent Capacity, or Custom Roles by default unless the user has a paid EE license. A naive 'check this box for full features' UX could expose customers to license violations.
- AGPL-3.0 (Zammad, FreeScout, Erxes) is fine for self-hosters but creates a real obligation if a customer wraps it inside a multi-tenant SaaS they sell. Our docs must clearly say 'AGPL — you must publish modifications if you offer this as a hosted service'.
- UVdesk's OSL-3.0 license has a patent-termination clause that fires on ANY patent litigation involving the licensor — even unrelated patents. This makes it risky for any company that might assert patents. AVOID for our bundle.
- FreeScout's official 'premium modules' (Kanban view, WhatsApp, Telegram, SAML, AI) require a paid license key from FreeScout themselves. The modules ARE AGPL once you have them, but you cannot bundle the keys. Document as 'install core, buy modules separately from upstream.'
- osTicket has NO native live chat. If the customer expects a chat widget on their marketing site, osTicket alone is insufficient — they'd need to pair it with Papercups (maintenance mode) or a separate widget. Skip it for the modern stack.
- Helpy looks superficially good on a search — MIT license, real GitHub repo, Rails app. But it has been abandoned since March 2023 (3+ years stale). Do not include in any recommended option even though it shows up on review sites.
- Erxes's GitHub license field is 'NOASSERTION' which means the SPDX scanner didn't detect a standard license header. Their docs claim AGPL-3.0 + commercial, but you MUST manually verify the LICENSE file in the specific commit you vendor before shipping in a paid template.
- Several review sites (G2, SaaSworthy) list 'Helpy 2026 reviews' which is misleading SEO — the product itself stopped receiving code commits in 2023. Always verify maturity from the repo, not review-aggregator dates.

**Recommendation (this angle):** Default to Chatwoot (MIT core only) — ship a Helm chart + Crossplane composition that deploys the community edition and explicitly disables the enterprise/ feature flags. It's the only OSS support tool in 2026 that is (a) MIT, (b) modern omnichannel, (c) production-grade with 50k+ installs, and (d) actively shipping (v4.14.1, May 2026). For users who need real SLA management and ITIL-flavored workflows, offer Zammad as a second-tier option with the AGPL warning prominently displayed — it's the most polished AGPL helpdesk in 2026 and v7.0 brings BYO-AI. Offer FreeScout as the 'low-resource / shared-hosting' fallback for Side Project tier customers. Do NOT bundle UVdesk (OSL-3.0), Helpy (abandoned), or Papercups (maintenance mode). Mention Plain.com in docs as the 'graduate to SaaS' option once a customer outgrows self-hosting. For Aegis/MCP integration, Chatwoot already has a documented REST + websocket API — this is the right substrate for an AI support agent.

**Citations:**

- [Chatwoot GitHub repository](https://github.com/chatwoot/chatwoot)
- [Chatwoot v4.14.1 release](https://github.com/chatwoot/chatwoot/releases)
- [Chatwoot LICENSE (MIT core)](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- [Chatwoot Enterprise Edition Features doc](https://developers.chatwoot.com/self-hosted/enterprise-edition)
- [Chatwoot 50,000 Installations announcement](https://www.chatwoot.com/blog/50-000-installations-of-chatwoot/)
- [Zammad GitHub repository](https://github.com/zammad/zammad)
- [Zammad 7.0 release news](https://zammad.com/en/product/releases)
- [FreeScout GitHub repository](https://github.com/freescout-help-desk/freescout)
- [FreeScout Modules FAQ (licensing model)](https://freescout.net/modules-faq/)
- [osTicket GitHub repository](https://github.com/osTicket/osTicket)
- [Open-Source Helpdesk landscape 2026 (FreeScout blog roundup)](https://freescout.net/blog/open-source-helpdesk-system/)
- [Helpy GitHub (abandoned since 2023)](https://github.com/helpyio/helpy)
- [Papercups GitHub (maintenance mode)](https://github.com/papercups-io/papercups)
- [UVdesk community-skeleton GitHub (OSL-3.0)](https://github.com/uvdesk/community-skeleton)
- [Plain.com pricing (proprietary SaaS reference)](https://www.plain.com/pricing)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **Chatwoot (Community Edition, MIT core)** — `MIT (core) + commercial source-available (enterprise/ dir)` — self-host: yes — maturity: production-grade
- **Zammad** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **FreeScout** — `AGPL-3.0 (core + modules), paid module keys` — self-host: yes — maturity: usable

Imagine your ts-monorepo-template already has the wiring: Nx for builds, Argo CD for GitOps, Crossplane to claim "give me X" infra, Keycloak as the identity hub, and a forthcoming MCP server so Aegis (the agent) can drive things. Now you want to bolt on a customer support inbox — email + chat widget + Slack/Twitter sidecars + SLA timers + a knowledge base. Three real, self-hostable, actively-maintained candidates exist in 2026: Chatwoot, Zammad, and FreeScout. The fourth tier (Plain, Linear) is closed SaaS and so violates self-host + license-safety requirements out of the gate. Erxes, osTicket, UVdesk, Helpy still ship but show old PHP plumbing and no MCP momentum — they're not contenders for a template that wants AI-native integration.

Chatwoot is the cleanest fit because four things line up: (1) its CORE is MIT — you can bundle it, redistribute it, even sell a managed offering — but its enterprise/ directory is source-available commercial (SSO/SAML, SLA, audit log, Captain AI). The template ships the MIT core; users who want SLA upgrade themselves. (2) It has an OFFICIAL Helm chart (chatwoot/charts, v2.0.23 as of May 2026, active) that already handles Postgres, Redis, web/worker HPA — so the integration is a values.yaml + an Argo CD Application, exactly like every other workload in our chart factory. (3) It exposes a clean REST API (POST /api/v1/accounts/{id}/inboxes, /webhooks, etc.) with HMAC-SHA256-signed outbound webhooks — that's what the Phase 12 MCP server wraps, and what the launcher CLI calls during `task setup:chatwoot` to create the first inbox + a webhook pointing at our backend. (4) Three independent Chatwoot MCP servers already exist in the wild (hugoblanc, StackLab, fazer-ai with 129 tools, gobenpark with 50+) — so Aegis can already converse with it.

Zammad is the most enterprise-feature-rich option (built-in triggers, SLAs, KB, agent groups, Elasticsearch search) and has an official Helm chart, but its blanket AGPL-3.0 license is the trap. If we ever deploy Zammad as part of our managed/SaaS offering, AGPL's network-use clause forces us to release modifications. For a template that customers self-host, it's safe; for our own hosted/demo cluster, it's a footgun. The MCP ecosystem is healthy (basher83, omert11, zammad-mcp-go).

FreeScout is a great cheap-and-cheerful third option (Laravel/PHP, AGPL core, tiny footprint, ~$15 paid modules for the nice stuff like Workflows + KB + Twitter). But there's NO official Helm chart — only a community tiredofit/freescout Docker image — and no MCP server, and no Crossplane provider. It belongs on the "Just Me" profile only, not Early/Scaling.

For Crossplane: none of the three has a NATIVE provider in 2026. The path is provider-helm (chart-as-MR), provider-kubernetes (Secret + ExternalSecret + the webhook), and provider-terraform wrapping the Chatwoot REST API for inbox/webhook/agent creation. The XRD looks like CustomerSupportClaim → Composition{Release+Object+Workspace}. The launcher verb `task setup:chatwoot` simply Crossplane-claims it and waits for status.ready.

**Key findings:**

- Chatwoot is dual-licensed: MIT for ~95% of the codebase, separate commercial source-available license for the enterprise/ directory (SSO/SAML, SLA policies, audit log, Captain AI). The template can safely ship and even resell the MIT core; users self-pay $99/agent/month for enterprise/. Production use of the enterprise/ dir requires a Chatwoot Inc subscription.
- Chatwoot ships an OFFICIAL, actively-maintained Helm chart at chatwoot/charts (latest chart v2.0.23 = app v2.16.0+ as of May 22 2026, 96 releases). Bundles Postgres + Redis as subcharts; supports external DB/Redis via env override; has separate web/worker Deployments with independent HPAs.
- Chatwoot REST API exposes programmatic inbox/webhook/agent/contact creation (POST /api/v1/accounts/{id}/inboxes, /webhooks, /agents). Outbound webhooks are HMAC-SHA256-signed and cover conversation_created/updated/status_changed and message_created events — exactly what the MCP server and our backend need.
- Three independent, active Chatwoot MCP servers exist (hugoblanc/chatwoot-mcp TS-based with OpenAPI-generated types; fazer-ai exposes 129 tools; gobenpark exposes 50+). Phase 12 MCP server can either fork one or ship a thin wrapper.
- Zammad is AGPL-3.0 across the board — including the foundation-owned core. Safe if customers self-host on their own infra; DANGEROUS if we run a managed/demo Chatwoot-style offering on our cluster because the network-use clause kicks in on modifications.
- Zammad Helm chart is official (zammad/zammad-helm), requires Elasticsearch + Postgres + Redis + Memcached (heavier than Chatwoot's stack). Chart v16.0.0 migrated from Bitnami to Cloudpirates subcharts; v12.0.0 split StatefulSet into independent Deployments. Min 4GB RAM, K8s 1.19+.
- FreeScout core is AGPL-3.0, but the API + Webhooks module is a PAID module (~$14.99 one-time). No official Helm chart — only community Docker image (tiredofit/freescout). No MCP server in the wild. Not suitable beyond the Just-Me profile.
- NONE of Chatwoot/Zammad/FreeScout has a native Crossplane provider in 2026. Crossplane integration goes through (a) provider-helm Release for the chart, (b) provider-kubernetes Object for the Ingress/Secret/PushSecret wiring, (c) provider-terraform Workspace wrapping the Chatwoot REST API for inbox/webhook/agent CRUD. This is the same pattern we already use for Keycloak realm seeding.
- Chatwoot website widget is a tiny iframe-embedded JS snippet auto-generated when a Website inbox is created — the launcher CLI can fetch the snippet via API and write it into the marketing site's \_document.tsx during `task setup:chatwoot`.
- Plain and Linear are SaaS-only proprietary — they violate the self-host requirement and license-safety policy. Exclude entirely.
- Erxes (MPL-2.0/permissive but heavy), osTicket (GPL-2.0, ancient PHP), UVdesk (MIT but Symfony+e-commerce-focused), Helpy (MIT but quasi-abandoned) all exist and ship in 2026, but none have MCP servers and only Erxes has any Helm tooling. Not first-tier for an AI-native template.

**Gotchas:**

- Chatwoot's enterprise/ directory is in the SAME repo as the MIT core and is built by default when you run `bundle exec rails server`. Setting INSTALLATION*PRO_USED=true or shipping a chart with the enterprise/ dir present technically infringes without a paid license. The Helm chart respects this — set image to chatwoot/chatwoot-ce:* to be safe in template defaults; users opt into chatwoot/chatwoot:\_ (enterprise) themselves.
- Zammad's AGPL means: if we run Chatwoot-on-our-cluster as a hosted demo for prospects, we're a service operator and any modifications we make must be published. Chatwoot/MIT does not have this constraint — strong reason to prefer Chatwoot for the demo environment.
- Chatwoot Helm chart bundles a Postgres subchart by default. For our template (which has a centralized pg-tenant CNPG cluster), you MUST set postgresql.enabled=false and provide external connection vars via ExternalSecret — otherwise you get a second, orphan Postgres.
- Chatwoot webhook delivery is best-effort with no built-in dead-letter; if the MCP/backend is down during a burst, events are lost. Mitigation: subscribe a small relay that mirrors webhooks to Kafka (we already have Kafka via Strimzi) and process from there.
- Chatwoot v2.x → v3.x migration in 2025 changed the migration path for ActiveStorage; pin image.tag in values.yaml or you'll silently jump majors on `helm upgrade`.
- Zammad Helm v16.0.0 migrated subcharts (Bitnami → Cloudpirates) — anyone on v15 needs migration steps before upgrade; ApplicationSet bumps must be staged.
- FreeScout's API & Webhooks module is paid. If we templatize FreeScout, users pay $14.99 per install or we ship without API/MCP — defeats the AI-native angle.
- All three tools store PII (customer emails, IPs, chat transcripts). Ensure the Chatwoot/Zammad Postgres ends up under our existing CNPG backup + WAL-G PITR posture, not the chart's bundled PV — otherwise compliance gap.

**Recommendation (this angle):** Ship CHATWOOT (Community Edition / MIT core) as the default `task setup:support` target in the Side-Project, Early-Startup, and Scaling-Startup profiles. Crossplane wiring: create an XRD `XCustomerSupport` (kind: CustomerSupportClaim) whose Composition fans out to (1) provider-helm Release v2.0.23+ pointing at chart `chatwoot/chatwoot`, with `postgresql.enabled=false`, `redis.enabled=false`, and ExternalSecret-injected connection strings to the shared pg-tenant CNPG + Redis (Dragonfly) cluster; (2) provider-kubernetes Object for the Ingress + Keycloak OIDC PushSecret; (3) provider-terraform Workspace wrapping the Chatwoot REST API to create a default Website inbox + webhook (signed-secret stored in ExternalSecrets), with the webhook URL pointing at the Phase 12 MCP server's `/inbound/chatwoot` handler. Pin `image.repository=chatwoot/chatwoot-ce` and `image.tag=v4.x` to stay strictly MIT in the template default. Day-1 wiring is ~7 commands (below). Phase 12 MCP server should fork or wrap `hugoblanc/chatwoot-mcp` (TypeScript, OpenAPI-typed) since it matches our TS/Nx stack — expose a `chatwoot` namespace of tools to Aegis (create_conversation, send_message, list_inboxes, create_webhook). Add ZAMMAD as an optional `task setup:support --tool=zammad` for Early-Startup+ profiles that demand built-in SLA/KB and accept the AGPL self-host constraint — but ban it from any hosted-demo cluster we run. Drop FreeScout from the template; recommend it only in docs for hobbyist single-agent installs (Just-Me profile). Drop osTicket/UVdesk/Helpy/Erxes/Plain/Linear from the candidate list entirely. Day-1 commands: `task crossplane:install:provider-helm` → `task crossplane:install:provider-terraform` → `kubectl apply -f xrds/customer-support.yaml` → `kubectl apply -f compositions/chatwoot.yaml` → `kubectl apply -f claims/$ENV/customer-support.yaml` → `task setup:chatwoot:seed` (calls launcher CLI which polls the claim status, then POSTs Website inbox + Webhook to the freshly-deployed Chatwoot API) → `task argocd:sync --app=customer-support-$ENV`.

**Citations:**

- [Chatwoot Helm Charts (official, 96 releases, latest May 2026)](https://github.com/chatwoot/charts)
- [Chatwoot Helm chart deployment docs](https://developers.chatwoot.com/self-hosted/deployment/helm-chart)
- [Chatwoot LICENSE (MIT for core)](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- [Chatwoot Enterprise Edition features and licensing](https://developers.chatwoot.com/self-hosted/enterprise-edition)
- [Chatwoot Self-Hosted Pricing (Enterprise $99/agent/mo)](https://www.chatwoot.com/pricing/self-hosted-plans/)
- [Chatwoot Webhook API reference](https://developers.chatwoot.com/api-reference/webhooks/add-a-webhook)
- [Chatwoot Inbox API (programmatic creation)](https://developers.chatwoot.com/api-reference/inboxes/create-an-inbox)
- [hugoblanc/chatwoot-mcp (TypeScript MCP server)](https://github.com/hugoblanc/chatwoot-mcp)
- [@fazer-ai/mcp-chatwoot (129 tools)](https://www.npmjs.com/package/@fazer-ai/mcp-chatwoot)
- [Zammad Helm chart (official)](https://github.com/zammad/zammad-helm)
- [Zammad K8s install docs](https://docs.zammad.org/en/latest/install/kubernetes.html)
- [Zammad Webhook admin docs](https://admin-docs.zammad.org/en/latest/manage/webhook.html)
- [omert11/zammad-mcp (Claude Code MCP)](https://github.com/omert11/zammad-mcp)
- [FreeScout API & Webhooks paid module](https://freescout.net/module/api-webhooks/)
- [Crossplane provider-terraform (Workspace MR for REST-driven seeding)](https://github.com/crossplane-contrib/provider-terraform)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Chatwoot (Community Edition)** — `MIT Expat (core) + proprietary Enterprise EULA in /enterprise dir` — self-host: yes — maturity: production-grade
- **Zammad** — `AGPL-3.0-only` — self-host: yes — maturity: production-grade
- **FreeScout (core)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **osTicket** — `GPL-2.0` — self-host: yes — maturity: usable
- **Erxes (core)** — `AGPL-3.0 + custom anti-SaaS clause` — self-host: yes — maturity: usable

Picture a customer support tool as a Lego brick we want to snap into the ts-monorepo-template starter kit. The question isn't "does it work?" — it's "if I sell the box of Legos, does the brick maker own a piece of my box?" That's what software licenses encode.

Three licenses dominate this category in 2026, and they sit at very different points on the safety spectrum:

(1) MIT (Chatwoot core) is the friendliest. You can take the brick, glue it into anything, sell the box, even repaint it — you only have to keep the tiny "made by Chatwoot" sticker on it. No source-disclosure obligation, no network-use clause, no contagion. The catch with Chatwoot specifically: the repository is split. The `/enterprise` folder is NOT MIT — it's a proprietary source-available license that requires a paid subscription to run in production. So we have to ship the community edition only (literally delete the `/enterprise` directory, which is exactly how their `cwctl` community installer works), and we're golden.

(2) AGPL-3.0 (Zammad, FreeScout, Erxes core) is the strong-copyleft one with the "network use" clause (Section 13). The key mental model: if WE the template authors deploy AGPL software AS PART of OUR managed SaaS, and we MODIFY it, we owe the modified source to every network user. But the template ships values.yaml that point at upstream Docker images — the CUSTOMER deploys it on their own cluster. Section 13 only triggers on modifications by the deployer. So bundling unmodified AGPL helm values is generally safe, BUT we have to be loud about three things: (a) if a customer modifies the image, they trigger Section 13 — that's their problem, not ours; (b) we cannot deploy AGPL as part of OUR hosted offering without source disclosure; (c) Erxes adds a NON-STANDARD clause ("not permitted to be hosted as a SaaS to compete with erxes Inc") which is a custom restriction beyond vanilla AGPL — that's a yellow flag.

(3) GPL-2.0 (osTicket) is older copyleft without the network clause. Distribution triggers source disclosure, but SaaS-style network use does not. Mostly safe to bundle, but osTicket is also a relatively stagnant project compared to Chatwoot/Zammad.

The disqualified ones: UVdesk uses OSL-3.0 (an obscure copyleft with reciprocity stronger than MPL — most enterprise legal teams flag it). Helpy is MIT but the project looks largely abandoned post-2023. Plain and Linear are pure proprietary SaaS — can't self-host, irrelevant.

Bottom line: for a commercial open-core template, MIT-licensed Chatwoot (community edition only, `/enterprise` excluded) is the only candidate where bundling is unambiguously safe with no obligations on us OR our customers. AGPL choices (Zammad, FreeScout) are safe-IF-unmodified, which we should document clearly. Erxes's custom anti-SaaS clause makes it AVOID for a template that might one day be deployed as part of a managed offering.

**Key findings:**

- Chatwoot core LICENSE is MIT Expat (Copyright 2017-2024 Chatwoot Inc.) — the safest bundling candidate; only obligation is preserving copyright notice. Critical: must delete or exclude the /enterprise directory which carries a separate proprietary EULA requiring a paid subscription for production use.
- Chatwoot has NOT switched to BUSL/FSL/SSPL as of 2026 — no evidence of a HashiCorp/Elastic/Redis-style license shift. Licensing structure unchanged since version 2.0.
- Zammad is AGPL-3.0-only (single license, no enterprise dual-license dir). Self-hosting and commercial reselling of services are explicitly permitted by Zammad themselves, subject to AGPL Section 13 and their trademark policy.
- FreeScout core is plain AGPL-3.0 with no custom clauses. Official modules are also AGPL-3.0 but sold under a trust-based one-instance license-key model (compliant with AGPL because source is provided to the purchaser).
- Erxes adds a NON-STANDARD clause to AGPL: 'erxes is not permitted to be hosted as a SaaS version to compete with erxes Inc.' — this is a Commons Clause-style restriction that pushes Erxes outside OSI-conforming OSS and creates legal risk for any managed-offering bundling.
- osTicket is GPL-2.0 (not GPL-3.0, not AGPL) — distribution triggers source-disclosure but pure SaaS/network use does NOT (the ASP loophole). Commercial use and reselling allowed under GPL terms.
- UVdesk Community is OSL-3.0 (Open Software License 3.0) — an unusual strong-copyleft with reciprocity provisions; not GPL-compatible and disliked by many enterprise legal teams. CAUTION for bundling.
- Helpy is MIT but the GitHub project shows low commit activity post-2023 — effectively abandonware risk; avoid for production recommendation despite license safety.
- Plain.com and Linear are pure proprietary SaaS with no self-host option — irrelevant for a self-hostable template even though they are popular B2B SaaS support tools.
- AGPL-3.0 Section 13 (network use) only triggers on MODIFIED versions. Shipping unmodified upstream Docker images in helm values is the safe pattern — no source-disclosure obligation cascades onto the template authors or downstream users.
- Documentation pattern emerging in 2024-2026: 'Fair Source' (FSL, FCL) licenses with delayed Apache/MIT conversion (2 years for FSL, 4 years for BUSL). None of the leading self-hosted support tools have adopted these yet.

**Gotchas:**

- Chatwoot Enterprise EULA explicitly forbids 'copy, merge, publish, distribute, sublicense, and/or sell' — if our helm values accidentally reference a chatwoot/chatwoot Docker image WITH /enterprise included (which is the DEFAULT cwctl install), we are bundling proprietary software. Must explicitly use CE-only build/install path or document the user must obtain an EE license.
- AGPL Section 13 is the 'network use clause' — it fires when a MODIFIED AGPL service is offered over a network. Customers who fork & modify FreeScout/Zammad/Erxes and run it as SaaS owe source disclosure. We should put a warning in our docs so customers don't unknowingly violate it.
- Erxes's 'not permitted to be hosted as a SaaS to compete with erxes Inc.' is a non-OSI-conforming restriction on top of AGPL. This is similar to the Commons Clause that put Redis Labs in hot water — treat as AVOID for any commercial-bundled scenario.
- Zammad trademark policy requires that resellers/hosters NOT present Zammad as 'their product' — naming/branding the support module 'Zammad' in our template's marketing is fine, but a CRM-style rebrand would violate the trademark policy even if AGPL-compliant.
- osTicket project velocity has slowed significantly compared to Chatwoot/Zammad; license-safe but stagnation is a maturity risk.
- FreeScout official 'modules' (knowledge base, end-user portal, etc.) require purchasing a one-per-instance license key. The CODE is AGPL but distribution is restricted by contract — this is enforceable per AGPL since AGPL doesn't mandate gratis distribution. Document this clearly so users know the core is free but advanced features cost.
- MPL-2.0 is sometimes confused as 'AGPL-lite' — it's actually file-level copyleft and SAFE for commercial bundling. None of our top picks use MPL but it's a useful comparison: MPL-2.0 = safe like MIT for bundling, AGPL-3.0 = safe-if-unmodified.
- OSL-3.0 (UVdesk) is poorly understood by most enterprise legal review — even if technically permissive enough, it triggers extra legal review cycles. AVOID for low-friction commercial bundling.

**Recommendation (this angle):** SHIP Chatwoot Community Edition as the default support module in the ts-monorepo-template. It is the only candidate with a permissive license (MIT) that imposes ZERO obligations on us as template authors and ZERO obligations on our customers when they self-host. Critical implementation note: the helm chart must reference a CE-only image build OR clearly document that customers using the upstream chatwoot/chatwoot image must comply with the /enterprise EULA separately. As OPTIONAL alternatives (presented in launcher CLI as 'Choose your support stack'), offer Zammad (AGPL-3.0) and FreeScout (AGPL-3.0) for customers who prefer a more traditional helpdesk UX — but document Section 13 clearly: 'If you modify the upstream image and offer it to network users, you must disclose source.' AVOID Erxes (custom anti-SaaS clause is a Commons-Clause-style restriction that violates OSI principles and creates uncertain commercial exposure). AVOID UVdesk (OSL-3.0 creates needless legal-review friction). AVOID Helpy (MIT-safe but abandoned). Plain and Linear are proprietary SaaS and irrelevant. For the marketing site, position support as 'Chatwoot (MIT, recommended) or Zammad (AGPL, classical helpdesk)' — this gives both vibe-coders an easy default and engineering teams a license-conscious choice. License flag: CAUTION at the category level because the field is mostly AGPL — but Chatwoot CE alone is unambiguously SAFE.

**Citations:**

- [Chatwoot LICENSE (MIT Expat + Enterprise carve-out)](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- [Chatwoot Enterprise Edition LICENSE (proprietary)](https://github.com/chatwoot/chatwoot/blob/develop/enterprise/LICENSE)
- [Chatwoot Self-hosted FAQ — license clarification](https://developers.chatwoot.com/self-hosted/faq)
- [Chatwoot Enterprise Edition Management docs](https://developers.chatwoot.com/self-hosted/enterprise-edition)
- [Zammad LICENSE (AGPL-3.0-only)](https://github.com/zammad/zammad)
- [Zammad KB — Is it allowed to offer Zammad services?](https://support.zammad.com/help/en-us/59-license/154-is-it-allowed-to-offer-zammad-services)
- [Zammad Foundation Trademark Policy](https://zammad-foundation.org/policy/)
- [FreeScout LICENSE (AGPL-3.0)](https://github.com/freescout-help-desk/freescout/blob/dist/LICENSE)
- [FreeScout Modules FAQ — trust-based licensing model](https://freescout.net/modules-faq/)
- [Erxes LICENSE.md — AGPL + custom anti-SaaS clause](https://github.com/erxes/erxes/blob/main/LICENSE.md)
- [osTicket LICENSE.txt (GPL-2.0)](https://github.com/osTicket/osTicket/blob/develop/LICENSE.txt)
- [GNU AGPL-3.0 full text — Section 13 network use clause](https://www.gnu.org/licenses/agpl-3.0.en.html)
- [FOSSA Blog — OSS Software Licenses 101: AGPL deep-dive](https://fossa.com/blog/open-source-software-licenses-101-agpl-license/)
- [Sentry Functional Source License (FSL) introduction](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/)
- [TechCrunch — 'fair source' license trend 2024-2026](https://techcrunch.com/2024/09/22/some-startups-are-going-fair-source-to-avoid-the-pitfalls-of-open-source-licensing/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Chatwoot (Community Edition)** — `MIT (core) + proprietary enterprise/ dir` — self-host: yes — maturity: production-grade
- **Zammad** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **FreeScout** — `AGPL-3.0 (core + paid modules)` — self-host: yes — maturity: production-grade
- **Plain (SaaS upgrade path)** — `Proprietary SaaS` — self-host: no — maturity: production-grade
- **UVdesk** — `OSL-3.0` — self-host: yes — maturity: usable
- **erxes** — `Fair-code (XOS) + AGPL EE` — self-host: partial — maturity: usable

Imagine you ship a monorepo template that startup founders clone on day one. They will get traffic, then questions: "my checkout is broken", "how do I import a CSV?", "can I get a refund?". Those questions land somewhere — email, a chat widget, Slack, X DMs. A customer support tool is the inbox that funnels every channel into one queue, lets you assign tickets, set SLAs ("answer paying customers in <4h"), and search a knowledge base before the human answers.

There are four real shapes in this market:

1. The omnichannel inbox + live chat widget (Chatwoot). Behaves like Intercom: drop a JS snippet on your site, customer chats, agent replies from a Slack-like UI. Also pulls in email, WhatsApp, FB, Insta, Telegram, SMS via a generic API channel. MIT-licensed core (clean for us to bundle), proprietary "Enterprise" features in an enterprise/ subdir (SLAs, audit logs, capacity management). If we ship only the MIT bits, we are commercially safe.

2. The classic shared-inbox helpdesk (FreeScout, Zammad). FreeScout looks like Help Scout — pretty, email-first, AGPL-3.0 core but knowledge-base + SLA + workflow are paid modules (also AGPL but gated by a license key — "trust-based open source"). Zammad is the modern OTRS — full ticketing, escalation rules, macros, KB, ES + Postgres backend, AGPL-3.0 cleanly.

3. The legacy PHP option (osTicket, UVdesk). osTicket is GPL-2.0 but pushes releases years apart; UVdesk is OSL-3.0 (an oddball weak-copyleft license most lawyers have not heard of) and Symfony/PHP.

4. The "we are abandoned or fair-code" trap (Helpy — last commit 2023; erxes — license NOASSERTION, mixed fair-code + AGPL Enterprise plugins).

For a startup founder cloning our template, the rule I'd teach is: **bundle nothing customer-facing on day 1 unless they have customers**. A "Just Me" or "Side Project" founder has no agents. They use a personal Gmail + maybe a Discord. Forcing them to operate a Rails + Redis + Postgres + Sidekiq stack with attachments storage is a waste. So we keep this tool **opt-in via the launcher CLI** until the Early Startup profile.

When they do turn it on, the pick is **Chatwoot**. Three reasons: (a) it is the only candidate whose **community core is MIT** — we can bundle it, fork it, package it as a Helm chart, point Argo at it, and never trigger AGPL's network-use clause; (b) it covers chat-widget + email + WhatsApp + Slack in one box, which is exactly the channel mix B2C and prosumer SaaS founders need; (c) it already has a maintained Helm chart and a 30k-star, daily-commit repo. Three reasons against: (a) Ruby on Rails adds a runtime our template otherwise avoids (we are Go/Python/Rust/TS); (b) the EE features founders will eventually want (SLA, audit logs, Captain AI) are gated behind a paid self-hosted license key, so "free forever" is a fib; (c) the official cloud is $19/agent and the upgrade-to-cloud path is smoother than self-hosted EE.

**Key findings:**

- Chatwoot community edition is MIT-licensed on the core (verified in repo LICENSE file); enterprise/ subdirectory is proprietary. If we bundle only the MIT core we are commercially safe and there is no AGPL network-use trap.
- Chatwoot is the only major OSS customer-support tool with a permissive (MIT) core. Every other contender (Zammad, FreeScout, erxes EE plugins) is AGPL-3.0, which is workable when the customer self-hosts but risky if WE host it for them as a managed service.
- Chatwoot repo: 29.9k stars, last pushed 2026-06-03, maintained Helm chart at chatwoot/charts — production-grade and easy to wire into our existing ArgoCD ApplicationSet + Crossplane pattern.
- FreeScout core is AGPL-3.0 but is module-gated: knowledge base ($12), SLA management, workflows ($14.99), customer portal ($12.99) are paid one-time modules. The 'free helpdesk with unlimited agents' headline is misleading once a founder needs an SLA.
- Zammad is cleanly AGPL-3.0, actively maintained (5.6k stars, daily commits), and has the deepest classical ticketing feature set (macros, escalation rules, ES-backed search). Heavier ops footprint (Postgres + Elasticsearch + ≥4GB RAM).
- Helpy is effectively abandoned: last GitHub push 2023-03-08. Exclude.
- osTicket (GPL-2.0) is alive but slow — last push 2026-01-28, only major releases every couple of years. Legacy PHP, not worth bundling in 2026.
- UVdesk uses OSL-3.0, an uncommon weak-copyleft license most counsel will need to review. Symfony/PHP runtime is foreign to our Go/Python/Rust/TS stack.
- erxes is fair-code / NOASSERTION with several plugins (Content, Accounting, Finance, Team, Property, Tour) requiring an Enterprise Edition license — license ambiguity makes it a poor default for a commercial template.
- Closest commercial alternative for Chatwoot is Intercom (Essential $29/seat, Advanced $85/seat, Expert $132/seat + $0.99 per Fin AI resolution). Plain is the modern B2B-SaaS alternative at $35/seat (Foundation) / $89/seat (Horizon), with a 50% startup discount for VC-backed founders <$5M raised.
- Self-hosted Chatwoot has zero per-agent cost — infrastructure-only — making it strictly cheaper than Intercom or Plain once you cross ~3 agents, provided the founder already operates K8s (which our template assumes).
- Chatwoot's mobile SDK, WhatsApp Cloud API, Instagram/FB/X integrations are all in the MIT core. Captain AI, SLA management, audit logs, agent capacity, and white-labeling are in enterprise/ and require a paid self-hosted license key.

**Gotchas:**

- If we (the template authors) ever offer 'managed customer support' as part of a paid SaaS tier, we MUST stay on Chatwoot Community (MIT). Bundling Zammad or FreeScout into a managed offering triggers AGPL §13 (network use = source disclosure to users).
- Chatwoot Helm chart requires 3 PVCs (Postgres 8GB, Redis 8GB, Rails uploads). Our Crossplane composition for app storage already covers this, but values.yaml needs a default StorageClass override per profile.
- Chatwoot 'enterprise/' directory ships in the same git repo as the MIT core. Our container build must either (a) strip enterprise/ at build time, or (b) leave it and document that customers must purchase a self-hosted EE license key before enabling those features. We should pick (a) for the default image.
- FreeScout's 'free unlimited agents' pitch hides that production features (KB, SLA, customer portal) are paid modules — founders will hit that paywall the moment they need an SLA.
- Zammad trademark policy forbids using the Zammad name/logo in a product or company — fine for us if we just self-host, but we cannot brand a tier 'Zammad for ts-monorepo'.
- Chatwoot Captain AI (their LLM agent) is EE-only. If founders want LLM auto-replies in the MIT core, they need to wire up an external LLM via webhooks themselves.
- Helpy looks attractive on paper (omnichannel, multi-brand) but the GitHub repo has been dormant since 2023 — do not recommend.
- erxes is positioned as an 'XOS' (Experience OS) — broader than support. The license model (fair-code + AGPL EE plugins) is too ambiguous for a commercial template default.

**Recommendation (this angle):** **Include-on-demand (NOT day-1)**. Add Chatwoot Community Edition (MIT core only) as a launcher-CLI opt-in module that activates from the **Early Startup ($30-150)** profile upward. Default ON for **Scaling Startup** and **Production at Scale**. Default OFF for **Just Me** and **Side Project** — those founders have no support volume and operating Rails+Postgres+Redis just for a chat widget is wasteful.

Concretely:

1. Ship a `support/` opt-in pillar in the launcher with one option: `chatwoot-community`. Strip the `enterprise/` directory at container build time to guarantee MIT-only artifacts.
2. Wire it into the existing ArgoCD ApplicationSet + Helm library chart pattern. Use the upstream chatwoot/charts repo as a dependency.
3. Document the upgrade path explicitly: free self-hosted Chatwoot CE → paid Chatwoot Self-Hosted EE license (for SLA + Captain AI) → Chatwoot Cloud ($19/agent) → Intercom ($29/seat + Fin AI) or Plain ($35/seat, 50% off for VC-backed startups). Founders see the ladder and choose where to step off.
4. Do NOT bundle Zammad, FreeScout, osTicket, UVdesk, Helpy, or erxes by default. Mention Zammad in docs as the AGPL-clean alternative for founders who explicitly want classic ticketing (regulated industries, German/EU GDPR-strict shops) and are comfortable self-hosting only — never as part of a managed offering we run.
5. If we ever build a managed-SaaS tier on top of the template, the Chatwoot CE MIT split is the only safe choice in this list.

**Citations:**

- [Chatwoot LICENSE (MIT core + enterprise proprietary)](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- [Chatwoot GitHub repo (29.9k stars, daily commits)](https://github.com/chatwoot/chatwoot)
- [Chatwoot Helm Chart deployment docs](https://developers.chatwoot.com/self-hosted/deployment/helm-chart)
- [Chatwoot Enterprise Edition feature gating](https://developers.chatwoot.com/self-hosted/enterprise-edition)
- [Chatwoot self-hosted pricing (EE license keys)](https://www.chatwoot.com/pricing/self-hosted-plans/)
- [Chatwoot vs Intercom pricing 2026](https://comparetiers.com/compare/chatwoot-vs-intercom)
- [Zammad LICENSE (AGPL-3.0)](https://github.com/zammad/zammad/blob/develop/LICENSE)
- [Zammad commercial use FAQ](https://support.zammad.com/help/en-us/59-license/154-is-it-allowed-to-offer-zammad-services)
- [Zammad trademark policy](https://zammad-foundation.org/policy/)
- [FreeScout modules pricing + AGPL trust-based model](https://freescout.net/modules-faq/)
- [FreeScout LICENSE (AGPL-3.0)](https://github.com/freescout-help-desk/freescout/blob/dist/LICENSE)
- [5 Open-Source Zendesk Alternatives Self-Host 2026 comparison](https://use-apify.com/blog/zendesk-alternatives-2026)
- [Plain pricing 2026 + startup program (50% off, $5M cap)](https://www.plain.com/pricing)
- [erxes XOS fair-code + AGPL EE plugins](https://github.com/erxes/erxes)
- [UVdesk OSL-3.0 license + Symfony stack](https://github.com/uvdesk/community-skeleton)

---

## Team 6 — Marketing automation + email

### Synthesized verdict

- **Verdict:** `include-day-2`
- **Fit score:** 82 / 100
- **Top pick:** **Listmonk**
- **License:** `AGPL-3.0`
- **Default profile bundles:** `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angles converge on the same architectural answer: marketing-automation is not one job, it is three (transactional plumbing, newsletter broadcast, full automation/drip/scoring), and no single OSS tool covers all three well in 2026. The synthesized verdict picks Listmonk (AGPL-3.0, Go single binary + Postgres, v6.1.0 March 2026, 21.3k stars, last commit 2026-05-26) as the SINGLE top tool because: (1) it is the only candidate that fits the dominant founder need (newsletter + transactional broadcast) AND aligns with the existing template stack (Postgres-only, no second DB engine, no extra runtime — unlike Mautic which forces MySQL/PHP/Symfony/4GB RAM, or Keila which forces Elixir/Phoenix); (2) AGPL-3.0 is SAFE for our distribution model because we ship unmodified upstream container references via Crossplane provider-helm, never fork into the repo — the §13 network-use clause only triggers on modification, and customers self-host under their own license obligations (confirmed by FOSSA/Hyve/Red Hat aggregation analysis); (3) it has TWO actively-maintained MCP servers (rhnvrm/listmonk-mcp 18 tools MIT, antoniolg/listmonk-mcp) which the Phase 12 MCP layer can wrap immediately for Aegis; (4) community Helm chart th0ths-helm-charts/listmonk v5.0.3 plus a Crossplane XRD pattern make it 10-command day-2 setup. Mautic was rejected as top pick despite category dominance because (a) PHP+MySQL+Redis+cron breaks the Postgres-only data plane, (b) Acquia funding pull-back late 2024 has slowed velocity, (c) 2-4GB RAM minimum breaks Just-Me/Side-Project cost envelopes — it stays as an OPT-IN add-on for Scaling Startup+ via --engine=mautic flag. Sendy is hard-EXCLUDED (proprietary EULA forbids third-party redistribution). Keila excluded as default (smaller community, adds 5th runtime, no advantage). Maizzle (MIT) and React Email (MIT) are complementary build-time email-design layers, not competitors — they ship in packages/emails regardless. Verdict is include-day-2 (not day-1) because transactional plumbing (React Email + Resend/SES SDK) is day-1, while the Listmonk newsletter engine activates when the founder needs to send broadcasts — typically the Side Project tier onward. Profile mapping excludes p-solo because a single founder at $0 budget should use the cloud Resend free tier (3k emails/mo) rather than self-host Listmonk; the operational floor for Listmonk is ~$5-10/mo of compute + SES which only makes sense from Side Project ($5-20) upward.

**Integration outline:**

DAY-1 (every profile, ships in template): packages/emails workspace with React Email (MIT) as default templating + Maizzle (MIT) as opt-in alternative via --email-framework=maizzle flag. Nx targets: email:dev (live preview server), email:render (HTML/text output), email:lint (Outlook compatibility check). Reference apps (go-hello/py-hello/rs-hello/ts-hello) call out to SMTP via env-configured provider (Resend SDK default, Nodemailer fallback). Founder picks SMTP provider in launcher wizard (Resend, AWS SES, Postmark, Mailgun) — we never ship our own relay.

DAY-2 (Side Project tier and above, opt-in via launcher): task setup:marketing --engine=listmonk → applies Crossplane XRD XNewsletter whose composition does: (1) provider-helm Release pointing at unmodified upstream knadh/listmonk Docker image pinned to v6.1.0 (NEVER fork into repo — preserves AGPL aggregation status), (2) pg-tenant claim for listmonk DB (reuses existing Postgres XRD — no new DB engine), (3) ExternalSecret seeded by post-install Job for admin user + API token (lands in Azure Key Vault via ESO), (4) Ingress claim with cert-manager TLS, (5) SMTP secret referencing the founder-chosen provider from day-1. Post-install steps: wait for Ready → kubectl get secret listmonk-admin -o jsonpath='{.data.api_token}' | base64 -d → task email:import (POST Maizzle/React-Email-rendered templates to /api/templates) → task mcp:enable -- marketing-listmonk (wraps rhnvrm/listmonk-mcp at pinned version, exposes 18 tools to Aegis) → smoke test curl -H 'Authorization: token admin:$TOKEN' $URL/api/tx.

OPT-IN ADD-ON (Scaling Startup + Production at Scale, advanced users): task setup:marketing --engine=mautic adds a SEPARATE XMarketingAutomation composition that provisions Mautic 7.x via Facet Interactive MIT Helm distribution. Requires MariaDB XRD (new) + Redis + RWX volume for media/spool (Longhorn RWX on OVH/Contabo). Documented as 4GB RAM minimum, GPL-3.0 (aggregation-safe by reference). Launcher prints upgrade-path guidance: 'Listmonk + n8n covers most teams; switch to Mautic when you need lead scoring + conditional branches + landing pages.'

LICENSE DISCIPLINE (CI gates, every PR): (a) LICENSES.md per aisle listing exact license + pinned image tag + obligation summary; (b) fossa or scancode CI check on dependency bumps; (c) README marketing-stack section explicitly states 'we orchestrate, you operate — AGPL/GPL obligations attach to whoever runs the service, which is you the customer'; (d) every Docker image tag pinned in values.yaml so a future BUSL/SSPL conversion of a new release does not silently change the bundled artifact; (e) automated weekly license-diff check against upstream LICENSE files (Cal.com proves silent relicensing is real); (f) NEVER vendor Listmonk/Mautic/Keila source into apps/_ or libs/_ — strict reference-only via Crossplane Helm Release.

EXPLICITLY EXCLUDED FROM TEMPLATE: Sendy (proprietary EULA forbids third-party redistribution — document as external option customer self-purchases), Cal.com main edition (April 2026 closed-source pivot + 30-user AGPL gate — use Cal.diy MIT fork via scheduling team if needed), Keila as default (smaller community, Elixir runtime adds 5th language for marginal benefit — documented as future --engine=keila flag once upstream OpenAPI spec lands).

**Risks:**

- AGPL-3.0 §13 network-use trap: if WE ever pivot to operating a managed/hosted flavor of the template where we run Listmonk on customers behalf, any modifications we make become source-disclosure obligations. Mitigation: ship unmodified upstream containers only; expose configuration via env vars + Helm values; never patch source.
- Listmonk has NO branching automation / drip / lead scoring — founders expecting Mailchimp-style journeys will hit a feature wall. Must communicate honestly in launcher CLI and docs that drip+scoring requires either bolting on n8n/Temporal/Trigger.dev for workflow logic or graduating to Mautic.
- Mautic Acquia funding pull-back late 2024 has slowed velocity; project survives via community Mautic Association (since 2024) and 6.0.x/7.x LTS cuts through Sept 2026, but bus-factor and security-patch cadence are now monitor-for-fork concerns. Re-evaluate Mautic health every 6 months.
- Cal.com April 2026 hostile closed-source pivot proves single-vendor governance is a relicensing risk for the entire aisle. Every dependency bump must re-verify LICENSE file unchanged; bake automated license-diff CI check; prefer foundation-governed projects (Mautic Association) over single-vendor (Keila @pentacent).
- Email deliverability (SPF/DKIM/DMARC, IP warming, blocklist hygiene) is unsolved by any self-hosted OSS tool. Founders WILL blame Listmonk/Mautic for bounce rates that are actually their SMTP-relay reputation issue. Launcher must force-pick a reputable upstream (SES, Postmark, Mailgun, Resend) and never ship our own relay.
- Two competing Listmonk MCP servers (rhnvrm Python 18-tool, antoniolg) — picking the wrong one or letting both ship creates Aegis integration drift. Pin ONE (rhnvrm/listmonk-mcp, MIT, larger toolset) at a tagged version; document the choice; the libs/mcp/marketing wrapper hides the backend.
- Mautic optional add-on forces a SECOND database engine (MariaDB/MySQL) into a Postgres-only platform plus Redis + cron + RWX volume — significant operational surface. Document footprint loudly in launcher; gate behind explicit --engine=mautic flag; do not auto-enable at any tier.
- Sendy EULA risk: even mentioning Sendy in docs with install scripts arguably encourages license violations. Keep Sendy mention to a single 'commercial alternative customers purchase separately' line; never ship values files or compose snippets that pre-configure it.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Mautic** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Listmonk** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Keila** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Plunk** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Postal** — `MIT` — self-host: yes — maturity: production-grade
- **Maizzle** — `MIT` — self-host: yes — maturity: production-grade
- **OpenEMM** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Sendy** — `Commercial (perpetual $69)` — self-host: yes — maturity: usable

Imagine you're shipping a monorepo template that founders will buy and use to run their own startups. Each of those startups eventually needs to send three flavors of email: (1) transactional — "your password reset link", (2) marketing/newsletter — "here's our March update", and (3) drip/lifecycle — "you signed up 3 days ago, here's onboarding tip #2". The marketing-automation category in 2026 is split into four sharply different tiers, and conflating them is the most common mistake.

Tier 1 — full marketing automation suite (drip + segmentation + lead scoring + landing pages). The only credible self-hostable option is Mautic. It hit 7.x in late 2025 / early 2026, sits at ~9.8k stars, GPL-3.0, and is genuinely the "open-source HubSpot/Marketo". It's PHP/Symfony, heavy, and runs MySQL — operationally chunky, but it owns the category. Nothing else even close.

Tier 2 — newsletter + list management + transactional. Listmonk (single Go binary, Postgres, 21.3k stars, AGPL-3.0, v6.1.0 in March 2026) dominates here. It's fast, beautiful, low-ops, but deliberately doesn't do branching automation workflows. Keila (Elixir/Phoenix, AGPL-3.0, ~2.1k stars, v0.20.1 in May 2026) is the up-and-comer, with a polished block editor, double opt-in, partner mode (multi-tenant) — best UX for end-users by far, but smaller community.

Tier 3 — transactional API platform (Postmark/Resend alternative). Plunk (AGPL-3.0, ~5.2k stars, TypeScript, rides on AWS SES) is the modern pick. Postal (MIT, 16.6k stars, Ruby, v3.3.6 April 2026) is the heavyweight — it's a full SMTP server, not just an API gateway. Cuttlefish exists but moves slowly.

Tier 4 — design/build the email itself. Maizzle (MIT, 1.5k stars, v5.5.0 Feb 2026) is the Tailwind-for-emails framework. It produces the HTML that any of the above sends.

THE LICENSE TRAP. We are selling this template. AGPL-3.0 (Listmonk, Keila, Plunk, Cal.com) is fine if the END-USER runs the software themselves — the network-use clause attaches to whoever operates the service. We are NOT operating it for them; we ship infra-as-code that runs in their cluster. That means AGPL is SAFE for bundling-as-recipe but CAUTION if we ever offer "managed marketing-automation as part of our SaaS". Mautic is GPL-3.0 — same logic, slightly less viral because it lacks the network clause. Maizzle and Postal are MIT — fully safe. Sendy is a commercial $69 perpetual license — we cannot redistribute it; users buy it themselves. Cal.com itself is AGPL with a paid-enterprise edition for >30 users; Cal.diy is a community MIT fork. The smart move: ship a single Mautic profile recipe for the full-suite tier and a Listmonk + Plunk + Maizzle recipe for the lean newsletter+transactional+design stack. Both stacks are GPL/AGPL/MIT — safe to bundle as Helm/Crossplane recipes the customer applies in their cluster.

**Key findings:**

- Mautic 7.1.2 (May 28, 2026) is the only credible OSS full-suite marketing automation platform — GPL-3.0, ~9.8k stars, 200+ contributors, 36k commits on the 7.x branch. Mautic 7.0 RC announced Dec 2025; 7.x is now the active LTS line. Used by 200k+ organizations.
- Listmonk v6.1.0 (March 29, 2026) is the production-grade newsletter+list manager — AGPL-3.0, 21.3k stars, 2.3k forks, single Go binary + Postgres. Last commit 2026-05-26. The default pick for the Side Project / Early Startup tier.
- Keila v0.20.1 (May 25, 2026) — AGPL-3.0, Elixir/Phoenix, 2.1k stars, 52 releases, 1307 commits. Polished block editor, partner mode (multi-tenant sub-accounts), Brazilian Portuguese localization added May 24 2026. Best end-user UX in the category.
- Plunk (next branch, 5.2k stars, AGPL-3.0, TypeScript) — modern transactional + drip + workflow automation built on AWS SES. 13 releases, 777 commits on next branch. Costs ~$0.001/email through SES.
- Postal v3.3.6 (April 28, 2026) — MIT license, 16.6k stars, Ruby. This is a full SMTP delivery server, not just an API — heavier ops but most license-friendly option for bundling.
- Maizzle v5.5.0 (Feb 12, 2026) — MIT, 1.5k stars, Tailwind-for-emails framework. 279 releases. Cleanest pairing with any of the above as the email-design layer.
- Sendy ($69 perpetual commercial license, PHP+MySQL+Amazon SES) — popular for cost-per-email at scale but explicitly NOT bundleable; customer must buy their own license. Mention as alternative, do not include in template.
- OpenEMM (AGPL-3.0, AGNITAS-backed, Java) — claims >90% feature parity with commercial products including graphical campaign manager. German enterprise heritage. Mature but heavyweight; niche audience.
- Cal.com is licensed AGPL-3.0 with a commercial Enterprise tier required for >30 self-hosted users; Cal.diy is a 100% MIT community fork (v6.2.0, March 2026, 45k+ stars) — Cal.diy is the safer bundle for the scheduling overlap in marketing flows.
- PostHog added a Messaging beta (email drip + campaigns) in 2025 — same MIT/Apache-license-friendly stack as the rest of PostHog; worth considering as a CDP+analytics+messaging combined pick when the analytics team also chooses PostHog.
- Cuttlefish (Ruby, Postfix-backed) is alive but glacial — used in production for years (1M+ emails/month at OpenAustralia Foundation) but commit velocity has dropped; classify as 'usable' not production-grade for new adoption.
- License-safety summary: All viable OSS options are GPL-3.0, AGPL-3.0, or MIT. None use SSPL/BUSL/Commons-Clause. AGPL network-use clause only triggers if WE operate the service for customers; customer-operated self-hosting is unrestricted.

**Gotchas:**

- AGPL is a real trap if we ever offer 'managed marketing automation' as part of the commercial SaaS — the network-use clause forces us to release our entire SaaS surface. Stays SAFE only if we ship recipes that customers apply to their own clusters.
- Mautic is PHP/Symfony + MySQL/MariaDB — the rest of the template assumes Postgres. Bundling Mautic forces a second DB engine into the platform. Either accept the dual-DB cost or default to Listmonk for the Postgres-only profile.
- Listmonk does NOT do branching automation workflows (if-this-then-that drip logic). If founders need lifecycle email triggered by product events, pair it with Plunk or move up to Mautic. Don't market Listmonk as 'drip automation' — it isn't.
- Sendy's perpetual license is per-installation and explicitly forbids redistribution. We cannot include Sendy in the template; it must be a documented external option the customer self-purchases.
- Cal.com's AGPL applies to the community edition; the 'commercial license required at 30+ users' is a separate proprietary license. If we mention Cal.com, default to Cal.diy (MIT fork) for the bundle to avoid the 30-user gate.
- Postal v3 requires RabbitMQ, MariaDB, and a separate SMTP relay box — operationally bigger than its 'send emails' description suggests. Budget cluster footprint accordingly.
- Email deliverability is the unsolved problem of self-hosting. None of these tools fix SPF/DKIM/DMARC/IP-warming/blocklist work — they assume you bring AWS SES, Mailgun, Postmark, or run Postal yourself with a clean IP. Document this loudly in the launcher CLI.
- Plunk's repository default branch is `next` (not main); many CI integrations point at `main` and silently get a stale tree. Pin to a tagged release.

**Recommendation (this angle):** Ship two recipe profiles, not one. (1) Lean stack — Listmonk (newsletter/list) + Plunk (transactional + drip via AWS SES) + Maizzle (email design) — covers Just-Me through Early-Startup. All Postgres + Node/Go, fits the existing template stack, licenses are AGPL/AGPL/MIT and SAFE for customer-operated self-hosting. (2) Full suite — Mautic 7.x — for Scaling Startup and Production at Scale where founders need lead scoring, landing pages, multi-channel automation. Accept the PHP+MySQL operational cost in exchange for category completeness. Postal optional add-on for customers who want their own SMTP infra rather than SES/Mailgun/Postmark. Explicitly exclude Sendy (non-redistributable) and Cal.com proper (use Cal.diy MIT fork instead, owned by the scheduling team not us). Document loudly in the launcher: AGPL is fine because the CUSTOMER operates the service; if we ever pivot to "managed marketing automation as part of our SaaS", we must swap Listmonk/Plunk/Keila for the Mautic-or-Postal pair before that day. Keep Keila as a documented alternative for the newsletter slot when founders want a more polished editor and don't need Listmonk's API depth.

**Citations:**

- [Mautic GitHub repository (v7.1.2, GPL-3.0, 9.8k stars)](https://github.com/mautic/mautic)
- [Mautic Releases page](https://mautic.org/releases/)
- [Mautic Open Startup Report #35 — January 2026](https://mautic.org/blog/open-startup-report-35-january-2026/)
- [Listmonk GitHub repository (v6.1.0, AGPL-3.0, 21.3k stars)](https://github.com/knadh/listmonk)
- [Listmonk v6.1.0 release notes](https://github.com/knadh/listmonk/releases/tag/v6.1.0)
- [Keila GitHub repository (AGPL-3.0, Elixir/Phoenix, v0.20.1)](https://github.com/pentacent/keila)
- [Keila official site — 2026 feature updates](https://www.keila.io/)
- [Plunk GitHub repository (AGPL-3.0, 5.2k stars)](https://github.com/useplunk/plunk)
- [Plunk overview at Medevel](https://medevel.com/plunk/)
- [Postal GitHub repository (MIT, 16.6k stars, v3.3.6)](https://github.com/postalserver/postal)
- [Maizzle Framework GitHub repository (MIT, v5.5.0, Feb 2026)](https://github.com/maizzle/framework)
- [Cal.com licensing — AGPLv3 + Enterprise blog post](https://cal.com/blog/changing-to-agplv3-and-introducing-enterprise-edition)
- [Cal.diy MIT fork (45k+ stars, v6.2.0 March 2026)](https://github.com/calcom/cal.diy)
- [OpenEMM (AGPLv3, AGNITAS-backed)](https://github.com/agnitas-org/openemm)
- [Sendy review — $69 perpetual commercial license + AWS SES](https://mailflowauthority.com/esp-reviews/sendy-review)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **Listmonk** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Maizzle** — `MIT` — self-host: yes — maturity: production-grade
- **Mautic** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Keila** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Sendy** — `Proprietary EULA (per-domain perpetual)` — self-host: yes — maturity: production-grade

Imagine the ts-monorepo-template is a starter kit you sell to founders. When their startup hits the "Early Startup" tier ($30-150/mo) they need to start emailing humans — welcome flows, drip campaigns, password resets, newsletter blasts. Three jobs hide inside that one need: (1) transactional email (one-to-one, triggered by code: "your order shipped"), (2) marketing/newsletter email (one-to-many broadcast: "May product update"), and (3) automation (drip sequences, segmentation, scoring, conditional branches: "if user opened email A but hasn't logged in for 7 days, send email B").

The OSS landscape splits cleanly along those jobs. **Listmonk** is a single Go binary that nails jobs 1 and 2 with a clean REST API, real transactional templates with variable substitution, and a webhook surface — but it has no drip/automation builder. **Mautic** is the only OSS tool that does job 3 properly (visual workflow builder, lead scoring, conditional content, form builder), but it's a heavyweight PHP/Symfony stack that pulls in MySQL/MariaDB + Redis + cron + workers. **Keila** is the polished prosumer middle ground built on Elixir/Phoenix — beautiful UI, MJML-based composer — but smaller community and a thinner API. **Maizzle** isn't a server at all; it's a build-time Tailwind-CSS-to-HTML-email compiler — it composes with any of the above.

For our monorepo, the integration mechanics matter more than feature counts. Three questions decide fit: (a) Is there a clean Helm chart we can install via provider-helm so we get a Crossplane XRD like `MarketingStack`? (b) Does it expose a stable HTTP API the Phase 12 MCP server can wrap so Aegis can "create campaign", "add subscriber to segment"? (c) Does the launcher CLI's `task setup:<tool>` flow have something to template (secrets, API token bootstrap, sample template)?

Listmonk wins on all three: community Helm chart exists (th0ths-helm-charts/listmonk v5.0.3), the REST API is documented with token auth (`Authorization: token user:token`), two production-ish MCP servers already exist (rhnvrm/listmonk-mcp 18 tools, antoniolg/listmonk-mcp), and the Postgres dependency aligns with our existing pg-tenant XRD. Mautic also has a Facet Interactive Helm distribution (MIT-licensed wrapper) and a comprehensive 203-tool MCP server, but the GPL-v3 license is the load-bearing problem — bundling Mautic into a template we ship means anyone we sell to who modifies and network-deploys is on the hook for GPL-v3 obligations (and they may distribute downstream). Keila is AGPL-3.0, same issue but worse (network-use clause).

The license calculus is critical: we don't want the template itself to carry copyleft obligations. The clean pattern is "the template ships a Crossplane claim + Helm reference + setup task, but does NOT bundle or fork the upstream code." That means the user opts in, installs into their own cluster, runs under their own AGPL/GPL obligations — we never touch the source. This works for all three; we just need to be explicit about it in our marketing-stack README and never vendor any code.

Recommendation: ship **Listmonk as the default** for jobs 1+2 (transactional + newsletter), add **Maizzle as the email build pipeline** in the contracts package so templates live in git, and offer **Mautic as an optional add-on claim** for users who graduate into needing automation. Keila is the dark-horse alternative for EU-data-residency-conscious users; gate it behind a `--marketing-engine=keila` flag in the launcher.

**Key findings:**

- Listmonk v6.1.0 (March 2026) is AGPL-3.0, Go single-binary, 21.3k stars, with full REST API covering subscribers/lists/campaigns/templates/transactional/bounces and token auth via Authorization: token user:api_token
- Listmonk has TWO actively-maintained MCP servers (rhnvrm/listmonk-mcp 18 tools MIT-licensed; antoniolg/listmonk-mcp) — Phase 12 MCP layer can subclass or proxy these instead of writing from scratch
- Community Helm chart th0ths-helm-charts/listmonk v5.0.3 plus redzumi/listmonk-chart exist; deployment is a Deployment+Postgres dependency (slots into our existing pg-tenant XRD)
- Mautic is GPL-3.0 (5.x branch) with a trademark clause; Facet Interactive ships an MIT-licensed K8s distribution (mautic-k8s) with Helm 3 charts that is the de-facto upstream for ops
- Mautic has a 203-tool MCP server covering Contacts/Companies/Segments/Campaigns/Emails/Forms/Webhooks/etc. with OAuth2 — heaviest functional surface of any candidate
- Keila v0.20.1 (May 2026) is AGPL-3.0, Elixir/Phoenix, 2.1k stars, Docker image pentacent/keila — but API surface is undocumented externally and no Helm chart found
- Maizzle is MIT-licensed Tailwind-to-HTML email compiler, actively maintained (Maizzle OÜ © 2026) — purely build-time, no server, composes with ANY backend (Listmonk/Mautic/Keila/SES)
- Sendy is proprietary EULA ($69 per-domain perpetual) — must NOT be bundled into a commercial template; users can install separately but we cannot ship it
- Crossplane provider-helm v1.2.0 is the mechanism: write a Release CR pointing at the upstream chart; no need for a bespoke marketing-automation provider
- Terraform provider Muravlev/listmonk v0.1.1 exists but only manages templates — too narrow to be useful for our XRD layer; better to use provider-helm + provider-kubernetes secret + post-install Job for API-token seed
- Listmonk transactional API supports per-call data injection ({{ .Tx.Data.order_id }}) and custom SMTP headers — sufficient for code-triggered emails from go-hello/py-hello/rs-hello reference apps via HTTP POST
- Mautic forum confirms Mautic is used as a base for niche SaaS products — GPL-3 distribution obligation only triggers if we distribute modified source; pure orchestration (Helm chart reference, no fork) is safe

**Gotchas:**

- AGPL/GPL-bundling trap: if our template ships modified upstream source, customers who deploy as a network service inherit AGPL/GPL obligations. Safe pattern: reference upstream Helm chart by URL, install via provider-helm, never vendor code into apps/_ or libs/_
- Listmonk has no built-in drip/automation/scoring engine — for vibe-coders expecting Mailchimp-like journeys that is a hard gap; supplement with Temporal/workflow engine or recommend Mautic add-on
- Mautic GPL-v3 + heavy stack (PHP-FPM + MySQL + Redis + cron + queue workers) breaks our Postgres-only data plane assumption; needs separate MariaDB XRD or relax to PG via Doctrine (extra surface)
- Listmonk admin UI is single-tenant — for SaaS-on-top use case they would need one Listmonk per tenant or a custom row-level-security fork. Document this clearly
- Two competing Listmonk MCP servers exist (rhnvrm Python, antoniolg); pick ONE for the template and pin a version — or write a thin wrapper in libs/mcp/marketing that selects backend by env
- Maizzle build output is plain HTML; you still need a runtime to send it. Do not market Maizzle alone as 'email solution' — it composes with Listmonk/SES/Postmark
- Keila has poor external API documentation; building a stable MCP wrapper is risky without upstream Swagger/OpenAPI. Recommend only as user-facing UI for EU data residency, NOT as a programmatic backend
- Mautic K8s distribution uses EFS for media/spool/cache — on K8s without RWX you need Longhorn RWX or NFS-CSI shim. Our OVH+Contabo Longhorn setup supports this but it is an extra constraint

**Recommendation (this angle):** Ship **Listmonk as the default marketing-stack claim** (transactional + newsletter, AGPL-3.0 — reference upstream Helm chart, never vendor). Wrap with a Crossplane `MarketingStack` XRD whose composition does: (1) provider-helm Release pointing at th0ths-helm-charts/listmonk pinned to v5.0.3, (2) pg-tenant claim for the listmonk DB, (3) ExternalSecret with admin + API token seeded by a post-install Job, (4) Ingress claim. Add **Maizzle as a workspace package** (`libs/email-templates`) so HTML templates live in git, get type-checked, and ship as Listmonk template imports via an Nx task. The launcher CLI gets `task setup:marketing` which: (a) applies the claim, (b) waits for ready, (c) creates the first admin user, (d) imports Maizzle-built templates, (e) prints the API token. Phase 12 MCP server wraps rhnvrm/listmonk-mcp upstream (MIT, Python) by pinning a version and embedding it; expose 18 tools to Aegis. Offer **Mautic as an optional `--engine=mautic` claim** for users who need automation/scoring/journeys — clearly flag GPL-3.0 + heavier footprint + separate MariaDB. **AVOID Sendy** entirely (proprietary EULA — cannot ship in a commercial template). Treat **Keila as a future flag** (`--engine=keila`) once an OpenAPI spec lands upstream. License posture: the template stays MIT/Apache-style; we never fork or modify Listmonk/Mautic/Keila source; the README's marketing-stack section explicitly states 'the user installs upstream OSS under its own license; we provide only orchestration glue.' Day-1 wiring (10 commands): `task setup:marketing --engine=listmonk` → `kubectl apply -f xrds/marketingstack.yaml` → `kubectl apply -f claims/listmonk-dev.yaml` → wait for `marketingstack.platform.io/listmonk-dev` Ready → `kubectl get secret listmonk-admin -o jsonpath='{.data.api_token}' | base64 -d` → `task email:build` (Maizzle compile → `dist/templates/*.html`) → `task email:import` (POST each to /api/templates) → `task mcp:enable -- marketing-listmonk` → smoke test `curl -H 'Authorization: token admin:$TOKEN' $URL/api/tx -d '{...}'` → commit Maizzle templates to git.

**Citations:**

- [knadh/listmonk — GitHub (AGPL-3.0, v6.1.0, 21.3k stars)](https://github.com/knadh/listmonk)
- [Listmonk API documentation — auth, endpoints, transactional](https://listmonk.app/docs/apis/apis/)
- [Listmonk Transactional API — template variables and headers](https://listmonk.app/docs/apis/transactional/)
- [th0th's Listmonk Helm chart 5.0.3 (Artifact Hub)](https://artifacthub.io/packages/helm/th0ths-helm-charts/listmonk)
- [redzumi/listmonk-chart — community Helm chart](https://github.com/redzumi/listmonk-chart)
- [rhnvrm/listmonk-mcp — MIT-licensed MCP server, 18 tools](https://github.com/rhnvrm/listmonk-mcp)
- [antoniolg/listmonk-mcp — alternative MCP server](https://github.com/antoniolg/listmonk-mcp)
- [Muravlev/terraform-provider-listmonk (templates only, v0.1.1)](https://registry.terraform.io/providers/Muravlev/listmonk/latest)
- [mautic/mautic LICENSE.txt — GPL-3.0 + trademark clause](https://github.com/mautic/mautic/blob/5.x/LICENSE.txt)
- [FacetInteractive/mautic-k8s — MIT-licensed Helm + K8s distribution](https://github.com/FacetInteractive/mautic-k8s)
- [Mautic Developer Docs — Webhooks REST API 5.x](https://devdocs.mautic.org/en/5.x/rest_api/webhooks.html)
- [pentacent/keila — AGPL-3.0, Elixir/Phoenix, v0.20.1](https://github.com/pentacent/keila)
- [maizzle/framework — MIT-licensed email build framework](https://github.com/maizzle/framework)
- [Sendy EULA — proprietary per-domain perpetual license](https://sendy.co/end-user-license-agreement)
- [crossplane-contrib/provider-helm v1.2.0 — Upbound Marketplace](https://marketplace.upbound.io/providers/crossplane-contrib/provider-helm/latest)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Listmonk** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Mautic** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Keila** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Maizzle** — `MIT` — self-host: yes — maturity: production-grade
- **Postal** — `MIT` — self-host: yes — maturity: production-grade

Think of selling a commercial open-core template as opening a restaurant where the recipe book is the product. Customers buy the book to cook at home. Your job is to make sure every ingredient you list in the recipe book is something the cook can legally buy and use without owing royalties to the spice supplier — and crucially, without YOU being on the hook either.

The marketing-automation aisle has four ingredient categories, and each has very different licensing rules.

(1) PERMISSIVE (MIT/Apache-2.0/BSD/ISC). Maizzle (the email-design framework) is MIT. Postal (the SMTP gateway) is MIT. These are spices you can put in any recipe — no attribution rule beyond "include the license file." If your template ships a Helm chart that references their Docker image, you owe nothing. Pure SAFE.

(2) STRONG COPYLEFT (GPL-3.0). Mautic is GPL-3.0. GPL is famous for the "viral" reputation, but here is the nuance that matters for a template: GPL's trigger is _distribution of a derivative work_, not deployment. If your template's Helm chart simply _points at_ the upstream `mautic/mautic` Docker image (the user pulls and runs it), you are not distributing Mautic — Docker Hub is. You are distributing YAML that references it. The "mere aggregation" clause (GPLv3 §5) makes clear this is fine. You only get bitten if you fork Mautic, modify the PHP code, and ship a modified binary. SAFE for bundle-by-reference. CAUTION if you fork.

(3) NETWORK COPYLEFT (AGPL-3.0). Listmonk and Keila are AGPL-3.0. The AGPL adds §13 — the "network use" clause — which says if you _modify_ the software and let users interact with it over a network, you must publish your modifications. The critical word is _modify_. Unmodified Listmonk deployed as a Docker container does not trigger §13. The Hyve and FOSSA both confirm: containers running unmodified upstream binaries are "aggregates," not derivatives. SAFE for bundle-by-reference, even if your customer runs it as a SaaS.

(4) PROPRIETARY DRESSED AS OSS. Sendy is a $69 perpetual EULA — non-transferable, single-website. You cannot bundle this in a template you sell, because the EULA forbids redistribution and requires each end-user to buy their own license. Worse, Cal.com just (April 2026) yanked its main codebase closed-source and renamed the AGPL public fork to "Cal.diy" (now MIT but feature-stripped — no teams, orgs, API v2). The lesson: a tool's license today is not the license tomorrow. License-change risk is real and Cal.com proves it within this research window.

So the playbook for the template: prefer permissive (Maizzle, Postal) for anything you wrap or extend; reference AGPL/GPL tools by upstream Docker image only (never fork into the template repo); avoid Sendy entirely; treat Cal.com as "use Cal.diy MIT fork or pick a different scheduler"; document for every bundled tool the _exact_ image tag + license so customers can audit. The user installs at their own risk — your template just orchestrates.

**Key findings:**

- Mautic is GPL-3.0 (verified from LICENSE.txt on the 5.x branch — 'GNU General Public License Version 3, 29 June 2007'). GPL's copyleft trigger is distribution of a derivative work. A Helm chart that references the upstream mautic/mautic Docker image is 'mere aggregation' per GPLv3 §5 and imposes no source-disclosure obligation on the template authors or the customer.
- Listmonk is AGPL-3.0 (verified from LICENSE on master — 'GNU AFFERO GENERAL PUBLIC LICENSE Version 3, 19 November 2007'). The §13 network-use clause triggers ONLY on modification. Unmodified container deployments are not subject to network copyleft per the Mend/Revenera/Hyve analyses and confirmed by Elastic's own discussion of AGPL container licensing.
- Keila is AGPL-3.0, 100% open source with no proprietary components, published as official Docker image pentacent/keila. Same §13 carve-out as Listmonk — safe for bundle-by-reference, no upcharges, no MAU caps.
- Cal.com underwent a HOSTILE license change in April 2026: main commercial codebase moved closed-source/proprietary; the public AGPL repo was demoted to 'Cal.diy' under MIT but feature-stripped (no teams, no orgs, no API v2 endpoints, no multi-tenant). CEO Bailey Pumfleet cited AI-assisted vulnerability scanning as justification. Community reaction was hostile (Mozilla Thunderbird publicly offered to help users migrate).
- Maizzle email framework is MIT-licensed (confirmed via maizzle/framework GitHub + npm). No copyleft, no attribution beyond the license file. Ideal for bundling email templates into the template repo itself.
- Postal mail-delivery platform is MIT-licensed (copyright aTech Media Limited). Drop-in self-hosted alternative to SendGrid/Mailgun/Postmark — safe to bundle by reference or to package alongside Mautic/Listmonk as the SMTP backend.
- Sendy is a PROPRIETARY EULA product ($69 perpetual, single-website, non-transferable). Each end-user must purchase their own license. Bundling Sendy in a commercial template you sell would violate the EULA — this is the only candidate that is unambiguously AVOID.
- GPL-3.0 and AGPL-3.0 'Docker image aggregation' is settled territory: opensource.com (Red Hat), FOSSA, and The Hyve all agree that referencing unmodified upstream images from a Helm chart does NOT extend copyleft to surrounding manifests, values files, or the orchestrator. Each container is a separate 'work' under GPLv3 §5 / AGPLv3 §13.
- Mautic trademark policy is separate from the GPL grant: you can fork the code freely, but you cannot use the Mautic name/logo to brand your derivative. If the template bundles Mautic by reference (no fork, no rebrand), trademark policy does not apply.
- License-change risk is the single biggest threat in this aisle and cannot be eliminated — only mitigated. Mitigation: pin Docker image tags (so a future BUSL/SSPL conversion of a new release does not silently change the bundled artifact), keep a documented exit path for each tool, and prefer projects with foundation/community governance (Mautic Association since 2024) over single-vendor projects (where Cal.com-style shifts are easy).

**Gotchas:**

- AGPL §13 is triggered by modification, NOT by deployment. The instant a customer forks Listmonk/Keila to add a custom field and exposes the modified UI over a network, they owe source disclosure. Document this explicitly in template README so customers do not unknowingly contaminate their proprietary changes.
- GPL §5 'mere aggregation' is well-settled for separate processes/containers, but blurs if you bundle a GPL library INTO your own binary. Never `import` Mautic PHP code into a template-shipped helper — keep it strictly process-isolated via Docker.
- Cal.com proves single-vendor governance is a relicensing risk. Cal.diy (the MIT public fork) is missing the features most commercial users want (teams, orgs, API v2). If a scheduling tool is needed, do NOT use Cal.com — pick Calendso predecessors, Thunderbird Appointment (Mozilla, MPL-2.0 expected), or build on top of cal.diy with eyes open about feature gaps.
- Sendy's EULA is single-website + non-transferable. Even pointing at a Sendy install in template docs is fine, but bundling install scripts or values that 'pre-configure' Sendy would arguably encourage license violations. Better to omit entirely.
- Mautic's PHP/Symfony stack pulls hundreds of Composer dependencies — many MIT/BSD, but a few LGPL. LGPL is fine for library use but worth running a license scan (fossa, licensee, scancode) on the actual built container before claiming SAFE status to downstream customers.
- Postal is MIT but bundles RabbitMQ (Apache-2.0/MPL-2.0 dual since 2024), MariaDB (GPL-2.0), and ClamAV (GPL-2.0) at runtime. Same aggregation logic applies — but document the transitive licenses for any customer doing compliance review.
- Keila has a much smaller maintainer base than Listmonk or Mautic (single primary maintainer @pentacent). License is safe but bus-factor is a separate risk dimension that license analysis alone does not capture.
- BUSL (Business Source License) is currently absent from this aisle — but worth periodic re-checks. HashiCorp/Sentry-style relicensing pressure is industry-wide. Treat any future minor version of Mautic/Listmonk/Keila as 'verify license unchanged' on every bump.

**Recommendation (this angle):** For the marketing-automation aisle of the ts-monorepo-template, ship a layered, license-aware default that is SAFE for commercial bundling. Tier 1 (SAFE, ship by default): Maizzle (MIT) for email design + Postal (MIT) for SMTP delivery. Both are MIT, no obligations, no surprises. Tier 2 (SAFE-by-reference, opt-in): Listmonk (AGPL-3.0) as the default newsletter/transactional engine for self-hosted profiles (Side Project through Production-at-Scale). Bundle as a Helm chart that references the upstream knadh/listmonk Docker image at a pinned tag — never fork into the template repo. Document the AGPL §13 modification-trigger explicitly in the README. Tier 3 (SAFE-by-reference, advanced): Mautic (GPL-3.0) for customers who need full marketing automation (campaigns, drip, scoring, CRM integration). Same pattern — reference upstream container, no fork. Tier 4 (alternative): Keila (AGPL-3.0) as a Listmonk alternative for customers who prefer Elixir/Phoenix and a simpler UI. EXCLUDE Sendy entirely (proprietary EULA, non-transferable, fundamentally incompatible with template bundling). EXCLUDE Cal.com from the scheduling overlap — use Cal.diy (MIT) if needed, but flag the feature gaps. Operational discipline: pin every Docker image tag in values files; run a license scanner (fossa or scancode) as a CI gate on every dependency bump; maintain a LICENSES.md per aisle in the template that lists exact license + version + obligation summary for every bundled tool so customers can run their own compliance review without grep-archaeology. Overall flag for this aisle: MIXED — two tools are pristine MIT, three are copyleft but safely bundleable-by-reference, one is a hard AVOID, one is in active license-shift turbulence.

**Citations:**

- [Mautic LICENSE.txt on 5.x (GPL-3.0 verbatim)](https://github.com/mautic/mautic/blob/5.x/LICENSE.txt)
- [Listmonk LICENSE on master (AGPLv3 verbatim)](https://github.com/knadh/listmonk/blob/master/LICENSE)
- [Cal.com going closed-source — official blog (April 2026)](https://cal.com/blog/cal-diy-open-source-to-closed-source)
- [Cal.com closed-source debate — Slashdot coverage](https://yro.slashdot.org/story/26/04/15/1913213/calcom-is-going-closed-source-because-of-ai)
- [Cal.com closes commercial codebase — security debate](https://letsdatascience.com/news/calcom-closes-commercial-codebase-sparks-security-debate-d5e0d3fd)
- [Keila — Open Source under AGPLv3](https://www.keila.io/open-source/)
- [Maizzle framework — MIT license (npm + GitHub)](https://github.com/maizzle/maizzle)
- [Sendy End User License Agreement](https://sendy.co/end-user-license-agreement)
- [Postal mail server (MIT) — postalserver/postal](https://github.com/postalserver/postal)
- [Containers, the GPL, and copyleft (Red Hat / opensource.com)](https://opensource.com/article/18/1/containers-gpl-and-copyleft)
- [Containers and Open Source License Compliance — FOSSA](https://fossa.com/blog/containers-open-source-license-compliance/)
- [AGPL Section 13 trigger requires modification — Mend](https://www.mend.io/blog/the-saas-loophole-in-gpl-open-source-licenses/)
- [AGPLv3 source-code disclosure obligations — opensource.com](https://opensource.com/article/17/1/providing-corresponding-source-agplv3-license)
- [Mautic Association governance (community-led since 2024)](https://mautic.org/about/)
- [Mautic Trademark Policy (separate from GPL grant)](https://www.mautic.org/about/trademark)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **React Email** — `MIT` — self-host: yes — maturity: production-grade
- **Maizzle** — `MIT` — self-host: yes — maturity: production-grade
- **Listmonk** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Mautic** — `GPL-3.0` — self-host: yes — maturity: usable
- **Keila** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Sendy** — `Proprietary (non-transferable EULA)` — self-host: yes — maturity: production-grade

Picture a founder who just shipped a landing page with the ts-monorepo-template. Day one they want a signup form that drops emails into a list. Day thirty they want a 5-step onboarding drip. Day ninety they want lead scoring, behavioral triggers, and a SQL-segmented re-engagement campaign. The question is: what do we bundle so they don't have to wire Mailchimp ($100+/mo at 10k contacts) on day one?

There are really three jobs hiding inside "marketing automation":

1. Transactional email (password resets, receipts, magic links). This is plumbing — it should ship with the template by default. The right answer in 2026 is React Email (MIT) for templating + Nodemailer/Resend SDK for sending. React Email is just a React renderer that outputs Outlook-safe HTML — no daemon to run, no AGPL contamination. Maizzle (MIT, Tailwind-based) is the close alternative if you don't want React in your email rendering path.

2. Newsletter / broadcast sending. Listmonk is the clear winner on operational cost — a Go binary + Postgres, runs on 512MB RAM, SQL-based segmentation, transactional API. It costs nothing to run alongside a cheap SES bill. Its catch is AGPL-3.0: if WE eventually offer a managed flavor of the template, we have to ship our Listmonk source changes to end-users. As long as customers self-host it (which is the whole product premise), AGPL is fine.

3. Full marketing automation — drip campaigns with conditional branches, lead scoring, landing pages, behavioral triggers. Mautic is the only OSS tool that genuinely does this. It's GPL-3.0 (server-side, no contamination risk), but it's heavy — PHP/Symfony, 2-4GB RAM minimum, several hours to install properly, and Acquia pulled funding in late 2024. The 6.0.x LTS train is still being cut by community maintainers through Sept 2026, but velocity has slowed.

So the founder's decision tree is: every project gets React Email + Maizzle on day one. Newsletters get Listmonk on day two (or as a one-command opt-in). Mautic gets pulled in only when the customer explicitly needs drip+scoring, and ideally at the Early Startup tier or later where they have the RAM budget.

Two things to avoid: Sendy ($59 perpetual but explicitly non-transferable and prohibits redistribution to third parties — we cannot bundle it in a commercial template), and Keila (also AGPL like Listmonk but with 10x smaller community, Elixir runtime adds operational surface area without compensating value).

The upgrade path for founders: when Listmonk's lack of automation logic starts hurting, the next step is either (a) bolt on n8n/Trigger.dev for workflow logic, or (b) graduate to Mautic, or (c) move to Loops/Resend Broadcasts (commercial SaaS, ~$50/mo). Mailchimp Standard at 10k contacts is $100/mo, Klaviyo similar — that's the wall founders hit and why we bundle the OSS pieces in the first place.

**Key findings:**

- Three distinct sub-problems hide inside 'marketing automation': (a) transactional plumbing, (b) newsletter broadcast, (c) automation logic / drip + scoring. No single OSS tool covers all three well in 2026 — the right answer is layered.
- React Email is MIT-licensed and is the default 2026 choice for transactional templates in a TypeScript/React stack — it renders to Outlook-safe HTML and pairs with Resend, Nodemailer, or any SMTP. Active maintenance through April 2026; ~500K weekly downloads of Resend SDK.
- Maizzle is MIT, Tailwind-based, build-time only (no daemon). It is the right pick when teams prefer a non-React email rendering path or want full Tailwind utility classes inlined.
- Listmonk is the strongest pure-newsletter tool — Go single binary + Postgres, runs on 512MB RAM, SQL segmentation, transactional API, v6.1.0 released Mar 2026, ~21k GitHub stars. License is AGPL-3.0.
- Listmonk's AGPL-3.0 means: SAFE for customers who self-host (they don't redistribute), but if WE later operate a managed/hosted flavor of the template, network-use kicks in and any modifications must be published. Mitigation: do not modify upstream Listmonk; ship as unmodified container.
- Mautic is the only OSS tool with genuine marketing automation depth — visual workflow builder with conditional branches, lead scoring, landing pages, behavioral triggers. License is GPL-3.0 (server-side, no contamination of our template code).
- Mautic project health is mixed: Acquia reduced funding late 2024, but community maintainers continue cutting releases. Mautic 6.0.x LTS supported through Sept 2026. Heavy stack: PHP/Symfony, 2-4GB RAM, multi-hour install. Not a fit for the Just Me or Side Project profiles.
- Sendy is proprietary with a one-time $59-69 license but its EULA explicitly prohibits selling, distributing, or making the Software available to third parties — we CANNOT bundle Sendy in a commercial template. AVOID.
- Keila (AGPL-3.0, Elixir/Phoenix) is functionally similar to Listmonk but has ~10x smaller community (2.1k vs 21k stars), heavier runtime, and no clear advantage for our audience. Skip in favor of Listmonk.
- Cal.com moved its main repo to closed-source; the public fork Cal.diy is MIT-licensed. Relevant only if scheduling becomes part of the marketing-automation surface (booking links in email).
- Pricing wall founders hit: Mailchimp Standard at 10k contacts ≈ $100/mo, Premium ≈ $230/mo; Klaviyo similar; Resend Broadcasts ~$50/mo. The OSS stack reduces this to SES sending cost (~$1 per 10k emails) plus hosting (~$5-20/mo).
- Mautic does NOT replace React Email — the two complement each other. React Email = developer-authored templates committed to git; Mautic = marketer-authored campaigns in a UI. A complete template should support both editing modes.

**Gotchas:**

- AGPL network-use clause: if the ts-monorepo-template ever ships a managed/hosted SaaS flavor where WE operate Listmonk or Keila on customers' behalf, we must publish any modifications to the AGPL components. Mitigation: bundle upstream containers unmodified; expose configuration only via env vars + Helm values.
- Sendy's EULA explicitly forbids redistribution to third parties — bundling Sendy in the launcher CLI or a paid template tier would violate the license. AVOID even though the perpetual $59 fee is attractive.
- Mautic resource footprint (2-4GB RAM minimum, PHP-FPM + MySQL + cron) breaks the 'Just Me' and 'Side Project' profile cost envelopes. Listing it as default-on would push the entry-level $0-20 profiles into a $30+ infrastructure spend.
- Mautic's reduced corporate sponsorship (Acquia pull-back late 2024) means slower security patches and feature velocity. Acceptable for now (6.0.x LTS through Sept 2026) but flag as a 'monitor for fork' candidate in the platform roadmap.
- React Email + Nx monorepo integration is community-maintained (@nx-extend/react-email); not first-party. Expect to write a thin Nx executor wrapper for the email-dev server and the render pipeline.
- Listmonk's 'transactional API' is a single-shot send endpoint — it is NOT a queue with retries, dedup, or webhook delivery receipts. For magic links and payment receipts, route through SES/Postmark directly via React Email render, not through Listmonk's transactional endpoint.
- Self-hosting an email sender does NOT solve deliverability — SPF/DKIM/DMARC, IP warming, and a reputable upstream (SES, Postmark, Mailgun, Resend) still matter. Bundle a 'pick your SMTP' wizard in the launcher; do not ship our own SMTP relay.
- Keila's Elixir/Phoenix stack adds a runtime that nothing else in the template uses (Nx polyglot is Go/Python/Rust/TS). Bundling Keila introduces a 5th runtime for marginal benefit over Listmonk — skip.

**Recommendation (this angle):** RECOMMENDATION: Layer three components, not one monolith.

(1) **React Email** — INCLUDE DAY 1, all 5 profiles. MIT-licensed React renderer for transactional templates. Ship as `packages/emails` in the monorepo with an Nx target for `email:dev` (live preview) and `email:render` (HTML/text output piped to any SMTP). Pair with Resend SDK for the cloud-default path and Nodemailer for the self-hosted-SMTP/SES path. This is plumbing — every app needs it.

(2) **Maizzle** — INCLUDE ON-DEMAND ONLY (launcher CLI flag `--email-framework=maizzle`). MIT, Tailwind-native, build-time only. Right for teams that want a non-React email rendering path. Not the default because React Email integrates better with our TS-first stack and is what the AI-agent (Aegis) audience will expect.

(3) **Listmonk** — INCLUDE DAY 2 for Side Project + Early Startup + Scaling Startup + Production at Scale profiles. Default-on at Side Project and above; opt-in for Just Me. Ship as a Crossplane XRD `XNewsletter` + ArgoCD Application that boots Listmonk against the existing Postgres + an SMTP secret. AGPL-3.0 is fine because we ship it unmodified.

(4) **Mautic** — INCLUDE ON-DEMAND ONLY, Early Startup tier and above. Add a launcher flag `--marketing-automation=mautic` that pulls in a separate Crossplane composition (`XMarketingAutomation`) sizing the deployment for ≥4GB RAM. Document the upgrade path "Listmonk + n8n → Mautic" as the natural progression when drip + scoring become required.

(5) **AVOID Sendy** — EULA prohibits third-party distribution. Cannot bundle in a commercial template.

(6) **EXCLUDE Keila** — AGPL like Listmonk but smaller community and adds an Elixir runtime that nothing else in the stack needs. No advantage for our audience.

(7) **Cal.com / Cal.diy** — Out of scope for this team; covered by the scheduling-overlap team. If they pick Cal.diy (MIT), it integrates cleanly with React Email for booking-confirmation flows.

Founder upgrade path to communicate: React Email + Listmonk replaces Mailchimp Essentials (~$57/mo at 10k contacts). Add Mautic when you need drip + scoring — replaces Mailchimp Standard ($100+/mo) and Klaviyo. The graduation point to commercial SaaS (Loops, Resend Broadcasts, Klaviyo) is when marketing headcount > engineering headcount — at that point the per-month savings stop justifying the operational tax.

**Citations:**

- [Listmonk — Free and open source self-hosted newsletter manager](https://listmonk.app/)
- [knadh/listmonk on GitHub (AGPLv3, single binary, v6.1.0 Mar 2026)](https://github.com/knadh/listmonk)
- [Listmonk Review 2026 — Mailflow Authority](https://mailflowauthority.com/esp-reviews/listmonk-review)
- [Mautic Releases & roadmap](https://mautic.org/releases/)
- [Mautic End of Life / LTS dates (6.0.x through Sept 2026)](https://eosl.date/eol/product/mautic/)
- [Mautic vs Listmonk 2026 — Use Apify comparison](https://use-apify.com/blog/mautic-vs-listmonk-2026)
- [Listmonk vs Mautic — Sequenzy 2026](https://www.sequenzy.com/versus/listmonk-vs-mautic)
- [Maizzle framework on GitHub (MIT, Tailwind email)](https://github.com/maizzle/maizzle)
- [React Email + Resend (MIT, monorepo support)](https://github.com/resend/react-email)
- [Keila — open source newsletter (Elixir, AGPL-3.0)](https://www.keila.io/)
- [Keila vs Listmonk — Sequenzy 2026 comparison](https://www.sequenzy.com/versus/keila-vs-listmonk)
- [Sendy End User License Agreement (non-transferable, no redistribution)](https://sendy.co/end-user-license-agreement)
- [AGPL and SaaS — Open Core Ventures explainer](https://www.opencoreventures.com/blog/agpl-license-is-a-non-starter-for-most-companies)
- [Cal.com → Cal.diy MIT fork (AGPL to MIT split)](https://cal.com/blog/cal-diy-open-source-to-closed-source)
- [5 Open-Source Mailchimp Alternatives 2026 — Use Apify](https://use-apify.com/blog/mailchimp-alternatives-2026)

---

## Team 7 — CRM

### Synthesized verdict

- **Verdict:** `include-only-on-demand`
- **Fit score:** 78 / 100
- **Top pick:** **Twenty CRM**
- **License:** `AGPL-3.0 (community) + proprietary "Twenty Enterprise License" on files marked /* @license Enterprise */`
- **Default profile bundles:** `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angle reports converge on the same shape: Twenty CRM is the clear momentum + AI-fit winner (44-49k stars, YC S23, $5M seed, 300+ contributors, native MCP server in v2.x, GraphQL+REST with HMAC-signed webhooks), and it is the only modern OSS CRM whose data model and API surface were designed for AI-agent access — which is exactly Audience 2 (Aegis) of ts-monorepo-template. The license question is the central concern, and three of four angles independently concluded that AGPL-3.0 is SAFE for us under the specific bundling pattern this template uses: we ship a Crossplane XRD (XCrmInstance) + a Helm Release that REFERENCES the upstream twentycrm/twenty Docker image, wires Postgres via the existing XPostgresInstance claim, and plumbs OIDC through the existing provider-keycloak claim. We never vendor Twenty source into the Nx monorepo, never fork the image, and never bundle files marked /_ @license Enterprise _/. Under FSF "mere aggregation" doctrine, Google's published AGPL policy, and the Grafana Helm-chart precedent, this pattern does not pull our template code into AGPL scope. The risk crystallizes ONLY if we (a) ever host Twenty as part of our own managed SaaS layer, or (b) modify/patch the upstream image — both forbidden by template policy. Atomic CRM (MIT, Marmelab) was considered as the runner-up because its license is genuinely cleaner, but it loses on three decisive criteria: no native MCP, smaller feature surface (no signed-webhook story for Aegis events, no metadata API for schema discovery), and a Supabase backend assumption that fights our existing Postgres + Crossplane rail at the Scaling/Production tiers. We keep Atomic CRM as a documented "license-paranoid swap" via a --profile=mit flag on the launcher CLI for founders who plan to white-label and resell. Verdict is include-only-on-demand (not day-1) because Just-Me and Side-Project profiles are better served by HubSpot Free or a Notion DB — bundling a CRM at $0 ARR is overkill and adds cluster surface area. Default-off at p-solo and p-hobby; offered as `task setup:crm` at p-startup-small (where HubSpot's 1k-contact cap and $20/seat pricing start to bite around 4-5 users); default-on for p-startup-scale and p-enterprise where Aegis genuinely needs structured CRM data and HA Postgres is already in the stack.

**Integration outline:**

Build XRD `XCrmInstance` (apiVersion: platform.ts-monorepo.io/v1alpha1) whose Composition fans out into: (1) a provider-helm `Release` pinning a community Twenty chart (AMecea or twenty-crm on Artifact Hub) at a vendored chart version + image digest in charts/vendor/twenty-crm/ with our own values overlay; (2) an `XPostgresInstance` claim for the CRM database; (3) an `XKeycloakClient` claim that provisions an OIDC client (issuer = platform Keycloak realm, redirect URIs = Twenty UI route) — this routes auth through our existing IdP instead of Twenty's Enterprise-licensed SSO file; (4) a bootstrap Job that mints the admin API key and writes it to a Secret. Argo CD ApplicationSet adds a `crm` generator so the claim deploys per-environment; Kargo handles promotion across dev/stage/prod. Launcher CLI verb: `task setup:crm` applies claims/crm.yaml, polls `kubectl get crminstance crm -w` until Ready, prints the URL + Secret. Post-provision a second task runs `task crm:codegen` which executes Twenty's metadata API against the live instance and generates per-workspace TypeScript clients into the Nx workspace (codegen must run post-provision because Twenty's schema is workspace-specific — custom objects become first-class endpoints). For Aegis/MCP (Phase 12): we author OUR OWN thin MCP server inside the template that wraps Twenty's REST endpoints (/rest/people, /rest/companies, /rest/opportunities, /rest/activities) plus a discover_schema tool hitting the metadata API — do NOT depend on community Twenty MCP servers (mhenry3164 et al.) which may go stale. Webhook wiring: bootstrap Job registers a signed-HMAC webhook from Twenty to our event gateway so Aegis subscribes to opportunity.updated etc. Observability: Twenty exports Prometheus metrics + structured logs that flow into the existing Loki/Tempo/Prom stack with no extra config. Operational guardrails enforced in CI: a `licenses-audit` task greps for `@license Enterprise` markers in any vendored chart/template content and fails the build; LICENSES.md auto-generated from Chart.yaml annotations; launcher CLI surfaces a "license advisor" screen explaining AGPL self-host vs MIT swap. Fallback path: same XRD swaps implementation via values.yaml `crm.backend: espocrm | atomic-crm | twenty` so founders can choose EspoCRM (deeper email/calendar sync) or Atomic CRM (MIT, white-label-friendly) without changing the claim shape.

**Risks:**

- AGPL-3.0 network-use clause: if we EVER operate Twenty as part of our own managed SaaS layer, any modifications we make to Twenty itself must be released under AGPL. Mitigation: keep Twenty strictly unmodified (config-only via values.yaml + env), keep all extensions in separate sidecars/external services, never patch the image.
- Twenty's /_ @license Enterprise _/ marker on individual files is easy to miss in a vendored chart. A fork or chart copy that bundles those files is a commercial license violation. Mitigation: CI grep gate + audit on every chart-version bump; default Helm values disable enterprise features (SSO, advanced RBAC) and route SSO through the platform's existing Keycloak instead.
- Twenty's official Helm chart is community-maintained, not upstream-blessed (open issue #8900 requests an official chart). Risk of chart abandonment or breaking changes between versions. Mitigation: vendor the chart into charts/vendor/twenty-crm/, pin chart version AND image digest, own the values.yaml.
- Twenty's API schema is workspace-specific — TypeScript codegen must run AFTER provisioning against a live instance, not at template-init time. This is a wrinkle for the launcher CLI's offline/dry-run modes and for CI test fixtures.
- Native Twenty Cloud MCP server is a Cloud-only feature; self-hosted users get the community MCP or our own wrapper. Risk that community MCPs (mhenry3164 etc.) go stale. Mitigation: ship our own thin MCP wrapper as part of the template (Phase 12).
- Email/calendar sync (IMAP/SMTP, Google/Outlook) is weaker on Twenty than on EspoCRM out-of-the-box. Founders whose #1 day-1 need is inbox/calendar sync will be unhappy. Mitigation: document EspoCRM swap path; consider a Mautic add-on profile for marketing-automation-heavy teams.
- Younger codebase (2023+) means fewer battle-tested edge cases vs SuiteCRM's decade-plus production hardening, and SMB-only marquee customers (no Fortune 500 anchors yet). Mitigation: pin known-good versions; mirror upstream releases; keep EspoCRM/SuiteCRM as documented conservative alternatives.
- Trademark separate from copyright: even though AGPL lets us redistribute the code, the Twenty name and logo are trademarked. Marketing copy must say 'pre-configured Helm chart for Twenty CRM' / 'compatible with Twenty', NOT 'Twenty Edition by [us]' or similar endorsement-implying phrasing.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Atomic CRM (marmelab)** — `MIT` — self-host: yes — maturity: usable
- **Twenty CRM** — `AGPL-3.0 + commercial (dual)` — self-host: yes — maturity: production-grade
- **EspoCRM Community** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **SuiteCRM** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Krayin CRM** — `MIT` — self-host: yes — maturity: usable
- **Vtiger Open Source (Community)** — `Vtiger Public License 1.1 (MPL-1.1 derivative)` — self-host: yes — maturity: usable
- **Mautic** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Dolibarr ERP/CRM** — `GPL-3.0+` — self-host: yes — maturity: production-grade

A CRM (Customer Relationship Management system) is basically a database with a friendly face. It tracks three things: who you talk to (contacts/companies), what you're trying to sell them (deals/pipeline), and what's happened (activities — calls, emails, notes, meetings). Around that core sits integration with email/calendar, automations, and reporting. Every modern CRM is conceptually the same table-of-tables — Salesforce, HubSpot, the open-source ones — they differ in UX, data model flexibility, and how angry the lawyer gets when you read the license.

For an open-core monorepo template that we plan to SELL, the license question dominates everything else. Here's why: in 2026 the OSS CRM market split into two camps. Camp A picked AGPL-3.0 (Twenty, EspoCRM Community, SuiteCRM, NocoBase) — this is fine for the END USER who self-hosts, but if WE bundle and operate it as part of OUR managed offering, the AGPL "network use is distribution" clause means we'd have to open-source our entire managed-service code. Camp B picked permissive licenses (Atomic CRM = MIT, Krayin = MIT, Vtiger Open Source = MPL-derivative). Camp B is what we ship in the template by default. Camp A goes in the "user can install at their own cluster" pile.

The 2026 landscape has one clear winner on momentum: Twenty CRM. Started in 2023 (YC S23), ~49k GitHub stars, modern React+NestJS+Postgres+GraphQL stack, native MCP server (which matters because our Audience 2 is AI agents). But the dual license (AGPL + "Enterprise" tier with /_ @license Enterprise _/ marker files) means we can recommend it for user self-host, NOT for our managed SaaS.

EspoCRM is the boring, reliable workhorse — PHP, AGPL, 50,000+ companies in production, version 9.3.8 shipped June 1 2026, ~12 years of maintenance. Less sexy, less risk.

SuiteCRM is the "everything bag" fork of SugarCRM — AGPL, the most feature-complete (quotes, territories, reporting), but heavier and aging stylistically. 8.10 shipped April 2026.

Krayin (Laravel, MIT) and Atomic CRM (React+Supabase, MIT) are the two license-safe options. Atomic CRM is the gem — built by Marmelab (the react-admin maintainers), modern stack, MIT, you can literally fork it into the template. The trade-off: smaller community than Twenty, fewer batteries-included integrations.

Mautic is marketing-automation-first with CRM-lite features. GPL-3.0. Useful if the team wants email blasts + lead scoring more than pipeline management. Pair it with a proper CRM rather than replace one.

Vtiger Community (MPL-derivative "Vtiger Public License" — file-level copyleft, similar to MPL-2.0 in spirit, generally commercial-friendly) is mid-tier — still maintained, last open-source release was 8.3.0 in late 2024 which suggests slowing investment in the community edition.

Dolibarr is ERP-with-CRM-attached, GPL-3. Choose only if accounting + invoicing matter as much as pipeline.

**Key findings:**

- Twenty CRM is the momentum leader: ~49k GitHub stars (June 2026), v2.8.0 released May 26 2026, 12k+ commits, 300+ contributors, YC S23 backed. Native MCP server in v2.0 makes it AI-agent-native — exactly fitting Audience 2 (Aegis).
- Twenty uses DUAL licensing: most files AGPL-3.0, but files marked /_ @license Enterprise _/ are under a commercial Twenty.com Enterprise License. This is a load-bearing detail for any commercial bundling decision.
- EspoCRM v9.3.8 shipped June 1 2026; PHP stack, AGPL-3.0, claims 50,000+ companies across 163 countries in production. ~3k GitHub stars but ~22.6k commits since 2014 — boring-but-reliable signal.
- SuiteCRM 8.10 released April 30 2026, with maintenance releases 8.9.2 (Jan 2026) and 8.9.3 (Mar 2026). AGPL-3.0. Angular + Symfony rebuild. Still the most feature-complete OSS CRM (quotes, territories, advanced reporting).
- Atomic CRM (by Marmelab, the react-admin team) is MIT-licensed — the ONLY modern OSS CRM with a fully permissive license. React + shadcn/ui + Supabase stack. Small but high-quality.
- Krayin CRM (Laravel/Vue) is also MIT, ~22-23k GitHub stars in 2026 — surprisingly popular for a Laravel project.
- Vtiger Community Edition stuck at v8.3.0 (released Sep 28 2024 — no 2025/2026 community releases). Vtiger Public License 1.1 is a Mozilla Public License derivative — file-level copyleft, generally commercial-friendly.
- Mautic LTS 5.2 supported through June 2026 security, mainline 7.1 RC active. GPL-3.0. Marketing automation primary, CRM features secondary — pair-with rather than replace.
- NocoBase is AGPL-3.0 (core + open-source plugins) with one-time commercial license tiers ($800 Standard / $8k Professional) — interesting buy-once model but NOT a pure CRM, a low-code platform.
- Dolibarr (GPL-3.0+) is actively maintained 2003-2026; ERP-with-CRM-attached use case.
- erxes uses 'fair-code' (source-available, not OSI-approved) — AVOID for bundling.
- Marquee production users for Twenty are predominantly startups/SMBs (no Fortune 500 anchors yet); EspoCRM lists 50k+ companies but most are SMBs across 163 countries; SuiteCRM is widely used in EU SMB/government segments inherited from SugarCRM community.

**Gotchas:**

- AGPL-3.0 network-use clause: if WE host Twenty/EspoCRM/SuiteCRM as part of our managed SaaS, we trigger the obligation to release the full corresponding source of our stack. Safe if customer self-hosts, dangerous if we operate it for them.
- Twenty's /_ @license Enterprise _/ marker on individual files is easy to miss — a fork that bundles those files would be a commercial license violation. Audit the file headers before vendoring.
- Twenty Cloud's native MCP server is a CLOUD-only feature; self-hosted users get the community-built MCP server (github.com/mhenry3164/twenty-crm-mcp-server) which has narrower CRUD coverage.
- Vtiger Community's last release was Sep 2024 — signal of de-prioritized OSS investment. Don't lead with it for a long-lived template.
- Krayin is Laravel/PHP — adds a runtime our TS-monorepo doesn't otherwise need. Acceptable as an external installable, painful as a vendored subpath.
- Mautic ≠ a pipeline-tracking CRM. Don't position it as Salesforce-replacement; position it as 'marketing automation that talks to your real CRM'.
- erxes 'fair-code' license is NOT OSI-approved — explicit AVOID for the template bundle.
- Atomic CRM ships with Supabase as the backend assumption — works for the Just-Me / Side-Project profiles, but Scaling/Production-at-Scale profiles will want a Postgres + the existing platform OIDC rather than a separate Supabase project.

**Recommendation (this angle):** Two-track strategy, optimized for license safety:

TRACK A — Default in the template (license-safe, we can host it ourselves later):

- Primary: Atomic CRM (MIT) for Just-Me / Side-Project / Early-Startup profiles. Ship as an optional Helm/Crossplane claim. Modern React, react-admin under the hood (Marmelab maintainership = stable), small enough to fork into the marketing-site demo.
- Secondary: Krayin CRM (MIT) as an external installable for Laravel-comfortable users.

TRACK B — User-self-hosts-only (AGPL — safe for user, unsafe for our managed offering):

- Twenty CRM as the marquee "if you want the fancy modern CRM" choice. Ship a Crossplane composition + ArgoCD Application that deploys Twenty to the user's cluster, with the native MCP server wired into Aegis. NEVER bundle Twenty into a SaaS we operate; NEVER vendor /_ @license Enterprise _/ files.
- EspoCRM as the "boring + production-proven" alternative for SMB users who want PHP-stack familiarity.
- SuiteCRM only if the user explicitly needs the feature-complete suite (quotes/territories/etc.).

Decision rules baked into the launcher CLI:

1. If user picks "I'll host this on my own infra AND I never plan to resell it" → offer Twenty/EspoCRM/SuiteCRM.
2. If user picks "I want to resell this as part of my own SaaS" → offer ONLY Atomic CRM or Krayin (MIT-only).
3. Surface Mautic as an ADD-ON for marketing automation, not as a CRM replacement.

Explicitly REJECT: erxes (fair-code, non-OSI), NocoBase as a CRM (it's a low-code platform misclassified), SugarCRM proprietary editions, Vtiger commercial editions.

For the AI-agent (Aegis) Audience 2: Twenty's native MCP is the clear win, but because of AGPL we expose it via the user's own self-hosted instance — the MCP server runs in the user's cluster, Aegis connects to it. This sidesteps the network-use clause entirely (we never operate Twenty for them).

**Citations:**

- [Twenty CRM GitHub repo](https://github.com/twentyhq/twenty)
- [Twenty CRM LICENSE (AGPL-3.0 + Enterprise dual)](https://github.com/twentyhq/twenty/blob/main/LICENSE)
- [Twenty.com official site](https://twenty.com/)
- [Twenty CRM self-host docs](https://docs.twenty.com/developers/self-host/self-host)
- [EspoCRM GitHub repo (AGPL-3.0, v9.3.8 Jun 2026)](https://github.com/espocrm/espocrm)
- [EspoCRM official site](https://www.espocrm.com/)
- [SuiteCRM 8.10 release (Apr 30 2026)](https://suitecrm.com/suitecrm-8-10-release/)
- [SuiteCRM licensing docs (AGPLv3)](https://docs.suitecrm.com/admin/licensing/)
- [Krayin Laravel CRM GitHub (MIT)](https://github.com/krayin/laravel-crm)
- [Atomic CRM by Marmelab (MIT)](https://github.com/marmelab/atomic-crm)
- [Marmelab 2026 OSS CRM benchmark](https://marmelab.com/blog/2026/01/09/open-source-crm-benchmark-2026.html)
- [Vtiger Open Source CRM / Vtiger Public License](https://www.vtiger.com/open-source-crm/vtiger-public-license/)
- [Mautic releases page](https://mautic.org/releases/)
- [NocoBase license + pricing](https://www.nocobase.com/en/commercial)
- [Twenty CRM MCP server (community)](https://github.com/mhenry3164/twenty-crm-mcp-server)

### Angle: Integration mechanics

**License flag:** `CAUTION`

**Top picks:**

- **Twenty** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **EspoCRM** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **SuiteCRM** — `AGPL-3.0` — self-host: yes — maturity: usable

Picture a customer-record desk: contacts, companies, deals, activities, plus a hose for inbound email and a calendar. That is the CRM. For our template, the question isn't "which CRM is prettiest?" — it is "which CRM slots cleanly into the existing Crossplane + Argo CD + Kargo + MCP rails without forcing license obligations on customers who later resell?" Three real contenders survive that filter in 2026: Twenty, EspoCRM, and SuiteCRM. All three are AGPL-3.0. That license is the central trap. AGPL says: if you modify the source AND offer the modified service over a network, you must publish your modifications. For the launcher-CLI path — where the user self-hosts Twenty inside their own cluster, unmodified — AGPL is harmless: they are the operator, not a redistributor of a derivative. If we instead bundled a modified fork into our managed offering, AGPL would bite us. So our integration must keep Twenty/Espo at arm's length: deploy via upstream Helm chart, never fork their image, never embed their code in our Nx workspace. Now the mechanics. Crossplane has no native provider-twenty or provider-espocrm; that would be months of work. We don't need one. We already use provider-helm (release.helm.crossplane.io) and provider-kubernetes (object.kubernetes.crossplane.io). Those are the universal adapters: an XRD called XCrmInstance can wrap a Helm Release plus a Postgres database claim (your existing XPostgresInstance) plus a Keycloak client (your existing provider-keycloak claim for SSO) plus a Secret with the API key. One claim → full CRM stack with OIDC plumbed in. Twenty wins the integration race for three reasons. First, it ships a first-party MCP server concept already in its API surface (per-workspace REST+GraphQL with auto-generated docs at Settings → API & Webhooks), so Phase 12's MCP wrapper is a thin pass-through, not a clean-room implementation. Second, Twenty exposes signed webhooks (HMAC signature header), which means our Aegis agents can subscribe to "opportunity.updated" events through the platform's existing eventing rail. Third, the data model uses object/field names directly in URLs (POST /rest/people) — no opaque IDs — which makes Nx-generated TypeScript clients trivially stable across schema migrations. EspoCRM is the conservative fallback: smaller GitHub footprint (~3k stars vs Twenty's 45k), PHP/MariaDB stack that doesn't share our Postgres rail, but battle-tested since 2014 and webhooks with signature verification. SuiteCRM is mature but the codebase is the old SugarCRM lineage — not what you want as a 2026 default. The launcher CLI verb is one line: task setup:crm — which under the hood applies a CrmInstance claim, waits for healthy, prints the admin URL and API-key bootstrap command. Day-1 wiring is roughly five kubectl/task commands.

**Key findings:**

- Twenty CRM is AGPL-3.0, ~45k GitHub stars, YC-backed, NestJS + React + Postgres — the most modern OSS CRM in 2026 and the only one with a first-party MCP integration story already in its docs.
- EspoCRM is AGPL-3.0, PHP/MariaDB, continuously maintained since 2014; signed webhooks, REST API at /api/v1/, official Docker image, multiple community Helm charts on Artifact Hub.
- Twenty exposes BOTH REST and GraphQL for every object (built-in + custom), with workspace-specific auto-generated API docs and a Playground — so codegen for our Nx TS clients is a build-time step.
- Twenty webhooks ship with HMAC signature verification (Signature header) and event batching — adequate for Aegis-agent subscriptions without building our own event proxy.
- Crossplane has no native provider for either CRM. Integration is via provider-helm (Release) + provider-kubernetes (Object) + existing provider-keycloak claim for OIDC SSO — wrappable into an XRD `XCrmInstance` claim.
- Twenty's official Helm chart is community-maintained (AMecea, twenty-crm on Artifact Hub, TWENTY-20/helm-charts) — no upstream-blessed chart yet; pin chart version + image digest in our values.yaml.
- Twenty CLI (salmonumbrella/twenty-cli) claims 100% API coverage — useful as a reference for `task setup:crm` post-provision seeding (create admin API key, register webhooks).
- Multiple production-quality Twenty MCP servers exist on GitHub (mhenry3164, jezweb, IgorWarzocha) — proves the MCP integration pattern is real; Phase 12 can fork the surface and wire it through our gateway.
- EspoCRM webhooks require API User + Webhooks scope in Roles — slightly more setup friction than Twenty but acceptable for an opinionated default.
- Twenty has no static API reference because each workspace has its own schema — codegen must run AFTER provisioning, not at template-init time. This is a real wrinkle for the launcher CLI.

**Gotchas:**

- AGPL-3.0 network-use clause: SAFE if the customer self-hosts the unmodified upstream image; AVOID forking Twenty/Espo source into our Nx workspace or bundling it in a managed SaaS we operate — that triggers source-disclosure obligations on US.
- Twenty's Helm charts are community-maintained, not upstream-blessed. There is an open GitHub Discussion (#8900) asking for an official chart — pick one community chart, pin the version, and own the values.yaml in our repo.
- Twenty's API schema is workspace-specific (custom objects become first-class endpoints). The launcher CLI cannot pre-generate TypeScript clients; it must run codegen against a live instance after `task setup:crm`.
- EspoCRM's stack is PHP + MariaDB — it does NOT share our Postgres rail. Either accept a second DBMS in the cluster (extra ops surface) or rule it out for that reason alone.
- Premium Twenty features (SSO via OIDC, row-level permissions) require the paid Organization plan — verify Keycloak SSO is in the free self-hosted tier before promising it in `task setup:crm`.
- SuiteCRM legacy SugarCRM codebase — old PHP patterns. Not recommended as a 2026 default; include only as a migration target for shops already running it.
- Twenty MCP server is a community pattern, not an official Twenty release. Phase 12 should wrap Twenty's REST+GraphQL ourselves rather than depending on a third-party MCP that may go stale.
- AGPL applies to MODIFICATIONS — using the upstream image unmodified and configuring it through values.yaml + Helm is not a derivative work. Document this clearly in our customer-facing license-safety guide.

**Recommendation (this angle):** Adopt Twenty as the default `task setup:crm` target; keep EspoCRM as a documented alternative for shops that need PHP/MariaDB familiarity or a more conservative profile. Concretely: (1) Crossplane — author XRD `XCrmInstance` (apiVersion: platform.ts-monorepo.io/v1alpha1) whose Composition fans out into a Helm `Release` (chart: twenty-crm, version pinned), a `XPostgresInstance` claim, a `XKeycloakClient` claim with OIDC redirect URIs, and a `Secret` for the admin API key bootstrapped via a Job. (2) Helm — vendor the AMecea or twenty-crm chart into `charts/vendor/twenty-crm/` with a values overlay that wires Postgres DSN from the XPostgresInstance output, sets OIDC issuer to our Keycloak realm, and enables signed webhooks. (3) Launcher CLI — add `task setup:crm` that runs `kubectl apply -f claims/crm.yaml`, polls until Ready, then runs a one-shot post-provision script that creates the admin API key, registers a default webhook pointing at our event gateway, and prints the URL + API key. (4) MCP (Phase 12) — write our own thin MCP server that wraps Twenty's REST endpoints (`/rest/people`, `/rest/companies`, `/rest/opportunities`, `/rest/activities`) plus a `discover_schema` tool that hits Twenty's Metadata API so Aegis can adapt to custom objects at runtime. Do NOT fork Twenty. Do NOT embed its source in our monorepo. License flag is CAUTION (not AVOID) because the AGPL-3.0 obligation only triggers if WE redistribute a modified version — customers self-hosting upstream are unaffected. Day-1 wiring: `task setup:crm` → `kubectl get crminstance crm -w` → `kubectl get secret crm-admin -o jsonpath` → `curl -H "Authorization: Bearer $KEY" $URL/rest/people` → `task crm:register-webhook -- --url $GATEWAY/crm-events` → done.

**Citations:**

- [Twenty CRM — GitHub repository](https://github.com/twentyhq/twenty)
- [Twenty Documentation — APIs (REST + GraphQL + webhooks + auth)](https://docs.twenty.com/developers/extend/capabilities/apis)
- [Twenty CRM Helm chart (AMecea)](https://github.com/AMecea/helm-twentycrm)
- [twenty-crm Helm chart on Artifact Hub](https://artifacthub.io/packages/helm/twenty-crm/twenty)
- [Twenty Helm chart Discussion #8900 (upstream chart status)](https://github.com/twentyhq/twenty/discussions/8900)
- [Twenty CRM MCP Server (mhenry3164) — reference MCP wrapper](https://github.com/mhenry3164/twenty-crm-mcp-server)
- [Feature: Create MCP Server for Twenty CRM API Integration (issue #12953)](https://github.com/twentyhq/twenty/issues/12953)
- [twenty-cli — 100% API coverage CLI (salmonumbrella)](https://github.com/salmonumbrella/twenty-cli)
- [EspoCRM Webhooks documentation (HMAC signature, batch POST)](https://docs.espocrm.com/administration/webhooks/)
- [EspoCRM API overview (REST /api/v1/)](https://docs.espocrm.com/development/api/)
- [EspoCRM Helm chart on Artifact Hub](https://artifacthub.io/packages/helm/espocrm/espocrm)
- [Best Open Source CRM 2026 — Twenty/Espo/SuiteCRM comparison](https://www.opensourcealternatives.to/blog/best-open-source-crm)
- [Twenty CRM vs EspoCRM — Self-Hosted CRM comparison (2026)](https://use-apify.com/blog/twenty-crm-vs-espocrm-2026)
- [Crossplane provider-helm (Helm Release as managed resource)](https://github.com/crossplane-contrib/provider-helm)
- [Twenty CRM Review 2026 (production-readiness assessment)](https://www.sentisight.ai/twenty-crm-review-is-this-open-source-salesforce-alternative-ready-for-production/)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Twenty (twentyhq/twenty)** — `AGPL-3.0 + proprietary Enterprise files` — self-host: yes — maturity: production-grade
- **EspoCRM** — `AGPL-3.0 (+ optional commercial license, paid extensions)` — self-host: yes — maturity: production-grade
- **SuiteCRM** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Atomic CRM (marmelab)** — `MIT` — self-host: yes — maturity: usable
- **Krayin laravel-crm** — `MIT (per README; verify LICENSE file in tag)` — self-host: yes — maturity: usable
- **Mautic** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Vtiger CRM Open Source** — `Vtiger Public License 1.1 (MPL-1.1 derivative)` — self-host: yes — maturity: usable
- **Frappe CRM** — `AGPL-3.0 (NOT MIT — one secondary source claimed MIT, GitHub metadata + repo LICENSE confirm AGPL-3.0)` — self-host: yes — maturity: production-grade

Think of CRM licensing the way you'd think about food allergies in a restaurant. If our ts-monorepo-template is the restaurant and the CRM is one of the ingredients we serve, we need to know: does this ingredient force everything else on the plate to carry the same warning label?

Here is the short version. There are two completely different questions, and people constantly conflate them.

Question 1: "Am I allowed to use it?" Almost every OSS CRM here says yes, even for commercial use. AGPL, GPL, MPL, MIT — they all let you and your customers run the software for any purpose, free of charge.

Question 2: "Does using it pull obligations onto MY OWN code?" This is where licenses diverge sharply, and this is the question that matters for an open-core template we plan to sell.

Permissive licenses (MIT, Apache-2.0, BSD, ISC) — they say "use it, modify it, ship it, attribute us in the LICENSE notice, and that's it." Atomic CRM is the only major CRM in this category. Krayin's repo claims MIT in the README, but I'd verify before trusting it (the README is not a license file, and a stray LICENSE file can override).

GPL-3.0 (Mautic) — copyleft on distribution. If you fork Mautic, modify it, and DISTRIBUTE the modified binary, you must release source. If you simply run it (even for users over a network), no obligation. So bundling Mautic as a Docker image reference in a Helm chart is fine.

AGPL-3.0 (Twenty, EspoCRM, SuiteCRM, Plane, Frappe CRM) — the dragon. AGPL adds the "network use" clause: if users interact with a MODIFIED version of the AGPL software over a network, you must offer them the modified source. The trap people fear is "if I deploy Twenty alongside my proprietary app, does my app become AGPL too?" Answer per FSF and Google's own AGPL policy: NO, as long as the AGPL software runs as a SEPARATE PROCESS and communicates only via well-defined boundaries (HTTP, gRPC, pipes, sockets) — this is the "mere aggregation" exception. A Helm chart that references the upstream Docker image is the textbook safe pattern.

The actual risk for us, the template authors: zero, IF (a) we ship only the Helm values/manifests pointing at the upstream image, (b) we do not fork or patch the CRM, (c) the CRM runs as its own process behind its own API. The risk for OUR CUSTOMERS: zero, IF they self-host without modifying the CRM. If a customer DOES modify Twenty and runs it as part of their own SaaS, THEY (not us) owe their users the modified source.

The traps to watch for: Twenty has a dual-licensing trap — files marked `/* @license Enterprise */` are NOT AGPL, they are proprietary and require a paid subscription for production. Our template must not vendor those files. EspoCRM bills a "Marketing extension" and "Advanced Pack" as commercial-only — fine if we don't ship them. Vtiger uses VPL 1.1 (MPL-derived); some OSI commentators dispute whether it's truly OSS, but for bundling purposes it behaves like MPL (file-level copyleft, no network clause).

The pattern from MongoDB/Elastic/Redis/HashiCorp: a permissive-licensed darling becomes a market leader, the original company relicenses to SSPL/BUSL, the community forks (OpenSearch, Valkey, OpenTofu). For us the lesson is — pin to a known-good version and prefer projects whose license is already AGPL-3.0 (the floor doesn't drop further) over projects on Apache/MIT that could relicense tomorrow.

**Key findings:**

- Twenty is AGPL-3.0 for the community code, but the repo is a DUAL-LICENSE hybrid: files annotated `/* @license Enterprise */` are governed by a proprietary commercial license that explicitly forbids production use without a paid subscription. Any bundle of Twenty MUST exclude the enterprise tree (or use the community-edition build).
- EspoCRM relicensed from GPL-3.0 to AGPL-3.0 (current). Community Edition is AGPL-3.0; a separate commercial license is offered for organizations that want to avoid AGPL copyleft. The 'Marketing' extension and Advanced Pack are paid extensions under separate commercial terms — DO NOT bundle those.
- SuiteCRM is AGPL-3.0. SalesAgility (the steward) explicitly clarifies that 'customisations and add-ons are not modifications' for AGPL purposes — straight customer-side configuration does NOT trigger the network clause.
- Mautic is GPL-3.0 (not AGPL). The network-use clause does NOT apply. Distributing a modified Mautic binary triggers source-disclosure; running an unmodified upstream Mautic image behind a Helm chart does not. Acquia (corporate backer) cut investment in late 2024 — community-maintained in 2026, slower release cadence but not abandoned.
- Atomic CRM (Marmelab) is MIT — the only fully-permissive, modern, actively-maintained option in this list. Built on React + shadcn-admin-kit + Supabase. Smaller feature surface than Twenty/SuiteCRM but ZERO license obligations for downstream commercial bundling.
- Krayin laravel-crm advertises MIT in the README, but a sibling fork (`luisogandob/krayin-crm`) explicitly carries an MIT LICENSE file — verify the LICENSE file at the pinned tag before shipping, because Webkul (the corporate parent) has historically dual-licensed some Bagisto/Webkul products.
- Vtiger Open Source uses Vtiger Public License 1.1, which is the MPL-1.1 with cosmetic edits. File-level copyleft (modifications to VPL files must be released; new files can be proprietary). No network-use clause. Some OSI commentators question whether VPL is OSI-conformant; for commercial bundling it behaves like MPL.
- Frappe CRM — secondary source ('Marmelab 2026 benchmark') claimed MIT, but GitHub repo metadata returns `spdx_id: AGPL-3.0` and the repo LICENSE file is verbatim AGPL-3.0 v3 (2007). Treat as AGPL.
- FSF's 'mere aggregation' doctrine + Google's published AGPL policy + Grafana's Helm-chart-with-AGPL-image precedent all agree: shipping a Helm chart that REFERENCES an unmodified upstream AGPL Docker image does NOT make the chart (or anything in the customer's cluster) AGPL. The line is crossed only when (a) the AGPL software is modified, OR (b) it's statically linked / share-process with proprietary code.
- Industry license-shift pattern: MongoDB 2018 (AGPL→SSPL), Elastic 2021 (Apache→SSPL/Elastic, +AGPL in 2024), HashiCorp 2023 (MPL→BUSL), Redis 2024 (BSD→SSPL/RSALv2, +AGPL in 2025). Lesson: a permissive-licensed CRM today (Atomic, Krayin) could relicense tomorrow. A project already on AGPL (Twenty, SuiteCRM, Plane) cannot get worse from our perspective; pinning to a known SHA + mirror is cheap insurance for both classes.
- SSPL (Server Side Public License) is the only license in this space that is genuinely toxic for an open-core commercial template. NONE of the CRM candidates currently use SSPL. Watch list: any future MongoDB/Elastic/Redis-style relicense.
- Trademark gotcha: SuiteCRM and Vtiger both have published trademark guidelines that restrict how you may use the project NAME in your commercial offering. Code is AGPL/MPL — name is separately trademarked. Our marketing copy must say 'compatible with' / 'pre-configured chart for' rather than 'SuiteCRM Edition by [us]'.

**Gotchas:**

- DO NOT vendor (copy) AGPL CRM source code into the template repo. Shipping Helm values + an image reference is fine; copying upstream code into our monorepo would pull our repo into AGPL scope.
- DO NOT bundle the `twenty-ee` enterprise tree or any `/* @license Enterprise */` files. They are NOT AGPL — they are proprietary and have a 'no production without subscription' clause.
- DO NOT bundle EspoCRM Advanced Pack, Sales Pack, or Marketing extension as defaults. They are commercially licensed, NOT AGPL.
- If we EVER fork-and-patch any AGPL CRM (Twenty, EspoCRM, SuiteCRM, Plane, Frappe) and ship the patched image, we MUST publish the modified source publicly. Prefer upstream config + sidecar pattern over patches.
- Atomic CRM's MIT license includes Supabase as a dependency — Supabase OSS components are Apache-2.0/PostgreSQL license, but the Supabase managed platform has its own ToS. Self-hosting with `supabase/cli` is the safe path.
- Krayin's README claims MIT but the LICENSE file at HEAD needs verification at each pinned version — Webkul has dual-licensed sibling products (Bagisto, UVDesk) so a future commit could change terms. Lock to a known-good tag.
- Vtiger's commercial cloud product (vtiger.com) is a separate proprietary fork — do not confuse the cloud product license with the VPL-licensed community edition. Bundle only the community edition image.
- Trademark vs copyright: even when AGPL/MIT lets us redistribute the CODE, the NAME and LOGO may be trademarked. Our marketing copy and chart names must avoid implying official endorsement.

**Recommendation (this angle):** Tiered recommendation aligned to the 5 profiles and the open-core commercial concern:

DEFAULT (all profiles): Twenty CRM v0.x community edition, pinned image tag, AGPL-3.0. Reasons: (1) by far the most modern UX/DX in the AGPL set — closest to Notion/Linear feel that startup founders expect; (2) API-first (GraphQL + REST + webhooks) which suits the Aegis/MCP audience; (3) AGPL bundling risk is ZERO for us when we ship only a Helm chart that references the upstream `twentycrm/twenty` Docker image AND we do not vendor enterprise-marked files. Add a one-line `LICENSES.md` row pointing customers at upstream source.

ALTERNATIVE for license-paranoid customers (Just Me, Side Project, Early Startup): Atomic CRM (MIT). Ship as an optional Helm values overlay. Smaller feature set, but the MIT license means a customer can fork, white-label, and resell with zero copyleft worry — exactly the property startup founders sometimes need when they are building a commercial product on top of our template.

DO-NOT-DEFAULT but DOCUMENT: SuiteCRM (AGPL-3.0) for users coming from SugarCRM legacy; EspoCRM (AGPL-3.0) for users who want the most mature feature surface but accept AGPL; Mautic (GPL-3.0, marketing automation, not strict CRM) as a separate marketing-team profile add-on.

EXPLICITLY EXCLUDE: any `@license Enterprise` Twenty files; EspoCRM commercial extensions; Vtiger commercial cloud images.

Operational guardrails for the template repo: (1) `LICENSES/` directory listing every bundled tool, exact license, and SPDX identifier — auto-generated from Helm chart `Chart.yaml` annotations; (2) `task crm:install` defaults to Twenty community image, but accepts `--profile=mit` to swap to Atomic CRM; (3) the launcher CLI must surface a one-screen "license advisor" that tells founder users whether their chosen stack is fully-MIT, contains-AGPL-self-host-only, or contains-paid-extensions; (4) NEVER commit forked/patched CRM source into the monorepo — patches live as sidecar containers or external operators only.

Overall license_flag for the CRM category: MIXED — SAFE if we restrict to upstream-image-reference bundling and exclude enterprise/paid components; CAUTION the moment anyone forks-and-vendors an AGPL CRM. The template must enforce the first pattern by default.

**Citations:**

- [Twenty CRM LICENSE (AGPL-3.0 + Enterprise dual)](https://github.com/twentyhq/twenty/blob/main/LICENSE)
- [EspoCRM Open Source License (AGPL-3.0)](https://www.espocrm.com/espocrm-open-source-license/)
- [A new license for EspoCRM (GPL-3.0 → AGPL-3.0)](https://www.espocrm.com/blog/espocrm-license/)
- [SuiteCRM Licensing Documentation (AGPL-3.0, customisation exception)](https://docs.suitecrm.com/admin/licensing/)
- [Mautic LICENSE.txt (GPL-3.0)](https://github.com/mautic/mautic/blob/5.x/LICENSE.txt)
- [Atomic CRM LICENSE.md (MIT, Marmelab)](https://github.com/marmelab/atomic-crm/blob/main/LICENSE.md)
- [Krayin laravel-crm (MIT per README)](https://github.com/krayin/laravel-crm)
- [Vtiger Public License 1.1 (MPL-1.1 derivative)](https://www.vtiger.com/open-source-crm/vtiger-public-license/)
- [Plane editions and AGPL-3.0 community license](https://developers.plane.so/self-hosting/editions-and-versions)
- [Google Open Source AGPL Policy (mere-aggregation reasoning)](https://opensource.google/documentation/reference/using/agpl-policy)
- [Containers, the GPL, and copyleft — Opensource.com](https://opensource.com/article/18/1/containers-gpl-and-copyleft)
- [AGPL license is a non-starter for most companies — Open Core Ventures](https://www.opencoreventures.com/blog/agpl-license-is-a-non-starter-for-most-companies)
- [The Open Source License Change Pattern (MongoDB → Redis 2018-2026)](https://www.softwareseni.com/the-open-source-license-change-pattern-mongodb-to-redis-timeline-2018-to-2026-and-what-comes-next/)
- [HashiCorp adopts BUSL — official announcement](https://www.hashicorp.com/en/blog/hashicorp-adopts-business-source-license)
- [Best Open Source CRM for 2026 — Marmelab benchmark](https://marmelab.com/blog/2026/01/09/open-source-crm-benchmark-2026.html)

### Angle: Tradeoffs + recommendation

**License flag:** `CAUTION`

**Top picks:**

- **Twenty CRM** — `AGPL-3.0 (OSS) + Twenty Commercial License for files marked /* @license Enterprise */` — self-host: yes — maturity: production-grade
- **EspoCRM** — `AGPL-3.0 (core) + paid extensions for Reports/BPM/Invoicing` — self-host: yes — maturity: production-grade
- **SuiteCRM** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Krayin CRM** — `MIT (core) + paid premium extensions` — self-host: yes — maturity: usable
- **Vtiger Community** — `Vtiger Public License (MPL-2.0 derivative, file-level copyleft)` — self-host: yes — maturity: usable
- **Mautic (adjacent — marketing automation, not pure CRM)** — `GPL-3.0` — self-host: yes — maturity: usable

Imagine you are a founder using ts-monorepo-template to ship a SaaS. You start getting users. You need somewhere to track them — who they are, what company they're at, what stage of the funnel they're in, what emails you sent them, what the next follow-up is. That is what a CRM does. The tricky part for us: we are SELLING the template as a product, so anything we BUNDLE has to not legally infect our customers' or our own code.

The CRM space splits cleanly in 2026. On one end: Twenty CRM (44k stars, YC-backed, Notion-like UX, native MCP server for AI agents, GraphQL + REST API, AGPL-3.0 for OSS + a separate "Enterprise" file-level commercial license for SSO and a few advanced features). On the other end: the older PHP-stack incumbents — SuiteCRM (AGPL, deepest feature set, dated UX), EspoCRM (AGPL, very polished but charges $230-$395 for reports/BPM/invoicing extensions), Vtiger Community (Vtiger Public License = MPL-2.0 file-level copyleft, but the open-source edition is feature-frozen years behind their cloud), Krayin (MIT, Laravel, smaller community), Mautic (GPL — but it's marketing automation, not really a CRM). Plane is project management, not CRM, so it does not belong here.

For us, two facts dominate the decision. First: our Audience 2 is AI agents (Aegis via MCP). Twenty is the only OSS CRM in 2026 that ships first-class MCP support and was explicitly redesigned around AI agent access. Second: license safety. AGPL is fine if WE don't host it — we ship Helm charts and Crossplane XRDs, the CUSTOMER hosts the CRM in their cluster, so AGPL's network clause attaches to THEM, not us. We never embed Twenty code into our proprietary template code; we deploy it as a separate container behind its own API. That is the classic "process boundary" pattern courts and license experts accept as a clean AGPL firewall. The Enterprise-licensed files (SSO etc.) are a gotcha — startups using our template who turn on SSO in production technically need a paid Twenty seat — so we document this rather than bundle SSO-on by default.

The right shape for the template: include Twenty as an OPTIONAL Helm chart wired through Crossplane and ArgoCD, default-off for Just Me / Side Project (overkill — a Notion DB or HubSpot Free covers them), default-on for Early Startup (when they hit 100+ leads and need pipeline + email-sync), and absolutely default-on for Scaling Startup / Production at Scale (where Aegis the AI agent needs structured CRM data). The commercial alternative is HubSpot Free (genuinely good up to 1k contacts cap, 2 users, branded emails) then the brutal jump to $20/seat Starter then $1,300/mo Professional — that cliff is exactly when self-hosting Twenty pays for itself.

**Key findings:**

- Twenty CRM is the only modern OSS CRM in 2026 with native MCP server support (Twenty 2.0 ships it built-in), making it uniquely suited to Audience 2 (Aegis AI agent) of ts-monorepo-template.
- Twenty uses a DUAL license: AGPL-3.0 for the bulk of the codebase + a separate commercial 'Enterprise Edition' license for files marked /_ @license Enterprise _/ (SSO, some advanced features). Production use of those specific files requires a paid Twenty subscription.
- Funding/momentum: Twenty raised $5M seed Nov 2024 (Runa Capital, ex-HubSpot/Front/Pipedrive execs), 44k+ GitHub stars, 300+ contributors, ~11.5k commits, 34 employees as of Apr 2026 — production-grade and accelerating.
- AGPL is safe for us to BUNDLE because the customer self-hosts it in their cluster as a separate containerized service (Helm chart + Crossplane claim), not linked into our proprietary template code. Process boundary + API integration is the recognized AGPL firewall pattern.
- EspoCRM is more feature-complete out-of-the-box (mass email, IMAP/SMTP sync, VoIP call log, mature report builder) but key features (Reports $230-395+, BPM, Invoicing) are paid extensions even on self-hosted — true cost is not zero.
- SuiteCRM is the most feature-mature (full quotes/cases/invoices/territory management with nothing behind paywall) but has dated PHP/UI and is heavier to operate than Twenty.
- Vtiger Community Edition is years behind their cloud product (no AI sales coaching, no deal intelligence, no modern mobile) — using it means shipping a 2019-era CRM in 2026.
- Krayin is MIT-licensed (cleanest license fit), Laravel-based, but has a much smaller community, fewer integrations, and premium extensions cost $1,499-4,500 one-time per feature — adoption risk for the template's wider audience.
- Mautic is marketing automation (drip campaigns, lead scoring, landing pages) not CRM — wrong category for this slot; consider for the marketing team's research instead.
- Plane is project-management (Jira alternative), miscategorized as a CRM candidate. Should not be in this comparison.
- HubSpot Free (the obvious commercial alternative for founders) caps at 1,000 contacts and 2 users for new accounts post-Sep-2024; jump to Starter is $20/seat/mo, then a steep cliff to Professional at $1,300+/mo — the self-host break-even comes fast.
- All AGPL CRM candidates allow self-hosting without us being a 'distributor' of modifications, but the moment WE host Twenty as part of OUR managed offering (a future SaaS layer on ts-monorepo-template), the network-use clause triggers and our additions to Twenty must be AGPL too.

**Gotchas:**

- AGPL network-use clause: if WE later operate Twenty as part of OUR hosted SaaS, any modifications we make to Twenty itself must be released under AGPL. Mitigation: keep Twenty unmodified and configure via env/values; isolate any extensions into separate sidecars or external services.
- Twenty's Enterprise-licensed files include SSO. If a customer using our template enables SSO via Twenty in production, they technically need a Twenty paid subscription. Document this — default the Helm chart to OSS-only features and route auth through Keycloak (already in our stack) instead of Twenty SSO.
- EspoCRM's 'free self-hosted' is misleading — Reports ($230+), Advanced Pack, BPM, Invoicing, Sales Pack are paid extensions even when self-hosted. Real cost for a usable instance is $500-1500 one-time.
- Vtiger Community is feature-frozen relative to their cloud product. Don't market it as equivalent to 2026 Vtiger Cloud — it isn't.
- Twenty's Enterprise license production-use enforcement was 'lenient as of July 2025' per third-party reports — that is NOT a stable basis for our customers to rely on. Treat the license terms as written.
- Email/calendar sync is weaker on Twenty than EspoCRM out-of-the-box. If a founder's #1 need is IMAP/SMTP and Google/Outlook calendar sync at install-time, EspoCRM is the better technical fit despite the worse DX.
- Krayin's MIT license is the cleanest legally but the smaller ecosystem means more bespoke integration work — higher TCO for our customers even though license cost is $0.
- AGPL software still requires offering source to network users — our template docs must include the standard '/source' route guidance and a SOURCE.md so customers know what to expose.

**Recommendation (this angle):** PICK: Twenty CRM. BUNDLE STATUS: include-on-demand-only (opt-in Helm chart + Crossplane claim) with default-on at Early Startup tier and above. \n\n3 reasons FOR Twenty: (1) Only OSS CRM with first-class MCP server in 2026 — directly aligned with Aegis/AI-agent audience; (2) Modern Notion-like UX + GraphQL/REST API matches ts-monorepo-template's TS/Node-native stack and developer DX values; (3) Strong momentum: $5M seed from credible CRM-veteran investors, 44k stars, 34-person team, daily commits — not abandonment-risk. \n\n3 reasons AGAINST: (1) Dual license — Enterprise-marked files (SSO etc.) require paid subscription in production, which is a footgun we must document and configure around (route SSO through Keycloak instead); (2) Email/calendar sync is less mature than EspoCRM and requires more wiring; (3) Younger codebase (2023+) means fewer battle-tested edge cases versus SuiteCRM's decade-plus production hardening. \n\nPROFILE MAPPING: Just Me — exclude (use a Notion DB or HubSpot Free); Side Project — exclude (HubSpot Free still covers it); Early Startup — include-day-2 default-on (this is where pipeline pain begins and HubSpot's $20/seat starts to bite); Scaling Startup — include-day-1 default-on (Aegis needs structured CRM data here); Production at Scale — include-day-1 default-on with HA Postgres + Loki/Tempo wiring via existing Crossplane XRDs. \n\nCOMMERCIAL UPGRADE PATH TO COMMUNICATE: HubSpot Free (1k contacts / 2 users) → HubSpot Starter $20/seat/mo → HubSpot Professional $1,300+/mo (5 seats) → Salesforce $25-300+/seat/mo. Twenty self-hosted breaks even vs HubSpot Starter around 4-5 users or when the 1k contact cap bites; it crushes HubSpot Professional economically.\n\nFALLBACK: If a customer needs deep mass-email + report-builder + calendar sync DAY ONE and is non-technical, swap in EspoCRM via the same Crossplane XRD pattern — keep both behind a 'crm' alias so values.yaml flips the implementation.

**Citations:**

- [Twenty GitHub LICENSE file](https://github.com/twentyhq/twenty/blob/main/LICENSE)
- [Twenty CRM official site](https://twenty.com/)
- [Twenty CRM: 44k Stars (Pasquale Pillitteri)](https://pasqualepillitteri.it/en/news/954/twenty-crm-open-source-salesforce-hubspot-alternative)
- [Twenty CRM MCP server (jezweb/twenty-mcp)](https://github.com/jezweb/twenty-mcp)
- [Twenty CRM MCP server issue tracker](https://github.com/twentyhq/twenty/issues/12953)
- [Best Open Source CRM 2026 (opensourcealternatives.to)](https://www.opensourcealternatives.to/blog/best-open-source-crm)
- [Best Open Source CRM 2026 (Marmelab benchmark)](https://marmelab.com/blog/2026/01/09/open-source-crm-benchmark-2026.html)
- [EspoCRM Open Source License](https://www.espocrm.com/espocrm-open-source-license/)
- [Twenty vs EspoCRM 2026 (Use Apify)](https://use-apify.com/blog/twenty-crm-vs-espocrm-2026)
- [Vtiger Public License](https://www.vtiger.com/open-source-crm/vtiger-public-license/)
- [Krayin Laravel CRM GitHub](https://github.com/krayin/laravel-crm)
- [Mautic GitHub](https://github.com/mautic/mautic)
- [HubSpot Pricing 2026 (Resonate)](https://www.resonatehq.com/hubspot-pricing)
- [AGPL Compliance Guide (Vaultinum)](https://vaultinum.com/blog/essential-guide-to-agpl-compliance-for-tech-companies)
- [Twenty CRM funding (Tracxn)](https://tracxn.com/d/companies/twenty/__oyf_sCMiigApXb-QCd9gzMXlCdKb6Za7OSNrSEGQJ7E)

---

## Team 8 — Billing + subscription + usage metering

### Synthesized verdict

- **Verdict:** `include-day-2`
- **Fit score:** 78 / 100
- **Top pick:** **OpenMeter**
- **License:** `Apache-2.0`
- **Default profile bundles:** `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

Billing has four jobs (metering, rating, invoicing, collection) and no single OSS tool does all four well without license friction for a commercial open-core template we plan to SELL. All four angle reports converge on the same architectural truth: ship a thin billing-adapter abstraction in the template and let the profile pick the backend. The decisive criterion is license safety — we are an open-core seller, so any AGPL component we OPERATE on behalf of customers triggers §13 network copyleft. That immediately disqualifies Lago as the bundled default even though Lago has the best DX and feature-set in the OSS pack (9.8k stars, PayPal/Mistral/Groq/Synthesia/Laravel in production, SOC 2 Type II, v1.47.0 May 2026). Lago is still SAFE when the END customer self-hosts an unmodified upstream image in their own cluster — they become the network operator and own the AGPL obligation, not us. So Lago is the right Tier-3+ opt-in, never the default. KillBill (Apache-2.0, killbill-0.24.18 May 2026, 5.6k stars, 10k+ commits since 2010) has perfect license posture but a 2010-era Java/Tomcat/MariaDB/Kaui stack with NO first-party Helm chart, which is hostile to our vibe-coder and AI-agent audiences — appropriate as include-only-on-demand for enterprise users with plugin-grade pricing complexity. Polar.sh is a SaaS MoR masquerading as OSS (5% + 50c, self-host kills the MoR value). BillaBear's FCL-1.0 "Competing Uses" clause directly targets our bundling case — AVOID. Stripe Billing is the proprietary paved-road default for Just-Me/Side-Project but is not OSS we can claim as part of our open-core story. That leaves OpenMeter (Apache-2.0, Go, CloudEvents ingest, Kafka+ClickHouse backend, official OCI Helm chart at ghcr.io/openmeterio/helm-charts/openmeter, TypeSpec-generated OpenAPI SDK, v1.0.0-beta.228 May 2026) as the cleanest single pick: (1) Apache-2.0 zero-friction bundle, (2) CloudEvents matches our existing app event envelope (go-hello/py-hello/rs-hello), (3) Kafka+ClickHouse already in the platform stack, (4) deliberately defers tax + collection to Stripe Sync so we never ship VAT tables, (5) typed SDK auto-generates MCP tool descriptors for the Phase 12 Aegis MCP server. Caveats noted by all four angles: OpenMeter is metering-only (you still need Stripe Billing on top for invoices/dunning/tax), the billing module is beta, and the Kong acquisition (Sept 2025) introduces roadmap risk as features may diverge between OSS and Konnect-managed tiers. Score 78 reflects strong license + architectural fit but acknowledges it is a HALF solution that requires Stripe Billing pairing and is not appropriate below the Early-Startup profile. Verdict include-day-2 (not day-1) because Just-Me/Side-Project profiles should not deploy Kafka+ClickHouse just to count events — a Stripe Checkout link stub is the day-1 default for those tiers.

**Integration outline:**

Ship a TIERED billing strategy via a TS billing-adapter package, not a single bundled engine:

1. packages/billing-adapter (MIT, in our repo) — TypeScript interface with four reference adapters: stripe-billing, lemonsqueezy (MoR), openmeter+stripe (recommended), lago (opt-in with AGPL ack). All app code calls the adapter; the engine is a Helm values + Crossplane composition choice.

2. Tier 0/1 (Just-Me $0, Side-Project $5-20) — launcher CLI verb `setup:billing-stripe-link` writes a Stripe Checkout link stub + Zod-validated webhook receiver in apps/billing-webhook (Fastify). No self-hosted infra. Alternative: `setup:billing-lemonsqueezy` for MoR/global-tax-offload at 5%+50c.

3. Tier 2 (Early-Startup $30-150) DEFAULT — launcher verb `setup:billing-openmeter`:
   - Crossplane XRD `XBillingMeter` wrapping provider-http calls to OpenMeter REST API
   - ApplicationSet deploys oci://ghcr.io/openmeterio/helm-charts/openmeter into customer cluster
   - Reuses existing Kafka + ClickHouse from platform stack (no new infra)
   - App code emits CloudEvents (already our envelope) — zero adapter layer
   - Stripe Sync handles invoices, tax (Stripe Tax), dunning, card-on-file
   - Day-1 wiring: task setup:billing-openmeter → kubectl apply XRD + Composition → claim → argocd sync → task billing:seed-plans (push catalog via OpenMeter SDK) → pnpm --filter @app/billing-webhook dev → task billing:smoke (emit CloudEvent → assert Stripe draft invoice)

4. Tier 3 (Scaling-Startup $300-1500) OPT-IN — launcher verb `setup:billing-lago` gated behind an AGPL-3.0 acknowledgment dialog:
   - Template ships Helm values + Crossplane Composition `XBillingPlatform` referencing upstream getlago/lago image (NEVER vendored, NEVER patched in our repo)
   - Customer applies the claim into THEIR cluster — they are the AGPL operator
   - Our integration code lives in a separate MIT package communicating only via Lago's public REST/webhook API (preserves AGPL §5 aggregate boundary; avoids derivative-work claim)
   - LICENSING.md in template explicitly states customer owns AGPL obligation; if they ever resell their template-derived product as managed SaaS including Lago, they evaluate Lago's commercial dual-license

5. Tier 4 (Production-at-Scale $2k+) INCLUDE-ON-DEMAND — `setup:billing-killbill` recipe documented but not auto-installed; for teams with plugin-grade pricing complexity (committed-spend, multi-entity, ERP integration). We author/maintain the missing Helm chart only when a customer requests it.

6. Phase 12 MCP server (packages/mcp-billing) — wraps OpenMeter's TypeSpec-generated SDK (and lago-javascript-client for the opt-in path) using @modelcontextprotocol/typescript-sdk. OpenAPI spec drives tool descriptors so Aegis gets typed billing tools (createMeter, ingestEvent, getEntitlement, createSubscription, listInvoices) for free.

7. Tax (all tiers) — NEVER bundled. Template requires customer to wire Stripe Tax / Anrok / Avalara per environment. Document in /docs/billing/tax.md and surface as a line item in the launcher's profile cost estimate.

8. Entitlements/feature-flags overlap — coordinate with feature-flags team: entitlements live in OpenMeter (boolean + quota); OpenFeature/Unleash reads them via a provider adapter. Single source of truth = billing engine.

**Risks:**

- AGPL-3.0 contamination if a future managed tier of ts-monorepo-template ever hosts Lago on behalf of customers — §13 network-use clause forces source disclosure of our wrapper code; mitigation: keep Lago strictly customer-self-hosted, never vendor or patch in our repo, communicate only via public REST/webhook API to preserve §5 aggregate boundary
- OpenMeter roadmap risk post-Kong acquisition (Sept 2025) — OSS feature parity may diverge from managed Kong Konnect tier landing early 2026; license stays Apache-2.0 but advanced features may become Konnect-only. Mitigation: pin to a stable release, track commit cadence quarterly, keep adapter layer ready to swap to Lago or KillBill
- OpenMeter is metering-only — the billing/invoice module is still beta (v1.0.0-beta.228). Saying 'we use OpenMeter for billing' is wrong; must pair with Stripe Billing for invoices/dunning/tax until the billing module GAs. Document the split clearly in /docs/billing/openmeter-stripe-split.md
- Operational footprint — OpenMeter requires Kafka + ClickHouse + Postgres + Redis; Lago additionally needs Sidekiq + Gotenberg PDF + frontend (7-8 pods); KillBill needs JVM + MariaDB + Kaui. None are realistic for Just-Me/Side-Project profiles — billing infra must be tier-gated or customers will hate us
- Tax compliance NEVER bundled — no production-grade OSS multi-jurisdiction VAT/GST exists in 2026; all paths require Stripe Tax (+0.4-0.5%), Anrok, or Avalara. Bundling tax tables = legal liability. Must be a hard rule in adapter design and surfaced in launcher cost estimates
- Lago license dual-licensing pricing is opaque ('contact sales') — if customers later pivot to managed-SaaS resale, they face unknown spend or rip-and-replace risk. Architectural rule: billing-adapter must keep engines swappable behind a single TS interface
- Merchant-of-Record dead-end — LemonSqueezy/Polar work for $0-20 profiles but cannot do B2B POs, net-30/60 terms, or multi-entity contracts. Once a customer hits ~20% enterprise revenue, MoR fails and forces migration. Document the migration path from MoR → Stripe Billing → OpenMeter+Stripe in the template README
- BillaBear FCL-1.0-ALv2 'Competing Uses' clause directly targets our bundling case — even as an optional component, shipping it exposes us to a colorable claim. Hard exclusion from all tiers until 2-year Apache-2.0 conversion lands on a usable release (and by then it will be obsolete)

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Lago** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Kill Bill** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **OpenMeter (Kong)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Flexprice** — `AGPL-3.0` — self-host: yes — maturity: usable
- **BillaBear** — `FCL-1.0-ALv2` — self-host: yes — maturity: usable
- **Polar.sh** — `Apache-2.0` — self-host: partial — maturity: production-grade
- **Crater** — `AGPL-3.0` — self-host: yes — maturity: usable
- **Stripe Billing (reference SaaS)** — `proprietary` — self-host: no — maturity: production-grade

Think of billing as four jobs stitched together: (1) metering — counting what each customer used (API calls, GB ingested, tokens); (2) rating — turning those counts into money using a price book; (3) invoicing — producing legal documents with tax; (4) collection — actually getting paid via Stripe/Adyen/etc and handling failures (dunning). Stripe Billing does all four but locks you in and takes a cut. The OSS world splits the job up.

The 2026 OSS landscape has stratified into three layers. Layer 1 is pure metering — OpenMeter (now owned by Kong since Sept 2025) — Apache-2.0, Go, ingests CloudEvents, aggregates with SUM/COUNT/AVG/MIN/MAX. It's a Lego brick; you bolt it onto whatever rating engine you want. Layer 2 is full-stack billing engines — Lago (AGPLv3) and Flexprice (AGPLv3 + commercial EE) are the two leaders. They do metering AND rating AND invoicing AND Stripe orchestration. Lago is the leader by mindshare — 9.8k stars, used by PayPal, Mistral AI, Groq, Synthesia, Laravel, GitHub references, SOC 2 Type II. Flexprice is newer (3.6k stars, 1 yr old) but AI-native — built around credit wallets and feature entitlements. Layer 3 is the enterprise veteran — Kill Bill (Apache-2.0, 5.6k stars, Java 11/17, since 2010) — battle-tested in telecom/fintech but with a 2010-era dev experience.

Then there is the merchant-of-record (MoR) sidetrack — Polar.sh (Apache-2.0, 9.9k stars, Python/FastAPI). MoR means _they_ are the legal seller and handle global tax/VAT/compliance. You pay 5% + 50c (matching Paddle/Lemon Squeezy in 2026). Polar is technically self-hostable but the MoR value disappears when self-hosted — you become the merchant. So Polar is really a SaaS option masquerading as OSS.

For our open-core monorepo template, the critical question is license safety. AGPL is the elephant: it triggers the network-use clause if WE deploy AGPL software as part of OUR managed offering. If our customers self-host Lago in their own clusters as one of the 5 profiles, they accept AGPL terms themselves — that is fine. But if we ship Lago bundled into a "scaling-startup" managed tier we operate, the AGPL would arguably reach into our orchestration code. Same problem with Flexprice. OpenMeter and Kill Bill are Apache-2.0 — zero friction.

For the Just-Me / Side-Project profiles ($0-$20), no real billing needed (Stripe Checkout link is enough). For Early-Startup ($30-150), OpenMeter + Stripe Billing is the sweet spot — metering OSS, billing SaaS. For Scaling-Startup ($300-1500) and Production-at-Scale ($2k+) profiles, Lago (self-hosted by customer) is the default if usage-based; Kill Bill if subscription-only enterprise. BillaBear is FCL-1.0 (Fair Source — converts to Apache after 2 years) which works under our "CAUTION" bucket but is fine for self-host.

**Key findings:**

- Lago hit v1.47.0 on May 27 2026, 9.8k stars, 615 forks, 186 releases, 45 contributors, AGPLv3 self-host edition is fully free with no usage cap or revenue cap — production users include PayPal, Mistral AI, Groq, Synthesia, Laravel, GitHub; SOC 2 Type II certified
- Kill Bill released killbill-0.24.18 on May 14 2026, 5.6k stars, 929 forks, 10,261 commits since 2010, Apache-2.0, Java 11 (best-effort 17), positioned as enterprise-grade for telecom/fintech with heavy plugin ecosystem
- OpenMeter v1.0.0-beta.228 (May 19 2026), 2k stars, 181 forks, Apache-2.0, Go/TypeScript, was acquired by Kong in September 2025 — integration into Kong Konnect completes early 2026, customer migration mid-2026; remains pure metering (CloudEvents in, aggregated meters out)
- Flexprice 2.1.17 released June 3 2026, 3.6k stars, AGPL-3.0 with Open Core commercial EE — built around credit wallets + feature entitlements + hybrid pricing for AI-native products; Go stack with PostgreSQL + Kafka + ClickHouse + Temporal
- Polar.sh has 9.9k stars, Apache-2.0, Python/FastAPI/Next.js — 15,501 commits — but MoR economics changed in 2026: Starter tier is now 5% + 50c (matches Paddle/Lemon Squeezy), making it a tier-1 MoR SaaS; self-host loses the MoR value prop
- BillaBear (747 stars, PHP/Symfony) shifted license to FCL-1.0-ALv2 (Fair Core License with Apache-2.0 future) — code becomes Apache-2.0 two years after each release; targets self-hosted Stripe Billing replacement
- AGPL-3.0 network-use clause only activates when modified code is exposed over a network — for customers self-hosting Lago/Flexprice unmodified in their own cluster, there is no source-disclosure trigger; the risk is only if WE host it as part of our managed offering
- Stripe Billing, Chargebee, Paddle, Lemon Squeezy remain the dominant proprietary players; the OSS gap is closing but tax compliance + global card routing is still SaaS-only in practice

**Gotchas:**

- AGPL-3.0 license (Lago, Flexprice, Crater) does NOT create obligations for end-customers self-hosting unmodified releases — but if WE ship a managed billing tier built on Lago, the network-use clause likely forces us to publish our modifications. Safe path: customers self-host themselves; we do not operate Lago for them.
- OpenMeter is metering-only — no rating, no invoicing, no Stripe sync, no subscription lifecycle. You still need Stripe Billing or Lago/KillBill on top. After Kong acquisition, roadmap is being absorbed into Konnect; long-term standalone OSS direction is uncertain.
- Kill Bill is Java 11/17 — operationally heavy (JVM tuning, Tomcat, MariaDB), XML/Groovy plug-in config, 2010-era admin UI. Most teams under 10 engineers will find it disproportionate.
- Polar.sh self-host kills the Merchant-of-Record value — when you self-host, YOU become the merchant and inherit global VAT/sales-tax compliance. Use Polar SaaS for MoR, or pick Lago for self-host billing.
- BillaBear FCL-1.0 license is NOT OSI-approved open source today; it bans competing commercial offerings until conversion. Safe to bundle in a template that customers self-host for themselves; risky to use as backing for a competing managed billing service.
- Lago self-host requires Postgres + Redis + Rails API + Sidekiq worker + scheduler + frontend + Gotenberg PDF service + object storage — easily 7-8 pods. Not realistic at Just-Me/Side-Project profile.
- Tax calculation (Stripe Tax / Avalara / TaxJar / Anrok) is universally SaaS — no production-grade OSS exists for multi-jurisdiction VAT/GST/sales tax in 2026. Plan to consume a SaaS tax API regardless of which billing engine.
- Flexprice is 1 year old — production track record is shorter than Lago/Kill Bill. Wallet/credits primitives are strong but invoicing + tax + dunning are less battle-tested.

**Recommendation (this angle):** Three-tier plan keyed to the 5 profiles. (1) Just-Me + Side-Project: NO billing engine; ship a Stripe Checkout link template + webhook handler — Stripe handles everything. (2) Early-Startup ($30-150): default to Stripe Billing SaaS with an optional OpenMeter (Apache-2.0) sidecar for usage metering — cleanest license story, lowest ops burden, no AGPL exposure. (3) Scaling-Startup + Production-at-Scale: ship a Crossplane composition + Helm chart that lets the CUSTOMER self-host Lago (AGPL-3.0) as their billing core, with OpenMeter feeding events in. We never operate Lago for them — the customer is the licensee, so AGPL obligations rest with them. Kill Bill is offered as an alternative composition for customers that need legacy enterprise patterns (subscription-heavy, plugin-driven, Java shop). DO NOT bundle BillaBear or Crater in marketing material until FCL-1.0 / AGPL implications are reviewed by counsel. DO NOT pre-integrate Polar.sh as a billing engine — it is a SaaS MoR, not infrastructure we should adopt as a self-host default. For tax, document that all profiles consume Stripe Tax / Avalara via API; no OSS equivalent in 2026.

**Citations:**

- [Lago GitHub repository — v1.47.0 release, AGPL-3.0, 9.8k stars](https://github.com/getlago/lago)
- [Lago — Why we chose AGPLv3](https://getlago.com/blog/open-source-licensing-and-why-lago-chose-agplv3)
- [Lago — Why Mistral chose Lago to bill for its frontier AI models](https://getlago.com/blog/mistral-billing)
- [Kill Bill GitHub repository — Apache-2.0, 5.6k stars, latest 0.24.18](https://github.com/killbill/killbill)
- [Kill Bill Release 0.24 — Java 11 support](https://blog.killbill.io/blog/kill-bill-release-0-24-includes-support-for-java-11/)
- [OpenMeter GitHub — Apache-2.0, v1.0.0-beta.228](https://github.com/openmeterio/openmeter)
- [Kong Acquires OpenMeter (Sept 2025 press release)](https://konghq.com/blog/news/kong-acquires-openmeter)
- [Flexprice GitHub — AGPL-3.0 + commercial EE, 3.6k stars](https://github.com/flexprice/flexprice)
- [Polar.sh GitHub — Apache-2.0, 9.9k stars](https://github.com/polarsource/polar)
- [Polar.sh 2026 pricing review (5% + 50c MoR)](https://dodopayments.com/blogs/polar-sh-review)
- [BillaBear GitHub repository (PHP/Symfony, FCL-1.0)](https://github.com/billabear/billabear)
- [BillaBear LICENSE.md — FCL-1.0-ALv2 (Apache-2.0 future)](https://github.com/billabear/billabear/blob/main/LICENSE.md)
- [Flexprice — Best Open-Source Alternatives to Stripe Billing 2026](https://flexprice.io/blog/open-source-stripe-billing-alternatives)
- [Flexprice — Best Open Source Alternatives to Traditional Billing Platforms 2026](https://flexprice.io/blog/best-open-source-alternatives-to-traditional-billing-platforms)
- [FOSSA — AGPL License explainer (network-use clause)](https://fossa.com/blog/open-source-software-licenses-101-agpl-license/)

### Angle: Integration mechanics

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Kill Bill** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **OpenMeter** — `Apache-2.0` — self-host: yes — maturity: usable
- **Lago** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **BillaBear** — `FCL-1.0-ALv2 (Fair Core, converts to Apache-2.0 after 2y)` — self-host: yes — maturity: usable
- **Stripe Billing** — `Proprietary (commercial EULA)` — self-host: no — maturity: production-grade
- **Chargebee** — `Proprietary (commercial EULA)` — self-host: no — maturity: production-grade
- **Paddle (Merchant of Record)** — `Proprietary (commercial EULA)` — self-host: no — maturity: production-grade
- **LemonSqueezy (Merchant of Record)** — `Proprietary (commercial EULA, Stripe-owned 2024)` — self-host: no — maturity: production-grade

Imagine you are running a coffee shop, and you want a cash register. You can buy a closed-box one (Stripe, Chargebee, Paddle, LemonSqueezy) — it works, but the vendor keeps the keys and charges you per cup. Or you can pick up a kit you assemble yourself (Kill Bill, OpenMeter, Lago, BillaBear) and run it on your own counter. The question is not just "does the register work?" — it is "what does the kit's instruction manual say about reselling kits that include this register?" That is the license.

There are three "shapes" of open-source licenses that matter for our template, which we plan to SELL. (1) Permissive (MIT, Apache-2.0): take it, ship it, charge for it, no obligation back. Kill Bill and OpenMeter are here. Apache-2.0 even hands you a patent grant — the original author promises not to sue you over patents covering the code. (2) Network copyleft (AGPL-3.0): if YOU run the software as a service that users talk to over a network and you modified it, you must share your modifications. Lago is here. Critical nuance — if our template only references Lago as a separate Docker image that the END USER installs into THEIR cluster, we are not "running it" — they are. The AGPL "aggregate" clause says bundling separate independent works does not infect the rest. But if WE later run "ts-monorepo-template Cloud" and we modify Lago, AGPL bites. (3) Fair Source / Functional Source / BUSL: a brand-new family ("source-available") that explicitly forbids you from offering the software as a competing product for 2-4 years. BillaBear is FCL-1.0-ALv2. The license itself says "no Competing Uses." A commercial billing template that bundles BillaBear is exactly the use case it prohibits.

Why does this matter so much for ts-monorepo-template? Because our template is the product we sell. If a customer downloads our template and the install instructions say "deploy this Helm chart pointing at the Lago image," nothing forces our customer to publish source. They are self-hosting open source. Fine. But if we add a "managed cloud" tier where WE host the customer's Lago instance, we are now an AGPL operator. We must either (a) publish all our wrapper code, (b) buy Lago's commercial license, or (c) keep our modifications strictly to configuration files (which AGPL does not consider a modification).

The historical lesson is that "source-available" labels (BUSL, SSPL, FCL) were created precisely to stop someone like us. MongoDB went SSPL in 2018, Elastic in 2021, Redis in 2024, HashiCorp Terraform went BUSL in 2023 — each because AWS or another cloud was reselling their software. The community responded with forks (Valkey, OpenSearch, OpenTofu). The forks now have CNCF or Linux Foundation governance precisely so the rug cannot be pulled again. For us, the takeaway is: lean on permissively licensed billing software (Apache/MIT) so we never have to repaper the deal, and treat any "Fair Source" / BUSL component as if it were proprietary — because legally it is, for our use case.

So the punchline for the template: ship Kill Bill as the recommended backbone for traditional subscription billing, ship OpenMeter for usage metering (watching the Kong roadmap), and only point at Lago as an optional self-host that the end customer chooses themselves. Never bundle BillaBear.

**Key findings:**

- Kill Bill is Apache-2.0 with a full patent grant (Apache 2.0 §3) — permissive, no copyleft, no network clause, no attribution beyond keeping LICENSE/NOTICE files. Safe to bundle, recommend, and ship Docker images in our Helm values without legal exposure. 15+ years of production use, Fortune 500 deployments.
- OpenMeter is Apache-2.0 and remains so after the Sep 2025 Kong acquisition — Kong publicly committed to keeping the project Apache-2.0 (Kong's own gateway is Apache-2.0). License: SAFE. Roadmap: CAUTION — integration into Kong Konnect lands early 2026 with managed-cloud migration mid-2026; pin to last pre-integration release if we want stability.
- Lago is pure AGPL-3.0 (no exceptions, no Contributor License Agreement carve-outs in the LICENSE file itself). The network-use clause (AGPL §13) only triggers if WE modify Lago AND let users interact with our modified instance over a network. Pure self-host by the END customer is unaffected. Lago sells a separate commercial license that removes copyleft if we ever want to embed Lago into a managed offering.
- AGPL 'aggregate' provision (§5, last paragraph) explicitly says that combining the AGPL work with other independent works in storage or distribution media does NOT extend AGPL to the other works. A Helm chart that pulls a Lago image alongside our own apps is an aggregate, not a derivative — so our template does not become AGPL just by referencing Lago.
- BillaBear is Fair Core License 1.0 with Apache-2.0 Future License (FCL-1.0-ALv2). The license text bans 'Competing Uses' — specifically making the software available 'in a commercial product or service that substitutes for the Software.' Our template arguably IS such a product. Auto-converts to Apache-2.0 only on the 2nd anniversary of each release. AVOID for bundling.
- Stripe acquired Metronome in January 2026 and LemonSqueezy in 2024 — the proprietary usage-billing landscape is consolidating around Stripe. For a self-host-first template this consolidation reinforces the case for permissively licensed self-hostable alternatives.
- Lago's customer list (Mistral AI, Algolia, GitHub, PayPal, Groq, Synthesia, Laravel) demonstrates that real production users are comfortable with AGPL-3.0 self-host — meaning end-customers of our template will not balk at the license either, as long as we set the expectation that they (not us) operate the Lago instance.
- Kill Bill includes a built-in plugin model (Java + Kotlin + Ruby plugins) — extending its functionality does not require modifying its core, which keeps any plugins we ship under our own chosen license. Apache-2.0 §4(b) only requires us to mark modified files; unmodified Kill Bill jars carry no obligation.
- OpenMeter only solves the metering half (event ingestion, aggregation, entitlements). It does NOT do subscription lifecycle, dunning, multi-currency tax. Pairing OpenMeter (meter) + Kill Bill (subscriptions/invoicing/tax via plugin) is the cleanest permissive-only stack for the template.
- The 'Hashicorp Terraform → BUSL → OpenTofu fork' precedent (Aug 2023 → CNCF April 2025) is the single strongest argument for choosing Apache/MIT over BUSL/FCL/SSPL: rugs CAN be pulled, foundation-governed forks are the safety net, and any tool we bundle should ideally already live under foundation governance or under a permissive license.
- No billing candidate examined is licensed under SSPL — the AVOID-tier license used by MongoDB/Elastic/Redis. The risk surface for billing is BUSL/FCL/FSL-style 'Fair Source' rather than SSPL.
- For Merchant-of-Record products (Paddle, LemonSqueezy), 'license' is largely irrelevant — they are SaaS-only and there is no self-host option. They are recommended only for the 'Just Me' / 'Side Project' profiles where the customer wants Stripe-free indie-hacker UX and is okay with MoR fees (~5% + 50¢).

**Gotchas:**

- AGPL §13 triggers on ANY modification we ship — even a one-line config patch baked into a custom Docker image of Lago can count. If our template ships pre-built Lago images, build them from upstream sources with zero patches OR purchase the commercial license.
- AGPL 'aggregate' protection is fragile if the boundary is too thin. If our wrapper code calls Lago's INTERNAL libraries (not just its REST API), a court could view it as derivative work. Always communicate with Lago over its public HTTP/Webhook API only.
- BillaBear's FCL 'Competing Uses' clause is broad and ambiguous. Even shipping it as an OPTIONAL component of our template — where customers choose to enable it — exposes us to a colorable claim. Treat FCL as proprietary for bundling decisions.
- OpenMeter's Kong acquisition (Sep 2025) introduces roadmap risk: features may be folded into proprietary Kong Konnect tiers. License stays Apache-2.0, but feature parity between OSS and Konnect-managed may diverge. Track the GitHub commit cadence quarterly.
- Kill Bill requires Java 17+, MySQL or PostgreSQL, and a non-trivial operational footprint. Apache-2.0 freedom comes with operational complexity — for the 'Just Me' tier, Kill Bill is overkill; recommend Stripe (proprietary SaaS) for that profile despite the license.
- Apache-2.0 §4(a) requires that you include a copy of the LICENSE in any redistribution. If our template's docker-build pipeline produces images that embed Kill Bill, the resulting image manifest MUST include the Apache-2.0 LICENSE and NOTICE files. Easy to miss in multi-stage Dockerfiles.
- Lago's commercial license pricing is opaque ('contact sales'). If we ever pivot to bundling Lago in a managed offering, budget unknown spend OR rip-and-replace risk. Plan the architectural boundary so Lago is swappable for Kill Bill.
- Merchant of Record (Paddle, LemonSqueezy) is NOT a license question but a regulatory/tax one — MoRs become the seller of record and handle global tax, BUT they take 5-8% gross. For SaaS at $300+ MRR, the math flips to wanting our own merchant account + Stripe Billing or Kill Bill.

**Recommendation (this angle):** Default recommendation for the ts-monorepo-template billing layer: ship Kill Bill (Apache-2.0) as the canonical self-host subscription/invoicing backbone, and OpenMeter (Apache-2.0) as the canonical self-host usage-metering backbone. Both are SAFE to bundle, recommend, and reference by Docker image in our Helm library chart with zero copyleft obligation on us or our customers.

Profile mapping:

- Just Me ($0) and Side Project ($5-20): default to Stripe Billing (proprietary SaaS) or LemonSqueezy MoR. No self-host overhead; license is irrelevant because there is no code to bundle, only an API key in secretspec. Document this clearly so vibe-coders ship in a day.
- Early Startup ($30-150): default to Kill Bill + Stripe payment plugin (Kill Bill ships the Stripe plugin under Apache-2.0). Self-host on a small VM/cluster. SAFE.
- Scaling Startup ($300-1500) and Production at Scale ($2k+): Kill Bill (subscriptions/invoicing/dunning/tax via plugins) + OpenMeter (real-time usage metering, especially for AI/API products). Both Apache-2.0, both production-grade, both swappable.

List Lago as a documented OPTIONAL alternative for teams that explicitly choose AGPL — make it clear in our /docs/billing/options.md that (a) the END customer is the AGPL operator, not us, (b) we recommend they treat Lago as a network service consumed only via its public API to preserve the AGPL aggregate boundary, (c) if they ever resell their template-derived product as a managed service that includes Lago, they should evaluate Lago's commercial license. Flag this prominently — vibe-coders will not read the AGPL.

Do NOT bundle BillaBear. FCL-1.0-ALv2's "Competing Uses" clause directly targets the use case where our template enables customers to operate a competing billing product. The 2-year Apache-2.0 future grant does not help us because by then we have either shipped infringing copies or the version we shipped is obsolete. AVOID.

Architectural rule for the template: every billing integration must go through a thin internal SDK in packages/billing-sdk so customers can swap providers (Stripe / Kill Bill / Lago / Chargebee) without modifying app code. This isolates the license decision to a single Helm values block and a single Crossplane composition.

**Citations:**

- [Lago — LICENSE (AGPL-3.0)](https://github.com/getlago/lago/blob/main/LICENSE)
- [Lago Blog — Open-source licensing and why Lago chose AGPLv3](https://getlago.com/blog/open-source-licensing-and-why-lago-chose-agplv3)
- [Lago — Self-hosted overview (commercial license alternative)](https://getlago.com/solutions/use-cases/self-hosted)
- [Kill Bill — Why Open-Source (Apache-2.0)](https://killbill.io/about-open-source-software)
- [Kill Bill — GitHub repository (LICENSE)](https://github.com/killbill/killbill/blob/master/LICENSE)
- [OpenMeter — LICENSE (Apache-2.0)](https://github.com/openmeterio/openmeter/blob/main/LICENSE)
- [OpenMeter — Joining Kong (Apache-2.0 commitment, integration timeline)](https://openmeter.io/blog/openmeter-is-joining-kong)
- [BillaBear — LICENSE.md (FCL-1.0-ALv2)](https://github.com/billabear/billabear/blob/main/LICENSE.md)
- [Fair Core License — official site (fcl.dev)](https://fcl.dev/)
- [GNU AGPL-3.0 — full text](https://www.gnu.org/licenses/agpl-3.0.en.html)
- [Apache License 2.0 — full text](https://www.apache.org/licenses/LICENSE-2.0)
- [FOSSA Blog — AGPL License 101 (SaaS implications)](https://fossa.com/blog/open-source-software-licenses-101-agpl-license/)
- [Opensource.com — Containers, the GPL, and copyleft (aggregate boundary)](https://opensource.com/article/18/1/containers-gpl-and-copyleft)
- [OpenTofu — fork announcement and CNCF acceptance (BUSL precedent)](https://opentofu.org/blog/opentofu-announces-fork-of-terraform/)
- [Flexprice — Best Open-Source Alternatives to Stripe Billing (2026 landscape)](https://flexprice.io/blog/open-source-stripe-billing-alternatives)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **OpenMeter** — `Apache-2.0` — self-host: yes — maturity: usable
- **Lago** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **KillBill** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Polar.sh** — `Apache-2.0` — self-host: partial — maturity: usable
- **Stripe Billing** — `Proprietary (SaaS, SDK MIT)` — self-host: no — maturity: production-grade
- **LemonSqueezy** — `Proprietary (SaaS)` — self-host: no — maturity: production-grade
- **Paddle** — `Proprietary (SaaS)` — self-host: no — maturity: production-grade

Billing has four jobs: tell people what they owe (rating), take their money (payments), prove they paid (invoices+tax), and keep the lifecycle moving (trial → active → past_due → churned). For a junior founder it feels like one problem; it is four, and tools usually do one well and the others poorly.

The 2026 OSS landscape gives you three real shapes:

1. Lago (AGPL-3.0) — "Stripe Billing, but in your VPC." Postgres + Redis + ClickHouse. You define billable metrics, push events, it produces invoices and hands the charge to Stripe/Adyen/whatever for actual money movement. Devex is the best of the OSS pack: modern API, SDKs, dashboard. The catch is the license (network copyleft) and that _we_ must not redistribute a modified Lago bundled inside our template product — we reference its upstream Helm chart and image instead.

2. KillBill (Apache-2.0) — the veteran. Java + MariaDB + plugin architecture. Battle-tested at telcos and fintechs since ~2010. The license is fully safe to bundle. The pain is real: heavy JVM tuning, Kaui admin UI feels like 2014, plugins written in Java/Ruby, the data model assumes you know subscription billing already. Right answer for a B2B startup that _needs_ arbitrarily complex pricing + payment-gateway abstraction; wrong answer for a vibe-coder.

3. OpenMeter (Apache-2.0) — does _only_ metering+entitlements+catalog, deliberately. Go + Kafka + ClickHouse. It does not do MoR, dunning, or PDF invoices well; it pairs with Stripe Billing or Lago for those. For an AI startup whose pricing is "$0.002 per 1k tokens with a quota and overage," OpenMeter is the cleanest core; you let Stripe Billing handle invoices and tax.

The commercial side: Stripe Billing is now 0.7% of subscription revenue stacked on 2.9%+30c payment fees. Paddle/LemonSqueezy/Polar are Merchants-of-Record at ~5% + 50c — they own the tax problem in 100+ jurisdictions, you own nothing. For a one-person side project that ships to global users, MoR is mathematically cheap; below ~$20k MRR, _not_ dealing with VAT is worth 5%.

Decision for ts-monorepo-template: we are not a billing company. We must _not_ bundle billing by default — billing chosen wrongly poisons the product and the license posture. Instead: ship billing as an _opt-in_ Crossplane composition + per-tool integration package. For Just Me / Side Project (USD 0-20), default-recommend LemonSqueezy/Polar via a thin TS adapter — no infra. For Early Startup (USD 30-150), default-recommend Stripe Billing + OpenMeter (if usage-based) self-hosted in the cluster. For Scaling Startup (USD 300-1500), the launcher offers Lago (with an AGPL acknowledgment dialog) as the in-cluster alternative. Production-at-Scale ($2k+) gets KillBill as an opt-in composition for teams that already know they need plugin-level extensibility.

Crucially: our template's integration code stays MIT/Apache; AGPL software runs in the _customer's_ cluster, so the AGPL obligation (if they modify Lago) is theirs, not ours. We never patch Lago's source in our repo.

**Key findings:**

- Lago is AGPL-3.0, not MIT (some 2026 blog posts repeat a stale claim of MIT — verified against the getlago/lago GitHub LICENSE; Lago's own blog explains the AGPLv3 choice). The Self-Hosted Premium SKU is a separate commercial license with internal-use-only terms.
- KillBill is Apache-2.0 end-to-end (core + Kaui + Stripe plugin) — the only veteran billing platform with no copyleft exposure for a commercial bundler. Actively maintained: killbill-0.24.18 shipped May 2026 with ~10k commits on master.
- OpenMeter is Apache-2.0, Go + Kafka + ClickHouse, scope is deliberately metering + entitlements + product catalog + invoicing — NOT a Merchant of Record. v1.0.0-beta.228 May 2026; active development.
- Stripe Billing in 2026 is 0.7% of subscription volume layered on 2.9% + $0.30 card fees (unified from the old 0.5/0.8% split in July 2024). The 0.7% covers metering up to 100M events/month, smart retries, dunning, quotes.
- Merchant-of-Record platforms (Paddle, LemonSqueezy, Polar) all converged on ~5% + 50c in 2026 — Polar restructured to match. MoR economically wins below ~$20k MRR because you offload VAT registration in 40+ US states and EU jurisdictions.
- Lago Cloud is $0/mo up to $250k cumulative invoiced revenue, then 0.75% of revenue processed — a credible managed-tier upgrade path if customers don't want to operate the Lago stack themselves.
- Flexprice is a newer AGPL-3.0 entrant (open-core, ~1% enterprise features under commercial license) — interesting but less production-proven than Lago/KillBill; not a default recommendation for our template.
- AGPL's network-copyleft trigger fires on the _operator_ of the network service, not the _distributor_ of an unmodified image. If our template ships Helm values pointing at the upstream getlago/lago image and our customer self-hosts, the AGPL obligation lives with the customer's cluster, not the template's authors.
- Bundling AGPL software into our template product as redistributed source (vendored / modified) WOULD expose us — must reference Lago via its upstream Helm chart + container image only, with our integration code in a separate MIT/Apache package.
- KillBill's plugin architecture (Java/Ruby) and Kaui Rails UI are the real cost — DX is 2014-grade compared to Lago/OpenMeter. Worth it only when pricing complexity (committed-spend contracts, multi-currency consolidated invoices, ERP integration) justifies it.
- OpenMeter pairs naturally with Stripe Billing: OpenMeter owns the high-cardinality usage event pipeline (Kafka/CH), Stripe owns money + tax + dunning. This split is the lowest-risk pattern for usage-based pricing under $1M ARR.

**Gotchas:**

- Don't repeat the 'Lago is MIT' claim from openalternative-style blog spam — Lago's LICENSE file is AGPL-3.0 since the project began; the misclaim is from auto-generated comparison sites.
- Stripe Billing's 0.7% only covers subscription volume; one-off invoices add 0.4%, and per-transaction card fees (2.9% + 30c US, higher international + currency conversion) still apply on top. Founders consistently underestimate the all-in cost.
- Bundling AGPL Lago as a default in our paid commercial template — even pointing at upstream images — creates a perception/legal-review burden. Some enterprise buyers (financial-services, defense) reject AGPL in their software bill of materials regardless of compliance posture. Keep Lago opt-in, not default.
- KillBill's tax handling is intentionally pluggable, not built-in. If you choose KillBill you still need an Avalara/TaxJar plugin or you build VAT/sales-tax computation yourself — KillBill is billing, not tax.
- OpenMeter is not a billing system on its own — saying 'we use OpenMeter for billing' is wrong. It is the metering+entitlements layer. The actual invoice/PDF/dunning path is either Stripe Billing or its own beta billing module (still beta as of 1.0.0-beta.228).
- Merchant-of-Record platforms (Paddle/LemonSqueezy/Polar) cannot do B2B purchase orders, net-30/60 terms, or multi-entity contracts — once you have an enterprise sales motion (>20% of revenue), MoR fails and you have to migrate. Plan the migration before locking in.
- Customer-deployed Lago: if the _customer_ modifies Lago and exposes it to their end-users over a network, THEY must publish their modifications. We need an LICENSING.md in the template that flags this — otherwise we're shipping a footgun.
- Don't promise tax calculation by default — Stripe Tax is +0.5% (US) / +0.4% (intl), Avalara is per-call. Tax is a separate budget line; surface it in the launcher's profile estimate.

**Recommendation (this angle):** EXCLUDE billing from the default day-1 bundle for any profile — billing is never a one-size-fits-all decision and a wrong default is destructive. Instead ship a Billing Adapter layer in the template (TS interface in `packages/billing-adapter`) with four reference adapters: (a) `stripe-billing` for Early Startup default, (b) `lemonsqueezy` for Just Me / Side Project (MoR, zero infra), (c) `openmeter+stripe` Crossplane composition for usage-based Early/Scaling startups, (d) `lago` Crossplane composition (opt-in, gated behind an AGPL acknowledgment in the launcher) for Scaling startups who want full self-host. KillBill is documented as an `include-on-demand-only` recipe for enterprise-grade extensibility (Production-at-Scale profile). Hard rule: our template repo never vendors Lago source — only references upstream Helm chart + image — so the AGPL obligation cleanly lives with the customer's deployment, not with us as the template seller. Top pick if forced to name one: **OpenMeter + Stripe Billing** — Apache-2.0 + 0.7% Stripe — best license posture, cleanest split of concerns, broadest profile fit. Pros: (1) Apache-2.0 zero-restriction bundle, (2) split lets Stripe own tax/dunning/PDF complexity you don't want to solve, (3) ClickHouse-backed usage pipeline scales to AI-token workloads without rewrite. Cons: (1) still requires a Stripe account so it's not 'pure self-host', (2) OpenMeter billing module is beta (use Stripe for invoices for now), (3) two systems to operate instead of one. Upgrade path: when complexity outgrows it, move to KillBill (still Apache, more powerful, more painful) or to fully-managed Stripe Billing+Tax if ops budget is tight.

**Citations:**

- [Lago GitHub repository (LICENSE: AGPL-3.0)](https://github.com/getlago/lago)
- [Lago blog — Why we chose AGPLv3](https://getlago.com/blog/open-source-licensing-and-why-lago-chose-agplv3)
- [Lago Self-Hosted FOSS license terms](https://getlago.com/legal/lago-self-hosted-terms)
- [KillBill GitHub repository (Apache-2.0, latest 0.24.18 May 2026)](https://github.com/killbill/killbill)
- [KillBill overview + Kaui admin UI](https://killbill.io/overview)
- [KillBill Stripe plugin docs](https://docs.killbill.io/0.24/stripe_plugin)
- [OpenMeter GitHub (Apache-2.0, Go + Kafka + ClickHouse)](https://github.com/openmeterio/openmeter)
- [OpenMeter billing overview](https://openmeter.io/docs/billing/overview)
- [Stripe Billing pricing (0.7% of subscription volume, 2026)](https://stripe.com/billing/pricing)
- [Polar.sh — open-source Merchant of Record (Apache-2.0, 5% + 50c)](https://github.com/polarsource/polar)
- [Comparison: open-source billing alternatives 2026 (Flexprice blog)](https://flexprice.io/blog/best-open-source-alternatives-to-traditional-billing-platforms)
- [MoR comparison: Paddle vs LemonSqueezy vs Polar 2026](https://www.buildmvpfast.com/blog/lemon-squeezy-vs-polar-paddle-merchant-of-record-2026)
- [AGPL SaaS network copyleft analysis](https://www.mend.io/blog/the-saas-loophole-in-gpl-open-source-licenses/)
- [AGPL compliance guide for tech companies](https://vaultinum.com/blog/essential-guide-to-agpl-compliance-for-tech-companies)
- [Open Core Ventures — AGPL as commercial non-starter](https://www.opencoreventures.com/blog/agpl-license-is-a-non-starter-for-most-companies)

---

## Team 9 — SEO + GTM + landing + lead capture

### Synthesized verdict

- **Verdict:** `include-day-1`
- **Fit score:** 92 / 100
- **Top pick:** **Astro 5 + @astrojs/sitemap + astro-seo + schema-dts + Satori/sharp + Umami (MIT-only landing/SEO/analytics chassis)**
- **License:** `MIT (Astro, @astrojs/sitemap, astro-seo, Umami) + Apache-2.0 (schema-dts, sharp) + MPL-2.0 (Satori)`
- **Default profile bundles:** `p-solo`, `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angles converge on the same architectural answer: a permissively licensed Astro-based chassis (Astro + @astrojs/sitemap + astro-seo + schema-dts + Satori OG + Umami) is the only stack that can be bundled inside both the sellable template AND our future managed offering without triggering AGPL §13 network-use obligations. Astro is already in the monorepo (Starlight for docs), MIT, Cloudflare-backed since Jan 2026, with Lighthouse 95-100 baseline. Umami beats Plausible CE on the single criterion that matters for commercial bundling: MIT vs AGPL-3.0. schema-dts (Apache-2.0, by Google) gives type-safe JSON-LD for AI-search visibility (Perplexity, ChatGPT, Google AI Overviews). Satori+sharp produces dynamic OG images at build/edge time with no proprietary dependency. The AGPL-licensed lead-capture/scheduling/e-sign/newsletter tools (Formbricks, Cal.diy or Cal.com, Documenso, Listmonk) belong in a separate tier as opt-in Crossplane claims the customer self-hosts in their own cluster — never inside our managed control plane. CRITICAL 2026 UPDATE flagged by the license deep-dive: Cal.com went closed-source on Apr 15 2026; the MIT fork is Cal.diy (reduced feature set, ex-intern maintained). Any existing template reference to calcom must migrate to cal.diy or be removed. PostHog dropped official K8s/Helm support in May 2023 — strike from any K8s-first bundle. The top pick is the MIT chassis itself because that is the only piece every profile gets and the only piece we can safely run inside our own SaaS.

**Integration outline:**

Layered delivery driven by the existing Nx + Crossplane + ArgoCD + Kargo pipeline.

TIER 0 (Day-1, every profile, baked into template — all MIT/Apache/MPL): (1) Create apps/marketing as a vanilla Astro 5 app sibling to the existing Starlight docs app, sharing the monorepo build. (2) Add @astrojs/sitemap (sitemap-index + chunked sitemaps + hreflang), astro-seo (meta + OG tags), schema-dts + react-schemaorg for compile-time type-safe JSON-LD (Article, Product, FAQ, SoftwareSourceCode, Organization). (3) Implement src/pages/og/[slug].png.ts as a Satori + sharp route — design templates inside Satori's CSS subset (flexbox yes, grid no, no JS), prerender=true so OG images bake at build time. (4) Add @unlighthouse/cli in CI as a quality gate that fails the build on SEO/perf/a11y regression. (5) Deploy Umami via Crossplane provider-helm Release CR — expose XRD XUmami in platform/xrds/marketing/, compose into provider-helm Release + provider-kubernetes Ingress + ESO ExternalSecret (Postgres creds) + Keycloak Client (SSO via existing provider-keycloak). Single-line tracker snippet injected via astro-seo. (6) Phase 12 MCP server wraps Umami's REST API as read-only resources (get_pageviews, get_funnel) so Aegis can read funnel state without humans.

TIER 1 (Day-2, opt-in Crossplane claims, customer self-hosts — AGPL acceptable): XRDs XFormbricks, XCalDiy, XListmonk, XDocumenso in platform/xrds/marketing/. Each composition fans out: provider-helm Release (chart version pinned in XRD) + provider-kubernetes Ingress + ESO ExternalSecret (DB creds + webhook signing key from AKV/Vault) + Keycloak Client. Launcher CLI verbs: task setup:formbricks, task setup:cal, task setup:listmonk, task setup:documenso — each applies the claim with profile-selected values, polls ArgoCD app health, seeds default config via official SDK, registers webhook URL into MCP receiver, rotates signing secret. Cal.diy MIT fork only (NOT cal.com — closed source since Apr 15 2026); Cal.com v1 API EOL Feb 28 2026 — target v2 with X-Cal-Signature-256 HMAC if customers integrate cloud. Documenso uses official Helm chart + official TS SDK (re-exported via MCP); webhook verification via crypto.timingSafeEqual on X-Documenso-Secret. Plausible/Cal.com have NO official Helm chart — ship minimal first-party charts in platform-helm-library/charts/ if needed, OR skip in favor of Umami + Cal.diy.

GOVERNANCE: (a) Single ADR docs/adr/NNNN-mit-vs-agpl-gtm-split.md explaining the bundled-MIT-core vs opt-in-AGPL-self-host boundary. (b) CI job license-check runs FOSSA/licensecheck against all Docker images in templates/\*/values.yaml; hard-blocks SSPL-1.0, BUSL-1.1, Commons-Clause, proprietary EULA; requires ADR for AGPL/GPL; passes MIT/Apache/BSD/MPL-2.0/ISC. (c) THIRD_PARTY_LICENSES.md generated per profile tier with upstream source pointers for any AGPL claims. (d) Never fork upstream charts — configure via values.yaml + Crossplane composition patches only, so AGPL §13 source-disclosure stays scoped to upstream. (e) Document the Formbricks /apps/web/modules/ee directory (separate proprietary license bundled in default Docker image) — pin to community-only build or surface boundary to customers.

**Risks:**

- AGPL §13 network-use trap: if we ever bundle Formbricks/Listmonk/Cal.diy-as-AGPL/Documenso/Plausible inside our OWN managed SaaS (not customer self-host), we owe source disclosure of any modifications. Mitigation: deploy upstream charts UNMODIFIED, values + composition patches only, never fork, never run inside our control plane.
- Cal.com went CLOSED SOURCE on April 15 2026 — any existing template reference to calcom/cal.com images is now pointing at private code. Must migrate to Cal.diy MIT fork (reduced feature set, ex-intern maintained, not enterprise-grade) or remove scheduling from defaults entirely.
- Cal.com v1 API EOL Feb 28 2026 — if customers integrate the hosted SaaS via our MCP wrapper, we MUST target v2 (api.cal.com/v2 with X-Cal-Signature-256) from day one or ship a broken integration in <60 days.
- Formbricks default Docker image silently bundles the /apps/web/modules/ee directory under a separate proprietary license. Customer modification of EE code violates the EE license. Pin to verified community-only build or document the boundary explicitly.
- PostHog dropped official Kubernetes/Helm support in May 2023 — do NOT propose it as a K8s bundle option. Direct users to PostHog Cloud or stay with Umami. Affects any 'product analytics' upgrade path narrative.
- Plausible CE and Cal.com (legacy) have NO official Helm charts — only community charts of varying quality. Either ship a first-party minimal chart in platform-helm-library or skip these tools. Don't pretend an official chart exists.
- Satori CSS subset constraint (flexbox yes, grid no, no JS) — designers unaware of this will produce OG templates that silently fail to render. Document the constraint and add a CI snapshot test of every OG route.
- Containers-as-separate-programs is the prevailing AGPL interpretation but NOT court-tested. SBOM must explicitly list AGPL bundles as a license-management surface so a future lawyer audit doesn't surface surprises.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Astro + @astrojs/sitemap + astro-seo (landing/docs)** — `MIT` — self-host: yes — maturity: production-grade
- **vercel/satori (OG image generation)** — `MIT` — self-host: yes — maturity: production-grade
- **google/schema-dts (JSON-LD structured data types)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **umami-software/umami (web analytics)** — `MIT` — self-host: yes — maturity: production-grade
- **growthbook/growthbook (A/B + feature flags)** — `MIT` — self-host: yes — maturity: production-grade
- **formbricks/formbricks (forms + surveys)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **knadh/listmonk (newsletter + lead nurture)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **harlan-zw/unlighthouse (site-wide SEO/perf audit)** — `MIT` — self-host: yes — maturity: production-grade

Picture the GTM motion for a commercial open-core monorepo template as four layered jobs, each best filled by a different OSS piece.

1. The marketing surface — landing page, docs, blog. You already have Astro Starlight in the stack, but Starlight is a docs theme. For a true landing site you want vanilla Astro plus @astrojs/sitemap 3.7.3 (MIT) for the XML sitemap and an SEO component like astro-seo for meta + Open Graph tags. That's the bedrock. Then Satori (MIT, from Vercel) generates OG images at build or edge time by turning JSX/Tailwind into PNG — no headless Chrome, no proprietary service. JSON-LD structured data (Article, Product, FAQ, SoftwareSourceCode) is bolted on with google/schema-dts (Apache-2.0): TypeScript types for every Schema.org class so AI search (Perplexity, Google AI Overviews, ChatGPT browse) can parse you cleanly. Add @unlighthouse/cli (MIT) in CI to crawl every page and fail the build on regressed SEO/perf/a11y scores.

2. Conversion experiments — headlines, CTA copy. The 2026 winner is GrowthBook (MIT core, MIT SDKs, 24 SDKs incl. edge). It's warehouse-native (BigQuery, Snowflake) and ships A/B + feature flags in one binary. PostHog (MIT core, EE features under ELv2) is the alternative when you also want session replay and product analytics under one roof.

3. Lead capture — newsletter signups, surveys, contact, scheduling. This is the tricky license layer. Formbricks (AGPL-3.0) is the Typeform-killer; Listmonk (AGPL-3.0, v6.1.0 March 2026) is the newsletter sender; Cal.com (AGPL-3.0 + Enterprise license on /ee) is the scheduler; Documenso (AGPL-3.0) is the eSign. AGPL is FINE for the buyer of our template who runs it themselves — they self-host, no obligation triggers. But if WE host these for customers as part of a managed offering, AGPL's network-use clause forces source disclosure of any modifications. Solution: ship these as opt-in self-host modules in our launcher CLI, don't bundle them inside our managed service. Tally is fully proprietary, no self-host — recommend against. Mautic (GPL-3.0) is bloated PHP/Symfony and overlaps with Listmonk; not worth the operational burden for vibe-coders.

4. Analytics — pageviews + conversion funnels. Umami (MIT, 23k stars) is the clean default: ~2 KB script, GDPR-friendly, MIT means we can bundle freely. Plausible (AGPL-3.0 since 2024) is more polished but the same license-friction story as Cal.com.

The licensing punchline: MIT/Apache pieces (Astro, Satori, schema-dts, Umami, GrowthBook, PostHog core, Unlighthouse) go INSIDE our shipped template and our managed service. AGPL pieces (Formbricks, Listmonk, Cal.com community, Documenso, Plausible CE) go in the "Side Project / Early Startup" profile as opt-in Crossplane claims the customer deploys into their own cluster. We document the AGPL implication once, in a single ADR.

**Key findings:**

- Astro Starlight 0.39 (May 7 2026) is docs-focused; for the actual marketing landing we use plain Astro + @astrojs/sitemap 3.7.3 (MIT, supports chunked sitemaps, hreflang, sitemap-index) + astro-seo. All MIT-safe to bundle.
- vercel/satori (MIT) is the canonical OSS OG-image generator in 2026 — JSX/Tailwind to SVG to PNG, runs at the edge or build-time. Used inside Vercel's own @vercel/og. Safe for our managed offering.
- google/schema-dts (Apache-2.0) provides typed JSON-LD for every Schema.org class. Critical for AI-search visibility (Perplexity, ChatGPT, Google AI Overviews) in 2026.
- Umami (MIT, ~23k stars) is the only top-tier web-analytics OSS with a permissive license — Plausible CE flipped to AGPL-3.0. For commercial bundling in our managed offering, Umami wins on license alone.
- GrowthBook (MIT core, ~3000 customers including Dropbox/Khan Academy/Mistral, 100B+ flag evals/day) beats every other OSS A/B + feature-flag combo on license safety. Enterprise dir is separately licensed; we stay in the MIT tier.
- PostHog core (analytics + replay + flags + A/B) is MIT; ee/ dir is ELv2 (cannot offer as competing managed service). Safe inside customer's own infra, requires care if we resell as SaaS.
- Formbricks v3.x is AGPL-3.0, Typeform-tier UX, unlimited responses self-hosted. Cloud free tier 250 resp/mo. AGPL = fine for customer self-host, friction for us-as-host.
- Listmonk v6.1.0 (Mar 29 2026, AGPL-3.0) is a single Go binary + Postgres — operationally trivial. Listmonk + Formbricks + Umami covers the entire 'Side Project' GTM stack at ~$5-20/mo infra.
- Cal.com is AGPL-3.0 for the community edition BUT the /ee directory is under a commercial license and self-hosting the enterprise tier requires a paid key (min 30 users). For our template: ship the community half only, document the EE boundary.
- Documenso (AGPL-3.0) is the OSS DocuSign — useful for the 'order form' / MSA flow at the Early Startup profile. Enterprise self-host license is $30k/yr (only matters if scaling).
- Mautic 7.0 (Jan 20 2026, GPL-3.0) overlaps heavily with Listmonk + Formbricks + GrowthBook but adds PHP/Symfony operational weight. 200k+ orgs use it but it's wrong for vibe-coders. Recommend OUT.
- Tally is fully proprietary — no self-host, no source. Forbidden as a bundled dependency. Use only as a manual external link if the customer chooses it.

**Gotchas:**

- AGPL-3.0 network-use clause: if WE host Formbricks/Listmonk/Cal.com/Documenso/Plausible as part of our managed offering AND we modify their source, we must publish those modifications. Mitigation: ship them as customer-deployed Crossplane claims, never inside our control plane.
- Cal.com's /ee directory is NOT AGPL — it's a separate commercial license requiring a paid key. Bundling /ee in our template would be a license violation. Strip /ee or document the boundary in our launcher.
- PostHog ee/ folder is ELv2 (Elastic License v2) — explicitly prohibits offering it as a competing managed service. Safe for customer self-host, not for our SaaS resale.
- Astro Starlight is a documentation theme, not a marketing-page builder. Don't try to force the landing page into Starlight — use Astro's main project structure with Starlight as a /docs sub-route.
- Satori has CSS gotchas — only a subset of CSS is supported (flexbox yes, grid no, no JS). Design OG templates with that constraint or you'll get silent rendering failures.
- schema-dts produces enormous TS unions; tree-shaking matters. Use schema-dts (runtime types) NOT schema-dts-gen unless you're regenerating the schema itself.
- Umami requires Postgres 12+ or MySQL 8+ and Node 18+; the Docker Compose default uses Postgres. Make sure the launcher CLI provisions the right Crossplane DB claim.
- Listmonk's AGPL means any commercial UI customizations made by our customer must be published if they offer Listmonk-as-a-service externally. For internal newsletter dispatch this is a non-issue. Document it once.

**Recommendation (this angle):** Ship a two-tier GTM stack in the template. CORE (bundled, all permissive licenses, runs inside our managed SaaS): Astro + @astrojs/sitemap + astro-seo + Satori for the marketing/docs surface; google/schema-dts for JSON-LD; Umami (MIT) for web analytics; GrowthBook (MIT core) for A/B + feature flags; PostHog (MIT core only, no ee/) for product analytics + session replay. Wire Unlighthouse into CI as a quality gate. OPT-IN MODULES (Crossplane claims the customer deploys into their own cluster, AGPL is fine because they self-host): Formbricks for lead-capture forms; Listmonk for newsletter/lifecycle email; Cal.com community edition for scheduling (strip /ee or document the EE boundary in the launcher); Documenso for eSign at the Early Startup tier. Exclude Mautic (PHP/Symfony weight, wrong audience) and Tally (proprietary, no self-host). Write ONE ADR explaining the MIT/Apache vs AGPL split so future contributors understand why we never bundle an AGPL tool inside our hosted plane. For the AI-agent (Aegis MCP) audience, expose the GrowthBook + PostHog + Umami APIs as MCP resources so agents can read funnel state and toggle flags without humans in the loop.

**Citations:**

- [Starlight 0.39 release (May 2026)](https://astro.build/blog/starlight-039/)
- [@astrojs/sitemap on npm (v3.7.3)](https://www.npmjs.com/package/@astrojs/sitemap)
- [vercel/satori GitHub](https://github.com/vercel/satori)
- [google/schema-dts GitHub](https://github.com/google/schema-dts)
- [umami-software/umami GitHub (MIT)](https://github.com/umami-software/umami)
- [growthbook/growthbook GitHub (MIT core)](https://github.com/growthbook/growthbook)
- [PostHog best open-source A/B tools (MIT core)](https://posthog.com/blog/best-open-source-ab-testing-tools)
- [formbricks/formbricks GitHub (AGPL-3.0)](https://github.com/formbricks/formbricks)
- [knadh/listmonk GitHub (AGPL-3.0, v6.1.0)](https://github.com/knadh/listmonk)
- [Cal.com AGPL + EE license boundary](https://cal.com/blog/changing-to-agplv3-and-introducing-enterprise-edition)
- [documenso/documenso GitHub (AGPL-3.0)](https://github.com/documenso/documenso)
- [Plausible Community Edition (AGPL-3.0)](https://plausible.io/blog/community-edition)
- [Mautic 7.0 release (GPL-3.0)](https://github.com/mautic/mautic/releases)
- [Unlighthouse OSS site auditor](https://unlighthouse.dev/)
- [Tally pricing (proprietary, no self-host)](https://tally.so/pricing)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **Astro + @astrojs/sitemap + astro-seo + Satori OG** — `MIT` — self-host: yes — maturity: production-grade
- **Cal.com (self-host, AGPLv3 + commercial)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Formbricks (AGPLv3 core)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Documenso (AGPLv3 + Enterprise license key)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Plausible CE (analytics)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Listmonk (newsletter)** — `AGPL-3.0` — self-host: yes — maturity: production-grade

Imagine the ts-monorepo-template as a Lego baseplate. The platform already snaps Astro (already in our stack for docs/marketing), Crossplane providers (24 of them), Helm library chart, ArgoCD ApplicationSets, and Kargo for promotion. The "SEO + GTM + landing" job is: ship a fast static marketing site, capture leads, A/B test headlines, book demo calls, and feed analytics. Two questions decide what we bundle: (1) does the tool snap onto our existing Lego studs (XRD claim, Helm chart, MCP-wrappable API), and (2) does its license let us SELL the bundle?\n\nThink of three tiers. Tier 1 is the static site itself: Astro + @astrojs/sitemap + a JSON-LD structured-data integration + Satori-based OG image generation. Astro is MIT (now owned by Cloudflare, January 2026 acquisition, still MIT and open governance). Everything you need for SEO meta + sitemap + structured data + social cards builds at compile time, zero runtime, ships pure HTML to crawlers. This is the floor — already in the stack, costs nothing, no license risk. Just wire it.\n\nTier 2 is lead capture + scheduling. Formbricks (AGPLv3 core, Apache-2.0 Hub helm chart) gives surveys + forms with a JS SDK, a webhook-out API following the Standard Webhooks signing format, and a community Helm chart. Cal.com (AGPLv3 core + paid commercial license for enterprise features) gives bookings; the v2 REST API at api.cal.com/v2 has stable webhooks (X-Cal-Signature-256) — v1 is being deprecated Feb 2026 so we MUST target v2. Both are AGPL: this is fine if the CUSTOMER self-hosts the template themselves (they're not distributing modifications back to end users over network), but if WE run a managed offering bundling these, AGPL §13 network clause forces source disclosure of OUR modifications. Mitigation: don't fork them, deploy upstream charts unmodified, configure via values only.\n\nTier 3 is analytics + e-sign. Plausible CE is AGPL, Docker Compose first (no official Helm — community charts only, with caveats). Documenso has an official Helm chart + a proper TypeScript SDK + v2 API with X-Documenso-Secret webhook signing. PostHog dropped official Kubernetes support in May 2023 — strike it for new bundles.\n\nIntegration mechanics that matter: every Tier-2 candidate has a stable webhook contract, so the Phase 12 MCP server wraps them as MCP tools (create_booking, list_responses, send_envelope). Crossplane provider-helm wraps any Helm chart as a Release CRD, so we CAN expose XRDs like XCalCom, XFormbricks, XDocumenso even when no native Crossplane provider exists. The launcher CLI just needs `task setup:cal`, `task setup:formbricks`, `task setup:documenso` verbs that apply the claim and rotate the webhook signing secret into ESO. Day-1 wiring is 5-10 commands per tool, all driven by the existing Crossplane + ArgoCD + Kargo pipeline.

**Key findings:**

- Astro is MIT and remains so after the January 2026 Cloudflare acquisition (open governance, public roadmap). Safe to bundle commercially with zero attribution friction. Starlight (also MIT) and @astrojs/sitemap give us SEO meta, sitemap-index.xml + sitemap-0.xml, and a hook for JSON-LD structured data injection at build time.
- Cal.com v1 API is being discontinued February 28, 2026. Any Cal.com integration we ship MUST target API v2 (https://api.cal.com/v2) with X-Cal-Signature-256 HMAC webhook verification. Webhooks scope at user/event-type/org level.
- No OFFICIAL Cal.com Helm chart exists. The Pyrrha/calcom-helm community chart is the de-facto choice and explicitly warns 'development of the Chart may not always keep up with changes in the application.' We wrap it via Crossplane provider-helm Release CR to pin chart version per env.
- Formbricks has TWO Helm charts: the community/main chart (AGPLv3, tracks the AGPL core) and formbricks/hub-helm (Apache-2.0 — Hub product). The Hub uses Standard Webhooks signing format with signed HTTP callbacks. JS SDK auto-adapts to authenticated vs anonymous mode based on userId presence.
- Documenso has an OFFICIAL Helm chart, an OFFICIAL TypeScript SDK (documenso/sdk-typescript), and a documented v2 API at openapi.documenso.com. Webhook signing uses X-Documenso-Secret header (not HMAC — secret comparison via crypto.timingSafeEqual). Enterprise/Business Edition is license-key gated; AGPL core has full document signing.
- Plausible CE is AGPL but ships Docker Compose first — there is no official Helm chart. Stack is PostgreSQL + ClickHouse + Plausible (~2GB RAM minimum). Stats API is single-endpoint POST /api/v2/query; Events API is server-side pageview/event ingestion when JS tracker isn't usable.
- PostHog DROPPED official Kubernetes/Helm support in May 2023. Self-host = Docker Compose only. This rules it out for our K8s-first template — strike from candidate list.
- Crossplane provider-helm (crossplane-contrib/provider-helm v0.20.0+, latest v1.2.0 in marketplace) lets us define a Release CR with spec.forProvider.chart + values + sets. This means we expose ANY Helm chart as an XRD claim even when no native Crossplane provider exists — XCalCom, XFormbricks, XDocumenso are all viable XRDs that compose into provider-helm Release + provider-kubernetes Object (Ingress, ESO ExternalSecret).
- AGPLv3 + commercial sales: if the template AUTHOR (us) sells the bundle AND runs a managed-SaaS offering of these tools, AGPL §13 forces source disclosure of any modifications. Mitigation is: deploy upstream charts UNMODIFIED, only configure via values.yaml + ExternalSecret, never fork. Customer self-hosting their own template stack has no §13 obligation toward end-users unless they distribute.
- Phase 12 MCP server can wrap all four (Cal.com, Formbricks, Documenso, Plausible) as stable MCP tools because each exposes a versioned REST API + webhooks. Documenso even ships a typed TS SDK we can re-export.
- Astro static OG image generation: Satori (HTML/CSS -> SVG) + sharp (SVG -> PNG, Twitter doesn't support SVG OG). Use `export const prerender = true;` so OG images bake at build time, avoiding sharp runtime issues on edge.
- Listmonk is AGPLv3 with multiple community Helm charts (deliveryhero/helm-charts, redzumi/listmonk-chart, th0ths-helm-charts). Single-binary + Postgres only. Use as 'launcher CLI setup:listmonk' optional module on Side Project tier+.

**Gotchas:**

- AGPL §13 network clause: deploying these AS PART of a managed offering triggers source-disclosure for OUR modifications. Never fork — deploy upstream charts, configure via values + Crossplane composition patches only.
- Cal.com v1 API EOL Feb 28, 2026. Any sample code, MCP wrapper, or launcher verb MUST target v2 from day one. Failing this ships a broken integration in <60 days.
- No official Cal.com Helm chart — the community Pyrrha/calcom-helm chart can lag the app version. Pin chart version explicitly in the XRD composition; CI test with the docker image tag matching the chart's expected appVersion.
- Formbricks has TWO products with TWO licenses: core (AGPLv3) and Hub (Apache-2.0 helm chart). Pick the one you mean explicitly when scaffolding — they expose different webhook payload shapes.
- PostHog: no official K8s support since 2023-05. Do NOT propose this as a bundle option even if asked — direct users to PostHog Cloud or recommend Plausible CE + (optional) OpenPanel instead.
- Plausible has no official Helm chart — only community charts of varying quality. Wrap Docker Compose via Crossplane provider-kubernetes Object running on a single replica, OR maintain our own minimal chart in the platform-helm-library. Don't pretend an official one exists.
- Documenso webhook signing uses a SHARED SECRET in X-Documenso-Secret header, not HMAC. This is weaker than Cal.com's X-Cal-Signature-256 — TLS-only delivery and IP allow-listing are mandatory. Use crypto.timingSafeEqual on the verifier, never ==.
- AGPL bundling: if we offer the template as a paid product (source visible to the customer), we MUST also surface upstream AGPL source pointers in our compliance docs. A simple THIRD_PARTY_LICENSES.md per profile tier is the minimum.

**Recommendation (this angle):** Bundle these THREE candidates for the seo-gtm-landing slot, in this order:\n\n**Tier 0 (always-on, every profile from Just Me): Astro stack** — already in our monorepo. Add `@astrojs/sitemap`, `astro-seo` / `@astrolib/seo`, a Satori+sharp OG-image route, and a JSON-LD injection helper at `apps/marketing/src/lib/structured-data.ts`. License: MIT. Zero new ops cost, zero license risk. This is the baseline; no XRD, no Helm — it's a build-time artifact deployed by ArgoCD as static assets on Cloudflare Pages or nginx.\n\n**Tier 2 (Side Project + Early Startup, USD 5-150): Formbricks (forms/surveys + lead capture) + Cal.com (scheduling)**. Both AGPLv3 — deploy upstream charts UNMODIFIED via Crossplane provider-helm Release CR. Expose XRDs `XFormbricks` and `XCalCom` in `platform/xrds/marketing/`. Compositions wire: provider-helm Release → provider-kubernetes Ingress → ESO ExternalSecret for Postgres + webhook signing key → Keycloak client (via existing provider-keycloak) for SSO. Launcher CLI gets `task setup:formbricks` and `task setup:cal`. Phase 12 MCP server wraps Cal.com v2 API (api.cal.com/v2) and Formbricks Management API as MCP tools — both have stable webhooks for event-driven workflows (booking.created, response.submitted).\n\n**Tier 3 (Scaling Startup + Production, USD 300+): add Documenso for e-sign and Plausible CE for analytics.** Documenso has an OFFICIAL Helm chart + official TS SDK — easiest integration of the four. Plausible has no official chart; ship a minimal first-party chart in `platform-helm-library/charts/plausible/` until upstream ships one. XRDs `XDocumenso`, `XPlausible`. MCP tool wrappers re-export documenso/sdk-typescript.\n\n**Hard nos**: PostHog (no K8s support since 2023-05), Tally (proprietary), Mautic (overlap with email-marketing team, plus PHP/MySQL ops drag). Defer Listmonk to the marketing-automation team — it overlaps and they own that slot.\n\n**Day-1 wiring (5-10 commands)** for the Cal.com claim looks like: (1) `task setup:cal` — runs `kubectl apply -f platform/xrds/marketing/calcom-claim.yaml` with profile-selected values; (2) Crossplane composition fans out into Release (calcom-helm chart pinned to vX.Y.Z), ExternalSecret (postgres-creds, nextauth-secret, cal-encryption-key from AKV/Vault), Ingress (cal.<tenant>.<domain> with cert-manager annotation), and Keycloak Client (for SSO); (3) `task verify:cal` polls ArgoCD app health + waits for `kubectl wait --for=condition=Ready release.helm.crossplane.io/cal`; (4) `task seed:cal` runs the SDK to create the default event-type + register the webhook URL into the MCP server's webhook receiver; (5) `task secret:rotate cal` rotates the X-Cal-Signature-256 key. Same pattern for the other three.\n\n**License compliance gate**: add a CI job `license-check` that fails the build if any bundled-by-default chart's appVersion shifts to a stricter license (SSPL/Commons Clause). For the AGPLv3 four, ship `THIRD_PARTY_LICENSES.md` per profile tier with upstream source pointers. Never fork — values.yaml + Crossplane composition patches only.

**Citations:**

- [Formbricks License documentation (AGPLv3 core + Enterprise)](https://formbricks.com/docs/self-hosting/advanced/license)
- [Formbricks Hub Helm Chart (Apache-2.0)](https://github.com/formbricks/hub-helm)
- [Formbricks Webhooks (Standard Webhooks signing)](https://formbricks.com/docs/developer-docs/webhooks)
- [Cal.com LICENSE (AGPLv3)](https://github.com/calcom/cal.com/blob/main/LICENSE)
- [Cal.com v5.6 — API v1 deprecation Feb 28 2026](https://cal.com/blog/calcom-v5-6)
- [Cal.com Webhooks v2 API reference (X-Cal-Signature-256)](https://cal.com/docs/api-reference/v2/event-types-webhooks/get-a-webhook)
- [Pyrrha/calcom-helm (community chart, the de-facto K8s deployment)](https://github.com/Pyrrha/calcom-helm)
- [Documenso Self-Hosting (Helm + Docker compose)](https://docs.documenso.com/docs/self-hosting)
- [Documenso v2 OpenAPI](https://openapi.documenso.com/)
- [Documenso TypeScript SDK (official)](https://github.com/documenso/sdk-typescript)
- [Plausible Community Edition (AGPLv3)](https://plausible.io/blog/community-edition)
- [Plausible Stats API v2](https://plausible.io/docs/stats-api)
- [Crossplane provider-helm (Release CR)](https://github.com/crossplane-contrib/provider-helm)
- [@astrojs/sitemap integration docs](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [PostHog drops official Kubernetes support (May 2023)](https://posthog.com/questions/self-hosted-version)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Astro Starlight** — `MIT` — self-host: yes — maturity: production-grade
- **schema-dts (google/schema-dts)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **@vercel/og + satori** — `MPL-2.0` — self-host: yes — maturity: production-grade
- **Plausible Community Edition** — `AGPL-3.0 (JS tracker: MIT)` — self-host: yes — maturity: production-grade
- **Formbricks (core)** — `AGPL-3.0 (SDKs: MIT, /ee: proprietary)` — self-host: yes — maturity: production-grade
- **Listmonk** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Documenso** — `AGPL-3.0 (commercial available)` — self-host: yes — maturity: usable
- **Cal.diy (NOT cal.com)** — `MIT` — self-host: yes — maturity: usable

Think of software licenses as the rules of a borrowing arrangement. The ts-monorepo-template is something we eventually want to sell. Any tool we ship inside it must not (a) force our customers to publish their source code or (b) force us to pay royalties downstream.

Three license families matter here:

1. Permissive (MIT, Apache-2.0, BSD, ISC). "Use it however, just keep the notice." These are the safe ones for commercial bundling. Astro Starlight, schema-dts, @vercel/og, satori all fall here. Bundle freely.

2. Weak copyleft / library copyleft (MPL-2.0, LGPL). File-level or library-level only. You can wrap it in a proprietary product as long as you don't modify the library itself in secret. Acceptable with care.

3. Strong network copyleft (AGPL-3.0). The trap. If you run AGPL software over a network and let users interact with it, you must offer those users the source code — including your modifications and (depending on how tightly coupled) potentially your surrounding code. This is what Cal.com (until April 2026), Documenso, Formbricks, Plausible, Listmonk, and Mautic (GPLv3) all use. The KEY insight for our template: shipping a values.yaml that references an AGPL Docker image is NOT the same as linking AGPL code into our binary. Containers are considered separate programs (FOSSA/SFC consensus), so the AGPL obligation falls on whoever DEPLOYS the container, not whoever ships the recipe. That means our customers (self-hosters) inherit the AGPL obligation when they run it on their network — we don't. Our template stays MIT/Apache and merely points at upstream images.

4. Source-available / dangerous category (SSPL, BUSL, FSL, Commons Clause). SSPL (MongoDB/Elastic/Redis) is specifically designed to prevent us from offering the tool as a managed service. BUSL (Hashicorp Terraform, Sentry-until-2023) restricts commercial competing use for typically 4 years then converts to MPL/Apache. FSL (Sentry 2023+) is a 2-year non-compete that converts to Apache-2.0. Avoid SSPL outright; CAUTION on BUSL/FSL — fine if our use isn't "compete with their hosted SaaS", but the line is fuzzy and lawyers hate fuzz.

The big 2026 plot twist: Cal.com moved closed-source on 15 April 2026 because AI coding assistants now systematically scan public repos for vulnerabilities. They released a stripped-down MIT fork called Cal.diy. So if our template references "cal.com", we are now pointing at a closed-source artifact — bad. We must pin to Cal.diy or pick another scheduler.

For our landing-page / GTM stack, the cleanest path is: keep Astro Starlight (MIT, already in stack), add schema-dts (Apache-2.0) and @vercel/og + satori (MPL-2.0/Apache-ish) for SEO and OG images, recommend Plausible CE for analytics ONLY if customer self-hosts (we never bundle the AGPL container into a managed offering of ours), and use Formbricks/Listmonk/Documenso the same way — values.yaml references, never managed-by-us. Tally is proprietary; do not bundle. Mautic (GPLv3) — same self-host-only model. The rule of thumb: if it's AGPL or GPL, the template references it as an optional add-on the user opts into and deploys themselves; if it's MIT/Apache, we can ship it as a default.

**Key findings:**

- Astro Starlight is MIT — safe to ship as a hard dependency in the template; this is the cleanest GTM/docs/landing primitive we have.
- schema-dts (Apache-2.0, v2.0 released March 2026) is the right choice for SEO structured data — TypeScript types over the whole Schema.org vocabulary, no attribution beyond NOTICE file.
- Cal.com went CLOSED SOURCE on April 15, 2026 — production code is now private; cal.diy is the MIT-licensed community fork. Any existing reference to calcom/cal.com images must be migrated or removed.
- Formbricks AGPL-3.0 core + a /ee directory under separate proprietary license + SDKs (js/android/ios/api) under MIT. The split means embedding their JS SDK on our marketing site is MIT-safe; running the server is AGPL.
- Plausible CE AGPL-3.0 with an explicit MIT exception for the JS tracker snippet — confirms the upstream's intent: shipping the tracker on websites does NOT trigger AGPL virality.
- Documenso AGPL-3.0 with a paid commercial license ($250/mo Platform or self-hosted Enterprise) needed for embedded/white-label use — embedding their iframe into our managed offering is the trigger.
- Listmonk and Mautic are AGPL-3.0 and GPL-3.0 respectively — fine as self-hosted opt-ins, NEVER fine to host as part of our managed SaaS offering of the template.
- Tally Forms is fully proprietary closed-source — only usable via their hosted API; do not bundle, only document as an optional external SaaS.
- FOSSA/SFC consensus (cited in containers-OSS compliance guidance): each container is a separate program, so referencing an AGPL Docker image in our values.yaml does not infect our chart's license.
- BUSL (Hashicorp Terraform, Sentry 2019–2023) is source-available, not OSI-open; OSI explicitly does not recognize it. Converts to FOSS after 4 years. Sentry has since moved to FSL (Functional Source License, 2-year non-compete then Apache-2.0).
- SSPL (MongoDB/Elastic/Redis) is designed specifically to prevent SaaS-ification — NEVER ship anything SSPL inside a commercial template offering, even as a reference.
- For OG image generation, @vercel/og (MPL-2.0) and underlying satori library are commercial-safe — file-level copyleft only applies if we modify satori itself and keep changes secret.

**Gotchas:**

- AGPL network-use clause triggers when WE (the template authors) run AGPL software as part of OUR managed offering. If we sell a hosted 'turnkey' deployment that includes Plausible/Documenso/Formbricks/Listmonk, we owe source. Self-hosted-by-customer deployments leave the obligation with the customer.
- Cal.com cal.diy is a brand-new MIT fork (April 2026) with much smaller feature set than the old AGPL cal.com. Don't assume feature parity — verify before adopting.
- Formbricks /apps/web/modules/ee directory is proprietary-licensed. If we Docker-pull the official image, we ship that proprietary code transitively; if our customer modifies it, they violate the EE license. Document this boundary.
- Mautic is GPL-3.0 not AGPL-3.0 — slightly weaker network clause but still strong copyleft. Same self-host-only treatment applies.
- Plausible JS tracker MIT exception only applies to the embed snippet, NOT to the analytics server. If our marketing site references plausible.io's cloud, we're fine; if we self-host the server as part of our SaaS, we're back in AGPL land.
- Tally Forms terms explicitly prohibit reverse engineering — even shipping a thin wrapper or feature-flagging behavior detection could trip their EULA. Use the official API only.
- BUSL conversion dates vary by vendor — Hashicorp's MPL conversion period is 4 years from each release. Don't assume 'BUSL eventually becomes free' covers your current usage.
- Containers-as-separate-programs is the prevailing interpretation but NOT a court-tested rule. Treat AGPL bundles as a license-management surface in our SBOM, not as 'safe to ignore'.

**Recommendation (this angle):** SHIP as MIT/Apache defaults in the template: Astro Starlight (docs/landing), schema-dts (SEO structured data), @vercel/og + satori (OG image generation). These are zero-risk for commercial bundling.

OFFER as opt-in self-hosted add-ons via Helm values references (clearly labeled AGPL): Plausible CE, Formbricks (core+SDKs), Listmonk, Documenso, Mautic. Document explicitly in the template README that activating these means the CUSTOMER takes on AGPL/GPL obligations for their deployment; we never run them as part of our managed offering.

MIGRATE AWAY FROM: any reference to calcom/cal.com (now closed source as of April 15, 2026). Either pin to cal.diy (MIT fork) and accept the reduced feature set, or recommend customers integrate Cal.com's hosted SaaS via their public API. Do not document the old self-hosted AGPL path — the upstream is gone.

DO NOT BUNDLE: Tally (proprietary EULA), and ANY SSPL/BUSL-licensed tool in this category. Hard-blocklist these in our license scanner: SSPL-1.0, BUSL-1.1, FSL-1.1-Apache, Commons-Clause, Cal.com-Commercial-License.

GOVERNANCE: Add a CI job that runs `licensecheck` / FOSSA against all Docker images referenced in templates/\*/values.yaml. Block on SSPL, Commons Clause, and any proprietary-EULA license. Warn (require ADR) on AGPL/GPL. Pass on MIT/Apache/BSD/MPL-2.0/ISC.

CRITICAL UPDATE for the broader 12-team research: Cal.com is no longer a viable open-source recommendation in our 2026 stack. This must propagate to all teams.

**Citations:**

- [Cal.com Goes Closed Source: Why AI Security Is Forcing Our Decision](https://cal.com/blog/cal-com-goes-closed-source-why)
- [calcom/cal.diy — MIT-licensed scheduling infrastructure](https://github.com/calcom/cal.diy)
- [Cal.diy: The New MIT-Licensed Open-Source Fork of Cal.com (AIToolly, April 2026)](https://aitoolly.com/ai-news/article/2026-04-22-caldiy-launched-as-mit-licensed-open-source-community-fork-of-calcom-for-self-hosters)
- [Formbricks LICENSE — AGPL-3.0 with /ee proprietary carve-out](https://github.com/formbricks/formbricks/blob/main/LICENSE)
- [Formbricks docs — Licensing](https://formbricks.com/docs/self-hosting/advanced/license)
- [Documenso Community Edition License docs](https://docs.documenso.com/users/licenses/community-edition)
- [Documenso Enterprise Edition License docs](https://docs.documenso.com/docs/policies/enterprise-edition)
- [Plausible — open source licensing and AGPL change announcement](https://plausible.io/blog/open-source-licenses)
- [Introducing Plausible Community Edition (AGPL CE + MIT tracker)](https://plausible.io/blog/community-edition)
- [Astro Starlight LICENSE (MIT)](https://github.com/withastro/starlight/blob/main/LICENSE)
- [google/schema-dts (Apache-2.0, v2.0 March 2026)](https://github.com/google/schema-dts)
- [Listmonk — AGPLv3 self-hosted newsletter manager](https://github.com/knadh/listmonk)
- [Mautic LICENSE — GPL-3.0](https://github.com/mautic/mautic/blob/5.x/LICENSE.txt)
- [HashiCorp adopts Business Source License (BUSL 1.1)](https://www.hashicorp.com/en/blog/hashicorp-adopts-business-source-license)
- [FOSSA — Containers and Open Source License Compliance](https://fossa.com/blog/containers-open-source-license-compliance/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Astro 5 (chassis: marketing site + landing pages)** — `MIT` — self-host: yes — maturity: production-grade
- **@astrojs/sitemap + astro-seo + schema-dts + react-schemaorg (SEO meta + JSON-LD)** — `MIT / Apache-2.0` — self-host: yes — maturity: production-grade
- **Satori + sharp (dynamic OG image generation per route)** — `MPL-2.0 / Apache-2.0` — self-host: yes — maturity: production-grade
- **Umami (web analytics — default bundled)** — `MIT` — self-host: yes — maturity: production-grade
- **Formbricks (forms/surveys — opt-in Crossplane claim)** — `AGPL-3.0 (core) + EE` — self-host: yes — maturity: production-grade
- **Cal.diy (scheduling — opt-in Crossplane claim, post-Apr-2026)** — `MIT` — self-host: yes — maturity: usable
- **Documenso (e-sign — opt-in Crossplane claim)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Listmonk (newsletter/lead nurture — opt-in Crossplane claim)** — `AGPL-3.0` — self-host: yes — maturity: production-grade

Imagine you're a founder shipping a SaaS template that other founders pay for. Your "landing page" stack does four jobs: (1) make a fast, SEO-clean public site, (2) capture leads, (3) book demos, (4) prove the funnel works (analytics + share previews). The trick is doing this without bundling something that legally forces you — or your customers — to open-source their commercial code.

Start with the chassis. Astro 5 is the right shape: static HTML by default, content collections with Zod schemas (so SEO meta is enforced at build time), official `@astrojs/sitemap` (MIT) and the community `astro-seo` package (MIT), and a one-route trick using Satori to generate dynamic OG images per page. You already have Starlight in the stack for docs — same engine, same MIT license, same image-optimization pipeline. So the marketing site is essentially "free" infrastructurally: same monorepo, same build, same CDN. Lighthouse 95–100 is the published baseline. As of Jan 2026 Cloudflare acquired Astro, which removes the "what if the project dies" risk you'd ask about Mautic.

Now the polluting risks. Almost every shiny "open-source Typeform/DocuSign/Calendly" is AGPL-3.0: Formbricks, Documenso, Plausible CE, Cal.com (until April 2026), Listmonk, Mautic. AGPL is fine if your customer self-hosts it on their own server — they're not "conveying" the software to anyone, and the network-use clause only fires when _they_ expose it. AGPL becomes a trap if YOU bundle it into a managed/hosted offering you sell, because then the network-use clause forces you to release the modified source under AGPL to every user who hits your service. Translation: ship AGPL tools as opt-in self-host modules with their own Helm chart and Crossplane claim — never embed them in the template's own code paths.

The MIT escape hatches matter. Umami (analytics, MIT) is the safe-to-bundle default — Plausible's AGPL gives you no advantage if you're shipping a commercial template. PostHog core is MIT too, but it's an elephant for a landing page funnel. schema-dts + react-schemaorg (Apache-2.0, by Google) gives you compile-time type-safe JSON-LD — no separate "schema generator service" needed. Cal.com flipped to MIT (as cal.diy) in April 2026, which actually solves the scheduling problem cleanly for day-2 — before that you had to either iframe their cloud or eat AGPL.

The wrong move is to ship a "batteries-included" GTM stack as part of the template binary. Founders at the "Just Me" and "Side Project" tiers don't need Mautic; they need a single contact form posting to a Formspree-style endpoint or a tiny serverless function writing to Postgres. Founders at "Scaling Startup" want PostHog or Umami self-hosted in their cluster, and Listmonk for newsletter — but as separately-installable Crossplane claims, not template-embedded code. That separation keeps your sellable template under permissive licenses while letting customers add the AGPL tools they self-host (which is the legally clean path).

Bottom line: ship Astro + sitemap + astro-seo + Satori OG + schema-dts in the template (all MIT/Apache). Ship Umami as the default analytics. Ship Formbricks, Cal.diy, Documenso, Listmonk as on-demand Crossplane claims for customers who want them. Skip Mautic — slow release velocity post-Acquia, too heavy for the audience.

**Key findings:**

- Astro 5 is the right chassis: MIT, Lighthouse 95-100 out of the box, content collections enforce SEO schemas at build time (Zod), and Cloudflare's Jan 2026 acquisition de-risks long-term maintenance.
- Satori (MPL-2.0) + sharp (Apache-2.0) at an Astro API route gives dynamic per-page OG images — research cites 2.3x click-through on social vs. plain links. No paid SaaS needed.
- schema-dts (Apache-2.0, by Google, ~100k weekly downloads) + react-schemaorg deliver type-safe Schema.org JSON-LD at compile time. Replaces any 'schema generator' SaaS.
- Plausible CE is AGPL-3.0; Umami is MIT — Umami is the safe default to bundle inside the template because MIT carries zero obligations on commercial redistribution.
- Cal.com forked to cal.diy under MIT in April 2026 (previously AGPL). This is the inflection point — scheduling is now safe to bundle, not just opt-in.
- Formbricks core is AGPL-3.0 with an enterprise (EE) directory under a separate license; the default Docker image bundles EE code per third-party audits — flag for customers.
- Documenso is AGPL-3.0 with a separate self-hosted enterprise license starting at USD 30k/yr for unlimited use — fine as customer-self-hosted, not as part of our managed offer.
- Listmonk (AGPL-3.0) runs in 512MB RAM and is dramatically lighter than Mautic; Mautic needs 2GB+ and release velocity slowed after Acquia disengaged in late 2024.
- AGPL bundling is safe when the customer self-hosts the tool as an isolated service (no network-use trigger on the template's own code). AGPL is dangerous if we expose it in a managed offering we sell.
- PostHog (MIT core + EE dir) can replace analytics + session replay + flags + surveys, but is overkill for the landing-page-only scope this team owns — keep it for the product-analytics team to decide.
- Astro Starlight (MIT, already in stack) handles docs; for marketing/landing pages prefer a Starlight-adjacent Astro app rather than forcing Starlight to do landing-page jobs it isn't built for.
- Tally is proprietary and cloud-only — exclude from the template; recommend it only as a managed-SaaS upgrade comparison.

**Gotchas:**

- If you bundle ANY AGPL tool into the template's own server processes (not as a separately-deployed service), the network-use clause applies to anyone hitting your customers' instances — derivative works become AGPL.
- Formbricks default Docker image silently includes the EE directory (separate license). Pin to a verified community-only build or document the EE-aware bundle for customers.
- Cal.diy (MIT) is maintained by former Cal.com interns; production-grade for hobbyists but commercial-edition features moved closed-source. Treat as 'usable' not 'production-grade-enterprise'.
- Satori does NOT output PNG — requires sharp to convert SVG→PNG. Both must be in the runtime, not just dev deps.
- @astrojs/sitemap regenerates only at build time; dynamic routes added via Server Islands need explicit sitemap entries or a manual sitemap-index.
- Plausible CE → don't host it in our managed offering; recommend customer-self-host only. Same applies to Documenso and Listmonk.
- Mautic is community-maintained as of 2026 (Acquia stepped back) — release velocity uncertain. Don't make it a first-class default.
- AGPL 'separately-installable Crossplane claim' framing must be documented in the template's LICENSE and README — silent AGPL exposure is a real legal risk to downstream customers.

**Recommendation (this angle):** DAY-1 INCLUDE (all profiles, baked into the template): Astro 5 + @astrojs/sitemap + astro-seo + schema-dts + react-schemaorg + Satori/sharp OG route + Umami (MIT) as default analytics. This is the entire 'landing page + SEO + lead capture' surface for Just Me / Side Project / Early Startup. All MIT/Apache — zero license risk for our commercial sale.\n\nDAY-2 INCLUDE as opt-in Crossplane claims (NOT bundled in template code paths): Formbricks (forms/surveys), Cal.diy (scheduling, now MIT post-Apr-2026), Listmonk (newsletter). Documented as 'install when you need them'. Targets Early Startup / Scaling Startup profiles.\n\nON-DEMAND ONLY (advanced Crossplane claim, explicit AGPL warning): Documenso for e-sign. Most founders won't need it until Scaling Startup tier; commercial alternatives (DocuSign at USD 25/user/mo, Dropbox Sign at USD 20/mo) are the upgrade path for those who want zero AGPL exposure.\n\nEXCLUDE entirely: Mautic (community-maintained drift risk post-Acquia, 2GB+ RAM overkill for audience). Tally (proprietary, cloud-only — not bundlable). Plausible CE as a bundled default (Umami covers same job under MIT). Cal.com 'cloud edition' as a default (closed source post-Apr-2026).\n\nUpgrade-path narrative for the marketing site: 'You start with our MIT stack at USD 0. When you outgrow Umami self-hosted (~5M events/mo), upgrade to Umami Pro at USD 49/mo or PostHog Cloud at usage-based pricing. When you outgrow Formbricks self-hosted, upgrade to Typeform at USD 25-83/mo. When you need notarized e-sign + audit, upgrade to DocuSign at USD 25/user/mo.' This gives founders an honest 'start free, pay only when you scale' story without trapping them in our managed offering.

**Citations:**

- [Astro Starlight — official docs (MIT)](https://starlight.astro.build/)
- [What's new in Astro - May 2026](https://astro.build/blog/whats-new-may-2026/)
- [Astro in 2026: Cloudflare acquisition](https://dev.to/polliog/astro-in-2026-why-its-beating-nextjs-for-content-sites-and-what-cloudflares-acquisition-means-6kl)
- [@astrojs/sitemap (MIT) on npm](https://www.npmjs.com/package/@astrojs/sitemap)
- [Astro SEO — definitive guide (Joost.blog)](https://joost.blog/astro-seo-complete-guide/)
- [schema-dts (Apache-2.0, Google)](https://github.com/google/schema-dts)
- [react-schemaorg (Apache-2.0, Google)](https://github.com/google/react-schemaorg)
- [Generate Dynamic OG Images with Satori + Astro](https://cai.im/blog/og-images-using-satori/)
- [Formbricks on GitHub (AGPL-3.0 core + EE)](https://github.com/formbricks/formbricks)
- [Formbricks license documentation](https://formbricks.com/docs/self-hosting/advanced/license)
- [Cal.com → cal.diy MIT relaunch (Apr 2026)](https://cal.com/blog/cal-diy-open-source-to-closed-source)
- [Documenso on GitHub (AGPL-3.0) + self-hosted enterprise license](https://documenso.com/blog/introducing-self-hosted-signing-infrastructure-for-enterprise)
- [Plausible Community Edition (AGPL-3.0)](https://plausible.io/blog/community-edition)
- [Umami vs Plausible 2026 — MIT vs AGPL](https://umami.is/compare/plausible)
- [Listmonk vs Mautic 2026 — Acquia governance shift](https://www.sequenzy.com/versus/listmonk-vs-mautic)

---

## Team 10 — Live chat + community + forum

### Synthesized verdict

- **Verdict:** `include-day-2`
- **Fit score:** 82 / 100
- **Top pick:** **Chatwoot Community Edition**
- **License:** `MIT (community/ dir only; enterprise/ dir is proprietary and must be excluded)`
- **Default profile bundles:** `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angles converge on the same two-tool answer: Chatwoot CE (MIT) for the in-app live-chat widget + support inbox, and Discourse (GPL-2.0) for the public community forum once a customer has actual community traffic. The synthesizer pick is Chatwoot CE as the single top tool because (a) it is the most license-clean option in the entire research scope — pure MIT on the community/ dir, no copyleft, no SaaS-killer §13 — which is the load-bearing criterion for a template we will SELL and may later host as a managed offering; (b) it covers the widest slice of the category (widget + omnichannel inbox + automation + Captain AI) with a single Helm chart; (c) it slots cleanly into the existing rails — official Helm chart for Phase 6/7, provider-keycloak OIDC client XR for Phase 8, REST API + HMAC-signed webhooks for the Phase 12 MCP server, so Aegis can read/write conversations end-to-end. Discourse is the correct day-2 companion (different job — public Google-indexable forum) and is GPL-2.0 which is safe because GPLv2 has no AGPL §13 trigger and 'mere aggregation' covers a Helm chart that references an upstream image. Rocket.Chat / Mattermost / Synapse / Talkyard are explicitly rejected as defaults: Rocket.Chat CE has a 100-concurrent-user binary cap and adds an EE/ exclusion ritual without a feature edge for the widget job; Mattermost's 'MIT' applies only to Mattermost-Inc-compiled binaries while the source is AGPL-3.0 (rebuild and you inherit AGPL); Synapse and Talkyard are both AGPL-3.0 — fine if a CUSTOMER self-hosts but a license bomb the day we operate them as part of our managed offering. Verdict is include-day-2 (not day-1) because Just Me + Side Project profiles do not have a community to support yet — bundling Chatwoot for them adds Postgres + Redis + Sidekiq + SMTP setup burden with no payoff; the launcher should gate it on the Early Startup profile and above.

**Integration outline:**

Phase 6 (library chart): add libs/charts/chatwoot wrapping the upstream chatwoot/chatwoot Helm chart (helm repo add chatwoot https://chatwoot.github.io/charts), pinned to an immutable -ce image digest with CHATWOOT_EDITION=community enforced; add libs/charts/discourse using a community/Chainguard chart (NOT bitnamilegacy — Bitnami deprecated their Discourse chart Aug 28 2025) pinned to upstream Discourse Docker image. Phase 7 (ApplicationSet): one ArgoCD Application per env, gated by profile label (chatwoot enabled at startup-small+, discourse enabled at startup-scale+). Phase 8 (Crossplane XRDs): define XChatwootInbox, XChatwootAgent, XChatwootWebhook, XDiscourseCategory, XDiscourseWebhook backed by crossplane-contrib/provider-terraform Workspaces calling community TF modules (no native Crossplane provider exists for either tool); extend the existing provider-keycloak XRDs to mint two OIDC clients per env — one for Discourse's bundled openid-connect plugin, one for Chatwoot SSO. Day-1 launcher verbs: `task setup:chatwoot` → adds Helm repo, applies XChatwoot claim, mints OIDC client via provider-keycloak XR, seeds admin via Job, registers a default Website inbox + HMAC-signed webhook back to the app namespace, drops window.chatwootSDK.run() snippet + website token into apps/web/.env (HMAC user-identifier secret stays server-side only). Same shape for `task setup:discourse` at the scaling tier, plus an Embedding hostname whitelist call via the TF provider so marketing-site iframes don't 403. Phase 12 (MCP server): wrap Chatwoot's Application API (Api-Key header) and Discourse's REST API (Api-Key + Api-Username) with HMAC-verified webhook receivers (X-Chatwoot-Signature sha256, Discourse X-Discourse-Event-Signature) so Aegis can list/post/triage/label conversations and forum topics. CI guardrails: FOSSA or Trivy --license-full scan asserting the enterprise/ dir is absent from any built image; LICENSES-BUNDLED.md tracking upstream license + version + SAFE/CAUTION/AVOID rating; Renovate config aware that Discourse uses calendar versioning (v2026.x.y) not semver.

**Risks:**

- Chatwoot enterprise/ directory is proprietary — if a future maintainer flips the image tag from -ce to a non-CE build or enables EE feature flags, the MIT license posture silently breaks. Mitigate with a CI license scan + pinned image digests.
- Chatwoot publicly promised never to migrate CE features into EE, but that promise is not contractual. A future flip (Elastic/Redis/HashiCorp-style) would force a fork or swap to Tiledesk (MIT) — document the swap plan in an ADR now.
- Discourse's official deployment model is its own discourse_docker launcher (Rails + Sidekiq + nginx + Postgres + Redis as one container). Running it as separate K8s Deployments is a community pattern, not upstream-blessed — expect upgrade friction at major-version bumps.
- Bitnami's Discourse chart and images moved to docker.io/bitnamilegacy on Aug 28 2025 with no further updates; pinning to bitnamilegacy is a known-EOL path. Use a community/Chainguard chart and own the upgrade cadence.
- No native Crossplane provider exists for either Chatwoot or Discourse; Day-2 resources go through provider-terraform which has slow reconcile loops (TF init/plan/apply per change). Acceptable but adds operational latency and TF-state ownership.
- Chatwoot's HMAC widget user-identifier secret MUST stay server-side — if leaked into a browser bundle, user impersonation is trivial. Bake the boundary into the launcher template (server-side env only, no NEXT*PUBLIC* prefix).
- Discourse is GPL-2.0-ONLY (no 'or later'). If we ever ship Discourse plugins or themes inside the template repo, those are derivative works and inherit GPLv2 — keep all Discourse customization out of the template and deliver it as Crossplane-managed configuration only.
- If we later offer a managed-cloud version of the template and accidentally host Synapse/Mattermost/Talkyard for paying customers, AGPL-3.0 §13 triggers source disclosure of our private code paths. Hard-code an AVOID list in the launcher so these can never be enabled on the managed tier.

### Angle: Tool landscape + maturity

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **Chatwoot (Community Edition)** — `MIT (community/ dir) + proprietary (enterprise/ dir — must be excluded)` — self-host: yes — maturity: production-grade
- **Discourse** — `GPL-2.0` — self-host: yes — maturity: production-grade
- **Rocket.Chat (Community Edition)** — `MIT (CE) + source-available EE (must exclude ee/ dir)` — self-host: yes — maturity: production-grade
- **Flarum** — `MIT` — self-host: yes — maturity: usable

Imagine you're selling a fancy office building (the ts-monorepo-template). Inside, you want pre-installed: (1) a public town square where customers can post questions and discuss your product (a community forum), and (2) a help-desk receptionist sitting in every lobby that website visitors can wave at (a live-chat widget). We have to install these in a way that future buyers of the building (our customers) can switch them on with one knob, and so that future receptionist-robots (Aegis AI agents) can also operate the receptionist's chair through a side door (MCP).

The OSS market here splits cleanly into two functions. Forum: Discourse (the GPL-2.0 grandparent), Flarum (a leaner PHP option), and Talkyard. Chat/help-desk: Chatwoot (open-core MIT community + proprietary enterprise dir), Rocket.Chat (MIT core + restrictive EE dir), Mattermost (AGPL/Apache mix), Element/Matrix (Apache). Crisp/Intercom are SaaS-only EULA and disqualified for self-host.

For a commercial template you SELL, the license analysis is everything. Discourse is GPL-2.0 — fine because the customer self-hosts the unmodified upstream image. We never modify-and-redistribute it; we just publish Helm values and an SSO config. Chatwoot's community edition is MIT — the cleanest possible answer. The enterprise/ folder is proprietary, so our Helm values must explicitly exclude it (set CHATWOOT_EDITION=community or simply not enable the EE flags). Rocket.Chat and Mattermost both ship dual structures where the "EE folder" is source-available-not-OSS — same pattern, same mitigation. AGPL becomes a problem ONLY if we deploy these as part of our managed offering; if the customer runs the binary on their own cluster, the network-use clause doesn't reach us.

Integration mechanics fit our existing rails cleanly. Both top picks ship an official Helm chart, which slots into the Phase 6 library chart + Phase 7 ArgoCD ApplicationSet. There's no native Crossplane provider for either, but we have two paths: (a) the Crossplane provider-keycloak XRD creates the OIDC client and we deliver that as a Secret the chart consumes; (b) Day-2 resources (Chatwoot inboxes/agents, Discourse categories/webhooks) get managed via crossplane-contrib/provider-terraform pointed at the community Terraform modules — wrapped in our own XRD like XChatwootInbox / XDiscourseCategory. Bitnami's Discourse chart is now deprecated (Broadcom moved free images to bitnamilegacy August 2025), so we use the Discourse-recommended Docker container plus a thin community chart, or pin bitnamilegacy with eyes-open.

For the launcher CLI verbs: `task setup:chatwoot` and `task setup:discourse` follow the same shape as our existing setup verbs — install Helm release, push OIDC client via provider-keycloak XR, seed an admin user, register a Crossplane claim for the first inbox/category, mint a webhook secret into the app namespace.

For the MCP server (Phase 12), both tools are gold: Chatwoot has a documented REST Application API + signed HMAC webhooks (X-Chatwoot-Signature sha256), and Discourse has a stable REST API behind Api-Key/Api-Username headers + per-event webhooks with HMAC. Aegis can read conversations/topics, post replies, triage, label — every primitive needed for an AI customer-success agent.

**Key findings:**

- Chatwoot CE is MIT-licensed and explicitly permits building/reselling derivatives of the community edition — best license fit for a commercial template, provided we never bundle the enterprise/ directory (SLA mgmt, SSO/SAML, audit logs, Captain AI all live there).
- Discourse is GPL-2.0 and reaffirmed in April 2026 that the license is not changing. GPL-2.0 is safe for our customers to self-host the unmodified upstream image; we only ship Helm values + OIDC config, not a modified binary.
- Chatwoot ships an official Helm chart (helm repo add chatwoot https://chatwoot.github.io/charts) with HPA, external Postgres/Redis support, and Redis Sentinel mode — slots directly into Phase 6 library chart + Phase 7 ApplicationSet.
- Discourse's Bitnami chart was deprecated when Broadcom moved free images to docker.io/bitnamilegacy (effective Aug 28 2025). Recommended path is the official Discourse Docker container + community/Chainguard chart, or pin bitnamilegacy with no-update awareness.
- Neither Chatwoot nor Discourse has a native Crossplane provider. Day-1 cluster resources go via Helm + provider-keycloak (for OIDC client). Day-2 entities (inboxes, agents, webhooks, categories) get managed through crossplane-contrib/provider-terraform calling community TF modules, wrapped in our own XRDs.
- Chatwoot has a documented Widget SDK (window.chatwootSDK.run() with website token + base URL) and a REST Application API for inbox/agent/conversation CRUD — perfect MCP server surface for Phase 12 Aegis integration.
- Chatwoot webhooks ship signed: X-Chatwoot-Signature (HMAC-SHA256), X-Chatwoot-Timestamp, X-Chatwoot-Delivery — verifiable end-to-end without any third-party trust.
- Discourse has a stable REST API (Api-Key + Api-Username headers) plus per-event webhooks with HMAC signing, OIDC SSO bundled in core (no plugin install needed), and an embed.js for embedding comments in marketing pages.
- DiscourseConnect protocol + Keycloak group/role mapping is supported via the bundled openid-connect plugin; aligns with our existing Phase 8 provider-keycloak XRDs (one Keycloak client XR per forum/widget).
- Rocket.Chat and Mattermost both ship dual-license structures (MIT/AGPL CE + proprietary or source-available EE). Workable but require the same enterprise-dir exclusion ritual as Chatwoot and add an audit-burden compared to a single-license CE.
- Crisp/Intercom are SaaS-EULA proprietary. They satisfy the 'in-app chat widget' but not self-host preferred, so they are AVOID for the template default and only an opt-in for the highest-tier 'Production at Scale' profile.
- Flarum (MIT, PHP/Laravel) is lighter than Discourse and reasonable for the Side Project / Early Startup profiles where Discourse's Rails+Sidekiq+Redis footprint is overkill — but its API/webhook surface is plugin-driven and weaker for an MCP wrapper.

**Gotchas:**

- Chatwoot enterprise/ directory is proprietary — your CI must explicitly assert it is not bundled or built into the image you ship. Document this in ADR and in the launcher's setup verb.
- Bitnami Discourse chart and images moved to docker.io/bitnamilegacy effective Aug 28 2025 — no further updates. Don't pin Bitnami long-term; use the official Discourse Docker container with a thin community chart, or migrate to Chainguard's hardened fork.
- Discourse's official deployment model is its own discourse_docker launcher (Rails + Sidekiq + nginx + postgres + redis in one container). Running it 'pure Kubernetes' (separate Deployments) is a community pattern, not the upstream-blessed path — expect upgrade friction.
- AGPL-3.0 (Mattermost CE) is fine for a customer self-hosting on their own cluster, but if WE host any AGPL workload in our managed offering (e.g., a public demo of the template), the network-use clause kicks in. Carve this out explicitly in the ADR.
- Chatwoot widget SDK loads from your base URL into an iframe with a window.chatwootSDK.run() boot call — the website token is public-by-design, but the HMAC user-identifier secret MUST stay server-side or impersonation is trivial.
- Discourse embed.js requires you to whitelist your marketing-site hostname under Admin → Customise → Embedding before iframes load — automate this via the Terraform provider call in the launcher, otherwise embeds silently 403.
- No native Crossplane provider for either tool; provider-terraform + community TF modules is the pragmatic Day-2 path, but budget for the round-trip cost (TF init/plan/apply per reconcile is slow vs. a real K8s controller).
- Discourse's OIDC plugin requires the discovery URL be reachable from inside the Discourse pod at boot (it fetches /.well-known/openid-configuration). On a NetworkPolicy-locked namespace this needs an explicit egress allow to Keycloak.

**Recommendation (this angle):** Default to a TWO-tool answer: Chatwoot CE for in-app chat widget (live chat + in-app community feed via its built-in conversations API) and Discourse for the public community forum. Both shipped only at the Early Startup tier and above; Just Me and Side Project profiles get no forum (Discourse is too heavy) and an opt-in lightweight Chatwoot install or a Crisp SaaS placeholder. Concrete integration: (1) Phase 6 — add libs/charts/chatwoot and libs/charts/discourse as App-of-Apps children pinned to upstream chatwoot/charts and a Chainguard or community-maintained Discourse chart (NOT bitnamilegacy as the long-term default); (2) Phase 7 — one ArgoCD Application per env (early/scaling/prod); (3) Phase 8 — define XRDs XChatwootInbox, XChatwootAgent, XDiscourseCategory, XDiscourseWebhook backed by provider-terraform Workspaces calling community TF modules; (4) Phase 8 — extend the existing Keycloak Crossplane XRDs to mint two OIDC clients (one for Discourse openid-connect plugin, one for Chatwoot SAML/OIDC); (5) Phase 12 — MCP server wraps both REST APIs with HMAC-verified webhook receivers so Aegis can read/write conversations and forum topics. Day-1 wiring: `task setup:chatwoot` → adds Helm repo, applies XClaim, mints OIDC client via provider-keycloak XR, seeds admin via Job, registers a default Website inbox + signed webhook back to the app, drops the widget snippet into apps/web/.env. Same shape for `task setup:discourse`. Reject Rocket.Chat and Mattermost as defaults — they add license-audit surface (EE folder exclusion ritual) without a feature edge over Chatwoot for the support-chat use case, and they don't replace a forum. Reject Crisp/Intercom from the default bundle (SaaS-EULA), but keep them as a one-flag opt-in for customers who want SaaS over self-host.

**Citations:**

- [Chatwoot Helm Chart — official deployment docs](https://developers.chatwoot.com/self-hosted/deployment/helm-chart)
- [chatwoot/charts on GitHub (Helm chart source)](https://github.com/chatwoot/charts)
- [Chatwoot LICENSE — MIT community edition + proprietary enterprise/ dir](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- [Developing Enterprise Edition Features — Chatwoot handbook](https://chatwoot.help/hc/handbook/articles/developing-enterprise-edition-features-38)
- [Chatwoot — How to use webhooks (HMAC signing headers)](https://www.chatwoot.com/hc/user-guide/articles/1677693021-how-to-use-webhooks)
- [Chatwoot Widget SDK — DeepWiki reference](https://deepwiki.com/chatwoot/chatwoot/6-widget-sdk)
- [Discourse is Not Going Closed Source — April 2026 blog](https://blog.discourse.org/2026/04/discourse-is-not-going-closed-source/)
- [Discourse API Docs (Api-Key / Api-Username auth)](https://docs.discourse.org/)
- [Bitnami Discourse container image is deprecated — Discourse Meta](https://meta.discourse.org/t/bitnami-discourse-container-image-is-deprecated/374875)
- [Upcoming changes to Bitnami catalog — bitnami/charts issue #35164](https://github.com/bitnami/charts/issues/35164)
- [Discourse OpenID Connect (OIDC) plugin — Discourse Meta](https://meta.discourse.org/t/discourse-openid-connect-oidc/103632)
- [Embed Discourse comments via JavaScript — Discourse Meta](https://meta.discourse.org/t/embedding-discourse-comments-via-javascript/31963)
- [crossplane-contrib/provider-terraform — Workspace managed resource](https://github.com/crossplane-contrib/provider-terraform)
- [Rocket.Chat License FAQs (MIT CE + source-available EE)](https://docs.rocket.chat/docs/license-faqs)
- [Mattermost Open-source licensing FAQ (AGPL/Apache/MIT mix)](https://docs.mattermost.com/about/faq-license.html)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Flarum** — `MIT` — self-host: yes — maturity: production-grade
- **Chatwoot (Community Edition)** — `MIT (core) + proprietary `enterprise/` carve-out` — self-host: yes — maturity: production-grade
- **Rocket.Chat (Community Edition)** — `MIT (core) + proprietary `ee/` carve-out` — self-host: yes — maturity: production-grade
- **Discourse** — `GPL-2.0-only` — self-host: yes — maturity: production-grade
- **Tiledesk** — `MIT` — self-host: yes — maturity: usable
- **Mattermost Team Edition** — `AGPL-3.0 (source) + MIT-COMPILED (binaries from Mattermost Inc. only)` — self-host: partial — maturity: production-grade
- **Element/Synapse (Matrix)** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **Talkyard** — `AGPL-3.0` — self-host: yes — maturity: usable

Imagine you're building a Lego set you plan to sell. Some Lego pieces have a sticker that says "if you sell this piece in a box with yours, you have to give away your own piece's instructions for free." That sticker is what copyleft licenses do. The trick is: which pieces have the sticker, and does "putting them in the same box" count as "bundling"?

For our template, "bundling" practically means: a Helm chart in our repo that points at someone else's Docker image. The OSI consensus (and the FSF's own "mere aggregation" carve-out in GPLv2 and AGPLv3) is that _referencing_ an upstream image you didn't modify is aggregation, not derivation — your code doesn't catch the copyleft sticker. That alone makes the live-chat / forum tier mostly safe to _reference_. The danger zone is the AGPLv3 "network use" clause (§13): if WE host the AGPL software AS PART of a managed product we sell, we owe customers the modified source. If the _customer_ self-hosts, they own that obligation, not us.

Now the four real choices, ranked by safety:

1. **Flarum (MIT).** Pure MIT, no enterprise carve-out, no future-conversion trap. Ship-and-forget. The catch: it's PHP — alien to a TS/Go/Rust/Python monorepo. You'd ship it as a sidecar container and accept the polyglot tax.

2. **Chatwoot (MIT core + proprietary `enterprise/`).** The OSS core is MIT, including the chat widget, agent inbox, automations, help center. The `enterprise/` directory (SSO/SAML, audit logs, custom branding) is proprietary. As long as we reference the **community image** (`chatwoot/chatwoot:vX.Y.Z-ce`) and don't pull from the enterprise image, we're MIT-clean. This is the sweet spot for our in-app widget use case.

3. **Rocket.Chat (MIT core + proprietary `ee/`).** Same structure as Chatwoot. Safe IF you reference the community image and don't enable EE features. There's recent friction (forced workspace registration with their cloud) which is operational, not legal — but a warning flag for "free as in lock-in."

4. **Discourse (GPLv2 only — no "or later").** Self-hosted, distributed unmodified, your customers don't catch GPL by USING a Discourse forum. The trap: if our template ships a Helm chart that _modifies_ Discourse code/themes, those mods inherit GPLv2. Also, GPLv2-only is incompatible with Apache-2.0 and AGPLv3 if you ever try to combine code — which we wouldn't, but worth knowing.

5. **AVOID for bundling: Mattermost server (AGPLv3 source + MIT compiled binaries from Mattermost Inc. only), Element/Synapse (AGPLv3 since Nov 2023), Talkyard (AGPLv3).** All three have a §13 trigger: if we host them inside our managed SaaS, we owe source. Safe ONLY when the end customer self-hosts them in their own cluster.

The macro lesson from 2024-2025: HashiCorp (BUSL), Elastic (SSPL → reversed to AGPL 2024), Redis (SSPL → reversed to AGPL May 2025), MongoDB (SSPL still). License flips happen overnight. The defense is: prefer truly permissive (MIT/Apache/BSD), and have a fork-or-swap plan for any copyleft tool you depend on.

**Key findings:**

- Flarum is the only candidate with a clean, no-strings MIT license — no enterprise carve-out, no copyleft, no relicense history. Safest possible choice for forum.
- Chatwoot's main LICENSE file is MIT but explicitly carves out the enterprise/ directory under a separate proprietary license. As long as we reference the \*-ce community image, we're MIT-clean and can bundle freely.
- Rocket.Chat uses the same dual structure (MIT core + proprietary `apps/meteor/ee/` and `ee/`). Community image is MIT-bundleable. Caveat: Rocket.Chat has been moving toward mandatory workspace registration with their cloud, which is operational lock-in pressure (not legal).
- Discourse is GPL-2.0-ONLY (verified — no 'or later' clause). For SaaS this is safe because GPLv2 has no network-use clause (the 'SaaS loophole'). Modifying Discourse forks them into GPLv2; unmodified distribution as a Docker image reference is 'mere aggregation' under GPLv2 §2.
- Mattermost is structurally a license trap: source is AGPLv3, but only binaries Mattermost Inc. compiles are MIT-licensed. If you fork, build your own image, and bundle it — you're back to AGPLv3 and §13 network-use kicks in if you host it as a managed service.
- Element/Synapse relicensed from Apache-2.0 to AGPLv3 in November 2023 — recent enough that older docs still call it Apache. If we host Matrix as part of our managed product (not customer self-host), we owe source under §13.
- Talkyard is AGPLv3 (verified directly from LICENSE.txt — no BUSL component despite stale third-party docs claiming dual-license). Same §13 risk as Synapse if we host it.
- The 'mere aggregation' principle (GPL §2, AGPL by extension) is the legal foundation that makes Helm-chart-referencing-upstream-image safe: a values.yaml that points at registry.example.com/discourse:latest is NOT a derivative work of Discourse.
- AGPL §13 'network use' is the load-bearing distinction. If the CUSTOMER deploys AGPL software in THEIR cluster, the customer owes source (not us). If WE host it inside our managed SaaS, WE owe source.
- 2024-2025 relicensing wave: Elastic SSPL→AGPL (Aug 2024), Redis SSPL→AGPL (May 2025), HashiCorp BUSL (still BUSL, IBM acquired). Lesson: license stability is a real risk factor; bundle copyleft tools only if a fork plan exists (Valkey for Redis, OpenTofu for Terraform).
- Papercups (Elixir, Intercom alternative) is in maintenance mode as of 2025 — security updates only, no new features. Do not adopt for greenfield work.
- Tiledesk (MIT) is a legitimate up-and-comer in the open-source chat widget space (2026 Product Hunt Golden Kitty for OSS), MIT-licensed — credible alternative to Chatwoot for the widget use case if a leaner footprint matters.

**Gotchas:**

- Mattermost MIT-binary trap: if you read 'Mattermost is MIT' on a Reddit post, that's only true for binaries Mattermost Inc. itself publishes. The moment you fork or rebuild from source, AGPLv3 applies. This trips up almost everyone.
- Chatwoot/Rocket.Chat enterprise images: if your Helm values default to chatwoot/chatwoot:latest, you may inadvertently pull an image that includes enterprise code. Always pin to the explicit Community Edition tag (`-ce` suffix on Chatwoot; check Rocket.Chat tag policy).
- Discourse is GPL-2.0-ONLY, not 'GPL-2.0-or-later'. This means you legally cannot relicense modifications to GPLv3 or AGPLv3, and combining Discourse code with Apache-2.0 code is a license-compatibility no-go (Apache-2.0 is one-way compatible with GPLv3, not GPLv2).
- Synapse used to be Apache-2.0. A LOT of docs and blog posts still say Apache. Confirm against the current LICENSE file in element-hq/synapse — not matrix-org/synapse (which was archived) — every time you bump versions.
- AGPL §13 means: if you (the template seller) RUN the AGPL software for customers as a managed service, you owe customers the source of YOUR modifications + linked code. This is the 'SaaS killer' clause and the entire reason Elastic/Mongo/Redis used SSPL.
- Helm chart 'bundling': there is no settled case law on whether shipping a Helm chart that templates AGPL code (e.g. ConfigMaps containing AGPL Lua scripts) constitutes a derivative work. Safe rule: only ship VALUES + IMAGE REFERENCES for AGPL software, never embed their code in your chart.
- Talkyard has stale documentation claiming dual AGPL+BUSL licensing. The current LICENSE.txt is plain AGPLv3. Don't rely on summary blog posts; always read the file in the repo at a pinned commit.
- License-change history is a stronger signal than current license. Companies that have flipped once (Elastic, Redis, HashiCorp, MongoDB) can flip again. Companies that have never flipped (Discourse 12+ years GPLv2, Flarum 10+ years MIT) are safer bets even at lower star counts.

**Recommendation (this angle):** **Recommended bundle for ts-monorepo-template live-chat/community tier:**

- **Public forum** (Just Me → Production): **Flarum** (MIT) as the default; offer **Discourse** (GPL-2.0) as a profile-selectable alternative for users who want the richer feature set and accept the GPLv2 modification rules. Both are SAFE to reference via Docker image in a Helm chart.
- **In-app chat widget + support inbox** (Side Project →): **Chatwoot Community Edition** (MIT core). Pin Helm values to the `-ce` image tag explicitly. Document the enterprise/ carve-out in the template's ATTRIBUTIONS file. SAFE for commercial bundling.
- **In-app community feed**: build on top of Chatwoot's conversation model OR ship Flarum embedded. Do not introduce a third tool.

**AVOID bundling into our managed offering**: Mattermost, Element/Synapse, Talkyard. All three are AGPLv3 — fine for customer self-host (the customer owns the §13 obligation), but if we EVER offer a managed-cloud version of the template, hosting these for paying customers triggers source-disclosure on our private code paths. List them as "BYO — self-host in your own cluster" options, not as bundled components.

**Operational guardrails:**

1. Add an OSS license scan (FOSSA or Trivy `--license-full`) to CI so a future maintainer bumping `image: chatwoot/chatwoot` to an enterprise tag gets caught.
2. Pin all upstream images to immutable digests, not floating tags, so a vendor-side license flip doesn't silently re-license what our customers run.
3. Maintain a `LICENSES-BUNDLED.md` in the template root listing every upstream tool, its license, its version, and the SAFE/CAUTION/AVOID rating.
4. For Discourse: ship our Helm values as Apache-2.0 (our code, our license) but ATTRIBUTE Discourse as GPL-2.0; never embed Discourse Ruby code in our chart templates.

**Overall flag for the live-chat/community tier: MIXED** — top picks (Flarum, Chatwoot CE, Rocket.Chat CE, Discourse) are SAFE for bundling; runner-ups (Mattermost, Synapse, Talkyard) are CAUTION-to-AVOID for managed offering, SAFE-only-for-customer-self-host.

**Citations:**

- [Discourse LICENSE.txt (GPL-2.0-only, verified)](https://github.com/discourse/discourse/blob/main/LICENSE.txt)
- [Discourse Meta — Do we need a commercial license for self-hosted Discourse?](https://meta.discourse.org/t/do-we-need-a-commercial-license-for-self-hosted-discourse/106187)
- [Mattermost LICENSE.txt (dual: AGPLv3 source + MIT compiled binaries)](https://github.com/mattermost/mattermost/blob/master/LICENSE.txt)
- [Mattermost — Open-source licensing FAQ](https://docs.mattermost.com/about/faq-license.html)
- [Element — A new home and license (AGPL) for Synapse and friends (Nov 2023)](https://element.io/blog/element-to-adopt-agplv3/)
- [Element — Sustainable licensing at Element with AGPL](https://element.io/blog/sustainable-licensing-at-element-with-agpl/)
- [Chatwoot LICENSE (MIT core + enterprise/ carve-out)](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- [Chatwoot GitHub repository](https://github.com/chatwoot/chatwoot)
- [Rocket.Chat LICENSE (MIT core + ee/ carve-out)](https://github.com/RocketChat/Rocket.Chat/blob/develop/LICENSE)
- [Flarum LICENSE (MIT)](https://github.com/flarum/flarum/blob/master/LICENSE)
- [Talkyard LICENSE.txt (AGPLv3 — direct from repo)](https://github.com/debiki/talkyard/blob/main/LICENSE.txt)
- [Mend — The SaaS Loophole in GPL Open Source Licenses (GPLv2 vs AGPL §13)](https://www.mend.io/blog/the-saas-loophole-in-gpl-open-source-licenses/)
- [Opensource.com — Containers, the GPL, and copyleft: No reason for concern (mere aggregation)](https://opensource.com/article/18/1/containers-gpl-and-copyleft)
- [FOSSA — Containers and Open Source License Compliance](https://fossa.com/blog/containers-open-source-license-compliance/)
- [Open-source relicensing 2024-2026 (Elastic→AGPL Aug 2024, Redis→AGPL May 2025, HashiCorp BUSL)](https://www.softwareseni.com/the-open-source-license-change-pattern-mongodb-to-redis-timeline-2018-to-2026-and-what-comes-next/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Chatwoot (Community Edition)** — `MIT` — self-host: yes — maturity: production-grade
- **Discourse** — `GPL-2.0-or-later` — self-host: yes — maturity: production-grade
- **Flarum** — `MIT` — self-host: yes — maturity: production-grade
- **Mattermost Team Edition** — `MIT (monthly compiled release)` — self-host: yes — maturity: production-grade
- **NodeBB** — `GPL-3.0` — self-host: yes — maturity: production-grade
- **Rocket.Chat Community Edition** — `MIT` — self-host: yes — maturity: usable
- **Element / Synapse (Matrix)** — `AGPL-3.0 (or commercial)` — self-host: yes — maturity: production-grade
- **Tiledesk** — `MIT` — self-host: yes — maturity: usable

Picture three different "rooms" your customers live in. Room A is the **public forum** — Stack Overflow style, Google-indexed, where people post once and the answer helps the next 10,000 visitors. Room B is the **live chat widget** in the bottom right of your marketing site — sales asks "what's your stack?", support asks "is this broken?". Room C is the **team chat** for internal humans + AI agents — Slack-ish. These three rooms have different needs, and the worst mistake is to try to merge them.

For the **public forum** (Room A), the field has effectively converged. Discourse is the gold standard — Markdown, real-time, plugin ecosystem, GPL v2, used by Rust, Hashicorp, Let's Encrypt. The license point matters: GPL v2 only triggers obligations if you **distribute modified Discourse**. Self-hosting it for your own users — even a paid product — is _not distribution_; that's the well-known SaaS loophole that AGPL was invented to close, and Discourse stayed on GPL v2 deliberately. So we can ship a `crossplane claim → discourse` flow and our customers can run it as part of their stack. We just can't bundle modified Discourse fork inside our commercial template binary. Flarum (MIT) is the lighter alternative for vibe-coders who want PHP-shared-hosting simplicity; NodeBB is GPLv3 (slightly stricter); Talkyard is now dual AGPL/GPL (avoid — the AGPL network clause is a footgun when we deploy it as part of a managed offering).

For the **live chat widget** (Room B), Chatwoot wins decisively. The Community Edition is **genuinely MIT** with no agent cap — that is rare. It's the de-facto open Intercom in 2026, ~24k GitHub stars, omnichannel (email + WhatsApp + IG + web widget), and the widget is plain JS you paste anywhere. We can ship the widget snippet directly inside the launcher's marketing site template without any license worry. The only nuance: Chatwoot's own guidelines politely ask you not to clone their SaaS — fine, we're not.

For **team chat / AI-agent comms** (Room C), Mattermost Team Edition (MIT, compiled monthly) beats Rocket.Chat for our purposes — Rocket.Chat CE caps at 100 concurrent users. Element/Matrix relicensed to **AGPL in 2024** and we should treat it as CAUTION: fine if the _customer_ self-hosts, dangerous if we host it as part of a paid managed offering without a commercial license from Element.

The recommendation flows from the 5-profile axis: Just Me + Side Project don't need any of this (point them to GitHub Discussions). Early Startup gets Chatwoot day-1 (the widget closes deals). Scaling Startup adds Discourse for the public knowledge base. Production at Scale gets Mattermost (or keeps Slack). Bundle = Crossplane XRDs + Helm charts that _deploy_ these, not forks we maintain.

**Key findings:**

- Public forum: Discourse is GPL-2.0-or-later and the SaaS loophole means hosting unmodified Discourse for paying customers does NOT trigger source-disclosure — only distributing a modified fork does. Safe to ship a Crossplane claim + Helm chart that deploys upstream Discourse.
- Live chat widget: Chatwoot Community Edition is unambiguously MIT-licensed with no agent cap on self-hosted, no concurrent-user cap, and the widget JS snippet is embeddable in any commercial site. This is the single most license-clean pick in the whole research scope.
- Chatwoot self-hosted Community = $0 software cost, ~$16-30/mo VPS infrastructure. Compare to Intercom Essential at $29/seat/mo + $0.99 per Fin AI resolution. For a 5-agent support team Intercom is ~$1,800/yr vs Chatwoot self-hosted ~$240/yr.
- Discourse hosted starts at $100/mo (Standard) and scales by user count. Self-hosted on a $12/mo 4GB VPS supports up to ~5,000 DAU. Crossover where self-host pays off vs hosted is roughly <10k DAU + a dev team that can run Linux.
- Flarum 2.0 ships in 2026 (RC April 20, requires PHP 8.3+). MIT-licensed, 16k+ GitHub stars, ~1,600 community extensions. Best for vibe-coders who want a single-PHP-VM forum vs Discourse's Postgres + Redis + Sidekiq stack.
- Element relicensed Synapse + Dendrite from Apache-2.0 to AGPL-3.0 in November 2023 and the move stuck through 2026. AGPL means: if WE deploy Matrix as a managed offering for paying customers, we must offer them the source of any modifications. Customer self-host = no obligation on us.
- Mattermost Team Edition is compiled and released under MIT on the 16th of every month, even though the source repo carries AGPL-3.0 for modifications. This dual posture is intentional and battle-tested.
- Rocket.Chat Community Edition is MIT but caps at 100 concurrent users by design. Mattermost Team Edition has no such cap. For our 'team chat' slot, Mattermost is the better commercial-template default.
- Papercups (the original open-source Intercom alternative) is archived and in maintenance mode — do NOT bundle. Tiledesk is a viable MIT-licensed alternative with stronger chatbot focus but smaller community than Chatwoot.
- Talkyard moved to dual AGPL/GPL with a rolling 5-year window in 2026 — license is too unusual for a commercial template default. Skip.
- NodeBB is GPL-3.0 (stricter than Discourse's GPL-2.0). Same SaaS-loophole math applies for self-host, but the v3 anti-tivoization clauses add friction for embedded/appliance customers — Discourse is the safer default.
- License posture for our 5-profile model: MIT picks (Chatwoot, Flarum, Mattermost TE) are zero-risk to bundle in launcher templates. GPL picks (Discourse, NodeBB) are safe to _deploy via Crossplane_ but never to fork-and-ship.

**Gotchas:**

- GPL v2 + SaaS: hosting unmodified GPL software for your customers does not trigger distribution obligations — but the moment we fork Discourse and ship the fork as part of our paid template, our customers can demand the source of our fork. Rule: deploy upstream, never fork into the template repo.
- Element/Matrix Synapse is AGPL-3.0 since late 2023. If we offer 'managed Matrix' as part of a SaaS tier of the template, the AGPL network clause kicks in and we owe source disclosure. Treat as 'customer self-host only' or buy Element's commercial license.
- Mattermost has a subtle dual-license model: source repo = AGPL-3.0, compiled monthly binary = MIT. Always pull the compiled binary, never build from source into your distribution, or you inherit AGPL.
- Chatwoot's MIT covers Community Edition only — the Enterprise Edition (advanced reporting, SLA, audit log, etc.) is proprietary. Make sure the Crossplane claim defaults to Community and doesn't accidentally enable enterprise features.
- Rocket.Chat Community Edition has hard caps: 100 concurrent users, 10,000 push notifications/month. These caps are not in the license — they are in the binary. Don't promise Scaling Startup users they can use CE.
- Talkyard's rolling 5-year AGPL/GPL window is unusual and the project has bus-factor 1 (KajMagnus). Don't bundle.
- Discourse requires Postgres + Redis + Sidekiq + an SMTP outbound (Mailgun/SES/Postmark). The SMTP requirement is the single most common self-host setup failure — bake it into the Helm chart preflight.
- Flarum requires PHP 8.3+ as of 2.0 — meaningfully newer than what shared hosts default to. Validate runtime before scaffolding the claim.

**Recommendation (this angle):** **Two-tool stack, bundle-by-profile, no forks.**\n\n**Pick 1 — Chatwoot (Community Edition, MIT)** for the in-app chat widget and support inbox. This is the day-1 bundle for **Early Startup ($30-150)** and above. Why: MIT license is the cleanest possible commercial posture, the widget is a plain JS snippet that drops into the launcher's marketing-site template with zero ceremony, no agent cap, and the self-hosted infrastructure cost (~$20-30/mo VPS) is an order of magnitude below Intercom Essential ($29/seat/mo + Fin AI fees). Ship as a Crossplane XRD `XChatwoot` + Helm chart deploying upstream image — do not fork.\n\n**Pick 2 — Discourse (GPL-2.0)** for the public community forum. This is the day-2 bundle for **Scaling Startup ($300-1500)** and above. Why: it's the unquestioned 2026 standard for technical communities, Google-indexes well (critical for SEO/GEO), and GPL v2's SaaS loophole means hosting it for our customers does not contaminate our commercial template. Ship as `XDiscourse` claim that provisions Postgres, Redis, and an SMTP secret — never embed a fork.\n\n**Three reasons FOR Chatwoot as the day-1 default:** (1) MIT is the only license posture that survives every commercial-template scenario without lawyering — fork it, embed it, resell it, all legal. (2) The economic gap vs Intercom is brutal: a 5-agent team saves ~$1,500/yr on software alone, more once Fin AI usage is counted. (3) Chatwoot already speaks omnichannel (email, WA, IG, web) so it scales with the customer's growth without forcing a tool migration.\n\n**Three reasons AGAINST Chatwoot:** (1) Intercom's Fin AI is materially better at unattended-resolution; AI-first SaaS startups will outgrow Chatwoot's AI features and want to migrate up. (2) The mobile SDKs are usable but lag Intercom and Crisp in polish — vibe-coders shipping mobile-first will feel it. (3) Self-hosting adds operational burden (Postgres + Redis + Sidekiq + push notifications setup) that Just Me / Side Project profiles will not survive — keep it out of their bundle.\n\n**Profile mapping (bundle defaults):**\n- Just Me ($0): exclude both — point at GitHub Discussions + Discord invite link.\n- Side Project ($5-20): exclude both — same.\n- Early Startup ($30-150): **Chatwoot day-1** (widget on marketing site). Forum deferred — direct to GitHub Discussions.\n- Scaling Startup ($300-1500): **Chatwoot day-1 + Discourse day-2** (public KB + community).\n- Production at Scale ($2k+): both, plus optional Mattermost Team Edition (MIT) for internal/AI-agent comms.\n\n**Commercial upgrade path to surface in the launcher:** Chatwoot Cloud (Startups tier $19/agent/mo) when ops burden exceeds savings; Intercom Essential ($29/seat) when Fin AI ROI is proven; Discourse Hosted ($100/mo) when forum DAU > ~5k. Element Matrix and Talkyard explicitly excluded due to AGPL / unusual-dual-license risk for a commercial template. Rocket.Chat excluded as default due to 100-concurrent-user CE cap.

**Citations:**

- [Discourse — Open Source (GPL v2)](https://www.discourse.org/open-source)
- [Discourse Pricing 2026](https://www.discourse.org/pricing)
- [Is Discourse Still Free to Self Host? — Discourse Meta](https://meta.discourse.org/t/is-discourse-still-free-to-self-host/305454)
- [Chatwoot — Open-source live-chat, email support, omni-channel desk (MIT)](https://github.com/chatwoot/chatwoot)
- [Chatwoot Self-Hosted Pricing](https://www.chatwoot.com/pricing/self-hosted-plans/)
- [Chatwoot vs Intercom: Pricing Comparison 2026](https://comparetiers.com/compare/chatwoot-vs-intercom)
- [Flarum — The extensible community framework (MIT)](https://flarum.org/)
- [Discourse vs Flarum vs NodeBB: Which Self-Hosted Forum Platform in 2026?](https://blog.elest.io/discourse-vs-flarum-vs-nodebb-which-self-hosted-forum-platform-in-2026/)
- [Mattermost — Editions and Offerings (Team Edition MIT, monthly compiled)](https://docs.mattermost.com/product-overview/editions-and-offerings.html)
- [Mattermost — Open-source licensing (AGPL source / MIT binary)](https://docs.mattermost.com/about/faq-license.html)
- [Rocket.Chat — Our Plans (CE = MIT, 100 concurrent user cap)](https://docs.rocket.chat/docs/our-plans)
- [Element — A new home and license (AGPLv3) for Synapse](https://element.io/blog/element-to-adopt-agplv3/)
- [NodeBB GPLv3 — Licenses and Pricing](https://community.nodebb.org/topic/17258/licenses-and-pricing-differences-between-the-free-developer-version-and-the-paid-hosting)
- [Tiledesk — MIT license, self-hosting](https://github.com/tiledesk)
- [The SaaS Loophole in GPL Open Source Licenses (Mend)](https://www.mend.io/blog/the-saas-loophole-in-gpl-open-source-licenses/)

---

## Team 11 — Session recording + heatmaps + error replay

### Synthesized verdict

- **Verdict:** `include-day-2`
- **Fit score:** 78 / 100
- **Top pick:** **PostHog (session replay module from MIT core / posthog-foss mirror)**
- **License:** `MIT (Expat) — core repo; ee/ subdir excluded; posthog-foss is 100% MIT mirror`
- **Default profile bundles:** `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

PostHog session replay is the only candidate that combines a clean commercial-bundling license (MIT in the core repo, with a posthog-foss mirror that strips the ee/ proprietary dir entirely) with a "batteries-included" surface that satisfies session replay + heatmaps + product analytics + feature flags + basic error tracking in one Helm install — which collapses 4 other research teams' tooling decisions into one operator. Three of four angle reports independently converge on PostHog as the default; the dissenting angle (tradeoffs) flags that PostHog removed self-hosted replay from the Community Edition in 2024, which is a real and material gotcha but does not block the Cloud-default path for the lower profiles or the posthog-foss self-host path for the upper profiles where ClickHouse + S3 are already in the stack. Critically, the obvious-sounding alternatives all fail license safety for a sold template: OpenReplay's backend is AGPL-3.0 (network-copyleft contaminates any managed offering we ever build on top), Sentry Replay is FSL-1.1 (not OSI-approved, "compete with Sentry" clause is ambiguous for a template that ships replay), Highlight.io is abandoned post-LaunchDarkly acquisition (Feb 2026 hosted shutdown), and Clarity is proprietary with a Microsoft data-licensing trap that disqualifies it from HIPAA/PCI/strict-GDPR workloads. Verdict is include-day-2 (not day-1) because (a) replay is a debugging/marketing tool, not a critical-path runtime dependency, (b) self-hosting it adds ClickHouse + S3 operational weight that is wasted for the Just-Me profile, and (c) the launcher CLI should prompt for it rather than force it.

**Integration outline:**

Wire PostHog as an optional Crossplane XRD (XSessionRecording) that composes provider-helm (mayflower/posthog-helm chart, version-pinned, with externalPostgres + externalClickHouse + externalS3 values pointing at our existing Bitnami PG / Altinity ClickHouse / MinIO so PostHog does not bring duplicate stateful stores) + provider-keycloak (SSO realm client) + provider-terraform wrapping the official PostHog Terraform provider (registry.terraform.io/providers/PostHog/posthog) for project + personal-API-key management + provider-kubernetes + External Secrets Operator to surface POSTHOG_API_KEY into the apps/web namespace. Day-1 wiring is one launcher verb: `task setup:session-recording PROVIDER=posthog` which (1) `pnpm add posthog-js @posthog/next` into apps/web, (2) writes NEXT_PUBLIC_POSTHOG_KEY into .env.local from the ESO-synced secret, (3) uncomments the rrweb-masking-config block in instrumentation-client.ts (maskAllInputs: true, maskTextSelector: '[data-private]', privacy_mode for password fields by default), (4) registers an Argo CD Application in the session-recording-stack ApplicationSet, (5) cuts a Kargo promotion stage→prod. For the MCP layer (Phase 12 / Aegis), expose three tool calls wrapping PostHog's REST API: get_replay_for_error(fingerprint), list_recent_sessions(filters), get_heatmap(url) — all read-only, scoped to a per-project API key. Profile defaults: Just-Me uses PostHog Cloud free tier (5k recordings/mo, zero ops); Side-Project uses PostHog Cloud; Early-Startup uses PostHog Cloud (still cheaper than running ClickHouse); Scaling-Startup migrates to self-host on the Crossplane XRD; Production-at-Scale runs self-host with sampling rate config (default 10%) and S3 lifecycle rules. Document posthog-foss as the canonical image for any "fork our template" path so customers never accidentally pull ee/ code. Add a CI SPDX scan that fails the build if any file with FSL, BUSL, SSPL, AGPL, or "PostHog Enterprise" SPDX identifier lands in the monorepo.

**Risks:**

- PostHog removed session replay from the self-hosted Community Edition in 2024 — replay self-host now requires the MIT core + posthog-foss path (which works, but every 2023-era tutorial misleads); document explicitly and pin known-good versions.
- PostHog officially sunset their first-party Helm chart in May 2023 — we depend on the community mayflower/posthog-helm chart, which is a real supply-chain and upgrade-cadence risk; version-pin tightly and preflight upgrades in stage via Kargo.
- ee/ subdirectory in the main PostHog repo is under the proprietary PostHog Enterprise License (forbids resale) — if anything from ee/ is ever vendored into our template we breach; CI SPDX guard is mandatory, not optional.
- Replay storage grows fast (rrweb event blobs are 200KB–2MB per 5-min session); self-host profiles must ship S3 lifecycle rules + sampling-rate config in defaults or customers will get surprise object-storage bills.
- All rrweb-based recorders (PostHog included) break on cross-origin iframes — Stripe Elements, embedded YouTube, OAuth popups will show blank rectangles in replay; document in runbook so customers do not file bug reports.
- Bundling 30–100 KB gzipped of posthog-js into the page bundle harms Core Web Vitals for the Just-Me marketing-site profile; lazy-load via dynamic import and gate behind cookie consent.
- PostHog Cloud pricing escalates at the Scaling-Startup tier ($0.005/recording after 5k, dropping to $0.0015 at 500k+); document the self-host migration cutover point so teams do not get caught by a surprise invoice.
- Privacy masking is configurable but not bulletproof — paste events, dynamic shadow DOM, and form autofill can leak PII unless masking config is reviewed; ship strict privacy-mode defaults (maskAllInputs: true) and require explicit opt-out, not opt-in.

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **PostHog (with session replay + heatmaps)** — `MIT (ee/ subdir excluded; posthog-foss mirror is 100% FOSS)` — self-host: yes — maturity: production-grade
- **rrweb** — `MIT` — self-host: yes — maturity: production-grade
- **OpenReplay (community)** — `AGPL-3.0 (+ EE proprietary in ee/, + some MIT dirs)` — self-host: yes — maturity: production-grade
- **Microsoft Clarity** — `Proprietary (free, no session limits)` — self-host: no — maturity: production-grade
- **Sentry Session Replay** — `FSL-1.1-Apache-2.0 (converts to Apache-2.0 after 2 years)` — self-host: yes — maturity: production-grade
- **Highlight.io** — `Apache-2.0` — self-host: yes — maturity: abandoned
- **FullStory / Hotjar / Smartlook** — `Proprietary SaaS` — self-host: no — maturity: production-grade

Session recording is "DVR for your web app": a tiny JS library serializes every DOM mutation, mouse move, scroll, input, and network call into a timeline, then a player reconstructs the session pixel-for-pixel in a sandboxed iframe. Heatmaps are just aggregates over those events (where clicks happen, how far people scroll). Error replay layers stack traces + console + network onto the timeline so you can debug "what the user actually saw."

Almost every OSS tool in this space — OpenReplay, PostHog, Sentry Replay, Highlight, Smartlook's web side — wraps the same upstream primitive: rrweb (MIT, 19.6k stars, actively maintained as of June 2026 with rrvideo@2.0.0). So the differentiator isn't recording fidelity; it's the backend (ClickHouse vs Postgres+S3), the UI, what they bundle (errors? heatmaps? product analytics?), and — critically for us — the license.

For a commercial template that we'll later sell, license is the whole game. Here's the 2026 landscape sorted by license safety:

1. rrweb itself (MIT) — the safest possible bet. If we want full control we can ship rrweb + a thin S3 sink and skip the all-in-one platforms.
2. PostHog (MIT for core; small EE dir excluded, and they ship a 100% FOSS mirror called posthog-foss). Session replay, heatmaps, product analytics, error tracking, feature flags — all in one. This is the strongest "batteries included" OSS choice in 2026 and the de facto standard for OSS PostHog-style stacks.
3. OpenReplay — looks open but is actually AGPL-3.0 by default (with an "ee/" proprietary dir and some MIT pockets). AGPL is fine if the _end user_ self-hosts it; it's a problem if we _bundle and operate it as a service_ in our managed offering. For a self-host-only profile (Just Me, Side Project, Early Startup), it's usable. For our Scaling/Production tier where we might host it, AGPL contaminates.
4. Sentry Session Replay — FSL (Functional Source License) since 2023. FSL is "Apache after 2 years" but immediately forbids competing commercial products. Since we're not competing with Sentry, FSL is technically OK for us to self-host and ship as a recommended dependency — but it is NOT OSI-approved and we can't market it as "open source." Treat as CAUTION.
5. Microsoft Clarity — free forever, proprietary, runs on 2M+ sites including major brands. Zero cost, zero session limits, AI summaries. But the price is data: Microsoft uses anonymized session data to train ads/AI models. For privacy-sensitive customers this is a non-starter; for vibe-coders shipping a landing page it's a no-brainer.
6. Highlight.io — Apache-2.0, but LaunchDarkly acquired it in March 2025 and shut down the hosted service Feb 28, 2026. The repo lives, but momentum is gone. AVOID for new builds.
7. FullStory / Hotjar / Smartlook — proprietary SaaS only, no self-host. Not relevant for an OSS template; mention as the "graduate to" tier.

The clean recommendation: ship PostHog as the default (one tool, covers replay + heatmaps + analytics + flags, MIT), document rrweb as the bring-your-own escape hatch, document Clarity as the zero-cost SaaS option for the Just-Me / Side-Project tiers, and explicitly warn against OpenReplay-as-managed-by-us and Sentry Replay in any "competes with Sentry" scenario.

**Key findings:**

- rrweb (MIT) is the underlying recording engine used by PostHog, OpenReplay, Highlight, and Statcounter — choice of platform is really a choice of backend + UI on the same primitive. Latest release rrvideo@2.0.0 shipped June 1, 2026; 19.6k stars, actively maintained.
- PostHog ships session replay under MIT (core repo) with an `ee/` directory carved out for paid features; they also publish posthog-foss for 100% MIT purity. Self-host has no recording cap; cloud free tier is 5k web replays/month. The strongest 'batteries-included' OSS pick in 2026.
- OpenReplay's default license is AGPL-3.0, NOT Elastic v2 or MIT as commonly assumed. The repo is a mix: ee/ proprietary, some MIT dirs, AGPL-3.0 default. Cloud-managed by US would trigger AGPL network-use clause and contaminate. Customer-self-hosted is fine.
- Sentry relicensed to Functional Source License (FSL) in 2023 — NOT BUSL anymore. FSL is stricter than BUSL: it permanently forbids competing commercial products (converting to Apache-2.0 after 2 years). Not OSI-approved; cannot be marketed as 'open source.'
- Microsoft Clarity is free forever (proprietary), powers 2M+ sites globally as of 2026, has no session caps, and shipped four AI features in 2026 (session summaries, Copilot chat with data, frustration detection, Brand Agents). Revenue model: anonymized data feeds Microsoft's ads/AI products.
- Highlight.io was acquired by LaunchDarkly in March 2025; the hosted service shut down February 28, 2026. Repo remains under Apache-2.0 but momentum is dead. Do NOT recommend for new builds.
- Self-hosted OpenReplay free tier is capped at 50K sessions/month; Dedicated cloud starts at $199/mo. Self-hosted is feature-complete (no artificial gating below 50K).
- PostHog cloud pricing for replay in 2026: $0.005/recording after 5K, dropping to $0.0015 at 500K+ — meaningful for the Scaling Startup ($300-1500) and Production ($2k+) profiles where teams may prefer self-host over paying per recording.
- All viable OSS options (PostHog, OpenReplay, Highlight, Sentry) require ClickHouse or similar columnar store for replay event data at scale. Adds operational weight — relevant when sizing the Early Startup vs Scaling Startup profiles.
- Privacy controls (PII masking, password input redaction, custom element masking) are first-class in rrweb upstream — every downstream tool inherits this. The differentiator is the UI affordance for configuring masks, not capability.

**Gotchas:**

- AGPL-3.0 trap: if WE host OpenReplay as part of our managed offering, network-use clause obligates us to release OUR template source under AGPL. Self-host-by-customer is safe. Make this distinction explicit in profile docs.
- FSL is NOT BUSL and NOT OSI-approved. If you market the template as 'fully open source,' shipping Sentry Replay as a default dependency creates a marketing claim mismatch. Document it as 'source-available recommended add-on.'
- rrweb's MIT license is permissive, but iframe sandboxing + DOM serialization has subtle privacy edges: form autofill, paste events, and dynamic shadow DOM can leak PII unless masking is configured. Ship privacy-mask config as defaults, not opt-in.
- Highlight.io looks alive on GitHub but the hosted service died Feb 2026 and LaunchDarkly has no public commitment to the OSS repo. Treat any tutorial recommending Highlight as outdated.
- PostHog's `ee/` directory is proprietary even though the main repo is MIT — anyone fork-and-selling needs to either delete ee/ or use posthog-foss. We should reference posthog-foss in any 'fork our template' guidance.
- Microsoft Clarity's data-for-free trade is incompatible with HIPAA/PCI/strict GDPR DPA stances. Fine for the vibe-coder marketing landing page, problematic the moment a customer ships an authenticated medical/financial app — document this hard.
- OpenReplay's monorepo license claim varies across third-party sources (some say Elastic v2, some MIT). The actual LICENSE file in the repo is the source of truth: AGPL-3.0 default + ee/ proprietary + MIT pockets. Verify before quoting in customer-facing docs.
- Session replay backend storage grows fast: rrweb events for a 5-min session can be 200KB-2MB compressed. Budget S3/object storage explicitly per profile tier; do not bury it in 'misc storage.'

**Recommendation (this angle):** Default to PostHog (MIT) as the bundled session-recording stack across all five profiles — it gives session replay + heatmaps + product analytics + error tracking + feature flags in a single Helm install, so we satisfy multiple research teams with one tool. For the Just Me ($0) and Side Project ($5-20) profiles, recommend Microsoft Clarity as a zero-ops SaaS alternative with an explicit privacy/data-tradeoff callout. Expose rrweb directly as the "bring-your-own backend" escape hatch for users who want maximum control or have a custom data residency requirement. Do NOT bundle OpenReplay as a managed service in our offering (AGPL contamination); list it as a customer-self-host option for users who prefer a dedicated session-replay UI over PostHog's. Do NOT include Sentry Session Replay in the default stack (FSL is not OSI-approved + competes-with-Sentry clause adds legal review burden); document it as an optional add-on for teams already paying Sentry. Drop Highlight.io entirely — abandoned post-LaunchDarkly acquisition.

**Citations:**

- [OpenReplay LICENSE (raw) — AGPL-3.0 default + ee/ proprietary + MIT pockets](https://github.com/openreplay/openreplay/blob/main/LICENSE)
- [OpenReplay GitHub — self-host repo, pricing tiers](https://github.com/openreplay/openreplay)
- [OpenReplay pricing — 50K sessions cap on OSS, $199/mo Dedicated](https://openreplay.com/pricing/)
- [PostHog GitHub — MIT license with ee/ carve-out, posthog-foss mirror](https://github.com/PostHog/posthog)
- [PostHog session replay pricing 2026](https://posthog.com/pricing)
- [PostHog: best open source session replay tools (2026 survey)](https://posthog.com/blog/best-open-source-session-replay-tools)
- [rrweb GitHub — MIT, 19.6k stars, rrvideo@2.0.0 (June 1, 2026)](https://github.com/rrweb-io/rrweb)
- [Sentry blog — FSL announcement (relicense from BUSL)](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/)
- [Sentry licensing page (FSL, Apache after 2 years)](https://open.sentry.io/licensing/)
- [Sentry self-host docs — includes Session Replay](https://develop.sentry.dev/self-hosted/)
- [Microsoft Clarity — free, no session limits, AI features 2026](https://clarity.microsoft.com/projects)
- [Microsoft Clarity 2026 product overview (2M+ sites, AI insights)](https://productgrowth.in/tools/analytics/microsoft-clarity/)
- [Highlight.io GitHub — Apache-2.0, LaunchDarkly-acquired](https://github.com/highlight/highlight)
- [Highlight.io self-host hobby docs (10k session cap warning)](https://highlight.io/docs/general/company/open-source/hosting/self-host-hobby)
- [Temps blog — Self-host session replay 2026 landscape comparison](https://temps.sh/blog/can-you-self-host-session-replay-2026)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **PostHog (session replay module)** — `MIT (main repo); ee/ subdir excluded` — self-host: yes — maturity: production-grade
- **Sentry Session Replay (self-hosted)** — `FSL-1.1-Apache-2.0` — self-host: yes — maturity: production-grade
- **OpenReplay (community edition)** — `AGPL-3.0 (main); MIT (tracker SDK subdirs); EE separate` — self-host: yes — maturity: production-grade

Session recording is "DVR for your web app." A tiny JS snippet (a tracker) hooks into the DOM via rrweb-style mutation observers, captures every DOM diff, mouse move, click, scroll, network request, and console error, then streams the deltas to a backend. The backend stitches them into a replayable timeline so you can literally watch a user fail. Heatmaps are just aggregates over those clicks; "error replay" is the same recording filtered to sessions where an exception fired.

For our template the integration question is not "which tool records the best?" — they all use rrweb underneath. The question is **how does the tool plug into a Nx + Crossplane + Argo CD + Kargo monorepo without infecting our commercial license**? Three live contenders matter in 2026: OpenReplay, PostHog session replay, and Sentry Session Replay.

License surprise first. The brief said "OpenReplay (Apache 2.0)" — that is wrong. OpenReplay's main code is **AGPLv3** with an enterprise edition gated behind a separate EULA. AGPLv3 is the network-copyleft license: if WE deploy OpenReplay as part of OUR managed offering, our SaaS users get a right to OUR modified source. Self-hosted by the customer in their cluster is fine. Bundling the helm chart and pointing at it from our launcher CLI is fine. Running it in our managed hosted offering = legal hazard. Treat as CAUTION.

PostHog's main repo is **MIT** (the `ee/` directory is separate and we just don't ship it). Session replay capture happens in `posthog-js` (MIT). The server-side replay stack lives in the main MIT repo. The has-it-all answer: SAFE.

Sentry is **FSL-1.1-Apache-2.0** (Functional Source License). The only forbidden use is "compete with Sentry's hosted offering." Bundling Sentry into our template for users to self-host is explicitly fine; offering Sentry-as-a-service is not. Session replay shipped to self-hosted Sentry in late 2024 and is stable in 25.x. Treat as CAUTION but practically safe.

Integration mechanics for our stack:

1. **No Crossplane provider exists for any of them.** Wrap the official Helm chart in a Crossplane Composition that takes a `XSessionRecording` claim, uses provider-helm to install the chart, provider-keycloak to wire SSO, and provider-kubernetes to seal a project-key secret that ExternalSecrets surfaces to apps.

2. **All three expose a JS tracker via npm** — `@openreplay/tracker`, `posthog-js`, `@sentry/replay`. Drop into our shared `@template/observability-web` package; the launcher CLI's `task setup:session-recording` writes the env var (`NEXT_PUBLIC_POSTHOG_KEY` etc.) into `.env.local` and uncomments the import in `instrumentation-client.ts`.

3. **MCP-wrapability** — PostHog has the richest REST API and an official Terraform provider so an Aegis MCP tool ("get_replay_for_error") is a thin wrapper. OpenReplay exposes a REST API for sessions/events. Sentry has a webhook-driven Issues API that emits replay URLs on error events — perfect for Aegis to consume.

**Key findings:**

- CORRECTION TO BRIEF: OpenReplay is NOT Apache-2.0. Main code is AGPLv3 (LICENSE file confirms), with some subdirs MIT and the ee/ subdir under a separate Enterprise Agreement. It was briefly ELv2 and switched to AGPLv3 dual-license. This materially changes safety analysis.
- PostHog session replay uses rrweb under the hood, captured via posthog-js (MIT), ingested by a Rust HTTP capture service, stored in S3 + ClickHouse session_replay_events table. Main repo MIT, only ee/ is separately licensed.
- Sentry switched to FSL-1.1-Apache-2.0 in late 2023; it auto-converts to Apache-2.0 after 2 years. Self-hosted is permitted; the only forbidden use is competing with Sentry's hosted offering.
- Sentry Session Replay is now available in self-hosted Sentry (25.x in 2026), gated behind SENTRY_FEATURES['organizations:session-replay'] and 'session-replay-ui' feature flags in config.py.
- PostHog officially sunset their Helm chart in May 2023. The current self-host path is Docker Compose (official) or the community mayflower/posthog-helm chart for K8s. This is a real operational drag for our Helm-chart-first template.
- OpenReplay ships a first-party Helm chart (scripts/helmcharts/) packaging PostgreSQL + Redis + ClickHouse; min footprint 2 vCPU / 8 GB RAM / 50 GB disk; HTTPS is mandatory or the tracker refuses to start.
- No first-party Crossplane provider exists for any of the three. Integration path is provider-helm + provider-kubernetes + provider-keycloak composed into an XRD (XSessionRecording).
- PostHog has an official Terraform provider (registry.terraform.io/providers/PostHog/posthog) — can manage projects, feature flags, and personal API keys from IaC. Crossplane provider-terraform can bridge this into an XRD without writing a native provider.
- OpenReplay tracker SDK (@openreplay/tracker, MIT-licensed subdir) does client-side PII masking by default (email obfuscation on by default, numeric obfuscation opt-in). Sanitization happens before bytes leave the browser.
- PostHog session_recording config supports maskAllInputs, maskTextSelector, and a privacy-mode that records DOM structure only (no text). Setting cookie consent via posthog.opt_in_capturing() is the standard GDPR gate.
- Sentry's @sentry/replay defaults to maskAllText: true and maskAllInputs: true — the most privacy-conservative default of the three.
- MCP-wrap surface: PostHog's REST API exposes /api/projects/:id/session_recordings with filtering by person, error, custom event — ideal for Aegis 'fetch replay for incident' tool calls.

**Gotchas:**

- AGPL trap (OpenReplay): if our managed offering ever hosts OpenReplay for paying users, AGPL §13 triggers — we must publish our modifications. Bundling-for-self-host is fine; managed-for-customers is not.
- PostHog Helm chart is community-maintained (mayflower) since PostHog officially sunset Helm — version pin carefully and pre-flight upgrades. Their preferred self-host path is Docker Compose, which doesn't fit our Argo CD GitOps model cleanly.
- Sentry Session Replay in self-hosted requires explicit feature flag enablement in sentry.conf.py AND ClickHouse + Kafka must be healthy — replay ingestion fails silently if Kafka backlogs.
- ELv2 historical context: OpenReplay was on ELv2 before AGPL — if you find old guides referencing 'OpenReplay (Apache)' they are wrong on TWO counts. Always re-verify the LICENSE file in main on every upgrade.
- All three trackers add 30-100 KB gzipped to the page bundle; lazy-load via dynamic import in the framework launcher to keep Core Web Vitals green for the 'Just Me' (USD 0) profile.
- rrweb-based recorders break on cross-origin iframes; if the template's payment integration uses a Stripe iframe, expect blank rectangles in replay. Document this in the runbook.
- PostHog and OpenReplay both ship PostgreSQL, Redis, ClickHouse as part of the helm chart by default — collisions with our existing Bitnami PG / Altinity ClickHouse stack. Use the chart's externalPostgres / externalClickHouse values, do NOT let it bring its own.
- Sentry's BUSL-to-FSL transition in 2023 means older Sentry < 23.6 is still BUSL — pinning to current 25.x avoids confusion.

**Recommendation (this angle):** Default to **PostHog session replay** for the Side Project (USD 5-20) through Scaling Startup (USD 300-1500) profiles. MIT licensing is the cleanest fit for our commercial template, the posthog-js SDK is one npm install + 4 lines in `instrumentation-client.ts`, the Terraform provider lets us manage projects/keys via Crossplane provider-terraform wrapped in an XSessionRecording XRD, and the REST API is the richest surface for the Phase 12 MCP server (Aegis can fetch a replay URL given an error fingerprint). Accept the Helm-chart-sunset drag by pinning mayflower/posthog-helm and documenting that PostHog Cloud is the recommended path for Just Me / Side Project profiles.

For Production at Scale (USD 2k+) profile, offer **Sentry Session Replay** as the second-option lane — it pairs naturally with Sentry error tracking which the same profile likely already runs, FSL is operationally identical to Apache-2.0 for our bundling use case, and self-hosted 25.x supports replay GA. The wiring is the same launcher verb (`task setup:session-recording PROVIDER=sentry`).

Treat **OpenReplay as a CAUTION-flagged third option** for users with strict data-residency requirements (EU AGPL-tolerant orgs) who want the best out-of-box replay UX and on-prem mandate. Ship the XRD but gate it behind a `template.config.session_recording.allow_agpl: true` opt-in in the launcher, with a clear note that THIS WE-AS-SAAS-FOR-CUSTOMERS deployment is incompatible with AGPL §13.

Day-1 wiring (10 commands) for the PostHog path:

```
1. pnpm add posthog-js @posthog/next               # in apps/web
2. task setup:session-recording PROVIDER=posthog   # launcher writes env + uncomments import
3. terraform apply -target=module.posthog_keys     # via crossplane provider-terraform XRD
4. kubectl apply -f xrds/xsessionrecording.yaml    # claim creates project + key + ESO secret
5. argocd app sync session-recording-stack         # provider-helm installs posthog if self-host
6. kubectl get externalsecret posthog-keys -n web  # verify ESO sync from Vault → K8s secret
7. kubectl rollout restart deploy/web -n web       # pick up new env var
8. curl https://app.local/api/health/replay        # smoke test recording endpoint
9. task verify:session-recording                   # opens incognito browser, triggers test event
10. kargo promote stage→prod replay-config         # cut promotion via existing Kargo pipeline
```

Stop adding tools to the bundle after this — three is already two too many. Lock the default to PostHog, ship Sentry + OpenReplay as alternate launcher presets, document AGPL hazard prominently in the OpenReplay preset's README banner.

**Citations:**

- [OpenReplay LICENSE (AGPLv3 + MIT subdirs + EE)](https://github.com/openreplay/openreplay/blob/main/LICENSE)
- [OpenReplay: Is it really FOSS? (license history ELv2 → AGPL)](https://isitreallyfoss.com/projects/openreplay/)
- [OpenReplay Helm chart (scripts/helmcharts)](https://github.com/openreplay/openreplay/blob/main/scripts/helmcharts/init.sh)
- [OpenReplay Deploy to Kubernetes docs](https://docs.openreplay.com/en/deployment/deploy-kubernetes/)
- [@openreplay/tracker on npm (MIT)](https://www.npmjs.com/package/@openreplay/tracker)
- [OpenReplay JavaScript SDK constructor (privacy options)](https://docs.openreplay.com/en/sdk/constructor/)
- [OpenReplay Integrations & API page](https://openreplay.com/platform/integrations-api/)
- [PostHog GitHub (MIT main + ee/ subdir separate)](https://github.com/PostHog/posthog)
- [PostHog session replay architecture](https://posthog.com/handbook/engineering/session-replay/session-replay-architecture)
- [PostHog session replay docs](https://posthog.com/docs/session-replay)
- [PostHog sunsetting Helm support announcement](https://posthog.com/blog/sunsetting-helm-support-posthog)
- [Community mayflower/posthog-helm chart](https://github.com/mayflower/posthog-helm)
- [Official PostHog Terraform Provider](https://registry.terraform.io/providers/posthog/posthog/latest/docs)
- [PostHog Next.js integration docs](https://posthog.com/docs/libraries/next-js)
- [Sentry FSL announcement (Nov 2023)](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **PostHog (session replay module, in MIT core)** — `MIT (Expat) for core including session replay; ee/ directory under PostHog Enterprise License (not used by replay)` — self-host: yes — maturity: production-grade
- **rrweb** — `MIT` — self-host: yes — maturity: production-grade
- **OpenReplay (self-hosted)** — `AGPL-3.0 (core) + MIT (parts) + proprietary EE in ee/` — self-host: yes — maturity: production-grade
- **Sentry self-hosted (session replay add-on)** — `FSL-1.1-Apache-2.0 (converts to Apache-2.0 after 2 years per release)` — self-host: yes — maturity: production-grade
- **Microsoft Clarity (script-tag only)** — `Proprietary EULA, free of charge` — self-host: no — maturity: production-grade

Think of a session-recording tool as a TV camera that records every click, scroll, and DOM change a user makes in your web app, plus a playback theatre that lets your engineers re-watch what happened just before a bug, plus a heatmap painter that overlays "where did everyone click" on top of a screenshot. Underneath, almost every modern player is built on the same open-source library: rrweb (MIT licensed). The differences live in the rest of the stack — the ingest server, the storage backend, the dashboard UI, the privacy controls, and especially the license those higher layers ship under.

For ts-monorepo-template we have a special problem: we sell the template. That means the moment our customers download it and run `task up`, they are using whatever tools we bundled. If a tool's license says "you can use this for yourself but you cannot ship it as part of a product you sell," then bundling it is a contract violation — even if we never charge for the tool itself, we charge for the template that pulls it.

Three license families matter here:

1. Permissive (MIT, Apache-2.0, BSD): you can do anything, including resell, as long as you keep the copyright notice. Safe.
2. Network copyleft (AGPL-3.0): you may use, modify, resell — but if anyone interacts with the software over a network, you must offer them the source code of any modifications. If you ship AGPL software as a Docker image referenced from your Helm chart and never modify it, the obligation is weak (just attribution). If you fork it, things get heavy.
3. Source-available "anti-competition" (FSL, BUSL, SSPL, Commons Clause, PostHog-EE): you can read and run the code, but you can't include it in a product that competes with the upstream vendor's commercial offering. These are the dangerous ones — bundling Sentry FSL into a template that "monitors and replays user sessions" arguably IS competing with Sentry.

Concretely:

- rrweb — MIT. The recorder library. Always safe.
- PostHog core — MIT (Expat). Session-replay code lives in the MIT core, not the ee/ directory. Safe to bundle as a reference. The ee/ folder has an Enterprise License that forbids resale; that folder also contains things like SAML and project-permissioning — none of which our template requires.
- OpenReplay — AGPL-3.0 + a small MIT carve-out + an enterprise-licensed ee/. We never have to modify the OpenReplay source to use it, but bundling AGPL inside a paid template should be treated as "ship a values.yaml that pulls the public Docker image, never fork." Caution.
- Sentry — FSL-1.1-Apache-2.0. Reverts to Apache-2.0 after two years per release. It explicitly forbids commercial use that competes with Sentry. A monorepo template that bundles Sentry session-replay is probably fine (we sell the template, not session-replay-as-a-service), but a defensible reading is uncertain. Caution.
- FullStory / Hotjar / Smartlook / Clarity — proprietary SaaS, no self-host, EULA-only. Cannot be "bundled" in any meaningful sense, only referenced via an opt-in script tag. Clarity is free forever, the others are paid.

Plain rule of thumb for the launcher: ship PostHog (MIT) by default for the "Side Project" tier, offer OpenReplay as a separate self-hosted profile clearly labelled AGPL, and treat Sentry replay as opt-in error-monitoring rather than core session replay.

**Key findings:**

- PostHog session-replay code lives in the MIT-licensed core repo, NOT in the ee/ directory. The ee/ directory contains SAML, advanced RBAC, and other enterprise gates — none of which session replay depends on. Bundling PostHog's MIT core (or the posthog-foss mirror, which strips ee/ entirely) is unambiguously safe for commercial resale.
- OpenReplay is multi-licensed: AGPL-3.0 default, MIT for some folders, proprietary 'Enterprise' for the ee/ directory. It was historically marketed as 'open source' under Elastic License 2.0 before switching — flagged as 'open-washing' by isitreallyfoss.com. The AGPL default means: if our customers run unmodified OpenReplay Docker images via Helm, attribution and source-availability obligations are minimal; if they fork it, the network copyleft kicks in for their users.
- Sentry uses FSL-1.1-Apache-2.0 (Functional Source License), NOT BUSL as commonly assumed in 2023 press. FSL was created by Sentry itself in late 2023. The license forbids using Sentry's code in 'a commercial product or service that competes with the Software.' After 2 years from each release, that version reverts to Apache-2.0.
- FSL's 'competing product' clause is the bundling trap: a monorepo template that ships Sentry session replay as a built-in feature could be argued to compete with Sentry's commercial offering. Sentry's own self-hosted bundle docs say in-house/internal use is fine but reselling self-hosted Sentry as part of a SaaS offering is not.
- FullStory, Hotjar (Contentsquare), Smartlook (Cisco), and Microsoft Clarity are pure SaaS with proprietary EULAs. They cannot be bundled — only integrated via opt-in script tags configured by the end customer with their own account. Microsoft Clarity is free forever and the only zero-cost option here, but it's Microsoft-proprietary, no self-host, and feedback you give Microsoft is licensed back to them for any purpose.
- rrweb (MIT) is the underlying recorder library used by PostHog session replay, Sentry session replay, OpenReplay's tracker, and many proprietary tools. Building your own thin player on rrweb is the most license-clean route, but you lose the ingest server, S3-backed storage, replay UI, and PII masking heuristics.
- AGPL-3.0's network clause only triggers when modifications are made and exposed to users over a network. Shipping an unmodified upstream Docker image via a Helm values reference is the lowest-risk AGPL bundling pattern — no source-disclosure obligation beyond the standard attribution.
- PostHog Cloud (managed) is hosted by PostHog Inc.; their MIT-licensed self-host path is fully separate. Customers can pick either via a profile flag — no license cross-contamination either direction.
- Bundling matrix for ts-monorepo-template: rrweb (SAFE) → PostHog core (SAFE) → OpenReplay non-EE (CAUTION, ship as opt-in profile) → Sentry replay (CAUTION, opt-in profile labelled FSL) → Clarity/Hotjar/FullStory/Smartlook (cannot bundle, only document as integration options).
- PostHog Enterprise License (ee/LICENSE) text explicitly says: 'it is forbidden to copy, merge, publish, distribute, sublicense, and/or sell the Software' — so if anything from ee/ ever lands in our template, we breach. Verify with a CI gate that no ee/-derived code is vendored.
- OpenReplay's CLA requires contributors to assign rights back to Asayer Ltd., meaning OpenReplay can relicense any contributions. Important if we ever upstream patches: don't.
- Sentry's FSL was deliberately authored after Sentry's experience with BSL — it's BSL with cleaner wording and a shorter (2-year not 4-year) conversion window. Both the FSF and OSI consider FSL non-open-source. Use Sentry SDKs (MIT) freely; treat Sentry server bundle with caution.

**Gotchas:**

- The 'PostHog is MIT' claim is true only for the main repo minus ee/. If you build a Docker image from the full repo, you have linked ee/ code in. Always either use posthog-foss or build from main with ee/ explicitly excluded.
- OpenReplay's GitHub readme and marketing still call it 'open source' generally; the actual default license is AGPL-3.0, not Apache-2.0 or MIT. Don't take their landing-page wording at face value.
- Sentry's FSL converts to Apache-2.0 after 2 years per release — but 'per release' means each tagged version has its own clock. The Sentry server you self-host today won't be Apache-2.0 until ~2028. Don't assume 'it's basically Apache anyway.'
- AGPL exposure spreads if you fork. If a customer adds a custom OpenReplay event filter and exposes it to their users over the network, AGPL says they must offer those users the modified source. That's the customer's burden — but our template's docs should warn them.
- Microsoft Clarity's terms grant Microsoft the right to 'use, share and commercialize' any feedback you send them — and Clarity itself collects session data. For a privacy-sensitive customer, Clarity is a different kind of license trap: data licensing, not code licensing.
- Sentry session replay (the feature) is included in Sentry SaaS pricing but is BANDWIDTH-bounded in self-hosted. The FSL covers both, but the self-host bundle's docker-compose ships with limits — replays are not free to run at scale even if the license were.
- 'Competing product' under FSL is undefined for templates. Sentry has been silent on whether a developer-tools template that ships Sentry self-hosted as one of multiple options 'competes' with Sentry. Best practice: ship the integration but not the Sentry binary itself — let the customer pull it.
- If we ever expose a hosted version of ts-monorepo-template as a SaaS (rather than selling the template source), the AGPL network clause on OpenReplay and the FSL competition clause on Sentry both become live — completely different risk profile from selling the source.

**Recommendation (this angle):** Ship PostHog session replay as the default in the Side Project / Early Startup profiles — it lives in PostHog's MIT-licensed core, is the same rrweb-backed tech as Sentry/OpenReplay, and the license imposes nothing on us or our customers beyond a copyright notice. Add OpenReplay as an explicitly-named optional profile flagged AGPL, documented to be deployed only as unmodified upstream Docker images via a Helm values reference; never fork it into the monorepo. Treat Sentry server as opt-in for error monitoring only, not as a bundled session-replay default — its FSL competing-product clause creates ambiguous risk for a commercial template, and the 2-year-to-Apache conversion doesn't help us today. Document Microsoft Clarity, Hotjar, FullStory, and Smartlook as integration recipes (script-tag snippets the customer configures with their own account) rather than bundled options — they cannot be self-hosted and their proprietary EULAs forbid embedding. Add a CI guard: SPDX scan the monorepo and fail the build if any file with an FSL, BUSL, SSPL, or 'PostHog Enterprise' SPDX identifier is committed. License safety verdict for the bundle: PostHog SAFE, rrweb SAFE, OpenReplay CAUTION (AGPL — opt-in profile only), Sentry server CAUTION (FSL — opt-in profile, prefer Sentry SDKs which are MIT), Clarity/Hotjar/FullStory/Smartlook AVOID for bundling but acceptable for documented integration.

**Citations:**

- [openreplay/openreplay LICENSE on GitHub](https://github.com/openreplay/openreplay/blob/main/LICENSE)
- [Is OpenReplay Really FOSS?](https://isitreallyfoss.com/projects/openreplay/)
- [PostHog/posthog LICENSE on GitHub (MIT Expat core)](https://github.com/PostHog/posthog/blob/master/LICENSE)
- [PostHog/posthog ee/LICENSE on GitHub (PostHog Enterprise License)](https://github.com/PostHog/posthog/blob/master/ee/LICENSE)
- [Sentry Licensing — FSL-1.1-Apache-2.0](https://open.sentry.io/licensing/)
- [Introducing the Functional Source License — Sentry Blog](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/)
- [Self-Hosted Sentry — Sentry Developer Documentation](https://develop.sentry.dev/self-hosted/)
- [rrweb GitHub repo (MIT)](https://github.com/rrweb-io/rrweb)
- [GNU Affero General Public License v3.0 — Free Software Foundation](https://www.gnu.org/licenses/agpl-3.0.en.html)
- [AGPL Compliance Guide — Vaultinum](https://vaultinum.com/blog/essential-guide-to-agpl-compliance-for-tech-companies)
- [Open Source Software Licenses 101: The AGPL License — FOSSA](https://fossa.com/blog/open-source-software-licenses-101-agpl-license/)
- [Microsoft Clarity Terms of Use](https://clarity.microsoft.com/terms)
- [PostHog Session Replay docs](https://posthog.com/docs/session-replay)
- [Best Open Source (and self-hosted) Session Replay tools — PostHog blog](https://posthog.com/blog/best-open-source-session-replay-tools)
- [Sentry Introduces Non-Open-Source Functional Source License — InfoQ](https://www.infoq.com/news/2023/12/functional-source-license/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Microsoft Clarity** — `Proprietary (free forever, unlimited)` — self-host: no — maturity: production-grade
- **OpenReplay (Community)** — `AGPL-3.0 (backend) + MIT (trackers/SDKs)` — self-host: yes — maturity: production-grade
- **Sentry Session Replay** — `FSL-1.1-Apache-2.0 (2-year Apache conversion)` — self-host: yes — maturity: production-grade
- **PostHog Session Replay (Cloud)** — `MIT (core) — but replay self-host removed 2024; Cloud-only in practice` — self-host: no — maturity: production-grade
- **rrweb (DIY building block)** — `MIT` — self-host: yes — maturity: production-grade

Imagine a junior dev's app is acting weird on a customer's phone. They want a DVR for the browser — every click, scroll, network call, console error — so they can rewind and watch what happened, then look at a heatmap to see where everyone is rage-clicking. That's session recording + heatmaps + error replay. The bones of all of this is one MIT-licensed JavaScript library called rrweb, which serializes DOM mutations on the client and replays them on a canvas later. PostHog, Sentry, OpenReplay, Smartlook, and even Microsoft Clarity all sit on top of rrweb or something equivalent.

The four real contenders for our template:

1. PostHog session replay — built on rrweb; great PII masking out of the box (inputs masked by default, CSS-selector and regex masking, all in the browser before bytes leave the device). The catch we MUST flag: in 2024 PostHog removed session replay from the self-hosted Community Edition. CE still does analytics + flags self-hosted, but for replay you must go PostHog Cloud (paid) or the proprietary "self-hosted Enterprise" SKU. So PostHog "open source self-hosted session replay" is, in 2026, effectively a myth.

2. OpenReplay — actually self-hostable, the OSS replay heavyweight: DevTools-grade tracking (network, console, Redux state, performance), co-browsing via WebRTC, PII masking. License: backend is AGPL-3.0. AGPL is the dangerous one for our open-core product — if WE deploy OpenReplay as part of our managed offering, the network-use clause kicks in and our app code may need to be open. For SELF-HOST by the END USER on their cluster, AGPL is fine; they're not redistributing to anyone but themselves. The trackers (JS, mobile SDKs) ship under MIT, so embedding them in any app is safe.

3. Sentry session replay — FSL-1.1 + Apache-2.0 (every release converts to Apache 2.0 after 2 years). FSL forbids building a competing commercial Sentry product. We're a monorepo template, not an error-tracking SaaS — so we're SAFE. Best-in-class for error replay (because the error tracker IS the same product).

4. Microsoft Clarity — free forever, unlimited, proprietary SaaS. Zero ops. Free tier for our users beats every OSS option on TCO. Cost: trust Microsoft with your visitor data and accept aggregated use for Bing ads.

Hotjar / FullStory / Smartlook are pure proprietary SaaS with no free-forever tier; they're upgrade-path comparisons, not bundle candidates.

The product split: a startup founder on "Just Me" or "Side Project" doesn't want to run a replay backend. They want one script tag. Clarity wins. By "Scaling Startup" they care about masking discipline, debugging, and data sovereignty — that's where OpenReplay self-hosted earns its keep. Sentry replay piggybacks on the error tracker we'd already bundle for any error-tracking team.

**Key findings:**

- rrweb (MIT) is the substrate for nearly every modern replay tool (PostHog, OpenReplay, Sentry) — safe to embed anywhere.
- OpenReplay backend is AGPL-3.0. For END USERS self-hosting on their own cluster, AGPL is fine. For US (the template authors) shipping a managed multi-tenant SaaS that bundles OpenReplay, the network-use clause triggers source disclosure — so we must NOT host OpenReplay as part of our paid managed offering. The MIT-licensed tracker SDKs are safe to ship regardless.
- PostHog REMOVED session replay from the self-hosted Community Edition in 2024 — replay is now Cloud-only (or proprietary self-hosted Enterprise). 'Self-host PostHog replay' is a 2026 myth.
- PostHog Cloud free tier: 5,000 web recordings/month free, then $0.005/recording; mobile is 2x web. Most generous free-tier in the category.
- Sentry switched from BUSL to FSL-1.1 (Functional Source License) — every release converts to Apache 2.0 after 2 years. We are SAFE: we are not building a competing error-tracking SaaS, we're a monorepo template.
- Microsoft Clarity: free forever, unlimited sessions, unlimited heatmaps, proprietary. In 2026 added AI session summaries, Funnels, Highlights (90-sec replay reels). Trade-off: Microsoft uses aggregated/anonymised data to improve Bing ads targeting.
- PostHog's privacy controls run entirely client-side: maskInputFn, maskCapturedNetworkRequestFn, CSS-selector masking — sensitive data never leaves the browser. Strongest PII story of the OSS options.
- OpenReplay self-host infra cost: ~$6-$12/month on a small VPS for low traffic; scales with ClickHouse + MinIO/S3 for replay blobs.
- Smartlook, Hotjar, FullStory: pure proprietary SaaS, no free-forever tier above trivial limits. Useful only as upgrade-path comparisons (FullStory ~$200+/mo enterprise, Hotjar Basic $32/mo, Smartlook $55/mo).
- Sentry self-host single docker-compose ships replay + error tracking + tracing in one box — strongest 'one tool, three jobs' story for the Scaling Startup profile.

**Gotchas:**

- AGPL trap on OpenReplay: if we EVER add a 'hosted template' SaaS where we operate OpenReplay for paying customers, the network-use clause kicks in and our wrapping code must be AGPL too. Document this loudly; only end-user self-host is safe.
- PostHog session replay self-host is dead since 2024. Any tutorial older than that lies. Treat PostHog replay as Cloud-only.
- PostHog deprecated ClickHouse-backed recordings — now requires blob storage (S3-compatible). Self-host migration breakage if you cached a 2023 recipe.
- Clarity sends raw session data to Microsoft. For EU/India PII-regulated workloads, Clarity alone is not sufficient — you need DPA review and may need consent banners (DPDP / GDPR).
- rrweb DIY route looks appealing but you'll spend 6 months rebuilding ingestion, storage, indexing, replay UI, and PII masking. Don't recommend this to founders — it's an engineering project, not a tool.
- Sentry FSL allows commercial use but FORBIDS building a competing product. If a customer of our template later builds an error-tracking SaaS on top of bundled Sentry, they violate FSL — flag in marketing docs.
- Replay storage costs scale brutally — even 'free' Clarity has hidden GDPR risks; OpenReplay and Sentry self-host hit S3 egress + ClickHouse storage for every recorded session. Document sampling rates in default config (e.g. 10% sampling for replay).
- Mobile session replay (React Native, iOS, Android) is a SEPARATE pricing axis on PostHog (2x web) and a separate SDK on OpenReplay. Don't promise mobile replay parity at the lower profiles.

**Recommendation (this angle):** RECOMMENDED BUNDLING STRATEGY for ts-monorepo-template:

Default day-1: NONE bundled, but ship a launcher CLI prompt: 'Do you want session replay? [Clarity (free) / Sentry (with error tracking) / OpenReplay (self-host) / None]'.

Per-profile defaults:

- Just Me (USD 0) — Microsoft Clarity script tag (commented in env.example). One script, zero ops. EXCLUDE OpenReplay self-host at this tier (running ClickHouse + MinIO + Kafka for one user is absurd).
- Side Project (USD 5-20) — Clarity stays default. Optionally enable Sentry Cloud free tier (5k errors + 50 replays/mo) if user also picked the error-tracking team's Sentry recommendation. INCLUDE-ON-DEMAND.
- Early Startup (USD 30-150) — Sentry Cloud (replay + errors in one bill) as PRIMARY. Clarity stays as the always-on free fallback for marketing pages. INCLUDE-DAY-2.
- Scaling Startup (USD 300-1500) — OpenReplay self-host (on user's cluster, AGPL is safe for them) on the Crossplane/ArgoCD stack we already ship. INCLUDE-DAY-2. Sentry remains for errors.
- Production at Scale (USD 2k+) — Pick BOTH: OpenReplay self-host for deep DevTools-grade product debugging + Sentry self-host (FSL safe) for error-replay correlation. INCLUDE-DAY-1.

Top choice for the 'default' template experience: Microsoft Clarity.
3 reasons FOR: (1) free forever with unlimited sessions is unbeatable TCO for founders; (2) single script tag, zero infra, zero ops cost — fits 'Just Me' profile perfectly; (3) Microsoft funds it long-term as a Bing-ads moat, so abandonment risk is low.
3 reasons AGAINST: (1) proprietary — no source, no data sovereignty, sends visitor data to Microsoft; (2) no DevTools / network panel — useless for engineer debugging vs OpenReplay/Sentry; (3) Microsoft uses aggregated data for ads — PII / GDPR / DPDP exposure must be disclosed in privacy policy.

Self-host pick for higher tiers: OpenReplay (AGPL is fine because END USERS self-host). Critical guardrail: We must NOT operate OpenReplay as part of a managed offering — document this in our LICENSE-NOTICE.md.

Closest commercial alternative for upgrade-path docs: FullStory (~$200+/mo enterprise pricing, no public tier) and Hotjar ($32-$80/mo). Position Sentry Cloud ($26+/mo team plan) as the natural paid upgrade from the bundled free options.

Marketing-page upgrade ladder to document: Clarity (free) → Sentry Cloud Team ($26/mo) → OpenReplay self-host (infra only) → FullStory enterprise (custom).

**Citations:**

- [OpenReplay GitHub repository](https://github.com/openreplay/openreplay)
- [OpenReplay LICENSE (AGPL-3.0 + Enterprise)](https://github.com/openreplay/openreplay/blob/main/LICENSE)
- [Can You Self-Host Session Replay? — Temps blog 2026](https://temps.sh/blog/can-you-self-host-session-replay-2026)
- [PostHog pricing (2026)](https://posthog.com/pricing)
- [PostHog open-source session replay tools blog](https://posthog.com/blog/best-open-source-session-replay-tools)
- [PostHog session replay privacy controls](https://posthog.com/docs/session-replay/privacy)
- [Sentry Functional Source License announcement](https://blog.sentry.io/introducing-the-functional-source-license-freedom-without-free-riding/)
- [Sentry Licensing page](https://open.sentry.io/licensing/)
- [Sentry Session Replay product page](https://sentry.io/product/session-replay/)
- [Microsoft Clarity (free heatmaps + session recordings)](https://clarity.microsoft.com/)
- [Microsoft Clarity 2026 product guide](https://productgrowth.in/tools/analytics/microsoft-clarity/)
- [rrweb GitHub repository (MIT)](https://github.com/rrweb-io/rrweb)
- [AGPL compliance guide (Vaultinum)](https://vaultinum.com/blog/essential-guide-to-agpl-compliance-for-tech-companies)
- [Best Session Replay Tools 2026 — Better Stack](https://betterstack.com/community/comparisons/session-replay-alternatives/)
- [PostHog session replay architecture handbook](https://posthog.com/handbook/engineering/session-replay/session-replay-architecture)

---

## Team 12 — Auth + user management + identity

### Synthesized verdict

- **Verdict:** `include-day-1`
- **Fit score:** 92 / 100
- **Top pick:** **Keycloak**
- **License:** `Apache-2.0`
- **Default profile bundles:** `p-startup-small`, `p-startup-scale`, `p-enterprise`

**Reasoning:**

All four angle reports converge on the same answer: Keycloak is the right Day-1 default for Early Startup → Production at Scale, with Logto (MPL-2.0) as the small-tier alternative. Three independent reasons make this the verdict: (1) License safety — Apache-2.0 is the cleanest possible license for a commercial template we will resell; no AGPL §13 reach-through, no source-available EULA traps, no open-core paywall splits like Authentik's enterprise/ or SuperTokens' ee/ dir. (2) Stack lock-in is already paid — the template ships crossplane-contrib/provider-keycloak with ~50 managed kinds (Realm, Client, User, Role, Group, ProtocolMapper, IdentityProvider) wired into 28 XRDs + Helm library chart + Argo CD ApplicationSets. Swapping to ZITADEL or Ory means rewriting that entire compositional layer for marginal feature gain. (3) The historical objections to Keycloak materially weakened in 26.x — Organizations is GA (closing the B2B multi-tenancy gap that drove teams to ZITADEL/Logto in 2023-2024), fine-grained admin permissions per realm, and graceful shutdown with connection draining landed in 26.6 (May 2026). The runner-up question matters: ZITADEL would be the architecturally cleanest modern pick (Go single-binary, event-sourced, native Instance→Org→Project→App model), but its March 2025 relicense from Apache-2.0 to AGPL-3.0-only disqualifies it for any managed-SaaS SKU we sell on top of the template — exactly the commercial path we are protecting. FusionAuth was eliminated by all four angles as proprietary-EULA-disguised-as-free. Authelia is eliminated by lack of SAML 2.0 in 2026. Ory Stack is preserved as a documented graduate path (Apache-2.0, powers ChatGPT login at 900M WAU) but its headless nature (no UI shipped) kills the vibe-coder DX. Logto (MPL-2.0, TS-native, 12.1k stars) is the right complement for Just Me / Side Project where Keycloak's ~1.25 GB RAM floor and JVM ops are wrong — but that is a _secondary_ recommendation, not the team's top pick. Keycloak is the team verdict because it is what the template should default to for the audiences that actually pay (B2B SaaS founders, enterprise customers demanding SAML/SSO, and the Aegis MCP server which needs a stable admin REST API to wrap).

**Integration outline:**

Day-1 wiring with five touchpoints, all of which already exist in the stack:

1. Launcher CLI (`task setup:auth`) — applies an `IdentityProvider` XR claim with profile-aware sizing (Just Me/Side Project route to a Logto composition; Early Startup+ routes to Keycloak). Claim writes OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET into the user's `.env` via secretspec.

2. Crossplane XRD (`IdentityProvider`) — composes onto crossplane-contrib/provider-keycloak v1.2.0+ resources: `Realm`, `Client`, `Role`, `Group`, `ProtocolMapper`, `IdentityProvider` (for social/upstream brokering). ProviderConfig credentials sourced via External Secrets Operator from Vault/AKV — never hand-applied Secrets (documented in claim docs to prevent admin-password leakage into git).

3. Helm + Argo CD — split into two Argo Applications with sync-wave annotations to dodge the known Keycloak Operator race where `KeycloakRealmImport` fires while the instance is still bootstrapping the master realm. App 1 (wave 0): Keycloak Operator + Keycloak instance + Postgres backing store. App 2 (wave +1): Realm imports + client/role declarations from the XR composition.

4. Observability — Keycloak's SmallRye OTel integration (v23+) emits traces to our existing Tempo collector, metrics to Prometheus, and structured JSON logs to Loki. Zero extra wiring required; just enable the OTel extension in the values file.

5. Phase 12 MCP server — wraps Keycloak admin REST API (decade-stable) behind a provider-agnostic interface (`createOrganization`, `inviteUser`, `createOAuth2Client`, `assignRole`) so Aegis can drive identity from natural language. Same interface exposes a second adapter for Logto on the small profiles, keeping the MCP contract uniform across tiers.

Profile defaults the launcher should hard-code: Just Me → Logto (single Postgres + small Node container, ~150 MB RAM); Side Project → Logto; Early Startup → Keycloak (1.5 GB RAM target, single replica); Scaling Startup → Keycloak HA (2 replicas + Infinispan cache); Production at Scale → Keycloak HA + optional Ory Oathkeeper as zero-trust API gateway sidecar + Ory Keto for ReBAC where fine-grained authz exceeds Keycloak's authorization services.

LICENSE-DEPENDENCIES.md (commercial-readiness artifact) must list every bundled tool with its SPDX ID, version pin, and a one-line license-impact statement — this is the single most important compliance artifact for an open-core product and was flagged by the license-deep-dive angle.

**Risks:**

- Crossplane provider-keycloak is Upjet-generated from terraform-provider-keycloak; upstream TF provider breakage propagates directly to every claim in the template — pin BOTH versions and add a renovate policy that gates upgrades behind a smoke test
- Keycloak's ~1.25 GB RAM floor (post-v26.5 OOMs under 256 MB) is wrong for Just Me / Side Project profiles — must route those profiles to Logto in the launcher, not Keycloak, or the USD 0/USD 5-20 tiers break on a 1 GB VPS
- Keycloak Operator + KeycloakRealmImport race on first install — must split into two Argo Applications with sync-waves or use Bitnami chart's init-container pattern; document in the runbook
- Keycloak Organizations is GA upstream in v26 but Crossplane provider coverage of Organization CRDs lags — audit provider release notes before claiming GitOps parity for B2B tenants; may need to declare orgs imperatively via MCP server in the interim
- Transitive Liquibase 5.x dependency moved to FSL (source-available, 2-year-to-Apache); not a current blocker but watch Keycloak issue #43391 — if they swap migration engines, upgrade tooling could break
- MCP server wrapping the Keycloak admin REST API needs a service-account token rotation strategy; static tokens in env are a credential-theft surface — use short-lived tokens via the SA grant flow
- Switching cost away from Keycloak is non-trivial (28 XRDs, Helm library, Argo wiring) — decision now locks the template in for 18-24 months; ZITADEL's AGPL move makes the alternate path more expensive than it looked in 2024
- Documentation must explicitly call out the AGPL/EULA traps users will encounter when researching alternatives (ZITADEL, FusionAuth, Stack Auth server, SuperTokens ee/, Authentik enterprise/) — otherwise a well-meaning customer adds an AGPL component and inherits §13 obligations on their own product

### Angle: Tool landscape + maturity

**License flag:** `MIXED`

**Top picks:**

- **Keycloak** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **ZITADEL** — `AGPL-3.0 (with Apache-2.0/MIT exceptions)` — self-host: yes — maturity: production-grade
- **Authentik** — `MIT (core) + proprietary EE dir` — self-host: yes — maturity: production-grade
- **Ory Stack (Kratos+Hydra+Keto+Oathkeeper)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Logto** — `MPL-2.0` — self-host: yes — maturity: production-grade
- **SuperTokens** — `Apache-2.0 (core) + proprietary ee/ dir` — self-host: yes — maturity: usable
- **Casdoor** — `Apache-2.0` — self-host: yes — maturity: usable
- **Authelia** — `Apache-2.0` — self-host: yes — maturity: usable

Imagine your monorepo template is a hotel and "auth" is the front desk: someone walks up, you confirm who they are (authentication), decide which rooms they can enter (authorization), keep a ledger of who came and went (audit), and — if your hotel hosts companies — let each company have its own branded lobby (multi-tenant SSO/B2B). In 2026, OSS gives you about a dozen front-desk software stacks, and they cluster into three patterns.

Pattern A — All-in-one IdP with a UI. Keycloak (Java, 34.7k stars, Apache-2.0, CNCF Incubating, used by CERN, Cisco, Accenture, Hitachi), Authentik (Python+Go, 21.8k stars, MIT core + separate Enterprise EE dir), ZITADEL (Go, 13.9k stars, AGPL-3.0 with MIT/Apache exceptions), Authelia (Go, 28k stars, Apache-2.0, no SAML yet — homelab/proxy-IDP territory), Casdoor (Go, 13.7k, Apache-2.0). You install one binary/container, get a login page, admin UI, social login, MFA, OIDC + (usually) SAML. This is your default if you want the team to "just have auth."

Pattern B — Headless toolkit you compose. Ory Stack (Kratos identity, Hydra OAuth/OIDC server, Keto authz, Oathkeeper proxy — all Apache-2.0, Go, 13.7k stars on Kratos). No login UI shipped — you bring your own. Highest engineering surface, lowest opinionation, used by big platforms (Sainsbury's, Padlet, OpenAI used Hydra historically). Best when you have one TS frontend and want full control of the UX.

Pattern C — Developer-API-first ("Auth0-replacements"). Logto (TS, MPL-2.0, 12.1k stars), SuperTokens (Java core Apache-2.0 + ee/ dir under separate license, 15.1k stars), Stack Auth (MIT+AGPL dual, YC-backed). Designed for the founder who copy-pastes SDK snippets. Logto is the cleanest match for a vibe-coder audience.

The license question is what cleanly eliminates options for a COMMERCIAL template:

- FusionAuth's "Community" is NOT open source — it's a proprietary EULA-free-beer plan that forbids redistributing/reselling. If you bundle it in a template you sell, you trigger the licensing clause. AVOID.
- ZITADEL is AGPL-3.0. If our customers self-host it (which is the model), AGPL is fine for them. But if we ever offer a managed flavour, the network clause activates. CAUTION + acceptable for self-host SKUs.
- SuperTokens' core is Apache-2.0 but `ee/` (multi-tenancy, MFA, dashboard analytics) is under a proprietary EE license. CAUTION — read the line carefully before shipping a tier that uses ee/.
- Authentik mirrors this: MIT core + separate EE dir. CAUTION — same gotcha as SuperTokens.
- Keycloak, Ory (Kratos/Hydra/Keto/Oathkeeper), Authelia, Casdoor, Logto (MPL-2.0 is file-level copyleft — safe for template bundling), Stack Auth's MIT path — all SAFE for commercial template distribution.

For YOUR stack specifically: you already ship Crossplane provider-keycloak with 28 XRDs, your customers already get realms-as-code declared from Helm + Argo CD. Swapping is a non-trivial rewrite. Keycloak 26.x added Organizations GA, fine-grained admin permissions per realm, graceful shutdown — the historical "Keycloak is heavy/slow" complaint is materially weaker in 26.6. Keep Keycloak as the default; offer Logto as the "Just Me / Side Project" alternative because its DX matches that audience and MPL-2.0 is template-safe.

**Key findings:**

- Keycloak 26.6.2 (May 19, 2026) is the incumbent: Apache-2.0, 34.7k GitHub stars, CNCF Incubating since April 2023, production users include CERN (~9k services, 150k user base), Cisco, Accenture, Hitachi, Okta, Quest, and Ohio Supercomputing Center.
- Keycloak 26.x materially closed historical gaps: Organizations feature is GA, fine-grained admin permissions are per-realm, graceful shutdown with connection draining was added in 26.6, removing the 'Keycloak takes 90s to boot and drops requests' complaint.
- ZITADEL v4.15.0 (May 4, 2026, AGPL-3.0, 13.9k stars, Go) is the strongest 'modern cloud-native' alternative — organizations were a core design decision (not bolted on), every event is in an audit-friendly event store, and self-hosted is free for unlimited users. AGPL is the catch for any managed-SaaS resale.
- Authentik 2026.5.2 (May 28, 2026, MIT core, 21.8k stars, Python+Go) is the second-most-starred OSS IdP, with the richest pre-built integration catalogue (Proxy/LDAP/RADIUS outposts). MIT only applies outside the enterprise/ directory; EE code is under a separate license.
- Ory Stack (Kratos v26.2.0, Hydra/Keto/Oathkeeper at v26.2.10–v26.2.14 as of May 2026, all Apache-2.0) is the headless toolkit choice — no login UI ships, you compose, and the Ory Network SaaS is the upsell path. Best fit when one TS frontend owns the entire UX.
- Logto v1.40.1 (May 29, 2026, MPL-2.0, 12.1k stars, TypeScript) is the Auth0-DX alternative. MPL-2.0 is file-level copyleft — safe for a commercial template that bundles it because obligations attach only to modified Logto files, not to the customer's app code.
- SuperTokens Core v11.0.7 (Mar 19, 2026, 15.1k stars, Java) splits the codebase: core is Apache-2.0 but ee/ (which contains multi-tenancy, account-linking, multi-factor MFA backends, and the production dashboard analytics) is under a separate Enterprise license that gates production use of those features.
- Casdoor v3.76.0 (Jun 2, 2026, Apache-2.0, 13.7k stars, Go+React) repositioned in 2026 as 'agent-first IAM' with built-in MCP gateway and LLM auth flows — uniquely relevant for our Aegis MCP audience, but the project is single-vendor-driven and noticeably less battle-tested than Keycloak/ZITADEL.
- Authelia v4.39.20 (May 26, 2026, Apache-2.0, 28k stars, Go) is OIDC-certified and excellent at the 'auth in front of a reverse proxy' niche but SAML 2.0 is still on the roadmap with no published timeline — disqualifies it for B2B SSO scenarios where customers will demand SAML.
- FusionAuth Community is a proprietary EULA, NOT open source — internal/free-for-app use is allowed but redistribution or hosting it for customers triggers the paid license. Including it in a sellable template is a license trap; AVOID for bundling.
- Stack Auth (MIT + AGPL dual-license, YC-backed) is a credible newer player but the dual-license shape means you need to elect the MIT path explicitly per usage; treat as 'usable, watch trajectory'.
- Our existing crossplane-contrib/provider-keycloak (Upjet-generated from the Keycloak Terraform provider) is at v1.2.0+, supports Realms/Clients/Roles/Groups/Protocol Mappers/Identity Providers as XRDs, and writes generated client secrets to k8s Secrets via writeConnectionSecretToRef — meaning the 'Keycloak as code' story is already solved in this stack and is not trivially replaceable for the other candidates.

**Gotchas:**

- FusionAuth Community is NOT FOSS — it is proprietary free-as-in-beer with a redistribution clause. Bundling it in a saleable template breaches the license. Treat the 'free tier' as a vendor SaaS, not as an OSS option.
- ZITADEL is AGPL-3.0. Customers self-hosting on their own clusters: fine. But if the template ever offers a 'managed hosted ZITADEL' tier, the AGPL §13 network clause forces us to release modifications. Document the boundary explicitly.
- Authentik MIT and SuperTokens Apache-2.0 covers ONLY the non-enterprise directories. Multi-tenancy/MFA/dashboard analytics live under separate EE licenses — read which features you advertise before bundling.
- Authelia has no SAML 2.0 yet (as of April 2026, no published timeline). If any Early Startup / Scaling tier promises 'B2B SSO', Authelia is not viable for that tier even though it is otherwise excellent.
- Keycloak's Java footprint (Quarkus base image, ~500MB) is still heavy for the 'Just Me USD 0' tier — a 1GB VPS may not run Keycloak + Postgres comfortably. Logto or Authelia is a better small-tier fit.
- Logto's MPL-2.0 is file-level copyleft — fine for bundling, but if YOU patch a Logto source file and ship it, that file must remain MPL-2.0. Document a 'no in-tree patches, fork-and-PR-upstream' policy if you bundle it.
- Casdoor velocity is high but contributor concentration is single-vendor and English-language docs/issues are thinner than Keycloak/ZITADEL. Production-critical bugs may take longer to triage. Pin a version and budget upgrade time.
- Replacing Keycloak in this stack is not a config change — it would require rewriting 28 XRDs / Crossplane compositions, the provider-keycloak Helm wiring, and Argo CD ApplicationSets. The migration cost is the dominant factor, not feature parity.

**Recommendation (this angle):** KEEP Keycloak as the default identity provider for the template. Three reasons: (1) Apache-2.0 is unambiguously commercial-template-safe with zero gotchas; (2) Keycloak 26.6 closed the historical weak spots (Organizations GA, fine-grained admin per realm, graceful shutdown) that motivated the 'should we switch?' question; (3) you already ship crossplane-contrib/provider-keycloak with realms/clients/roles as XRDs — that infra investment is the moat and switching costs are non-trivial. Offer Logto (MPL-2.0, TS-native, 12.1k stars, May 2026 release) as an OPTIONAL launcher-CLI alternative for the Just Me / Side Project profiles where a 500MB Java app is overkill; its DX matches the vibe-coder audience and MPL-2.0 file-level copyleft is template-safe. Reserve Ory Stack as a documented 'graduate path' for teams that outgrow Keycloak's opinionated UI and want headless. EXCLUDE FusionAuth from any bundled tier (proprietary license trap). EXCLUDE Authelia from B2B/Scaling tiers (no SAML). Flag SuperTokens, Authentik, and ZITADEL as 'usable but read the license boundary' — fine for users to self-deploy, risky to bundle the EE/AGPL directories into a managed SKU we sell.

**Citations:**

- [Keycloak GitHub repo (34.7k stars, Apache-2.0, v26.6.2)](https://github.com/keycloak/keycloak)
- [Keycloak 26.6.0 release announcement (Apr 2026)](https://www.keycloak.org/2026/04/keycloak-2660-released)
- [Keycloak joins CNCF as incubating project](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)
- [CERN: Why Keycloak (9k services, 150k user base)](https://auth.docs.cern.ch/documents/why-keycloak/)
- [Keycloak vs ZITADEL: Organizations / B2B SSO comparison 2026](https://zitadel.com/blog/zitadel-vs-keycloak)
- [ZITADEL GitHub repo (13.9k stars, AGPL-3.0, v4.15.0)](https://github.com/zitadel/zitadel)
- [ZITADEL Pricing and Self-Hosting discussion (AGPL terms)](https://github.com/zitadel/zitadel/discussions/8845)
- [Authentik GitHub repo (21.8k stars, MIT + EE split, 2026.5.2)](https://github.com/goauthentik/authentik)
- [Authentik MIT vs Enterprise License clarification](https://github.com/goauthentik/authentik/discussions/18682)
- [Ory Kratos GitHub repo (Apache-2.0, v26.2.0)](https://github.com/ory/kratos)
- [Ory changelog v26.2.10 (May 2026 release across Hydra/Kratos/Keto/Oathkeeper)](https://changelog.ory.com/announcements/ory-network-ory-hydra-ory-kratos-ory-oathkeeper-v26-2-10-released)
- [Logto GitHub repo (12.1k stars, MPL-2.0, v1.40.1)](https://github.com/logto-io/logto)
- [SuperTokens Core GitHub repo (15.1k stars, Apache-2.0 + ee/, v11.0.7)](https://github.com/supertokens/supertokens-core)
- [FusionAuth License FAQ (Community = proprietary, not OSS)](https://fusionauth.io/license-faq)
- [crossplane-contrib/provider-keycloak (already in our stack)](https://github.com/crossplane-contrib/provider-keycloak)

### Angle: Integration mechanics

**License flag:** `MIXED`

**Top picks:**

- **Keycloak** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **ZITADEL** — `AGPL-3.0 (binary) / Apache-2.0 (Helm chart)` — self-host: yes — maturity: production-grade
- **Ory Stack (Kratos + Hydra + Keto + Oathkeeper)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Authentik** — `MIT (core) + separate Enterprise license dir` — self-host: yes — maturity: production-grade

Picture our template the way a vibe-coder will meet it. They type `task setup:auth`, an XRD claim spins up a database + identity provider, a Helm chart deploys the IdP itself, ArgoCD reconciles it, and the launcher CLI writes `OIDC_ISSUER` into their `.env`. Phase 12's MCP server then wraps the IdP's admin API so Aegis can say "create org Acme, invite alice@acme.com as admin" and have it actually happen. So for any auth candidate the integration question reduces to four sub-questions: (1) Is there a Crossplane provider that lets us declare realms/orgs/clients as XRs? (2) Is there a Helm chart that runs cleanly on our k8s and respects our OTel + Loki + Tempo wiring? (3) Is there a stable admin API + SDK that a Phase 12 MCP server can sit on top of? (4) What's the day-1 wiring — five to ten commands — that a junior copies?

Keycloak (Apache-2.0) wins on (1) and (4) today. crossplane-contrib/provider-keycloak ships ~50 managed kinds under `keycloak.crossplane.io` (Realm, Client, User, Role, IdentityProvider, ProtocolMapper, Group); the Bitnami Helm chart + official Keycloak Operator handle deployment; the admin REST API has been stable for a decade so an MCP wrapper is trivial. The cost is a JVM-shaped memory footprint, a UI from 2018, and a tepid SDK story — but for the "Just Me / Side Project" tiers it's the lowest-friction choice and what our stack already targets.

ZITADEL (AGPL-3.0 since March 2025; Helm chart still Apache-2.0) is the architecturally cleaner option. Go single-binary, event-sourced, native multi-tenant Instance → Organization → Project → Application — exactly the shape a B2B SaaS template wants. Official Helm chart is Apache-2.0 and HPA-aware, and there's an unofficial-but-active didactiklabs/provider-zitadel Crossplane provider generated via Upjet from the official terraform-provider-zitadel. The headline risk: AGPL-3.0 on the IdP binary. AGPL only bites if WE deploy ZITADEL as part of a managed service we sell. If the template merely sets it up on the CUSTOMER's cluster, the customer is the operator and AGPL is fine — same as them running Postgres. But the moment we offer "hosted auth" we either need ZITADEL's commercial license or have to swap it out. That's a strategic fork the template has to choose.

Ory stack (Apache-2.0, all four services) is the cleanest license story and powers ChatGPT's login at 900M WAU, so production scale is settled. But Ory is headless — Kratos has no built-in UI, so we'd have to ship the Ory Elements / `kratos-selfservice-ui-node` apps and wire them through Oathkeeper. Four separate Helm charts (Kratos, Hydra, Keto, Oathkeeper) plus our own UI is too many moving parts for a "Just Me USD 0" tier. There's no first-party Crossplane provider; declarative config is via Ory CLI + YAML. Right answer for "Production at Scale" tier, wrong answer for the default.

Authentik (MIT core, separate Enterprise license dir; Helm chart MIT) is the user-friendliest Keycloak alternative but the Crossplane story is the weakest — vhdirk/crossplane-provider-authentik exists but only models Blueprints, not granular resources. So GitOps means "stuff your config in a Blueprint YAML and apply".

**Key findings:**

- Keycloak is Apache-2.0 end-to-end and remains the only candidate with a mature, ~50-resource Crossplane provider (crossplane-contrib/provider-keycloak, API group `keycloak.crossplane.io/v1alpha1`) — Realm, Client, User, Role, Group, ProtocolMapper, IdentityProvider are all first-class XRs, which means a `tsmonorepo.io/v1alpha1 IdentityProvider` XRD can compose directly onto them with no Terraform sidecar.
- ZITADEL relicensed from Apache-2.0 to AGPL-3.0 on v3 release (March 31, 2025). The Helm chart repo (zitadel/zitadel-charts) remains Apache-2.0, but the server binary it deploys is AGPL. Network-use clause only triggers if WE operate ZITADEL as part of a paid managed service — if the customer self-hosts on their own cluster, they are the operator and there is no obligation back to us.
- ZITADEL's native data model (Instance > Organization > Project > Application) maps 1:1 onto B2B SaaS multi-tenancy, which is exactly the abstraction Phase 12 MCP server wants to expose to Aegis. No need to invent a 'tenant' layer on top of realms.
- Ory components (Kratos, Hydra, Keto, Oathkeeper) are all Apache-2.0 and run ChatGPT's login at 900M weekly active users — production scale is unquestioned. Official Helm charts (ory/k8s) exist for all four and ship Hydra-Maester which gives you `oauth2clients.hydra.ory.sh` as a real CRD — partial declarative coverage without Crossplane.
- Ory is headless — no admin UI, no self-service UI shipped. Adopting it means also shipping `kratos-selfservice-ui-node` (or Ory Elements) and routing them through Oathkeeper. That's a deal-breaker for the 'Just Me USD 0' tier where the user wants a login form to exist after `task setup:auth`.
- Authentik core is MIT licensed (LICENSE file), client-side JS is MIT-Expat, `website/` is CC-BY-SA-4.0, and `authentik/enterprise/` has its own non-OSS license. The Helm chart at goauthentik/helm is MIT. The 2023 commercial pivot moved the project from short-lived GPLv3 back to MIT — safe for bundling.
- Authentik has an official Terraform provider (`goauthentik/authentik` v2026.2.0) and Pulumi provider, but the Crossplane story is weak — `vhdirk/crossplane-provider-authentik` only models a `Blueprint` kind, not granular Realm/Client/User resources. GitOps with Authentik means stuffing YAML blueprints into a CR, not composing fine-grained XRs.
- Keycloak Operator's KeycloakRealmImport CR can race the Keycloak instance startup when both are installed in the same Helm release — known issue. Workaround is to install operator + instance in one Application and realm imports in a dependent Argo App with sync-wave +1.
- ZITADEL Crossplane provider exists but is community-maintained: `didactiklabs/provider-zitadel` (Upjet-generated from the official Terraform provider). Not yet under crossplane-contrib. Production usage exists but it lacks the breadth and release cadence of provider-keycloak.
- Every viable candidate has an MCP server pattern: `takleb3rry/zitadel-mcp` is a 800-line TS reference for ZITADEL; Keycloak admin REST API is trivial to wrap (well-documented for 10+ years); Ory has gRPC + REST so codegen is straightforward; Authentik has an OpenAPI spec shipped at `/api/v3/schema/`. Phase 12 MCP wrapping is solvable for all four.
- FusionAuth, SuperTokens, Logto, Stack Auth, Casdoor were considered but eliminated: FusionAuth is proprietary EULA (free tier is feature-gated, not OSS); SuperTokens core is Apache-2.0 but feature-thin vs Keycloak/ZITADEL for B2B SSO + SAML; Logto core is MPL-2.0 but enterprise features (SAML, MFA in some tiers) are paywalled; Stack Auth (MIT) is too young and Next.js-coupled for a polyglot template; Casdoor (Apache-2.0) is usable but the admin UX and SDK quality lag.
- All four top picks ship official OTel instrumentation (Keycloak via SmallRye OTel since v23, ZITADEL native, Ory native, Authentik via OTel exporter) so they slot into our existing Tempo/Loki/Prometheus stack without integration work.

**Gotchas:**

- AGPL-3.0 network-use clause: if the template authors ever offer 'hosted ZITADEL' to customers, that managed service triggers AGPL §13 obligations on US — but customer self-host on their own cluster does NOT trigger obligations back to us. Document this in ADR before defaulting to ZITADEL.
- Keycloak Helm install + KeycloakRealmImport race condition: master realm import job fires while Keycloak instance is still bootstrapping the master realm. Always split into two Argo Applications with sync-wave annotations, or use the Bitnami chart's init-container pattern.
- Authentik `authentik/enterprise/` directory has its own non-OSS license — if we package Authentik we must EITHER use the upstream container image as-is (no problem) OR if we fork and rebuild, exclude or accept the enterprise/ terms. Custom container builds need a CI check that asserts no enterprise/ code is shipped under the MIT umbrella.
- Ory is headless. Saying 'Ory' in the spec without naming a UI strategy (Ory Elements + kratos-selfservice-ui-node, or our own) leaves a hole the launcher CLI cannot fill. `task setup:ory-stack` must scaffold the UI too, or the user gets a 404 after install.
- Crossplane provider-keycloak's `Realm` resource references a ProviderConfig that needs admin credentials — these MUST come from External Secrets Operator pointing at Vault/AKV, never from a hand-applied Secret. Document this pattern in the XRD claim docs or vibe-coders will leak admin passwords into git.
- ZITADEL v3 dropped support for several v2 config keys (event sourcing schema migration). Pin Helm chart version explicitly in the App spec; do NOT use chart range `>= 10.0.0` because v3 chart families are not drop-in for v2 deployments.
- FusionAuth's 'free community edition' looks OSS but is a proprietary binary under their own EULA — not bundleable in a commercial OSS template. Reject early in the launcher CLI even if a user asks for it.
- Authentik Helm chart README labels itself MIT, but earlier Artifact Hub metadata shows GPL — verify by reading the LICENSE file at goauthentik/helm HEAD before each release pin. The Artifact Hub label has lagged the actual repo license.

**Recommendation (this angle):** Keep Keycloak as the default for the launcher's `task setup:auth` verb (covers Just Me / Side Project / Early Startup), and add ZITADEL as an opt-in upgrade path (`task setup:auth -- --provider=zitadel`) for Scaling Startup and Production at Scale tiers where multi-tenancy and a Go runtime matter. Concretely: (a) keep the existing XRD `IdentityProvider` composing onto `provider-keycloak` resources as the v1 default; (b) ship a parallel XRD composition that targets `didactiklabs/provider-zitadel` behind a feature flag; (c) Phase 12 MCP server exposes a provider-agnostic interface (`createOrganization`, `inviteUser`, `createOAuth2Client`) with two backend adapters — Keycloak realms map to ZITADEL organizations. Do NOT default-bundle Ory or Authentik: Ory has no UI out of the box (kills the vibe-coder DX), and Authentik's Crossplane provider is too thin for our GitOps model. Day-1 user wiring is `task setup:auth` → claim applied → Helm chart synced by Argo → realm/org created via provider → launcher writes `OIDC_ISSUER` + client creds into the user's `.env` via secretspec → MCP server registers admin token. Block FusionAuth in the launcher: it presents as OSS but ships under a proprietary EULA that's incompatible with our 'safe to bundle and resell' bar.

**Citations:**

- [Keycloak vs Authentik vs Zitadel (2026) — House of FOSS](https://blog.houseoffoss.com/post/keycloak-vs-authentik-vs-zitadel-2026-which-open-source-login-tool-should-you-use)
- [ZITADEL v3: AGPL License, Streamlined Releases](https://zitadel.com/blog/zitadel-v3-announcement)
- [ZITADEL Licensing FAQs (commercial license option)](https://help.zitadel.com/zitadel-licensing-faqs)
- [crossplane-contrib/provider-keycloak (GitHub)](https://github.com/crossplane-contrib/provider-keycloak)
- [ZITADEL Helm chart repo (Apache-2.0)](https://github.com/zitadel/zitadel-charts)
- [didactiklabs/provider-zitadel — Crossplane provider for ZITADEL](https://github.com/didactiklabs/provider-zitadel)
- [Authentik LICENSE (MIT core + carve-outs)](https://github.com/goauthentik/authentik/blob/main/LICENSE)
- [Authentik MIT vs Enterprise License clarification (discussion #18682)](https://github.com/goauthentik/authentik/discussions/18682)
- [Ory k8s Helm charts (Kratos, Hydra, Keto, Oathkeeper)](https://github.com/ory/k8s)
- [Ory powers ChatGPT login — OSTechNix](https://ostechnix.com/what-is-ory/)
- [takleb3rry/zitadel-mcp — MCP server reference](https://github.com/takleb3rry/zitadel-mcp)
- [Keycloak Operator Realm import from Helm chart (race condition discussion)](https://github.com/keycloak/keycloak/discussions/17369)
- [Keycloak LICENSE.txt (Apache-2.0)](https://github.com/keycloak/keycloak/blob/main/LICENSE.txt)
- [ZITADEL B2B Multi-Tenant Authentication guide](https://zitadel.com/docs/guides/solution-scenarios/b2b)
- [Ory Kratos vs Auth0 vs Keycloak 2026](https://apiscout.dev/blog/ory-kratos-vs-auth0-vs-keycloak-2026)

### Angle: License deep-dive

**License flag:** `MIXED`

**Top picks:**

- **Keycloak** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Ory Kratos + Hydra + Keto + Oathkeeper** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Authelia** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Authentik (OSS core)** — `MIT` — self-host: yes — maturity: production-grade
- **Casdoor** — `Apache-2.0` — self-host: yes — maturity: usable
- **SuperTokens (core only, no ee/)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Logto** — `MPL-2.0` — self-host: yes — maturity: usable
- **ZITADEL** — `AGPL-3.0-only` — self-host: yes — maturity: production-grade

Imagine you wrote a recipe book that you plan to sell. The book includes recipes that call for specific brands of spices. If a spice maker says, "anyone who uses my spice in their book must give the entire book away for free," that's a problem — even though we never touched their factory. That's roughly what AGPL does for server software, and what SSPL / BUSL / proprietary EULAs do in even harsher forms. We need to pick an auth tool that's a normal ingredient — one whose license doesn't reach into our book.

In our ts-monorepo-template, "shipping auth" usually means a Helm values file that points at someone else's Docker image, plus some Crossplane Compositions that talk to the auth tool's API. Two distinct legal questions arise.

Q1 — Are we "distributing" the auth software? Yes, in a weak sense: we ship a Helm chart + image reference + maybe templated configs. We do NOT modify the auth tool's source. For Apache-2.0 / MIT / MPL-2.0 / BSD, this is fine — we just need to keep their LICENSE + NOTICE files when we redistribute the chart. No reach-through to our customer's app code.

Q2 — Are we (or our customer) running it as a network service? Yes. This is where AGPL-3.0 §13 ("Affero clause") bites: anyone who interacts with the program over a network must be offered the program's source code (the modified version). For an UNMODIFIED upstream image, you can just point users at the upstream repo — your obligation is satisfied. The danger zone is if our template forks/modifies the auth tool, or if customers build features on top — they then owe AGPL source to their own end users. That's a hidden tax on every customer.

Now the candidates, sorted by license safety:

SAFE (permissive, no reach-through):

- Keycloak — Apache-2.0. The 800-pound gorilla, CNCF project, mature. Caveat: a transitive dep (Liquibase 5.x) is moving to FSL (Functional Source License — source-available for 2 years, then Apache). Keycloak team is actively working around this; not a blocker today but worth watching.
- Ory Kratos/Hydra/Keto/Oathkeeper — Apache-2.0, each project. Best-in-class for permissive licensing. Ory Network (their SaaS) is separate; the OSS components don't have AGPL trapdoors.
- Authelia — Apache-2.0. Lightweight, no enterprise gate, very clean.
- Authentik — MIT (core) + separate Enterprise license under authentik/enterprise/. Public Benefit Corporation gives extra anti-rugpull governance. If you only use the OSS image (don't enable enterprise license keys), MIT applies cleanly.
- Casdoor — Apache-2.0. Permissive, but smaller community.
- SuperTokens core — Apache-2.0 (with ee/ directory under separate license). Safe if you don't enable ee/ features.

CAUTION:

- Logto — MPL-2.0. File-level copyleft only. Means: if YOU edit Logto's source files, those edited files stay MPL. Adding new files alongside is fine. Acceptable for bundling an unmodified image; risky if you fork.

AVOID for commercial bundling:

- ZITADEL — AGPL-3.0 since v3 (March 31, 2025). Crossplane provider exists, but customers using ZITADEL as part of YOUR template, if they extend it, owe AGPL source to their users. Commercial license required for proprietary redistribution.
- Stack Auth — Server (apps/backend) is AGPL-3.0. Same problem as ZITADEL plus less mature.
- FusionAuth — Proprietary EULA. Free-tier does NOT permit redistribution/embedding/resale; explicitly requires a paid reseller license for our use case.

Recommendation: keep Keycloak (already in spec) as the primary, and offer Ory Stack as the "modern/headless" alternative profile. Both Apache-2.0, both Crossplane-provider-ready, both production-grade. Do not switch to ZITADEL despite its great DX — the AGPL move in 2025 makes it a "sell it, and your customers inherit AGPL exposure" problem.

**Key findings:**

- Keycloak is Apache-2.0 — confirmed via GitHub /license API. Safest possible license for commercial bundling. Already in our spec, no reason to move.
- Ory Stack (Kratos, Hydra, Keto, Oathkeeper) — all Apache-2.0, all separately maintained, all available via Crossplane-compatible APIs. Best 'pure permissive' alternative if we want a more modular headless story.
- ZITADEL changed from Apache-2.0 to AGPL-3.0-only with v3 release on 2025-03-31. This is a hard AVOID for our commercial bundle scenario — although unmodified Docker image redistribution is OK, customers who extend ZITADEL inherit §13 network-use obligations.
- Stack Auth's server package (apps/backend/LICENSE) is GNU AGPL-3.0 — root LICENSE describes a per-package split (MIT client / AGPL server). AVOID for bundling.
- FusionAuth is NOT open source — it ships a proprietary EULA. The Community / Free tier explicitly does NOT permit redistribution or embedding in a commercial template; resale requires a paid reseller license. AVOID for OSS-bundle path.
- Authentik core is MIT, with authentik/enterprise/ directory under a separate enterprise license. Authentik Security is incorporated as a US public benefit corporation, which is the strongest anti-rugpull governance in this list.
- Authelia is Apache-2.0 — clean, lightweight, OIDC-certified. Good for the smaller-profile bundles (Just Me / Side Project) where Keycloak's footprint is excessive.
- SuperTokens core LICENSE.md confirms Apache-2.0 with an ee/ enterprise subtree carved out. If we ship only the OSS image and never enable ee/ features, it's commercially safe.
- Logto is MPL-2.0 — file-level copyleft. Permits commercial bundling of unmodified binaries; only risk is if our template forks Logto source files (which we won't).
- Casdoor is Apache-2.0 — permissive but the project leans 'commodity OSS clone' rather than category-leader; community smaller than Keycloak/Authentik.
- Liquibase license shift to FSL 5.0 creates a transitive license question for Keycloak (CNCF can't accept source-available deps). Keycloak team has flagged this as a high-priority blocker but it does not yet affect Keycloak's own license today.
- The Hashicorp BUSL/OpenTofu episode (2023) is the cautionary tale: VC-funded OSS vendors can and do change licenses post-adoption. Among our candidates, ZITADEL has already done so (2025); Authentik has the strongest legal-charter protection against doing it; Keycloak as a Red Hat/CNCF project is the most rugpull-resistant.

**Gotchas:**

- AGPL §13 'network use' obligation: triggered only if YOU modify the source and run it as a network service. Unmodified upstream Docker image redistribution is fine. But if a CUSTOMER forks AGPL software bundled in our template, the obligation transfers to them — they may not realize it.
- FusionAuth Community marketing reads 'free for commercial use' — but the License FAQ explicitly excludes resale/embedding/redistribution. Don't be fooled by the homepage; the License FAQ is the binding text.
- Authentik enterprise/ directory has its own license. If our Helm chart accidentally pulls in enterprise features (e.g., via a default config), we could trip enterprise-license obligations. Pin to OSS-only Helm values and disable enterprise license key by default.
- SuperTokens has the same ee/ trap as Authentik — keep image config to OSS feature set only.
- ZITADEL's commercial license is per-deployment — if we offer a managed/hosted version of our template that includes ZITADEL, every customer would need a commercial license. Self-hosted by the customer is OK under AGPL.
- Keycloak's Liquibase dependency is currently Apache-2.0 (Liquibase 4.x) but Liquibase 5.x switched to FSL. Watch the Keycloak issue #43391 — they may need to swap to a different migration engine, which could affect upgrade tooling but not license status of Keycloak itself.
- MPL-2.0 (Logto) is file-level copyleft. 'Aggregate' with our code via Docker image = fine. Forking and modifying Logto source files = those modified files must stay MPL. Document this in our customer-facing license guide.
- Crossplane provider quality varies wildly — provider-keycloak is mature (we already use it), provider-zitadel exists but as community projects (didactiklabs/Smana), not first-party. License safety of the provider itself is separate from the auth tool.

**Recommendation (this angle):** KEEP Keycloak as the default for Early Startup / Scaling Startup / Production at Scale profiles — it's Apache-2.0, mature, CNCF-governed, and we already have provider-keycloak working. Add Authelia as the lightweight default for Just Me / Side Project profiles (Apache-2.0, single Go binary, much smaller resource footprint than Keycloak's JVM). For the 'headless/modular' offering, document Ory Kratos+Hydra+Keto as a supported alternative (Apache-2.0, best-in-class for API-first auth). EXPLICITLY DO NOT BUNDLE ZITADEL, Stack Auth server, or FusionAuth in any default profile — their licenses transfer obligations or restrictions to our customers and can leak into our commercial product. We can mention them in docs as user-installable third-party options (customer's responsibility to comply), but do not put them behind our 'one-command install'. Write a short LICENSE-DEPENDENCIES.md in the repo listing each shipped tool's license and SPDX ID; this is the single most important commercial-readiness artifact for an open-core product.

**Citations:**

- [Keycloak LICENSE.txt (Apache-2.0)](https://github.com/keycloak/keycloak/blob/main/LICENSE.txt)
- [Keycloak Liquibase license-change discussion (#43226)](https://github.com/keycloak/keycloak/discussions/43226)
- [ZITADEL: Apache-2.0 to AGPL-3.0 announcement](https://zitadel.com/blog/apache-to-agpl)
- [ZITADEL v3 AGPL announcement blog](https://zitadel.com/blog/zitadel-v3-announcement)
- [ZITADEL LICENSING.md (AGPL-3.0-only)](https://github.com/zitadel/zitadel/blob/main/LICENSING.md)
- [Authentik LICENSE (MIT + enterprise carve-out)](https://github.com/goauthentik/authentik/blob/main/LICENSE)
- [Authentik MIT vs Enterprise license clarification](https://github.com/goauthentik/authentik/discussions/18682)
- [Ory Kratos repository (Apache-2.0)](https://github.com/ory/kratos)
- [Authelia repository (Apache-2.0)](https://github.com/authelia/authelia)
- [SuperTokens LICENSE.md (Apache-2.0 + ee/ split)](https://github.com/supertokens/supertokens-core/blob/master/LICENSE.md)
- [Stack Auth LICENSE (per-package MIT/AGPL split)](https://github.com/stack-auth/stack-auth/blob/main/LICENSE)
- [FusionAuth License FAQ (reseller-license required for embedding)](https://fusionauth.io/license-faq)
- [Casdoor LICENSE (Apache-2.0)](https://github.com/casdoor/casdoor/blob/master/LICENSE)
- [OpenTofu fork announcement (HashiCorp BUSL precedent)](https://opentofu.org/blog/opentofu-announces-fork-of-terraform/)
- [Mozilla Public License 2.0 FAQ (file-level copyleft)](https://www.mozilla.org/en-US/MPL/2.0/FAQ/)

### Angle: Tradeoffs + recommendation

**License flag:** `MIXED`

**Top picks:**

- **Keycloak** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Logto** — `MPL-2.0` — self-host: yes — maturity: production-grade
- **Ory Kratos + Hydra (+ Keto/Oathkeeper)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **Authentik (OSS core)** — `MIT` — self-host: yes — maturity: production-grade
- **SuperTokens (Core only — exclude /ee)** — `Apache-2.0` — self-host: yes — maturity: production-grade
- **ZITADEL** — `AGPL-3.0` — self-host: yes — maturity: production-grade
- **FusionAuth Community** — `Proprietary (source-available, free-of-charge tier)` — self-host: yes — maturity: production-grade
- **Authelia** — `Apache-2.0` — self-host: yes — maturity: usable

Imagine you're a startup founder. You need a "front door" for every app you build: sign-up, login, "Forgot password?", Google sign-in, MFA, and eventually "sign in with your company's Okta" for enterprise customers. You could code this yourself (a year-long mistake), pay Auth0 (great until your bill hits USD 2k/month at 25k users), or self-host an open-source identity provider (IdP). The IdP is a separate service your apps redirect users to. It speaks two standard protocols: OIDC (modern, JSON-based — what your TypeScript app uses) and SAML (XML, ugly, but every enterprise IT department demands it for SSO).

The catch for us: we are SELLING this template later. If we bundle AGPL-3.0 software and offer a hosted version of the template, the AGPL "network use" clause can drag our code into the same license. So license choice is not academic — it changes what we can ship.

In 2026 there are roughly three buckets of OSS IdPs:

1. **Heavyweight, battle-tested, enterprise-grade** — Keycloak. Apache-2.0. Red Hat backs it. Has every feature ever invented (SAML, LDAP, fine-grained authz, B2B Organizations since v25/26, social, MFA, passkeys). Costs 1.25 GB RAM minimum for a production pod and a JVM ops headache. Crossplane provider exists, is healthy (v1.x), and our spec already uses it.

2. **Developer-friendly, modern, B2B-SaaS-native** — Logto (MPL-2.0), ZITADEL (AGPL-3.0 since March 2025), Authentik (MIT + paid Enterprise tier). Built for "I want orgs/workspaces in 10 minutes." Logto is the rising star but young; ZITADEL's relicense to AGPL is a deal-breaker for us; Authentik is excellent but Python-heavy and adds a worker queue.

3. **Component stacks for builders** — Ory (Kratos + Hydra + Keto + Oathkeeper, Apache-2.0) and SuperTokens (Apache-2.0 core, with EE features paywalled). Ory powers OpenAI's login at 900M WAU. Power and licensing are perfect; the cost is operational surface area (4 services for Ory).

4. **Avoid for our template** — FusionAuth is "free as in beer, not as in speech" (source-available proprietary); ZITADEL is now AGPL; Authelia has no SAML in 2026 and is a 3-person spare-time project; Casdoor works but the project's marketing/quality signals are mixed.

The honest answer for a 5-profile launcher: Keycloak is overkill on **Just Me** and **Side Project** (RAM, JVM, ops). Logto or no-auth is the right Day-1 default there. Keycloak earns its keep on **Early Startup** upward, the moment a customer says "we need SSO with Okta." We already have the Crossplane provider wired, so the marginal cost of including Keycloak as the "platform" choice is low. The real recommendation is: don't make this a single choice — make it a _profile-driven_ choice in the launcher.

**Key findings:**

- Keycloak (Apache-2.0) is the safest license + the deepest feature set + already wired into our Crossplane stack via the actively maintained crossplane-contrib/provider-keycloak (v1.x in 2026, generated from terraform-provider-keycloak via Upjet).
- Keycloak shipped first-class B2B multi-tenancy via 'Organizations' — preview in v25, GA in v26 — closing the gap that pushed many teams to Logto/ZITADEL in 2023-2024.
- ZITADEL relicensed from Apache-2.0 to AGPL-3.0 with v3.0 on 2025-03-31. For a template we will RESELL as managed SaaS this triggers network-copyleft obligations on our code — effectively AVOID for bundling, OK for users who self-host it themselves.
- FusionAuth Community is NOT open source — the EULA itself states 'free as in beer, not as in speech' and they have no plans to open-source the core. Bundling it would create license-redistribution ambiguity. AVOID for default bundling.
- Logto (MPL-2.0) is the strongest 'developer-first B2B-SaaS' alternative: native organizations/workspaces in the data model, organization_id in the JWT, TypeScript-first SDK, ~12k GH stars and growing. MPL-2.0 is file-level copyleft only — SAFE for our commercial template.
- Ory stack (Apache-2.0, all 4 components) is the highest-ceiling option — Kratos powers OpenAI's login at 900M WAU — but is 4 separate services to operate (Kratos, Hydra, Keto, Oathkeeper). Operational tax is real.
- Authentik core is MIT but uses an open-core model: Enterprise features (Google Workspace sync, MS Entra sync, advanced audit, device compliance, FIPS, mTLS) are paywalled. Their stated policy is no feature pulled OUT of OSS — so what's MIT today stays MIT.
- SuperTokens Core is Apache-2.0 but features in the /ee directory are commercial-only — bundling must explicitly exclude /ee to stay license-clean.
- Authelia has no SAML 2.0 support as of 2026 (open issue #493 with no published timeline) and is a 3-person spare-time team — excludes it from enterprise SSO use cases.
- Keycloak resource floor is real: ~1.25 GB RAM for production pod + 300 MB non-heap. Post-v26.5 it OOMs under 256 MB. This makes it the wrong default for the 'Just Me' (USD 0) and 'Side Project' (USD 5-20) profiles.
- Crossplane provider-keycloak is community-maintained, actively released (v1.2.0+ in 2026), Upjet-generated from terraform-provider-keycloak — so any future churn in the TF provider directly propagates. Pin versions.
- Closest commercial alternatives: Auth0 ~USD 240/mo at the B2B Essentials tier and rises sharply with M2M and orgs; WorkOS ~USD 125 per SSO connection per month; Clerk free up to 10k MAU then USD 25/mo + USD 0.02/MAU. Self-hosted Keycloak/Logto on Hetzner/Contabo costs USD 10-30/mo for the same workload.

**Gotchas:**

- Keycloak Organizations is GA in v26 — but the Crossplane provider's coverage of Organization CRDs lags upstream. Audit provider release notes before claiming GitOps parity for B2B tenants.
- ZITADEL's license change is retroactive for new versions only — v2.x stays Apache-2.0 but is EOL. Anyone choosing ZITADEL today is choosing AGPL.
- Authentik's worker uses Celery + Redis + PostgreSQL; minimum footprint is 3 pods + DB. Lighter than Keycloak but heavier than Logto.
- SuperTokens splits OSS Core (Apache-2.0) and Enterprise (/ee directory) in the SAME repo. CI must guard against accidentally bundling /ee into our container.
- Logto's CLI/console is excellent but the SAML IdP role is newer than its OIDC IdP role — validate SAML interop with the customer's identity vendor before promising parity with Keycloak.
- Ory Hydra is OAuth/OIDC only — it deliberately has NO user database; pair with Kratos (or another IdP) or you'll be confused. This catches first-time adopters.
- FusionAuth's free Community plan still requires creating a FusionAuth.io account to activate WebAuthn/Passkeys — a hidden lock-in for a 'self-hosted' product.
- Crossplane provider-keycloak is generated via Upjet from the Terraform provider — when upstream TF provider breaks, every claim in the template breaks. Pin both.

**Recommendation (this angle):** KEEP KEYCLOAK as the canonical Day-1 IdP for Early Startup / Scaling Startup / Production at Scale profiles, AND ADD LOGTO as the Day-1 IdP for Just Me / Side Project. Concretely: (1) Keep our existing Crossplane provider-keycloak wiring — it is the right tool for the audiences (B2B SaaS founders, enterprise customers demanding SAML/SSO, Aegis MCP). Apache-2.0 license is the safest in this category and Organizations (v26) finally makes B2B multi-tenancy first-class. (2) Add Logto as a launcher option for the two lowest profiles where Keycloak's 1.25 GB RAM floor and JVM ops surface are wrong; MPL-2.0 is commercial-safe. (3) Provide Ory Kratos+Hydra as an 'advanced/headless' on-demand option for teams who want maximum power and are willing to operate four services. (4) EXPLICITLY exclude ZITADEL (AGPL-3.0 since v3) and FusionAuth (source-available proprietary) from bundling — document them as 'BYO if you really want them' to keep license cleanliness for the commercial template. (5) EXCLUDE Authelia (no SAML, 3-person team) and Stack Auth (too young, dual-licensed including AGPL). Three reasons FOR Keycloak as primary: Apache-2.0 + Red Hat steward + 22k stars = lowest license/maintenance risk; deepest enterprise feature set including LDAP/AD federation, SAML, OIDC, Organizations, identity brokering; Crossplane GitOps story is already in our stack — no migration cost. Three reasons AGAINST: heavy (1.25 GB RAM, JVM, Infinispan caching); steep admin-console learning curve for vibe-coders; Crossplane provider lags upstream feature releases. Profile mapping — Just Me: Logto include-day-1; Side Project: Logto include-day-1; Early Startup: Keycloak include-day-1; Scaling Startup: Keycloak include-day-1 + Ory Oathkeeper on-demand for zero-trust API gateway; Production at Scale: Keycloak include-day-1 + Ory Keto on-demand for ReBAC. Upgrade path documented in launcher: 'when your bill on Auth0 would exceed USD 200/mo, you are already past break-even on the Keycloak profile we ship.'

**Citations:**

- [ZITADEL: Strengthening Our Open Source Foundation — Moving to AGPL 3.0](https://zitadel.com/blog/apache-to-agpl)
- [ZITADEL v3 Announcement (AGPL effective 2025-03-31)](https://zitadel.com/blog/zitadel-v3-announcement)
- [Keycloak — Announcement: Organizations for CIAM and Multi-tenancy](https://www.keycloak.org/2024/06/announcement-keycloak-organizations)
- [Keycloak — Concepts for sizing CPU and memory resources](https://www.keycloak.org/high-availability/concepts-memory-and-cpu-sizing)
- [Keycloak Performance Benchmarks 26.4](https://www.keycloak.org/2025/10/keycloak-benchmark)
- [crossplane-contrib/provider-keycloak — GitHub](https://github.com/crossplane-contrib/provider-keycloak)
- [Logto on GitHub (MPL-2.0, OIDC + multi-tenancy + RBAC)](https://github.com/logto-io/logto)
- [Logto vs Ory vs Keycloak — PkgPulse 2026 comparison](https://www.pkgpulse.com/guides/logto-vs-ory-vs-keycloak-open-source-identity-providers-2026)
- [Ory Kratos — GitHub (Apache-2.0, headless identity)](https://github.com/ory/kratos)
- [Ory — The Open Source IAM Stack That Powers ChatGPT's Login](https://ostechnix.com/what-is-ory/)
- [Authentik Pricing + Open Core principles](https://goauthentik.io/pricing/)
- [Authentik LICENSE (MIT) on GitHub](https://github.com/goauthentik/authentik/blob/main/LICENSE)
- [SuperTokens Core LICENSE (Apache-2.0 + /ee commercial)](https://github.com/supertokens/supertokens-core/blob/master/LICENSE.md)
- [FusionAuth License FAQ ('free as in beer, not as in speech')](https://fusionauth.io/license-faq)
- [Authelia vs Authentik 2026 — Cerbos (SAML status)](https://www.cerbos.dev/blog/authelia-vs-authentik-2026-idp)

---

## Workflow metadata

| Field           | Value                        |
| --------------- | ---------------------------- |
| Workflow ID     | `wf_bf9f68c1-77c`            |
| Agents          | 60 (48 angle + 12 synthesis) |
| Subagent tokens | 3,528,944                    |
| Tool uses       | 994                          |
| Wall clock      | ~12 min                      |

## What's next

Three follow-ups:

1. **Accept verdicts and fold into spec/plan.** Open a follow-up PR adding Bundle E XRDs (5 new), launcher CLI verbs (9 new), MCP tools (3 new), and ADR-0015 / ADR-0016. Document Unleash exclusion in Section 17.
2. **Defer.** Treat as advisory; revisit when ready to ship a SaaS-tier marketing site.
3. **Push back on specific verdicts.** Object to any single team's recommendation and re-dispatch with corrected framing.

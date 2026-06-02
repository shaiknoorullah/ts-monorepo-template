---
title: ts-monorepo-template — Platform Foundation Design
date: 2026-06-03
status: draft (pending review)
authors: shaiknoorullah; drafted with claude-opus-4-7 + a 15-agent parallel workflow
audience:
  - Audience 1 — founders / vibe-coders / junior engineers (via launcher CLI + marketing site)
  - Audience 2 — AI agents (notably Aegis) via the MCP server
supersedes:
  - pnow-ats-v2 `docs/superpowers/specs/2026-05-23-dev-env-design.md` (ported and extended)
related:
  - ovh `docs/superpowers/specs/2026-05-23-crossplane-schema-governance-and-kroxylicious-design.md`
  - ts-monorepo-template `docs/handoffs/2026-05-22/research-ts-monorepo-template.md`
  - ts-monorepo-template `docs/handoffs/2026-05-22/research-frontend-stack.md`
implements: a commercial open-core ts-monorepo-template platform foundation
---

# ts-monorepo-template — Platform Foundation Design

> A single-PR spec for the seven-layer platform that turns this template into a
> commercial open-core product. Two audiences: founders and vibe-coders enter
> through a launcher CLI + marketing site; AI agents (notably Aegis) enter
> through an MCP server. Every architectural decision is profile-aware and
> machine-readable.

## TL;DR

- One product, three surfaces (founder-facing launcher, agent-facing MCP, power-user task verbs); same content underneath.
- Seven technical layers (verb surface, toolchain+secrets, build orchestration, container build, app runtime, platform infra via Crossplane, optional Terraform+Ansible bootstrap) plus Layers 0a (launcher) and 0b (MCP server).
- Five curated profiles (`Just Me`, `Side Project`, `Early Startup`, `Scaling Startup`, `Production at Scale`) — each a coherent vertical slice across all layers, with cost band, tagline, and machine ID.
- Polyglot from day one — Go, Python, Rust, TypeScript — all visible in `nx graph`, all shippable through the same `task` verbs and Helm library chart.
- Crossplane is the only path for stateful infra; the four XRD bundles (core service primitives + observability/identity + schema-governance + cloud bootstrap) all ship Day-1.
- Sibling OSS Terraform providers (`terraform-provider-contabo`, `terraform-provider-hetzner-robot`) tracked from this template; greenfield Contabo provider scope is in Section 16.
- Nx Cloud uses a CI-only two-token model; local developers never authenticate; cache warming closes the cold-cache gap.
- Multi-env promotion is an ApplicationSet matrix generator; Kargo handles staged promotion with AnalysisRun gating.
- Profile materialization touches all seven layers in one go; `task profile:diff` shows what changes; `task profile:validate` dry-runs.

---

## Section 1 — Top-level architecture, profiles, and OSS provider sibling repos

### 1.1 Surface model: one product, three surfaces

```
                  ┌─ Founder (vibe / junior) ─→  Launcher CLI + marketing site
ONE PRODUCT ─────┼─ AI agent (Aegis et al.)   ─→  MCP server
                  └─ Power user (you, later)   ─→  Direct task verbs + edit files
```

Same content underneath. Surfaces just hide/expose at different levels.

### 1.2 Layered architecture (Layers 0a + 0b + 1–7)

```
0a  Launcher CLI + marketing site         ← Audience 1 entry point
0b  MCP server                            ← Audience 2 entry point
─── (everything below hidden from founders, queryable by agents) ───
1   Verb surface (Taskfile)               vendor-neutral CLI
2   Toolchain (devenv.nix) + secrets      Nix-pinned langs + OS keyring + AKV
3   Build orchestration (Nx + Nx Cloud)   community plugins for Go/Py/Rust; CI-only auth
4   Container build (BuildKit + cosign)   multi-stage per-lang Dockerfiles, keyless signing
5   App runtime (Helm library chart)      observability + security baked in
6   Platform infra (Crossplane)           XRDs for stateful infra; ESO for secrets
7   Bootstrap (Terraform + Ansible)       optional; Kubespray-style configurable; 7 clouds
```

### 1.3 Key invariants

- Engineers type only `task <verb>` (Layer 1). Everything else is replaceable underneath.
- `secretspec` is the only secret surface; no plaintext `.env.local` ever committed or written. AKV is the source of truth for shared/team secrets; OS keyring is the local cache.
- Nx Cloud token lives **only** in GH Actions secrets. Local builds run without it (cache miss → local re-execution). Self-host path documented but not default.
- Each polyglot app is fully visible to Nx via the community plugin (`nx graph` shows Go/Python/Rust nodes alongside TypeScript).
- Library chart is the **only** Helm artifact apps depend on. App-specific charts in `infra/helm/apps/<svc>/` are 3 files: `Chart.yaml` (deps lib-chart), `values.yaml` (defaults), `values.{env}.yaml` (overlays).
- Crossplane is the **only** path for stateful infra. No app Helm chart provisions a DB / cache / topic. Apps consume connection details via `ExternalSecret` referencing a Crossplane-published secret.
- Bootstrap is opt-in: by default the template assumes a working kubeconfig. The `infra/terraform/` + `infra/ansible/` paths exist for full prod cluster bringup, Kubespray-style configurable.

### 1.4 Cross-cutting requirements (apply to every layer)

| Requirement                                         | Why                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| `META.yaml` next to every `README.md`               | Machine-readable layer contract for agents                                |
| `AGENTS.md` per directory                           | Cascading agent guidance, founder-safe verbs                              |
| Capability descriptor on every app / XRD / preset   | What it does, depends on, costs, owns                                     |
| ADR auto-emission on architectural choices          | Founder pick → `docs/adrs/NNNN-*.md` written automatically                |
| Decision audit log                                  | Timestamp + question + answer + reasoning + alternative                   |
| All errors carry plain-English text + auto-fix hint | Founder-readable; agents parse the structured `{error_code, fix_command}` |

### 1.5 Profiles — names, IDs, cost bands, taglines

| Founder label           | Machine ID        | $/mo band | One-line tagline                         |
| ----------------------- | ----------------- | --------- | ---------------------------------------- |
| **Just Me**             | `p-solo`          | $0        | "I'm hacking on something this weekend." |
| **Side Project**        | `p-hobby`         | $5–20     | "Maybe 100 users, single VPS, $5–20/mo." |
| **Early Startup**       | `p-startup-small` | $30–150   | "2–10 of us, real customers, basic HA."  |
| **Scaling Startup**     | `p-startup-scale` | $300–1500 | "Funded, multi-env, multi-AZ, real SLA." |
| **Production at Scale** | `p-enterprise`    | $2k+      | "Multi-region, compliance, audit trail." |

Each profile is a directory at `profiles/<machineId>/` containing:

```
profiles/p-startup-scale/
├── README.md                       # which params, why, what's tested
├── terraform.tfvars                # cluster size, region, instance types
├── ansible/group_vars.yml          # CNI, addons, kernel params
├── crossplane/composition-pins.yaml # which Composition revision per XRD
├── helm-values/                    # values.{lib-chart,go-hello,py-hello,rs-hello}.yaml
├── secretspec.toml                 # required vs optional secrets for this shape
├── argocd/appset-overrides.yaml    # promotion strategy + sync waves
└── nx/preset.json                  # Nx Cloud workspace + cache mode
```

### 1.6 Profile dimensions (the 12 axes)

| Axis                  | Range                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `team_size`           | solo / small (2–10) / mid (10–50) / large (50+)                     |
| `env_count`           | 1 (dev only) / 2 (dev+prod) / 3 (dev/staging/prod) / N (per-tenant) |
| `target_budget_usd`   | <$20 / <$100 / <$500 / <$2k / open                                  |
| `compliance_floor`    | none / SOC2-ready / HIPAA-ready / FedRAMP-ready                     |
| `workload_shape`      | web-services / event-driven / batch / mixed                         |
| `ha_level`            | none / single-AZ / multi-AZ / multi-region                          |
| `cluster_substrate`   | local-k3d / single-VPS / bare-VM k3s / kubeadm / managed-K8s        |
| `mesh`                | none / linkerd / istio / cilium-mesh                                |
| `observability_depth` | metrics-only / +logs / +traces / +profiling                         |
| `secret_backend`      | keyring (dev) / akv / asm / gsm / vault                             |
| `registry`            | ghcr / acr / ecr / gar / harbor                                     |
| `cdn_edge`            | none / cloudflare / fastly                                          |

The 5 named profiles each pick a coherent set of values across all 12 axes. Engineers can `task profile:fork` to make custom profiles; CI matrix gates only the 5 named ones.

### 1.7 Launcher CLI (Layer 0a) — founder front door

`npx create-platform@latest` OR `task init`:

1. Project name + slug
2. Profile recommender: 5–10 questions → ranked profile + reasoning
3. Cloud selection (offered conditionally on profile)
4. Secret backend selection (founder-friendly labels)
5. Domain + TLS (Cloudflare default)
6. Reference apps to seed (Go, Python, Rust, all, none)
7. Materializes: customized monorepo + ADRs + audit log + `task launch` instructions
8. Outputs a "what's next" Markdown plan with three immediate next commands

Full implementation detail: Section 11.

### 1.8 MCP server (Layer 0b) — agent front door

Ships as `@ts-monorepo-template/mcp-server` (npm) **and** `internal/mcp-server/` (in-repo) for direct development. Exposes:

| Tool                                | Purpose                                                                                          |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `list_profiles`, `describe_profile` | Enumerate + introspect profiles with full tradeoff structure                                     |
| `recommend_profile`                 | Constraints (team_size, budget, compliance, …) → ranked recommendations + reasoning              |
| `list_apps`, `describe_app`         | Inventory current monorepo apps with their capability descriptors                                |
| `add_app`                           | Scaffold a new polyglot app under a profile's constraints                                        |
| `list_xrds`, `describe_xrd`         | Enumerate Crossplane platform XRDs available                                                     |
| `claim_infra`                       | Scaffold an XR claim (e.g., `XPostgresCluster` for `app-foo`) under the right env                |
| `simulate_cost`                     | Current state + projected traffic → estimated $/mo per layer                                     |
| `explain_tradeoff`                  | "What changes if I switch from `p-hobby` to `p-startup-small`?" → diff of files, resources, $/mo |
| `validate_plan`                     | Dry-run-validate any proposed change against all 7 layers                                        |
| `propose_change`                    | Produces a structured patch + ADR draft + audit log entry                                        |

Aegis is the reference consumer. Conforms to the MCP spec so any Claude/Codex/Cursor agent can drive it. Full tool schemas + impl plan: Section 11.

### 1.9 Cloud Terraform modules (Layer 7) — 7 providers

Contabo + Hetzner Cloud + OVH + Azure + AWS + GCP + Cloudflare. Each in `infra/terraform/modules/<provider>/`. Composable per environment.

Sibling OSS provider repos (referenced as transitive Terraform Registry deps, not subdirectories):

| Repo (proposed)                                               | Scope                                                                                                                                                                                           | Status                       | Approach                                                                         |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------- |
| `shaiknoorullah/terraform-provider-contabo`                   | Greenfield: `instance`, `private_network`, `private_network_attachment`, `snapshot`, `image`, `object_storage_bucket`, `object_storage_credential`, `firewall`, `secret`, `role`, `user`, `tag` | NEW                          | Plugin Framework v6, oapi-codegen client, goreleaser → registry                  |
| `shaiknoorullah/terraform-provider-hetzner-robot` (if needed) | Dedicated-server side: `server`, `boot`, `ip`, `subnet`, `vswitch`, `firewall`, `failover`, `key`                                                                                               | NEW or upstream contribution | First try upstreaming PRs to `panta/hetzner`; only fork if maintainership stalls |
| `hetznercloud/hcloud`                                         | Hetzner Cloud (VPS, networks, LB, volumes)                                                                                                                                                      | Upstream, mature             | Use upstream                                                                     |
| `ovh/ovh`                                                     | OVHcloud (VPS, dedicated, DNS, IAM)                                                                                                                                                             | Upstream                     | Use upstream                                                                     |
| `Telmate/proxmox`                                             | Proxmox VE (on-prem PVE substrate)                                                                                                                                                              | Upstream, community          | Use upstream                                                                     |

Full sibling-repo scope, milestones, and tooling stack: Section 16.

### 1.10 What ships Day-1 in this PR

- Layers 1–7 fully working with three reference polyglot apps (Go/Python/Rust hello-world end-to-end).
- Layer 0a: Launcher CLI scaffold (works for `Just Me` + `Side Project` end-to-end; other profiles compile + render but their full bringup is in nightly CI matrix).
- Layer 0b: MCP server scaffold with **all tools defined**; deterministic ones implemented (`list_profiles`, `describe_profile`, `recommend_profile`, `list_apps`, `simulate_cost`, `explain_tradeoff`); the rest as scaffolded stubs with stable schemas.
- Marketing site shell (`apps/marketing/`) with the 5-profile pricing-style table + "from zero to deployed" hero.
- Sibling OSS provider repos scaffolded (separate PRs, but roadmap and stub TF modules tracked here).
- ADR system + audit log + cost simulator skeleton (works for `Just Me` and `Side Project` cleanly).
- Full nightly CI bringup of `Production at Scale` is gated manual (cost cap, not Day-1).
- Live Terraform Registry publish of the Contabo provider is a sibling effort, separate PR.

---

## Section 2 — Polyglot Nx integration

### 2.1 Plugins (locked) + versions

| Lang                             | Plugin                               | Resolves                                                   | Generators we wrap                    |
| -------------------------------- | ------------------------------------ | ---------------------------------------------------------- | ------------------------------------- |
| Go                               | `@nx-go/nx-go`                       | `go.mod` per project; uses `go build/test/vet`             | `application`, `library`, `cli`       |
| Python                           | `@nxlv/python`                       | `pyproject.toml` per project; uv-managed (workspace-aware) | `python-project`, `dependency`, `add` |
| Rust                             | `@monodon/rust`                      | `Cargo.toml` per project; cargo-managed                    | `binary`, `library`, `napi`           |
| TypeScript (already in template) | `@nx/js` + `@nx/vite` + `@nx/eslint` | `package.json` per project                                 | `library`, `application`              |

All four plugins use Nx 21's **inferred plugin** mode — they auto-discover projects without per-project `project.json`. Apps may _add_ `project.json` to declare implicit deps or override target options.

### 2.2 `nx.json` additions

```jsonc
{
  "plugins": [
    /* existing: @nx/vite, @nx/eslint */
    {
      "plugin": "@nx-go/nx-go",
      "options": {
        "buildTargetName": "build",
        "testTargetName": "test",
        "lintTargetName": "lint",
        "tidyTargetName": "tidy",
      },
    },
    {
      "plugin": "@nxlv/python",
      "options": { "packageManager": "uv" },
    },
    {
      "plugin": "@monodon/rust",
      "options": {
        "buildTargetName": "build",
        "testTargetName": "test",
        "lintTargetName": "lint",
      },
    },
  ],
  "namedInputs": {
    "polyglot-source": [
      "{projectRoot}/**/*.go",
      "{projectRoot}/go.mod",
      "{projectRoot}/go.sum",
      "{projectRoot}/**/*.py",
      "{projectRoot}/pyproject.toml",
      "{projectRoot}/uv.lock",
      "{projectRoot}/**/*.rs",
      "{projectRoot}/Cargo.toml",
      "{projectRoot}/Cargo.lock",
      "{projectRoot}/**/*.{ts,tsx,js,mjs,cjs}",
      "{projectRoot}/package.json",
    ],
  },
  "targetDefaults": {
    "build": { "inputs": ["polyglot-source", "^production"], "cache": true },
    "container": {
      "executor": "nx:run-commands",
      "cache": true,
      "dependsOn": ["build"],
      "inputs": ["polyglot-source", "{projectRoot}/Dockerfile", "{workspaceRoot}/docker/base/**"],
      "outputs": [],
    },
  },
}
```

### 2.3 Project-graph visibility

`nx graph` after PR lands shows TS apps + packages + Go services + Python services + Rust services + their Helm charts (treated as data nodes via inferred plugin on `infra/helm/apps/*/Chart.yaml`) + their Crossplane claims (data nodes from `infra/crossplane/claims/`). All polyglot, one graph.

### 2.4 Cross-language dependencies — how `nx affected` flows

Solved via a shared `packages/contracts/` package with `.proto` files + `buf` codegen:

```
packages/contracts/
├── buf.yaml
├── buf.gen.yaml          # generates ts, go, python, rust bindings
├── src/proto/v1/*.proto
├── gen/                  # committed-or-CI-build (configurable)
│   ├── ts/               # → packages/contracts dist
│   ├── go/               # → apps/<go-svc>/internal/gen/ via import alias
│   ├── python/           # → packaged wheel under packages/contracts-py
│   └── rust/             # → crate under packages/contracts-rs
└── project.json          # declares implicit deps for downstream consumers
```

Polyglot apps declare implicit dep on `contracts`:

```jsonc
// apps/go-hello/project.json
{
  "name": "go-hello",
  "implicitDependencies": ["contracts"],
  "targets": {
    "build": { "inputs": ["polyglot-source", { "dependentTasksOutputFiles": "gen/go/**" }] },
  },
}
```

Editing a `.proto` in `packages/contracts/` triggers `nx affected -t build,container` to rebuild every polyglot service. Without this, Nx is blind across language boundaries.

### 2.5 `task` wrappers (founder-facing) vs `nx g` (power-user)

The launcher CLI never exposes `nx g`. Wrappers in `internal/cli/src/commands/new.ts`:

| Verb                         | What it does                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task new:backend`           | fzf picker for language; prompts for name (validated against commitlint scope-enum) + needs-db? + needs-cache? + needs-kafka?                     |
| `task new:backend:go <name>` | Wraps `nx g @nx-go/nx-go:app --name=<name> --directory=apps/<name>`; then adds Dockerfile, Helm chart, META.yaml, AGENTS.md, ADR, audit log entry |
| `task new:backend:py <name>` | Wraps `nx g @nxlv/python:python-project --name=<name>`; same post-steps                                                                           |
| `task new:backend:rs <name>` | Wraps `nx g @monodon/rust:binary --name=<name>`; same post-steps                                                                                  |
| `task new:lib`               | Same shape for libraries (4 languages, packages/ destination)                                                                                     |
| `task new:frontend`          | For completeness — TS-only, wraps `@nx/js:lib` or app shell                                                                                       |

Each generator wrapper emits sibling artifacts to the source dir:

```
apps/<name>/
├── src/...                          # generator-provided
├── Dockerfile                       # rendered from internal/templates/dockerfiles/<lang>.Dockerfile.template
├── project.json                     # implicit deps + target overrides
├── META.yaml                        # capability descriptor (agents read this)
├── AGENTS.md                        # per-app agent guidance
├── README.md                        # founder-facing
└── Taskfile.yml                     # per-app verb namespace (optional)

infra/helm/apps/<name>/
├── Chart.yaml                       # deps: ../../lib-chart
├── values.yaml                      # defaults
├── values.{dev,staging,prod}.yaml   # env overlays

docs/adrs/NNNN-add-<name>-<lang>.md  # auto-emitted
.audit/decisions.jsonl               # auto-appended (sha256 chain)
```

### 2.6 `META.yaml` (per-app capability descriptor) — agent contract

```yaml
apiVersion: ts-monorepo-template.dev/v1
kind: App
metadata:
  name: go-hello
  language: go
  framework: chi
spec:
  capabilities:
    - http-api
    - prometheus-metrics
    - otel-tracing
  needs:
    - kind: XPostgresCluster
      ref: { name: go-hello-pg, env: '{{env}}' }
      optional: true
    - kind: XRedisCluster
      optional: true
    - kind: XKafkaTopic
      topics: [user.events.v1]
      optional: true
  exposes:
    services: [{ name: go-hello, port: 8080, protocol: http }]
    metrics: { path: /metrics, port: 9090 }
    health: { path: /healthz, port: 8080 }
  resources:
    requests: { cpu: 50m, memory: 64Mi }
    limits: { cpu: 500m, memory: 256Mi }
  costEstimate:
    minimal: 1usd/month # Just Me
    typical: 5usd/month # Side Project / Early Startup
```

### 2.7 Per-language container build matrix

| Lang       | Build stage                            | Runtime stage                                         | Caching                                                                     | Multi-arch                                                |
| ---------- | -------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Go         | `golang:1.24-bookworm`                 | `gcr.io/distroless/static-debian12` (CGO_ENABLED=0)   | `--mount=type=cache,target=/root/.cache/go-build,id=go-cache-${TARGETARCH}` | linux/amd64 + linux/arm64                                 |
| Python     | `python:3.13-slim-bookworm` + `uv`     | `gcr.io/distroless/python3-debian12`                  | `uv` venv layer + `--compile-bytecode`                                      | linux/amd64 (arm64 opt-in; wheel availability gate)       |
| Rust       | `rust:1.83-bookworm` + `cargo-chef`    | `gcr.io/distroless/cc-debian12` (or `static` if MUSL) | `cargo-chef cook` → recipe + sysroot layers                                 | linux/amd64 + linux/arm64 (MUSL static for static target) |
| TypeScript | `node:22-bookworm-slim` + `pnpm fetch` | `gcr.io/distroless/nodejs22-debian12`                 | `pnpm` content-addressed cache mount                                        | linux/amd64 + linux/arm64                                 |

Full container build detail: Section 5.

### 2.8 Tagging strategy

| Tag pattern            | When          | Mutable?               |
| ---------------------- | ------------- | ---------------------- |
| `sha-<git-sha>`        | every CI run  | no                     |
| `pr-<num>-sha-<short>` | PR builds     | no                     |
| `<branch>`             | branch builds | yes (latest of branch) |
| `v<changeset-version>` | release       | no                     |
| `latest`               | main only     | yes                    |

Helm `values.{env}.yaml` references `sha-*` or `v*` tags only (immutable).

### 2.9 Gotchas worth calling out

1. **`@nx-go/nx-go` doesn't infer cross-Go-module deps automatically** when projects use `replace` directives. Mitigation: `implicitDependencies` declared in generator output; CI smoke test asserts the graph.
2. **`@nxlv/python` defaulted to Poetry historically**; we explicitly pass `packageManager: uv` (10× faster, lockfile-stable). Pin the plugin to a version that supports uv (≥18.x).
3. **`@monodon/rust` requires Cargo.lock at repo root** for workspace mode; we configure a top-level `Cargo.toml` workspace listing `apps/*/Cargo.toml` + `packages/contracts-rs/Cargo.toml`. Otherwise per-project lockfiles drift.
4. **Buf code-gen output should be committed** for Go/Rust/TS (clean repo state, no codegen-on-build), but Python generated code is a wheel built per-CI. Commit Go/TS/Rust generated code; CI builds Python wheel from `packages/contracts-py/`.
5. **`nx affected` semantics with Nx Cloud**: CI must use `nrwl/nx-set-shas@v4` to set `NX_BASE`/`NX_HEAD` correctly. Without this, every PR rebuilds everything.

### 2.10 Reference apps shipped Day-1

Three minimal services consuming `packages/contracts/`:

| App              | Stack                 | Endpoints                         | OTel                               | DB               | Cache         | Kafka       |
| ---------------- | --------------------- | --------------------------------- | ---------------------------------- | ---------------- | ------------- | ----------- |
| `apps/go-hello/` | Go 1.24 + chi         | `/healthz` `/metrics` `/v1/users` | auto-instrumentations-go           | XPostgresCluster | XRedisCluster | XKafkaTopic |
| `apps/py-hello/` | Python 3.13 + FastAPI | `/healthz` `/metrics` `/v1/users` | `opentelemetry-instrument fastapi` | XPostgresCluster | XRedisCluster | aiokafka    |
| `apps/rs-hello/` | Rust 1.83 + Axum      | `/healthz` `/metrics` `/v1/users` | `tracing-opentelemetry`            | XPostgresCluster | XRedisCluster | rdkafka     |

All three consume the same `User` protobuf from `packages/contracts/`, are deployable through the same lib-chart with three `values.yaml` files, are buildable through one `nx run-many -t container`, and are claimable in the launcher via `task new:backend`.

Full reference-app detail: Section 12.

---

## Section 3 — Nx Cloud setup

### 3.1 Auth model: CI-only, two-token, never local

| Token                             | Scope          | Lives in                                 | Used by                                             |
| --------------------------------- | -------------- | ---------------------------------------- | --------------------------------------------------- |
| `NX_CLOUD_ACCESS_TOKEN`           | **read+write** | GH repo secret (`main` branch protected) | push-to-main jobs, release jobs, nightly cache-warm |
| `NX_CLOUD_ACCESS_TOKEN_READ_ONLY` | **read-only**  | GH repo secret                           | PR jobs (incl. PRs from forks)                      |
| (none)                            | —              | local devs                               | `nx affected` uses local cache only                 |

Three guarantees:

1. **No local auth.** Engineers never run `nx-cloud login`. The token is never on a laptop. OSS contributors can clone-and-build without an account.
2. **PRs from forks cannot poison cache.** GH workflows pass the read-only token to `pull_request` events; the write token is gated to `push` events + protected-branch context.
3. **Cache entries are content-addressed by input hash.** A malicious PR can't overwrite a different PR's output — the inputs are different, so the cache key is different.

Local devs see a one-liner in `nx` output: `remote cache: disabled (no NX_CLOUD_ACCESS_TOKEN — using local cache only)`. No error, no prompt, no degraded function beyond speed.

### 3.2 Backend choice (SaaS default, self-host opt-in)

```
                  ┌─ SaaS (Nx Cloud, free tier)  ← DEFAULT
nxCloud target ───┼─ Self-host: PowerPack (S3/Azure/GCS)  ← paid, opt-in
                  └─ Self-host: community adapter  ← free, opt-in, fewer features
```

| Path                                   | Free?                | Insights UI? | DTE?            | Storage                       | Best for                                                    |
| -------------------------------------- | -------------------- | ------------ | --------------- | ----------------------------- | ----------------------------------------------------------- |
| Nx Cloud SaaS                          | yes (50k uploads/mo) | yes          | yes (paid tier) | Nx-managed                    | `Side Project`, `Early Startup`, `Scaling Startup` profiles |
| PowerPack self-host                    | no (license)         | yes          | yes             | your S3/Azure-Blob/GCS bucket | `Production at Scale` (compliance/data-residency)           |
| Community adapter (`nx-remotecache-*`) | yes                  | no           | no              | your bucket                   | air-gapped / cost-sensitive orgs                            |

Template defaults to SaaS. Profile materializer rewrites `nx.json` `nxCloud` block + `tasksRunnerOptions` for the chosen path.

### 3.3 `nx.json` (SaaS default)

```jsonc
{
  "nxCloudId": "<populated by `task nx-cloud:setup`>",
  "neverConnectToCloud": false,
  "parallel": 3,
  "useDaemonProcess": true,
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx-cloud",
      "options": {
        "cacheableOperations": [
          "build",
          "test",
          "lint",
          "type-check",
          "container",
          "attw",
          "publint",
        ],
        "accessToken": "${NX_CLOUD_ACCESS_TOKEN}",
      },
    },
  },
}
```

For PowerPack/S3 (profile-driven swap):

```jsonc
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "@nx/powerpack-s3-cache",
      "options": {
        "bucket": "ts-monorepo-template-cache-${env}",
        "region": "${AWS_REGION}",
        "cacheableOperations": [...]
      }
    }
  }
}
```

License key + bucket creds wired through ESO from AKV/ASM; not committed.

### 3.4 Cache-warming (closes the "always cold" gap)

`.github/workflows/nx-cloud-warm.yml`:

- triggers: `push` to `main` + manual `workflow_dispatch`
- runs: `nx affected -t build test lint type-check container --base=HEAD~1 --head=HEAD` with write token
- effect: PRs on subsequent push hit warm cache on first run

Also runs on the **nightly** workflow over a wider base (`origin/main~7`) to refresh the cache against drift.

### 3.5 `task` verbs (founder-facing)

| Verb                      | What it does                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `task nx-cloud:setup`     | Wizard: opens Nx Cloud signup page, pastes token, writes GH secrets via `gh` CLI, updates `nx.json` `nxCloudId`, opens a PR `chore(ci): enable Nx Cloud` |
| `task nx-cloud:status`    | Reads Nx Cloud API: recent runs, cache hit rate over last 7d, estimated CI time saved, current bandwidth                                                 |
| `task nx-cloud:warm`      | Triggers `nx-cloud-warm.yml` via `gh workflow run`                                                                                                       |
| `task nx-cloud:disable`   | Reverse migration — sets `nxCloudId: null`, removes runner, deletes GH secret, opens PR                                                                  |
| `task nx-cloud:self-host` | Wizard: switches `tasksRunnerOptions.runner` to PowerPack S3 or community adapter; provisions bucket via Crossplane `XBucket` claim                      |

### 3.6 MCP tools (agent-facing) added to the MCP server

| Tool                            | Output shape                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `nx_cloud_status`               | `{ enabled, runner, lastWarmTimestamp, accessTokenSource }`                                                        |
| `nx_cloud_cache_hit_rate`       | `{ window: "7d", rate: 0.83, samples: 142 }`                                                                       |
| `nx_cloud_recent_runs`          | array of `{ sha, branch, duration_ms, cache_hit_count, cache_miss_count, savings_ms }`                             |
| `nx_cloud_estimate_savings_usd` | given CI runner $/min from `data/cloud-prices/gha.yaml`: `{ saved_ms_30d, saved_usd_30d, projection_monthly_usd }` |
| `nx_cloud_recommend_backend`    | given profile + monthly CI minutes + compliance flags → ranked recommendation across SaaS/PowerPack/community      |

### 3.7 Profile defaults

| Profile                                | Nx Cloud default                                          | Rationale                                                                       |
| -------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `Just Me` (`p-solo`)                   | **disabled**                                              | One-machine workspace; remote cache is overkill, adds an account dependency     |
| `Side Project` (`p-hobby`)             | **SaaS, opt-in via wizard**                               | Usually solo + CI; free tier covers it; wizard prompts but defaults to skip     |
| `Early Startup` (`p-startup-small`)    | **SaaS, enabled**                                         | 2–10 engineers; cache wins compound; free tier covers it                        |
| `Scaling Startup` (`p-startup-scale`)  | **SaaS, enabled + DTE on paid tier when CI > 30 min/run** | Recommender suggests DTE upgrade when threshold crossed                         |
| `Production at Scale` (`p-enterprise`) | **PowerPack self-host**                                   | Compliance/data-residency demands; `task nx-cloud:self-host` runs the migration |

### 3.8 Security boundaries — what we explicitly defend against

| Threat                                     | Defense                                                                                                                                                                                                                 |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fork-PR poisons cache                      | Workflow uses `NX_CLOUD_ACCESS_TOKEN_READ_ONLY` for `pull_request` events; write token gated by `if: github.event_name == 'push' && github.ref == 'refs/heads/main'`                                                    |
| Compromised dev laptop leaks token         | Token never on a laptop. Period.                                                                                                                                                                                        |
| Compromised Action exfiltrates token       | Third-party Actions pinned to 40-char SHAs (post-Trivy 2026 incident — already in CI).                                                                                                                                  |
| Nx Cloud-side breach                       | Cache entries are build artifacts only, no secrets in inputs (sanity-checked by `cspell` rule on common secret patterns + a `task nx-cloud:audit-inputs` verb that scans recent run inputs for secret-looking strings). |
| Self-host bucket exposure (PowerPack path) | Bucket created via XBucket XR with `publicAccess: deny`, encryption-at-rest required, lifecycle policy 30d retention.                                                                                                   |

### 3.9 What ships Day-1 in this PR

- `nx.json` configured for SaaS path with `nxCloudId` placeholder
- Two-token GH workflow pattern in all CI workflows (read-only on PR events)
- `task nx-cloud:setup`, `nx-cloud:status`, `nx-cloud:disable`, `nx-cloud:warm` verbs
- `.github/workflows/nx-cloud-warm.yml` (push-to-main + nightly + manual dispatch)
- Profile materializer wires the right backend per profile
- MCP tools `nx_cloud_status` + `nx_cloud_recommend_backend` implemented
- MCP `nx_cloud_cache_hit_rate` + `recent_runs` + `estimate_savings_usd` — schemas stable, impl uses Nx Cloud's public API; stubbed with mock data until token is wired
- PowerPack self-host path: `task nx-cloud:self-host` scaffolded but full provisioning (S3/Azure bucket via XBucket claim) requires Crossplane bootstrap (Section 8)
- Distributed Task Execution config — defined in docs as opt-in; not enabled by default; documented escalation path

---

## Section 4 — Dev environment (devenv.nix + Taskfile + secretspec + direnv)

### 4.1 Goal

One command (`task install`) gets a founder, a junior engineer, or an AI agent from a clean clone to a running stack — polyglot toolchain pinned, secrets resolved, data plane up, pre-commit hooks installed. No global `brew install`, no global `npm i -g`, no manual `.env` editing.

Inherits the proven shape from `pnow-ats-v2` and extends for:

| Add                                            | Reason                                                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Polyglot toolchain (Node + Python + Go + Rust) | Profiles can include any combination of these                                                     |
| Profile-aware devenv profile                   | Just Me skips Rust/gcloud/aws; Production at Scale includes everything                            |
| OS keyring backend selection                   | macOS Keychain / GNOME Keyring / KWallet auto-detected per host                                   |
| AKV bootstrap loop                             | Engineer-initiated, Entra-gated, audit-logged — for shared team secrets                           |
| 4-language env:reconcile grep                  | Drift detection across `process.env.X`, `os.environ["X"]`, `os.Getenv("X")`, `std::env::var("X")` |

### 4.2 Toolchain pins (Day-1)

| Tool       | Version         | Source                                        | Notes                                       |
| ---------- | --------------- | --------------------------------------------- | ------------------------------------------- |
| devenv     | 1.x             | https://devenv.sh/getting-started/            | Nix flake under the hood                    |
| Nix        | 2.24+           | Determinate Systems installer                 | Required by devenv                          |
| direnv     | 2.34+           | nix package                                   | `.envrc` → `use devenv`                     |
| Task       | 3.39+           | nix package                                   | Taskfile.yml runner                         |
| Node       | 22 LTS          | devenv `languages.javascript`                 | pnpm-managed deps                           |
| pnpm       | 10.x            | corepack inside devenv                        | Lockfile is source of truth                 |
| Python     | 3.13            | devenv `languages.python`                     | uv-managed venvs                            |
| uv         | 0.5+            | nix package                                   | `uv sync` / `uv run`                        |
| Go         | 1.24            | devenv `languages.go`                         | Module-aware                                |
| Rust       | stable (rustup) | devenv `languages.rust` with `rustup`-channel | Channel pinned via `rust-toolchain.toml`    |
| secretspec | latest          | https://secretspec.dev                        | OS keyring + AKV providers                  |
| aicommits  | 1.x             | pnpm dlx                                      | Used by `task commit` with hard schema gate |
| pre-commit | 4.x             | devenv `git-hooks.hooks` block                | Native to devenv                            |

All version drift is detectable via `task env:reconcile` (Section 4.9).

### 4.3 devenv.nix shape

Top-level `devenv.nix` reads `DEVENV_PROFILE` (set by `.envrc` from `profiles/<machineId>/profile.env`) and includes only the relevant language modules.

```nix
{ pkgs, lib, config, inputs, profile, ... }:
let
  toolchains = import ./devenv/toolchains.nix { inherit pkgs lib profile; };
in
{
  name = "ts-monorepo-template";

  languages = toolchains.languages;          # node + py + go + rs gated by profile
  packages  = toolchains.packages;           # task, direnv, secretspec, cosign, kubectl, etc.

  pre-commit.hooks = import ./devenv/pre-commit.nix { inherit pkgs; };

  enterShell = ''
    ${toolchains.banner}
    secretspec check || echo "run: task secrets:bootstrap"
    task env:check --silent || echo "run: task env:reconcile"
  '';

  processes = import ./devenv/processes.nix { inherit pkgs profile; };
}
```

Profile mapping (sourced from `profiles/<machineId>/devenv.profile.nix`):

| Profile         | Node | Python | Go  | Rust | Extra packages                         |
| --------------- | ---- | ------ | --- | ---- | -------------------------------------- |
| p-solo          | yes  | yes    | opt | no   | k3d, kubectl, helm                     |
| p-hobby         | yes  | yes    | opt | no   | + ssh, ansible-lite                    |
| p-startup-small | yes  | yes    | yes | opt  | + terraform, hcloud, kubectl-mtls      |
| p-startup-scale | yes  | yes    | yes | yes  | + gcloud OR aws OR az (one cloud)      |
| p-enterprise    | yes  | yes    | yes | yes  | + gcloud + aws + az + vault + istioctl |

"opt" = pulled in only if any project in `nx.json` declares that language. Detected at `enterShell` time via `nx show projects --type lib --json`.

### 4.4 Pre-commit hooks (devenv git-hooks block)

Single source of truth at `devenv/pre-commit.nix`. No `.pre-commit-config.yaml` drift.

| Hook                      | Scope                        | Notes                                                                 |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------- |
| `nixpkgs-fmt`             | `*.nix`                      | devenv config hygiene                                                 |
| `prettier`                | `*.{ts,tsx,js,json,md,yaml}` | pnpm-managed config                                                   |
| `eslint`                  | `*.{ts,tsx,js}`              | Nx-aware, only touches affected                                       |
| `ruff` + `ruff-format`    | `*.py`                       | Replaces black + flake8 + isort                                       |
| `gofmt` + `golangci-lint` | `*.go`                       |                                                                       |
| `rustfmt` + `clippy`      | `*.rs`                       | `cargo clippy -- -D warnings`                                         |
| `shellcheck`              | `*.sh`                       |                                                                       |
| `commitlint`              | commit-msg                   | Reads `commitlint.config.cjs` schema from Section 4.10                |
| `secretspec-check`        | pre-commit                   | Refuses commit if `secretspec.toml` declares a secret not satisfiable |
| `gitleaks`                | pre-commit                   | Detect raw secrets accidentally staged                                |

Bypass (`--no-verify`) is blocked at the harness level per repo policy. Fix the env, not the hook.

### 4.5 secretspec.toml — declared contract

`secretspec.toml` is the single declared contract for every secret the monorepo consumes. The OS keyring and AKV are _backends_; the toml is the schema.

```toml
[project]
name = "ts-monorepo-template"
revision = 1

[profiles.default]
backend = "keyring"          # macOS Keychain / GNOME Keyring / KWallet auto-detected
fallback = "env"

[profiles.team]
backend = "akv"
akv_vault_url = "https://${secrets:AKV_NAME}.vault.azure.net"
fallback = "keyring"

# --- declared secrets ---

[secrets.DATABASE_URL]
description = "Local postgres connection string"
required = true
profiles = ["p-solo", "p-hobby", "p-startup-small", "p-startup-scale", "p-enterprise"]
default_dev = "postgres://app:app@localhost:5432/app"

[secrets.OPENAI_API_KEY]
description = "OpenAI key for AI features"
required = false
profiles = ["p-startup-small", "p-startup-scale", "p-enterprise"]
consumers = ["apps/api", "apps/worker-py"]

[secrets.GHCR_TOKEN]
description = "GHCR pull/push token (CI only — never in dev shell)"
required = true
profiles = ["ci"]
ci_only = true
```

Validation:

```
task secrets:check     # fails if any required-for-current-profile secret is missing
task env:reconcile     # cross-refs declared vs referenced (Section 4.9)
```

### 4.6 OS keyring backend (per-host auto-select)

| Host           | Backend                                 | Detection                      |
| -------------- | --------------------------------------- | ------------------------------ |
| macOS          | Keychain (`security`)                   | `uname -s` == Darwin           |
| Linux + GNOME  | libsecret / GNOME Keyring               | `gnome-keyring-daemon` present |
| Linux + KDE    | KWallet                                 | `kwalletd5/6` present          |
| Linux headless | `pass` (gpg-backed)                     | Fallback when no D-Bus session |
| WSL2           | wincred via `secretspec-windows-bridge` | `$WSL_DISTRO_NAME` set         |

secretspec handles the dispatch. Founder never sees the difference. `task secrets:where` prints the active backend for debugging.

### 4.7 AKV bootstrap loop (team profile)

For shared team secrets (test API keys, sandbox tokens, shared GHCR token), the `team` profile uses Azure Key Vault. The loop is **engineer-initiated** — never auto-pull, never auto-push.

```
task secrets:bootstrap           # interactive
  1. az login --tenant <id>      # Entra-gated
  2. detect current AKV name     # from profiles/<id>/secretspec.team.toml
  3. list declared team secrets
  4. for each: prompt [pull from AKV / push from keyring / skip]
  5. write audit row to .secretspec/audit.log + AKV diagnostic log
```

Audit log row schema (sha256-chained, matching the forensic pattern from the ovh repo's evidence-cataloger):

```
ts | actor | profile | secret_name | action | prev_sha256 | this_sha256
```

A secret value is never written to the audit log — only its identity, action, and chain hash.

### 4.8 .envrc + direnv hook

```
# .envrc
strict_env
use devenv

# Profile selection (sourced before devenv evaluates)
if [ -f .profile ]; then
  export DEVENV_PROFILE="$(cat .profile)"
else
  export DEVENV_PROFILE="p-solo"
fi

# Inject secrets at enterShell time
eval "$(secretspec export --profile "${SECRETSPEC_PROFILE:-default}" --shell)"
```

direnv hook install is part of `task install`. Founders who refuse direnv get a clear error pointing at `eval "$(direnv hook bash)"` (or zsh/fish equivalents).

### 4.9 Taskfile verbs (full list)

`Taskfile.yml` at repo root uses `includes:` to mount per-app sub-Taskfiles from `apps/*/Taskfile.yml`.

| Verb                       | What it does                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `install`                  | direnv allow + devenv shell + corepack + pnpm install + uv sync + go mod download + cargo fetch + pre-commit install |
| `dev`                      | Nx run-many target=dev for all apps in current profile                                                               |
| `dev:<app>`                | Single-app dev (delegated to `apps/<app>/Taskfile.yml`)                                                              |
| `test`                     | Nx affected --target=test                                                                                            |
| `lint`                     | Nx affected --target=lint                                                                                            |
| `format`                   | Nx affected --target=format                                                                                          |
| `ci`                       | Composite: install + lint + test + build (used by GH Actions)                                                        |
| `clean`                    | Nx reset + rm node_modules + .venv + target/ + .nx                                                                   |
| `data:up`                  | docker-compose up for postgres + redis (minimal)                                                                     |
| `data:up:full`             | data:up + kafka + storage                                                                                            |
| `data:up:kafka`            | Just Kafka + Schema Registry + Kroxylicious shim (Section 8)                                                         |
| `data:up:storage`          | MinIO + create buckets                                                                                               |
| `data:down`                | Tear down data plane, keep volumes                                                                                   |
| `tools:up`                 | OpenTelemetry collector + Jaeger + Prometheus + Grafana (local)                                                      |
| `tools:down`               | Tear down tools                                                                                                      |
| `db:migrate`               | Per-app migration runner (delegated)                                                                                 |
| `db:seed`                  | Per-app seed runner (delegated)                                                                                      |
| `db:reset`                 | data:down + volume wipe + data:up + db:migrate + db:seed                                                             |
| `commit`                   | aicommits with hard schema gate (Section 4.10)                                                                       |
| `env:reconcile`            | Grep 4 langs vs secretspec.toml, write reconcile report                                                              |
| `env:check`                | CI-friendly variant; nonzero on drift                                                                                |
| `secrets:check`            | secretspec validate against current profile                                                                          |
| `secrets:bootstrap`        | AKV interactive loop (Section 4.7)                                                                                   |
| `secrets:where`            | Print active keyring backend                                                                                         |
| `profile:list`             | List 5 profiles with $/mo bands                                                                                      |
| `profile:select`           | Write `.profile` and re-source devenv                                                                                |
| `profile:diff <a> <b>`     | Diff two profile directories                                                                                         |
| `profile:fork <src> <dst>` | Copy profile dir, rewrite machine ID                                                                                 |
| `profile:validate`         | Run XRD compose dry-run + helm template against profile                                                              |
| `new:backend`              | Interactive: pick TS/Py/Go/Rust, scaffold                                                                            |
| `new:backend:ts`           | Scaffold Nx Node app with library-chart wiring                                                                       |
| `new:backend:py`           | Scaffold @nxlv/python app with uv + Dockerfile                                                                       |
| `new:backend:go`           | Scaffold @nx-go app + buf if proto present                                                                           |
| `new:backend:rs`           | Scaffold @monodon/rust app with cargo workspace member                                                               |
| `new:frontend`             | Scaffold Next.js 15 app with library-chart wiring                                                                    |
| `new:lib`                  | Scaffold a shared lib (lang chosen interactively)                                                                    |

### 4.10 `task commit` — constrained AI commit

aicommits configured with a hard schema gate. Conventional Commits + scope enum + body rules. If the generated message fails the gate, the task loops up to 3 times then falls back to opening `$EDITOR` with the staged diff.

```js
// commitlint.config.cjs
module.exports = {
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'refactor', 'test', 'build', 'ci', 'perf', 'revert'],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'monorepo',
        'helm',
        'crossplane',
        'tf',
        'ansible',
        'mcp',
        'launcher',
        'profiles',
        'apps',
        'libs',
        'ci',
        'dx',
        'secrets',
        'obs',
      ],
    ],
    'subject-case': [2, 'always', 'sentence-case'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [2, 'always'],
  },
  // NO Co-Authored-By trailers — enforced via custom rule:
  plugins: [
    {
      rules: {
        'no-coauthored-by': ({ raw }) => [
          !/Co-Authored-By:/i.test(raw),
          'Co-Authored-By trailers are forbidden in this repo.',
        ],
      },
    },
  ],
}
```

### 4.11 `task env:reconcile` — 4-language grep

Walks the repo, greps each language for env-var references, diffs the union against `secretspec.toml`. Writes `.secretspec/reconcile.report.md`.

| Language                | Pattern                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| TypeScript / JavaScript | `process\.env\.([A-Z_][A-Z0-9_]*)` and `import\.meta\.env\.([A-Z_][A-Z0-9_]*)`           |
| Python                  | `os\.environ(?:\.get)?\(["']([A-Z_][A-Z0-9_]*)` and `os\.getenv\(["']([A-Z_][A-Z0-9_]*)` |
| Go                      | `os\.Getenv\(["']([A-Z_][A-Z0-9_]*)` and `os\.LookupEnv\(["']([A-Z_][A-Z0-9_]*)`         |
| Rust                    | `std::env::var\(["']([A-Z_][A-Z0-9_]*)` and `env!\(["']([A-Z_][A-Z0-9_]*)`               |

Report categorises each variable as:

| Bucket                         | Meaning                                          | Action                               |
| ------------------------------ | ------------------------------------------------ | ------------------------------------ |
| `declared+used`                | OK                                               | none                                 |
| `declared+unused`              | Dead declaration                                 | propose removal from secretspec.toml |
| `undeclared+used`              | Drift — code reads a var the schema doesn't know | propose addition to secretspec.toml  |
| `declared+ci_only+used_in_dev` | Schema says CI-only but dev code reads it        | hard error                           |

CI runs `task env:check` which is the same logic with `--fail-on-drift`.

### 4.12 Per-app sub-Taskfiles via `includes`

Root Taskfile mounts each app's local Taskfile under a namespace. Nx targets and Task verbs do not duplicate — Task delegates to Nx for build/test/lint, and owns the verbs Nx doesn't (data plane, secrets, commit).

```yaml
# Taskfile.yml (root, abbreviated)
version: '3'
includes:
  api: { taskfile: apps/api/Taskfile.yml, dir: apps/api, optional: true }
  web: { taskfile: apps/web/Taskfile.yml, dir: apps/web, optional: true }
  worker: { taskfile: apps/worker-py/Taskfile.yml, dir: apps/worker-py, optional: true }
tasks:
  dev:
    cmds: [pnpm nx run-many --target=dev --all]
  dev:api: { cmds: [task api:dev] }
  dev:web: { cmds: [task web:dev] }
  dev:worker: { cmds: [task worker:dev] }
```

Per-app Taskfiles expose at minimum: `dev`, `test`, `lint`, `db:migrate`, `db:seed`. Conventions documented in `SETUP.md`.

### 4.13 POSIX Makefile fallback

For CI runners or hosts where Task isn't installed yet, a thin `Makefile` delegates. Never the primary path.

```makefile
.PHONY: install dev test lint ci clean
TASK := $(shell command -v task 2>/dev/null)

install:
	@if [ -z "$(TASK)" ]; then \
	  echo "Task not found. Install with: nix profile install nixpkgs#go-task"; exit 127; \
	fi
	@task install

dev test lint ci clean:
	@task $@
```

### 4.14 SETUP.md (founder-facing)

`SETUP.md` lives at repo root and is the authoritative onboarding doc. Five sections:

| §   | Content                                                |
| --- | ------------------------------------------------------ |
| 1   | Install Nix + direnv (one paste-friendly block per OS) |
| 2   | `direnv allow` + first `task install`                  |
| 3   | `task profile:select` — choose one of 5                |
| 4   | `task secrets:bootstrap` if joining a team             |
| 5   | `task dev` — running                                   |

Errors documented inline. Every failure mode that `task install` can hit maps to a numbered remediation in `SETUP.md`. The launcher CLI (Layer 0a, Section 1) reads the same numbered remediations to render plain-English suggestions.

### 4.15 Day-1 vs follow-up

| Item                                      | Day-1 PR                      | Deferred                                                       |
| ----------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| devenv.nix + 4-language toolchain modules | yes                           | —                                                              |
| Profile-aware language selection          | p-solo + p-hobby fully tested | p-startup-\* + p-enterprise compile-only; nightly CI bringup   |
| Pre-commit hooks via git-hooks block      | yes                           | —                                                              |
| secretspec.toml schema + keyring backends | yes                           | —                                                              |
| AKV bootstrap loop + audit log            | yes                           | RFC 3161 timestamping of audit (later)                         |
| .envrc + direnv hook                      | yes                           | —                                                              |
| All Taskfile verbs in §4.9                | yes                           | `profile:validate` deep XRD dry-run gated on Section 8 landing |
| `task commit` + commitlint gate           | yes                           | —                                                              |
| `task env:reconcile` 4-lang grep          | yes                           | —                                                              |
| Per-app sub-Taskfiles `includes` pattern  | yes                           | —                                                              |
| POSIX Makefile fallback                   | yes                           | —                                                              |
| SETUP.md with numbered remediations       | yes                           | —                                                              |
| Launcher CLI surfacing remediations       | wired (Section 1)             | richer UI later                                                |

Coupling notes: this section assumes Layer 0a launcher dispatches into these verbs (see Section 1), Layer 0b MCP server exposes `profile:list`/`profile:select`/`env:reconcile` as MCP tools (see Section 2), and Layer 3 Nx targets are invoked from `task dev/test/lint/ci` (see Section 5).

## Section 5 — Container build system (BuildKit + cosign + multi-stage per language + registry)

One opinionated container pipeline: BuildKit + per-language multi-stage Dockerfile templates rendered by the launcher (Section 1) + cosign keyless signing + Trivy scan + SBOM. The Nx target `nx run <app>:container` is the only public verb; everything else is internal.

### 5.1 Layout

```
internal/templates/dockerfiles/
  go.Dockerfile.template
  python.Dockerfile.template
  rust.Dockerfile.template
  typescript.Dockerfile.template
  _hadolint.yaml
  _trivy-dockerfile.yaml

infra/build/
  buildx-bake.hcl            # entrypoint for nx -> buildx
  cache-policy.json          # cache-from / cache-to matrix
  cosign.policy.yaml         # keyless verification policy (consumed by kyverno)
  trivy-image.yaml           # image-scan config
  sbom.cdx.json              # CycloneDX template fragment

infra/helm/apps/<svc>/Dockerfile   # rendered output (committed)
```

The Dockerfile is committed (not regenerated each build) so humans + agents see what runs. Regeneration is opt-in: `task app:refresh-dockerfile -- --app <svc>` re-renders from the template and shows a diff.

### 5.2 Base images and final runtime per language

| Lang      | Builder base                                    | Runtime base                                                                                          | CGO / dynamic   | Size target |
| --------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------- | ----------- |
| Go        | `golang:1.24-bookworm`                          | `gcr.io/distroless/static-debian12:nonroot`                                                           | `CGO_ENABLED=0` | < 25 MB     |
| Python    | `python:3.13-slim-bookworm` + `uv 0.5.x`        | `gcr.io/distroless/python3-debian12:nonroot`                                                          | n/a             | < 90 MB     |
| Rust      | `rust:1.83-bookworm` + `cargo-chef 0.1.x`       | `gcr.io/distroless/cc-debian12:nonroot` (glibc) or `gcr.io/distroless/static-debian12:nonroot` (musl) | profile flag    | < 30 MB     |
| TS (Node) | `node:22-bookworm-slim` + `pnpm 9.x` (corepack) | `gcr.io/distroless/nodejs22-debian12:nonroot`                                                         | n/a             | < 180 MB    |

All runtime images run as `nonroot` (uid 65532), no shell, no package manager. Final stage sets `USER nonroot:nonroot`, `WORKDIR /app`, `ENTRYPOINT ["/app/<bin>"]` (or `["node", "dist/main.js"]` for TS, `["python", "-m", "<pkg>"]` for Python).

### 5.3 Multi-stage template skeletons

Each template has identical stage names — `deps`, `build`, `test` (optional), `runtime` — so the Nx executor and cache policy don't branch per language.

Go (`go.Dockerfile.template`):

```dockerfile
# syntax=docker/dockerfile:1.10
ARG GO_VERSION=1.24
ARG RUNTIME=gcr.io/distroless/static-debian12:nonroot

FROM golang:${GO_VERSION}-bookworm AS deps
WORKDIR /src
COPY go.mod go.sum ./
RUN --mount=type=cache,target=/go/pkg/mod \
    go mod download

FROM deps AS build
ARG TARGETOS TARGETARCH
COPY . .
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
    go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/{{app}}

FROM ${RUNTIME} AS runtime
COPY --from=build /out/app /app/app
USER nonroot:nonroot
ENTRYPOINT ["/app/app"]
```

Python (`python.Dockerfile.template`) — uv for resolve, copy site-packages into distroless:

```dockerfile
# syntax=docker/dockerfile:1.10
ARG PY_VERSION=3.13
ARG RUNTIME=gcr.io/distroless/python3-debian12:nonroot

FROM python:${PY_VERSION}-slim-bookworm AS deps
RUN pip install --no-cache-dir uv==0.5.*
WORKDIR /src
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

FROM deps AS build
COPY . .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

FROM ${RUNTIME} AS runtime
COPY --from=build /src/.venv /app/.venv
COPY --from=build /src/{{pkg}} /app/{{pkg}}
ENV PYTHONPATH=/app PATH=/app/.venv/bin:$PATH
USER nonroot:nonroot
ENTRYPOINT ["python", "-m", "{{pkg}}"]
```

Rust (`rust.Dockerfile.template`) — cargo-chef recipe to maximise dep cache reuse:

```dockerfile
# syntax=docker/dockerfile:1.10
ARG RUST_VERSION=1.83
ARG RUNTIME=gcr.io/distroless/cc-debian12:nonroot

FROM rust:${RUST_VERSION}-bookworm AS chef
RUN cargo install cargo-chef --locked --version 0.1.*
WORKDIR /src

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS deps
COPY --from=planner /src/recipe.json recipe.json
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/src/target \
    cargo chef cook --release --recipe-path recipe.json

FROM deps AS build
COPY . .
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/src/target \
    cargo build --release --bin {{app}} && \
    cp /src/target/release/{{app}} /out/app

FROM ${RUNTIME} AS runtime
COPY --from=build /out/app /app/app
USER nonroot:nonroot
ENTRYPOINT ["/app/app"]
```

TypeScript (`typescript.Dockerfile.template`) — pnpm content-addressed store, prune to prod, copy node_modules to distroless nodejs22:

```dockerfile
# syntax=docker/dockerfile:1.10
ARG NODE_VERSION=22
ARG RUNTIME=gcr.io/distroless/nodejs22-debian12:nonroot

FROM node:${NODE_VERSION}-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /src
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/{{app}}/package.json apps/{{app}}/
COPY packages/ packages/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --filter "...{apps/{{app}}}"

FROM deps AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter {{app}} build && \
    pnpm --filter {{app}} deploy --prod /out/app

FROM ${RUNTIME} AS runtime
WORKDIR /app
COPY --from=build /out/app /app
USER nonroot:nonroot
ENTRYPOINT ["node", "dist/main.js"]
```

### 5.4 BuildKit cache mounts (per language)

| Lang   | Mount target                                                       | Mount id / scope   | Source of truth          |
| ------ | ------------------------------------------------------------------ | ------------------ | ------------------------ |
| Go     | `/go/pkg/mod`, `/root/.cache/go-build`                             | per-arch           | `go.sum`                 |
| Python | `/root/.cache/uv`                                                  | per-arch           | `uv.lock`                |
| Rust   | `/usr/local/cargo/registry`, `/usr/local/cargo/git`, `/src/target` | per-arch           | cargo-chef `recipe.json` |
| TS     | `/pnpm/store` (id=`pnpm`)                                          | shared across apps | `pnpm-lock.yaml`         |

CI cache backend: `--cache-from=type=gha,scope=<app>-<arch> --cache-to=type=gha,mode=max,scope=<app>-<arch>`. Local cache: `type=local,dest=.cache/buildx/<app>`.

### 5.5 Multi-arch

amd64 always. arm64 opt-in per app via `infra/helm/apps/<svc>/build.yaml`:

```yaml
platforms: [linux/amd64] # default
# platforms: [linux/amd64, linux/arm64]   # opt-in
```

Reasoning: cross-arch on GH-hosted runners doubles build time for arm64 (QEMU emulation). Profiles `p-startup-scale` and `p-enterprise` enable arm64 globally; `p-solo` / `p-hobby` / `p-startup-small` stay amd64-only.

### 5.6 Layer ordering and rebuild safety

Hard rules enforced by `task ci:dockerfile-lint`:

| Rule                                             | Why                                         |
| ------------------------------------------------ | ------------------------------------------- |
| Lockfile copied before source                    | dep layer hits cache on source-only changes |
| One `COPY . .` per stage, after lockfile install | avoids invalidating dep layer               |
| No `RUN apt-get` in runtime stage                | distroless has no apt; fails build          |
| No `ARG` after `FROM` for image refs             | breaks reproducibility                      |
| Final `USER nonroot:nonroot`                     | hadolint DL3002                             |
| Pinned base tag (no `latest`)                    | reproducibility                             |
| `# syntax=docker/dockerfile:1.10` first line     | required for cache mounts                   |

Hadolint config (`internal/templates/dockerfiles/_hadolint.yaml`) enforces DL3007 (no `latest`), DL3008 (apt pin), DL3059 (consecutive RUN merge), DL4006 (pipefail).

### 5.7 SBOM

Generated per image by `syft` (SHA-pinned action), CycloneDX JSON:

```bash
syft <image-ref> -o cyclonedx-json=sbom.cdx.json
```

SBOM is:

1. Attached to the image as an OCI artifact via `cosign attach sbom`.
2. Committed to release artifacts (`.github/releases/<version>/sbom/<app>.cdx.json`) on `v*` tags.
3. Diffed PR-to-PR by `sbom-diff-action` and posted as a sticky comment.

### 5.8 cosign keyless signing

Every pushed image is signed via GH OIDC, recorded in Rekor public log. No long-lived keys.

```yaml
# .github/workflows/_container.yml (reusable)
permissions:
  id-token: write # OIDC for cosign
  contents: read
  packages: write # GHCR push
steps:
  - uses: sigstore/cosign-installer@<40-char-sha>
    with: { cosign-release: 'v2.4.1' }
  - run: |
      cosign sign --yes \
        --oidc-issuer=https://token.actions.githubusercontent.com \
        ghcr.io/${{ github.repository }}/<app>@${{ steps.build.outputs.digest }}
```

Verification at deploy time — two paths, both ship Day-1:

| Path                          | Where                                    | When           |
| ----------------------------- | ---------------------------------------- | -------------- |
| Kyverno `verifyImages` policy | every cluster, `cosign.policy.yaml`      | admission time |
| Argo CD image-verification    | only on Apps managing pod-spec workloads | sync time      |

Policy fragment (Kyverno):

```yaml
verifyImages:
  - imageReferences: ['ghcr.io/<org>/*']
    attestors:
      - entries:
          - keyless:
              issuer: 'https://token.actions.githubusercontent.com'
              subject: 'https://github.com/<org>/<repo>/.github/workflows/release.yml@refs/heads/main'
              rekor: { url: 'https://rekor.sigstore.dev' }
```

The subject is profile-driven (`profiles/<id>/crossplane/composition-pins.yaml::cosignSubject`) so forks get their own identity.

### 5.9 Tagging strategy

| Tag                    | Mutability                    | Pushed on                     | Used by                             |
| ---------------------- | ----------------------------- | ----------------------------- | ----------------------------------- |
| `sha-<full-git-sha>`   | immutable                     | every build                   | Argo, deploy manifests              |
| `pr-<num>-sha-<short>` | mutable (overwritten on push) | PR builds                     | preview envs                        |
| `<branch>`             | mutable                       | branch builds                 | dev / staging tracking              |
| `v<semver>`            | immutable                     | release tag                   | prod, Renovate                      |
| `latest`               | mutable                       | release tag on default branch | humans only, never deploy manifests |

Helm `values.yaml` always pins `image.tag: sha-<full>` (rendered by the release workflow). `latest` is never referenced by any committed manifest — CI fails on `grep -r "tag: latest" infra/helm/`.

### 5.10 Nx executor wrapper

The `container` target is a thin `nx:run-commands` wrapper. No custom executor — buildx does the work.

`infra/helm/apps/<svc>/project.json`:

```json
{
  "name": "<svc>",
  "targets": {
    "container": {
      "executor": "nx:run-commands",
      "dependsOn": ["build"],
      "options": {
        "command": "bash infra/build/container.sh <svc>"
      },
      "inputs": ["default", "{projectRoot}/Dockerfile", "{workspaceRoot}/infra/build/**"],
      "outputs": ["{workspaceRoot}/.cache/buildx/<svc>"]
    }
  }
}
```

`infra/build/container.sh` resolves: app name -> language (from `nx/preset.json`) -> Dockerfile path -> platforms list -> tags -> registry. Calls `docker buildx build` with cache flags. Nx Cloud (Section 3) caches the script's output digest, not the image; image layer cache lives in GHA cache or local `.cache/buildx`.

### 5.11 Registry strategy

Default: GHCR (`ghcr.io/<org>/<app>`). Profile-driven swap via `profiles/<id>/registry.yaml`:

| Profile         | Registry                                | Auth                       | Pull secret                         |
| --------------- | --------------------------------------- | -------------------------- | ----------------------------------- |
| p-solo          | local k3d registry `localhost:5000`     | none                       | none                                |
| p-hobby         | GHCR public                             | OIDC push, anonymous pull  | none                                |
| p-startup-small | GHCR private                            | OIDC push, GHCR token pull | ESO → `ghcr-pull` secret            |
| p-startup-scale | profile-driven (GHCR / ACR / ECR / GAR) | OIDC federation            | ESO → `<reg>-pull`                  |
| p-enterprise    | Harbor on-cluster or GAR/ACR/ECR        | workload identity          | ESO + Crossplane `XImagePullSecret` |

ACR / ECR / GAR / Harbor adapters are scaffolded Day-1 at `infra/build/registries/{acr,ecr,gar,harbor}.sh` but only exercised in nightly CI per profile (the matrix builds one no-op image per registry to keep auth wired). Switching `profiles/<id>/registry.yaml::backend` triggers Renovate to bump the pull-secret path and Helm values.

Registry secret wiring is one ESO `ExternalSecret` per profile, written by Crossplane composition (`XImagePullSecret`, see Section 8). The launcher renders no secrets — credentials live in keyring locally and in AKV/ASM/GSM in cloud profiles.

### 5.12 Vulnerability scanning

Trivy SHA-pinned in CI on every image. Two passes:

| Pass                   | Target                  | Output                  | Gate                            |
| ---------------------- | ----------------------- | ----------------------- | ------------------------------- |
| Image scan             | built image (post-push) | SARIF → GH Security tab | fail on `CRITICAL` unfixed      |
| Dockerfile config scan | committed Dockerfile    | SARIF → GH Security tab | fail on `HIGH` config-misconfig |

Trivy config (`infra/build/trivy-image.yaml`) pins DB to the day's snapshot to avoid flaky CI; Renovate bumps weekly. `.trivyignore` is per-app at `infra/helm/apps/<svc>/.trivyignore` with mandatory expiry date on every entry — entries past expiry fail CI.

### 5.13 Base-image refresh (Renovate)

`renovate.json` rules:

```json
{
  "packageRules": [
    {
      "matchDatasources": ["docker"],
      "matchUpdateTypes": ["patch"],
      "automerge": true,
      "schedule": ["before 6am on monday"]
    },
    {
      "matchPackagePatterns": ["^gcr.io/distroless/"],
      "matchUpdateTypes": ["digest"],
      "automerge": true
    }
  ]
}
```

Distroless tags are pinned by digest (`gcr.io/distroless/static-debian12@sha256:...`), Renovate bumps the digest, CI rebuilds + signs + scans.

### 5.14 Supply-chain hardening

| Control                                                        | Mechanism                                        |
| -------------------------------------------------------------- | ------------------------------------------------ |
| All third-party Actions pinned to 40-char SHA                  | `actionlint` + `pin-github-action` in pre-commit |
| `permissions:` declared at job level, default `contents: read` | repo template + CI lint                          |
| OIDC for AWS / GCP / Azure / GHCR — no long-lived secrets      | profile-driven role ARN / WIF pool               |
| `harden-runner` (StepSecurity) on every job                    | block egress to non-allowlisted hosts            |
| Hadolint on every Dockerfile                                   | `task ci:dockerfile-lint`                        |
| Trivy config scan on every Dockerfile                          | same target                                      |
| cosign signature + Rekor entry on every image                  | release workflow                                 |
| SBOM attached + committed to release                           | release workflow                                 |

### 5.15 Plain-English errors (founder UX)

`infra/build/container.sh` wraps buildx with friendly mapping:

| buildx error                                              | Rendered message + hint                                                                      |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `failed to solve: failed to compute cache key: not found` | "Lockfile changed since last build. Run `task install` then retry."                          |
| `denied: permission_denied` on push                       | "Registry login expired. Run `task auth:registry` (profile <id> uses <backend>)."            |
| `exec format error`                                       | "You built for the wrong CPU. Add `linux/arm64` to `build.yaml::platforms` or run on amd64." |
| `no space left on device`                                 | "BuildKit cache is full. Run `task cache:prune` (frees `~/.cache/buildx`)."                  |

Errors are also emitted as structured JSON to the MCP server (Section 0b) so agents can act on them.

### 5.16 Day-1 vs follow-up

| Ships in this PR                                              | Deferred                                                                           |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| All 4 language Dockerfile templates (go / python / rust / ts) | Wasm runtime template (wasmCloud / spin)                                           |
| BuildKit cache mounts + GHA cache backend                     | Remote BuildKit builders (self-hosted on Hetzner)                                  |
| Multi-arch amd64 default, arm64 opt-in                        | Cross-compilation without QEMU (zig cc for Go, cross for Rust)                     |
| cosign keyless sign + Kyverno verify policy                   | TUF root for air-gapped verification                                               |
| Trivy image + Dockerfile scan, SARIF → GH Security            | Grype as second scanner for cross-check                                            |
| Syft CycloneDX SBOM, attached + committed on release          | SPDX format, in-toto attestations beyond SBOM                                      |
| GHCR push Day-1                                               | ACR / ECR / GAR / Harbor adapters scaffolded; exercised in nightly profile CI only |
| Renovate auto-bump distroless digests + base patches          | Auto-bump major language versions (manual review)                                  |
| Hadolint + actionlint + pin-github-action in pre-commit       | StepSecurity harden-runner in egress-block mode (audit-only Day-1)                 |
| Nx `container` target wired into `task build:images`          | Nx Cloud DTE container build distribution (PowerPack)                              |
| Plain-English error wrapper + MCP error JSON                  | Auto-fix PRs from CI on common Dockerfile lints                                    |

See Section 6 for how the resulting image ref flows into the Helm library chart's `image.repository` / `image.tag`, and Section 10 for the registry-swap Crossplane XRD (`XImagePullSecret` + `XContainerRegistry`).

## Section 6 — Library Helm chart (lib-chart with observability + security baked in)

One library chart. Every app consumes it. No app chart contains raw Kubernetes YAML.

### 6.1 Layout

```
infra/helm/
  lib-chart/
    Chart.yaml                 # type: library, version: 0.1.0
    values.schema.json         # JSON Schema for IDE + CI validation
    templates/
      _helpers.tpl             # name, labels, image ref, annotations
      _security.tpl            # securityContext FLOOR partial
      _otel.tpl                # OTel env injection partial
      deployment.yaml          # if .Values.workload.kind == Deployment
      rollout.yaml             # if .Values.workload.kind == Rollout
      service.yaml
      service-headless.yaml
      hpa.yaml
      pdb.yaml
      sa.yaml
      networkpolicy.yaml
      externalsecret.yaml
      servicemonitor.yaml
      podmonitor.yaml
      prometheusrule.yaml
      grafana-dashboard-cm.yaml
      instrumentation.yaml     # OTel Operator CR (Go/Py/Node auto-instr)
      otelcol-sidecar.yaml     # OpenTelemetryCollector sidecar mode
      httproute.yaml           # Gateway API
      grpcroute.yaml
      virtualservice.yaml      # Istio path
      ingress.yaml             # non-mesh path
      job-presync-migration.yaml
  apps/
    <svc>/
      Chart.yaml               # dependencies: [lib-chart]
      values.yaml              # base
      values.dev.yaml
      values.staging.yaml
      values.prod.yaml
```

### 6.2 Chart.yaml pins

```yaml
apiVersion: v2
name: lib-chart
type: library
version: 0.1.0
kubeVersion: '>=1.29.0-0'
```

App charts depend on it:

```yaml
# infra/helm/apps/orders/Chart.yaml
apiVersion: v2
name: orders
version: 0.1.0
dependencies:
  - name: lib-chart
    version: 0.1.0
    repository: file://../../lib-chart
```

### 6.3 Resource catalog

Every resource is a top-level toggle under `.Values.<key>.enabled`. Defaults chosen so a minimal `values.yaml` produces a safe, observable, network-isolated workload.

| #   | Resource                | values key                                      | Default                      | When to use                                              | Gotchas                                                                      |
| --- | ----------------------- | ----------------------------------------------- | ---------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | Deployment              | workload.kind=Deployment                        | on                           | Stateless services, no progressive delivery              | Disables (2) when set                                                        |
| 2   | Argo Rollouts Rollout   | workload.kind=Rollout                           | off                          | Canary / blue-green; needs Argo Rollouts CRDs            | Service traffic routing requires Gateway API or Istio path also enabled      |
| 3   | HPA v2                  | autoscaling.enabled                             | on if replicas>1             | CPU + custom (prom-adapter)                              | Requires metrics-server; custom metric names must match prom-adapter rules   |
| 4   | PodDisruptionBudget     | pdb.enabled                                     | on if replicas≥2             | Voluntary disruption protection                          | minAvailable=1 default; clusters with single node will block drain           |
| 5   | Service (ClusterIP)     | service.enabled                                 | on                           | Always for routable workloads                            | Port name must match container port name for Istio mTLS                      |
| 6   | Service (headless)      | service.headless.enabled                        | off                          | StatefulSet-style discovery, gRPC client-side LB         | Don't enable with HPA unless you understand endpoint churn                   |
| 7   | HTTPRoute (Gateway API) | route.kind=HTTPRoute                            | on for HTTP                  | Gateway API path; cluster has Gateway controller         | Needs Section 8 XRD for Gateway provisioning, or BYO gateway                 |
| 8   | GRPCRoute               | route.kind=GRPCRoute                            | off                          | gRPC over Gateway API                                    | Gateway controller must support GRPCRoute (Envoy GW / Cilium / Istio)        |
| 9   | VirtualService          | route.kind=VirtualService                       | off                          | Istio mesh path                                          | Mutually exclusive with HTTPRoute                                            |
| 10  | Ingress                 | ingress.enabled                                 | off                          | Non-mesh, non-Gateway path (legacy clusters)             | Last resort; no traffic policy primitives                                    |
| 11  | ServiceMonitor          | metrics.serviceMonitor.enabled                  | on                           | kube-prometheus-stack present                            | Label `release: kube-prometheus-stack` required for discovery                |
| 12  | PodMonitor              | metrics.podMonitor.enabled                      | off                          | Tracing/app metrics without Service (sidecar collectors) | Don't enable both ServiceMonitor and PodMonitor for same port                |
| 13  | PrometheusRule          | alerts.enabled                                  | on                           | Alerts colocated with app code                           | Rule group name must be unique cluster-wide                                  |
| 14  | Grafana dashboard CM    | dashboards.enabled                              | off                          | Sidecar-discovered dashboards                            | Needs label `grafana_dashboard: "1"`; JSON in `dashboards.json`              |
| 15  | Instrumentation CR      | otel.instrumentation.enabled                    | on for go/py/node            | OTel Operator auto-instrumentation                       | Rust not supported — use sidecar (16)                                        |
| 16  | OTelCol sidecar         | otel.sidecar.enabled                            | off (on for Rust)            | Per-pod collector when auto-instr not viable             | Adds ~50 MiB; configure batch + memory_limiter                               |
| 17  | ExternalSecret          | externalSecret.enabled                          | on if any secrets referenced | Pulls from ClusterSecretStore (Section 10)               | refreshInterval default 1h; overrideable                                     |
| 18  | ServiceAccount          | serviceAccount.create                           | on                           | Workload identity / IRSA / AKS WI / GKE WI               | Annotation key differs per cloud; profile sets the right one                 |
| 19  | NetworkPolicy           | networkPolicy.enabled                           | on                           | Default-deny + per-app allow stanzas                     | CNI must support NetworkPolicy (Calico/Cilium); k3d default flannel does NOT |
| 20  | SecurityContext FLOOR   | pod.securityContext + container.securityContext | on, non-overridable floor    | Always                                                   | App can RAISE restrictions, never lower                                      |
| 21  | Pre-sync migration Job  | migrations.enabled                              | off                          | DB migrations as Argo PreSync                            | Uses app image + override entrypoint; failed jobs block sync                 |
| 22  | Sidecars                | sidecars[]                                      | empty                        | Log shipper, proxy, pprof, etc.                          | Resources required; otherwise HPA math wrong                                 |
| 23  | PriorityClass ref       | priorityClassName                               | ""                           | Critical workloads                                       | Class must exist in cluster; lib-chart does NOT create it                    |

### 6.4 SecurityContext FLOOR

Non-negotiable. App values may add restrictions; cannot remove.

```yaml
# _security.tpl renders this verbatim into every pod
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault
containerSecurityContext:
  allowPrivilegeEscalation: false
  privileged: false
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 1000
  capabilities:
    drop: ['ALL']
automountServiceAccountToken: false # opt-in via serviceAccount.tokenMount: true
```

`values.schema.json` rejects any attempt to set `runAsUser < 1000`, `privileged: true`, or re-enable a dropped capability.

### 6.5 NetworkPolicy default-deny

Lib-chart renders two policies per app: `<name>-deny-all` + `<name>-allow`. Egress allow list is explicit; no `0.0.0.0/0` shortcut.

```yaml
networkPolicy:
  enabled: true
  ingress:
    fromGateway: true # allow Gateway namespace
    fromNamespaces: ['observability'] # Prometheus scrape
  egress:
    dns: true # kube-dns
    platformDeps:
      - postgres # resolves to platform.postgres NetworkPolicy selector
      - redis
      - kafka
    external:
      - host: api.stripe.com
        port: 443
```

Egress to arbitrary internet requires explicit `external[]` entries. The chart fails template render if `egress.external` contains `0.0.0.0/0`.

### 6.6 Observability wiring

Single `observability` block fan-outs to ServiceMonitor + PrometheusRule + Instrumentation + dashboard:

```yaml
observability:
  metrics:
    port: 9090
    path: /metrics
    serviceMonitor:
      enabled: true
      interval: 30s
  alerts:
    enabled: true
    rules:
      - alert: AppHighErrorRate
        expr: sum(rate(http_requests_total{job="{{ .Release.Name }}",code=~"5.."}[5m])) > 0.05
        for: 10m
        severity: page
  tracing:
    runtime: go # go | py | node | rust
    sampler: parentbased_traceidratio
    samplerArg: '0.1'
    exporterEndpoint: http://otel-collector.observability:4317
  dashboards:
    enabled: false
    json: |
      {{ .Files.Get "dashboards/app.json" | indent 6 }}
```

Runtime selection drives template choice:

| `tracing.runtime` | Template rendered                                   |
| ----------------- | --------------------------------------------------- |
| go                | Instrumentation CR with go auto-instr (eBPF)        |
| py                | Instrumentation CR with python auto-instr           |
| node              | Instrumentation CR with nodejs auto-instr           |
| rust              | OTelCol sidecar; app uses tracing-opentelemetry SDK |

### 6.7 ExternalSecret block

```yaml
externalSecret:
  enabled: true
  refreshInterval: 1h
  store:
    name: cluster-secret-store # set by profile, see Section 10
    kind: ClusterSecretStore
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: orders/db
        property: url
    - secretKey: STRIPE_API_KEY
      remoteRef:
        key: orders/stripe
```

The synthesized `Secret` is mounted as env-from. App pods never see raw store paths.

### 6.8 Pre-sync migration Job

Runs the app image with overridden entrypoint as an Argo PreSync hook. Failure blocks sync.

```yaml
migrations:
  enabled: true
  command: ['/app/bin/migrate', 'up']
  backoffLimit: 0
  envFromSecret: '{{ include "lib-chart.fullname" . }}-env'
  hookDeletePolicy: BeforeHookCreation
```

Rendered annotations:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: BeforeHookCreation
```

### 6.9 Sidecars

Free-form array. Each sidecar must declare resources or the chart fails to render.

```yaml
sidecars:
  - name: log-shipper
    image: fluent/fluent-bit:3.1.9
    resources:
      requests: { cpu: 50m, memory: 64Mi }
      limits: { cpu: 200m, memory: 128Mi }
    volumeMounts:
      - { name: varlog, mountPath: /var/log }
  - name: debug-pprof
    image: ghcr.io/org/pprof-sidecar:1.2.0
    enabled: false # toggle per env
```

### 6.10 Rollout (Argo Rollouts) mode

Switching workload kind flips template and adds strategy block. Service automatically gets the `argo-rollouts-stable` + `argo-rollouts-canary` services.

```yaml
workload:
  kind: Rollout
  replicas: 6
  strategy:
    canary:
      steps:
        - setWeight: 10
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 10m }
      trafficRouting:
        gatewayAPI:
          httpRoute: '{{ include "lib-chart.fullname" . }}'
          namespace: '{{ .Release.Namespace }}'
```

Gateway API traffic routing requires HTTPRoute (7) enabled. VirtualService path uses `trafficRouting.istio`.

### 6.11 Minimal app values.yaml

Smallest viable input. Everything else inherits chart defaults.

```yaml
# infra/helm/apps/orders/values.yaml
image:
  repository: ghcr.io/org/orders
  tag: '' # set by Argo Image Updater or CD pipeline
workload:
  replicas: 2
service:
  port: 8080
observability:
  tracing: { runtime: go }
externalSecret:
  data:
    - { secretKey: DATABASE_URL, remoteRef: { key: orders/db, property: url } }
networkPolicy:
  egress:
    platformDeps: [postgres]
```

That renders: Deployment, Service, ServiceMonitor, PrometheusRule (default high-error-rate alert), Instrumentation CR, ExternalSecret, ServiceAccount with workload-identity annotation from profile, default-deny + allow-platform-postgres NetworkPolicy, PDB (replicas≥2), HPA (CPU 70%).

### 6.12 Per-env overlays

Overlays are pure values diffs. No Kustomize. ApplicationSet (Section 9) selects the right file via `{{env}}` matrix dimension.

```yaml
# values.dev.yaml
workload: { replicas: 1 }
autoscaling: { enabled: false }
observability:
  tracing: { samplerArg: "1.0" }      # 100% sampling in dev
networkPolicy:
  egress:
    external:
      - { host: webhook.site, port: 443 }   # dev-only

# values.staging.yaml
workload: { replicas: 2 }
observability:
  tracing: { samplerArg: "0.5" }

# values.prod.yaml
workload:
  kind: Rollout
  replicas: 6
observability:
  tracing: { samplerArg: "0.05" }
  alerts:
    rules:
      - { alert: AppHighErrorRate, severity: page }
priorityClassName: prod-critical
```

Argo App renders `helm template -f values.yaml -f values.${ARGOCD_APP_PARAMETERS_ENV}.yaml`.

### 6.13 values.schema.json

App teams get IDE completion + CI rejection of invalid values. Schema is generated from the same source-of-truth that drives the MCP server (Section 0b) so AI agents and humans see identical shape.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["image", "service"],
  "properties": {
    "image": {
      "type": "object",
      "required": ["repository"],
      "properties": {
        "repository": { "type": "string", "pattern": "^[a-z0-9./_-]+$" },
        "tag": { "type": "string" },
        "digest": { "type": "string", "pattern": "^sha256:[a-f0-9]{64}$" }
      }
    },
    "workload": {
      "type": "object",
      "properties": {
        "kind": { "enum": ["Deployment", "Rollout"] },
        "replicas": { "type": "integer", "minimum": 0, "maximum": 1000 }
      }
    },
    "pod": {
      "properties": {
        "securityContext": {
          "properties": {
            "runAsUser": { "type": "integer", "minimum": 1000 },
            "runAsNonRoot": { "const": true },
            "privileged": { "const": false }
          }
        }
      }
    },
    "observability": {
      "properties": {
        "tracing": {
          "properties": {
            "runtime": { "enum": ["go", "py", "node", "rust"] }
          }
        }
      }
    },
    "networkPolicy": {
      "properties": {
        "egress": {
          "properties": {
            "external": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["host", "port"],
                "properties": {
                  "host": { "type": "string", "not": { "const": "0.0.0.0/0" } }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

CI gate: `helm lint --strict` + `helm template ... | kubeconform -strict -summary` per app per env.

### 6.14 \_helpers.tpl essentials

```gotemplate
{{- define "lib-chart.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "lib-chart.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | default .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: argocd
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end -}}

{{- define "lib-chart.imageRef" -}}
{{- if .Values.image.digest -}}
{{ .Values.image.repository }}@{{ .Values.image.digest }}
{{- else -}}
{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}
{{- end -}}
{{- end -}}
```

Digest preferred over tag — cosign verification (Section 5) keys off the digest.

### 6.15 Reference apps consuming the chart (Day-1)

Three apps wired end-to-end and used by CI to prove the chart:

| App      | Runtime | Why it exists                                                                   |
| -------- | ------- | ------------------------------------------------------------------------------- |
| `orders` | Go      | Exercises HTTPRoute, ExternalSecret, PreSync migration, eBPF Instrumentation    |
| `web`    | Node.js | Exercises Ingress fallback path, OTel Node SDK auto-instr, Grafana dashboard CM |
| `worker` | Rust    | Exercises OTelCol sidecar, no Service (PodMonitor), headless mode opt-in        |

### 6.16 Day-1 vs deferred

Ships in this PR:

- All 23 resource templates rendered for the three reference apps.
- `values.schema.json` enforced in CI.
- OTel Operator Instrumentation CR for Go/Python/Node.
- OTelCol sidecar mode for Rust.
- ExternalSecret wired to profile-selected ClusterSecretStore.
- Default-deny + per-app allow NetworkPolicy.
- PreSync migration Job pattern, used by `orders`.
- Argo Rollouts Rollout template, used by `orders` in prod overlay.

Deferred:

- KEDA scaler templates (HPA v2 only at Day-1).
- Multi-cluster fan-out via Argo CD ApplicationSet `clusters` generator (Section 9 ships matrix-only).
- Auto-generated SLO dashboards from PrometheusRule (manual JSON in `dashboards/` for now).
- Rust auto-instrumentation (waiting on upstream OTel Operator support).
- VPA recommendations integration.

See Section 7 for how this chart pairs with Crossplane XRDs that provision the platform deps it consumes (Postgres, Redis, Kafka, Gateway). See Section 9 for the ApplicationSet matrix that drives env overlays. See Section 10 for ClusterSecretStore provisioning that backs `externalSecret`.

## Section 7 — Multi-env promotion + ApplicationSet + Kargo

Argo CD is the single GitOps engine. ApplicationSet does the fan-out (envs × apps and envs × platform components), Kargo does the gated stage promotion (staging → prod), and Argo Image Updater handles the auto-write-back loop for `dev`. Founders never touch any of this — `task launch` installs the root-app, and from there it is all reconciled. Agents read shape from `META.yaml` in each Argo directory.

### 7.1 Layout

```
infra/argocd/
  root-app.yaml                  # app-of-apps, points at the ApplicationSets
  projects/
    appproject-platform.yaml     # crossplane core + providers + functions + XRDs
    appproject-infra.yaml        # eso, cert-manager, ingress, observability stack
    appproject-apps-dev.yaml
    appproject-apps-staging.yaml
    appproject-apps-prod.yaml
  appset-platform.yaml           # matrix: env x platform-component
  appset-infra.yaml              # matrix: env x infra-component
  appset-apps.yaml               # matrix: env x app (Helm)
  notifications/
    argocd-notifications-cm.yaml # triggers + templates
    slack-secret.tpl             # rendered by ESO from provider-slack secret
  sync-windows/
    staging-window.yaml
    prod-freeze.yaml
  kargo/
    project-go-hello.yaml
    warehouse-go-hello.yaml
    stages-go-hello.yaml         # dev -> staging -> prod
    analysistemplate-smoke.yaml
    analysistemplate-slo.yaml
  image-updater/
    argocd-image-updater-cm.yaml # dev-only write-back config
  META.yaml                      # machine-readable layer manifest
```

### 7.2 Wave ordering (single source of truth)

App-of-apps wave order; the same numbers are used by `argocd.argoproj.io/sync-wave` annotations everywhere.

| Wave | Layer                 | What lands                                                                                                                                                                                                                    | Annotation source |
| ---- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| -10  | Namespaces            | `kube-system` add-ons NS, `argocd`, `crossplane-system`, `eso`, `observability`, `kargo`, `cert-manager`, per-env app NS                                                                                                      | appset-platform   |
| -5   | CRDs                  | Crossplane CRDs, ESO CRDs, cert-manager CRDs, Kargo CRDs, Argo Rollouts CRDs                                                                                                                                                  | appset-platform   |
| -3   | Crossplane core       | crossplane chart (1.17+), RBAC                                                                                                                                                                                                | appset-platform   |
| -2   | Providers + Functions | provider-kubernetes, provider-helm, provider-contabo, provider-hetzner-robot, provider-aws/azure/gcp, provider-keycloak, provider-slack; functions: function-patch-and-transform, function-go-templating, function-auto-ready | appset-platform   |
| -1   | ProviderConfigs       | One PC per cloud, all reading from ESO-projected secrets                                                                                                                                                                      | appset-platform   |
| 0    | XRDs + Compositions   | All 4 XRD bundles (see Section 8): core / observability+identity / schema-governance / cloud-bootstrap                                                                                                                        | appset-platform   |
| +1   | Claims                | XR claims — `Database`, `Cache`, `ObjectBucket`, `IdentityClient`, `Topic` consumed by apps                                                                                                                                   | appset-infra      |
| +2   | Library chart deps    | Pulls `infra/helm/lib-chart` into chart cache, runs `helm dep update` on each app chart                                                                                                                                       | appset-apps       |
| +5   | Apps                  | Per-env Helm releases of `apps/<svc>`                                                                                                                                                                                         | appset-apps       |
| +10  | Smoke                 | Kargo `AnalysisRun` post-sync hooks (HTTP smoke + metric query)                                                                                                                                                               | appset-apps       |

Wave gaps are intentional — agents can drop new layers at -8, -4, -7 without re-numbering.

### 7.3 ApplicationSet matrices

All three ApplicationSets use the `matrix` generator: one `list` of envs cross-joined with one `git` (directories) generator. Envs are read from the active profile, not hard-coded.

`infra/argocd/appset-apps.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: apps
  namespace: argocd
spec:
  goTemplate: true
  goTemplateOptions: ['missingkey=error']
  generators:
    - matrix:
        generators:
          - list:
              elements:
                - env: dev
                  cluster: https://kubernetes.default.svc
                  autosync: true
                - env: staging
                  cluster: https://kubernetes.default.svc
                  autosync: true
                - env: prod
                  cluster: https://kubernetes.default.svc
                  autosync: false
          - git:
              repoURL: https://github.com/<org>/<repo>.git
              revision: HEAD
              directories:
                - path: infra/helm/apps/*
  template:
    metadata:
      name: '{{.path.basename}}-{{.env}}'
      labels:
        app.kubernetes.io/part-of: apps
        env: '{{.env}}'
    spec:
      project: 'apps-{{.env}}'
      source:
        repoURL: https://github.com/<org>/<repo>.git
        path: '{{.path.path}}'
        targetRevision: HEAD
        helm:
          valueFiles:
            - values.yaml
            - 'values.{{.env}}.yaml'
      destination:
        server: '{{.cluster}}'
        namespace: '{{.path.basename}}-{{.env}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: '{{.autosync}}'
        syncOptions:
          - CreateNamespace=true
          - ServerSideApply=true
          - ApplyOutOfSyncOnly=true
          - RespectIgnoreDifferences=true
        retry:
          limit: 5
          backoff: { duration: 10s, factor: 2, maxDuration: 5m }
```

`appset-platform.yaml` follows the same matrix but iterates `infra/crossplane/{providers,functions,configurations,xrds,compositions}/*` and pins to `project: platform`, `selfHeal: false` everywhere (humans approve platform drift).

`appset-infra.yaml` iterates `infra/helm/infra/*` (eso, cert-manager, ingress-nginx, kube-prometheus-stack, loki, tempo, longhorn-if-applicable). Project = `infra`.

### 7.4 Root app

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: root
  namespace: argocd
  finalizers: [resources-finalizer.argocd.argoproj.io]
spec:
  project: default
  source:
    repoURL: https://github.com/<org>/<repo>.git
    path: infra/argocd
    targetRevision: HEAD
    directory:
      recurse: true
      include: '{root-app.yaml,projects/*.yaml,appset-*.yaml,sync-windows/*.yaml,notifications/*.yaml}'
  destination: { server: https://kubernetes.default.svc, namespace: argocd }
  syncPolicy:
    automated: { prune: true, selfHeal: true }
    syncOptions: [ServerSideApply=true]
```

`task launch` does exactly one `kubectl apply -f infra/argocd/root-app.yaml`; everything else is reconciled.

### 7.5 AppProject scoping

One project per concern, one project per app-env. Keeps blast radius bounded and lets Keycloak RBAC bind cleanly.

| AppProject     | sourceRepos                                                                            | destinations (namespace)                                | clusterResourceWhitelist                                                        | Notes                                    |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `platform`     | this repo + crossplane chart repos                                                     | `crossplane-system`, `kube-system`                      | `*` (CRDs, ClusterRoles)                                                        | Manual sync only on prod profile         |
| `infra`        | this repo + upstream charts (ESO, cert-manager, ingress-nginx, kube-prom, loki, tempo) | `eso`, `cert-manager`, `ingress-nginx`, `observability` | `CustomResourceDefinition`, `ClusterRole`, `ClusterRoleBinding`, `StorageClass` |                                          |
| `apps-dev`     | this repo only                                                                         | `*-dev`                                                 | none                                                                            | `selfHeal: true`, auto-prune             |
| `apps-staging` | this repo only                                                                         | `*-staging`                                             | none                                                                            | `selfHeal: true`, Kargo-gated promotions |
| `apps-prod`    | this repo only                                                                         | `*-prod`                                                | none                                                                            | `selfHeal: false`, Kargo + manual GO     |

RBAC binding example, generated by `provider-keycloak` via the Identity XRD:

```yaml
# argocd-rbac-cm (managed)
g, /platform-admins, role:admin
g, /sre, role:platform-operator
g, /devs, role:app-developer
p, role:app-developer, applications, sync, apps-dev/*, allow
p, role:app-developer, applications, sync, apps-staging/*, allow
p, role:app-developer, applications, sync, apps-prod/*, deny
p, role:platform-operator, applications, *, platform/*, allow
```

### 7.6 Per-env values + sync windows

Per-env overlays live next to the chart, matching Section 5.

```
infra/helm/apps/go-hello/
  Chart.yaml
  values.yaml          # base
  values.dev.yaml      # 1 replica, debug logs, no PDB
  values.staging.yaml  # 2 replicas, prod-like, sandbox secrets
  values.prod.yaml     # HPA min=3, PDB minAvailable=2, real secrets
```

Sync windows are AppProject-scoped (Argo native), not Application-scoped:

```yaml
# sync-windows/staging-window.yaml — patched into appproject-apps-staging
syncWindows:
  - kind: allow
    schedule: '0 9 * * 1-5'   # weekdays 09:00 UTC
    duration: 9h
    applications: ['*']
    manualSync: true
  - kind: deny
    schedule: '0 0 * * 0,6'   # weekend freeze
    duration: 24h
    applications: ['*']

# sync-windows/prod-freeze.yaml — patched into appproject-apps-prod
syncWindows:
  - kind: deny
    schedule: '0 0 * * 5'     # Fri 00:00 UTC -> Mon 00:00 UTC
    duration: 72h
    applications: ['*']
    manualSync: false         # hard freeze; Kargo respects this
```

### 7.7 Promotion model

Two-loop split, both written-back to git so the repo is always the truth.

| Env       | Trigger                                                    | Mechanism                                                                                             | Gate                                                                         |
| --------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `dev`     | image push to GHCR with tag `sha-<commit>`                 | Argo Image Updater rewrites `infra/helm/apps/<svc>/values.dev.yaml` `image.tag` and commits to `main` | none                                                                         |
| `staging` | Kargo `Warehouse` detects new image + new manifest commit  | Kargo `Promotion` opens PR (or direct commit, profile-driven) updating `values.staging.yaml`          | `AnalysisRun`: smoke + p95 latency + 5xx rate                                |
| `prod`    | manual `kargo promote` (CLI/UI) OR auto if profile says so | Kargo `Promotion` updates `values.prod.yaml`                                                          | `AnalysisRun` + sync-window respect + manual approval step on `p-enterprise` |

Image Updater config (dev only):

```yaml
# image-updater/argocd-image-updater-cm.yaml
data:
  registries.conf: |
    registries:
      - name: ghcr
        api_url: https://ghcr.io
        prefix: ghcr.io
        credentials: pullsecret:argocd/ghcr-pull
  applications.conf: |
    # selector: only apps in apps-dev project
    write-back-method: git
    write-back-target: helmvalues:./values.dev.yaml
    git-branch: main
```

Image Updater is disabled on staging/prod projects via `argocd-image-updater.argoproj.io/image-list` annotation absence; only ApplicationSet template for `env=dev` adds the annotation.

### 7.8 Kargo pipeline (Day-1: `go-hello`)

```yaml
# kargo/project-go-hello.yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Project
metadata: {name: go-hello}
---
# kargo/warehouse-go-hello.yaml
apiVersion: kargo.akuity.io/v1alpha1
kind: Warehouse
metadata: {name: go-hello, namespace: go-hello}
spec:
  subscriptions:
    - image: {repoURL: ghcr.io/<org>/go-hello, semverConstraint: '>=0.0.0-0'}
    - git:   {repoURL: https://github.com/<org>/<repo>.git, branch: main}
---
# kargo/stages-go-hello.yaml — dev -> staging -> prod
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata: {name: dev, namespace: go-hello}
spec:
  requestedFreight:
    - origin: {kind: Warehouse, name: go-hello}
      sources: {direct: true}
  promotionTemplate:
    spec:
      steps:
        - uses: git-clone
        - uses: yaml-update
          config:
            path: infra/helm/apps/go-hello/values.dev.yaml
            updates: [{key: image.tag, value: ${{ imageFrom("ghcr.io/<org>/go-hello").Tag }}]
        - uses: git-commit
        - uses: git-push
        - uses: argocd-update
          config: {apps: [{name: go-hello-dev}]}
---
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata: {name: staging, namespace: go-hello}
spec:
  requestedFreight:
    - origin: {kind: Warehouse, name: go-hello}
      sources: {stages: [dev]}
  verification:
    analysisTemplates: [{name: smoke}, {name: slo}]
  promotionTemplate:
    spec:
      steps:
        - uses: git-clone
        - uses: yaml-update
          config:
            path: infra/helm/apps/go-hello/values.staging.yaml
            updates: [{key: image.tag, value: ${{ imageFrom("ghcr.io/<org>/go-hello").Tag }}]
        - uses: git-commit
        - uses: git-push
        - uses: argocd-update
          config: {apps: [{name: go-hello-staging}]}
---
apiVersion: kargo.akuity.io/v1alpha1
kind: Stage
metadata: {name: prod, namespace: go-hello}
spec:
  requestedFreight:
    - origin: {kind: Warehouse, name: go-hello}
      sources: {stages: [staging]}
  verification:
    analysisTemplates: [{name: smoke}, {name: slo}]
  promotionTemplate:
    spec:
      steps:
        - uses: git-clone
        - uses: yaml-update
          config:
            path: infra/helm/apps/go-hello/values.prod.yaml
            updates: [{key: image.tag, value: ${{ imageFrom("ghcr.io/<org>/go-hello").Tag }}]
        - uses: git-commit
        - uses: git-push
        - uses: argocd-update
          config: {apps: [{name: go-hello-prod}]}
```

AnalysisTemplates gate every promotion into staging and prod:

```yaml
# kargo/analysistemplate-smoke.yaml — HTTP smoke against the post-deploy service
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: {name: smoke}
spec:
  metrics:
    - name: smoke-200
      provider:
        web:
          url: 'http://go-hello.{{args.env}}.svc/healthz'
          jsonPath: '{$.status}'
      successCondition: 'result == "ok"'
      failureLimit: 0
      count: 3
      interval: 10s

# kargo/analysistemplate-slo.yaml — Prom query, p95 + 5xx
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata: {name: slo}
spec:
  metrics:
    - name: p95-latency
      provider:
        prometheus:
          address: http://kube-prometheus-stack-prometheus.observability:9090
          query: |
            histogram_quantile(0.95,
              sum(rate(http_request_duration_seconds_bucket{app="go-hello",env="{{args.env}}"}[5m])) by (le))
      successCondition: 'result < 0.300'
      failureLimit: 1
    - name: error-rate
      provider:
        prometheus:
          address: http://kube-prometheus-stack-prometheus.observability:9090
          query: |
            sum(rate(http_requests_total{app="go-hello",env="{{args.env}}",code=~"5.."}[5m]))
              /
            sum(rate(http_requests_total{app="go-hello",env="{{args.env}}"}[5m]))
      successCondition: 'result < 0.01'
      failureLimit: 1
```

`task promote SVC=go-hello FROM=staging TO=prod` is sugar for `kargo promote --stage prod --freight <id>`. Founders see "Promote go-hello to production? [y/N]".

### 7.9 Notifications + drift alerting

Argo notifications controller is enabled in the root install. Triggers fire to a Slack channel resolved via `provider-slack` (a Crossplane `SlackChannel` XR, see Section 8). The webhook URL lives in ESO, projected as `Secret/argocd-notifications-secret`.

| Trigger                  | When                                                 | Channel            |
| ------------------------ | ---------------------------------------------------- | ------------------ |
| `on-sync-failed`         | Application moves to `Degraded` or `Sync=Error`      | `#platform-alerts` |
| `on-out-of-sync`         | OOS for > 10m and `selfHeal=false` (platform + prod) | `#platform-drift`  |
| `on-health-degraded`     | Health = `Degraded` for > 5m                         | `#platform-alerts` |
| `on-promotion-failed`    | Kargo `Promotion.status.phase == Failed`             | `#release-bot`     |
| `on-analysis-run-failed` | AnalysisRun fails on staging or prod                 | `#release-bot`     |

Sample template:

```yaml
template.app-sync-failed: |
  message: |
    :red_circle: *{{.app.metadata.name}}* failed to sync in env *{{.app.metadata.labels.env}}*
    Project: {{.app.spec.project}}
    Last error: {{(call .repo.GetOperationStateInfo .app).Message}}
    Revision: {{.app.status.sync.revision}}
    {{- if .app.status.conditions }}
    Conditions:
    {{- range .app.status.conditions }} - {{.message}}{{- end }}
    {{- end }}
```

### 7.10 Disaster recovery

Argo CD state is fully declarative in this repo. DR is two commands; the only stateful pieces are `argocd_session_keys` and any in-cluster Argo notification secrets, both projected by ESO from the profile's secret backend.

```bash
# Backup (cron CronJob in argocd namespace, daily)
argocd admin export > /backup/argocd-$(date +%F).yaml

# Restore (new cluster, root-app already applied)
argocd admin import - < /backup/argocd-2026-06-02.yaml
```

The export is uploaded to the profile-configured object bucket (Contabo Object Storage, S3, ACR-blob, GCS) via the `ObjectBucket` XR. Kargo state is rebuilt by re-applying `infra/argocd/kargo/*` and replaying the warehouse — freight history is non-load-bearing.

### 7.11 META.yaml

```yaml
# infra/argocd/META.yaml
layer: 7-multi-env-promotion
provides:
  - argocd_appset
  - argocd_app_project
  - kargo_pipeline
  - image_updater
inputs:
  profile_envs: [dev, staging, prod] # overridable per profile
  repo_url: ${PROFILE.repoURL}
  cluster: ${PROFILE.cluster}
  notifications_channel: ${PROFILE.slack.channel}
outputs:
  application_count: 'len(envs) * len(apps)'
  project_count: 'len(envs) + 2' # apps-* + platform + infra
mcp_endpoints:
  - GET  /argocd/apps # list synced apps grouped by project + env
  - POST /argocd/promote # wraps kargo promote, validates env order
  - GET  /argocd/drift # apps where status.sync.status != Synced
  - GET  /kargo/freight # list freight per warehouse
```

### 7.12 Profile overrides

`profiles/<id>/argocd/appset-overrides.yaml` is patched into the base ApplicationSet by Argo CD's `ignoreDifferences` + a Kustomize overlay at `infra/argocd/profile/`. Keeps the base generic.

| Profile           | Envs shipped                          | Image Updater        | Kargo                                       | Sync window             | Notifications           |
| ----------------- | ------------------------------------- | -------------------- | ------------------------------------------- | ----------------------- | ----------------------- |
| `p-solo`          | `dev` only                            | on                   | off (no targets)                            | none                    | stdout (no Slack)       |
| `p-hobby`         | `dev`, `prod`                         | on (dev), off (prod) | dev→prod, smoke only                        | none                    | Slack optional          |
| `p-startup-small` | `dev`, `staging`, `prod`              | dev only             | full pipeline, smoke + slo                  | staging weekday-only    | Slack required          |
| `p-startup-scale` | `dev`, `staging`, `prod`              | dev only             | full + Friday freeze                        | full                    | Slack + PagerDuty       |
| `p-enterprise`    | `dev`, `staging`, `prod` (per-region) | dev only             | full + manual GO + change-ticket annotation | full + region-staggered | Slack + PD + ServiceNow |

### 7.13 Day-1 vs follow-up

Day-1 (this PR):

- `root-app.yaml` + `appset-{platform,infra,apps}.yaml` + 5 `AppProject`s.
- Three sample apps (`go-hello`, `py-hello`, `ts-hello`) × three envs (`dev`, `staging`, `prod`) = 9 Applications synced end-to-end on `p-startup-small`.
- Kargo Project + Warehouse + Stages + AnalysisTemplates for `go-hello`. Smoke + Prom-SLO gates wired.
- Argo Image Updater enabled, scoped to `apps-dev` AppProject.
- Sync windows on staging + prod. Notifications to one Slack channel via ESO-projected webhook.
- `task promote SVC=<svc> FROM=<env> TO=<env>` verb + `kargo` CLI installed in devenv (Section 2).
- DR cron `CronJob` running `argocd admin export` to the profile bucket.
- `META.yaml` consumed by MCP; `/argocd/apps`, `/argocd/promote`, `/argocd/drift`, `/kargo/freight` live (Section 0b).

Follow-up:

- Per-region ApplicationSet generators (`p-enterprise` multi-region).
- Kargo pipelines for the other two sample apps + a template generator (`task new-pipeline SVC=<svc>`).
- PagerDuty + ServiceNow notification triggers.
- Progressive delivery via Argo Rollouts integrated as a Kargo verification step (canary + analysis).
- Cross-cluster ApplicationSets (one Argo CD, many workload clusters) once Section 8's cluster-fleet XRD lands.
- PR-based promotion mode (Kargo opens PR instead of direct commit) for compliance-heavy profiles.

See Section 5 for the Helm shape that values overlays target, Section 6 for ESO/Keycloak/Slack provider plumbing, and Section 8 for the XRDs that back `Database`/`ObjectBucket`/`IdentityClient`/`SlackChannel` claims referenced above.

## Section 8 — Crossplane platform (providers + functions + XRDs + Compositions)

Layer 6. Crossplane is the single composition engine for everything stateful: databases, brokers, buckets, observability bundles, identity, schema governance, and cloud bootstrap. Apps never reference managed resources directly — they reference XR claims. Profiles (Section 6) inject sizing via `function-environment-configs`.

### 8.1 Core install (pinned)

| Component          | Version             | Source                                    |
| ------------------ | ------------------- | ----------------------------------------- |
| Crossplane core    | `1.17.3`            | `crossplane-stable/crossplane` Helm chart |
| Helm chart version | `1.17.3`            | `https://charts.crossplane.io/stable`     |
| Namespace          | `crossplane-system` | created by chart                          |
| ESO                | `0.10.x`            | for provider creds + claim secrets        |

Install path: `infra/crossplane/install/` — Argo `Application` that templates the upstream chart with these values:

```yaml
args:
  - --enable-environment-configs
  - --enable-usages
  - --enable-realtime-compositions=false
resourcesCrossplane:
  limits: { cpu: '1', memory: 1Gi }
  requests: { cpu: 100m, memory: 256Mi }
packageCache:
  pvc: crossplane-package-cache
  sizeLimit: 5Gi
```

v2 migration (namespaced XRs, composite-level operations) is deferred — Day-1 stays on 1.17.3 cluster-scoped XRs. See Section 16 for the migration plan.

### 8.2 Providers (Day-1 list, exact versions)

All providers installed via `Provider` CRs at `infra/crossplane/providers/`. Family-scoped providers (Azure / AWS / GCP) install only the subpackages we use to keep CRD count manageable.

| Provider                         | Package                                                    | Version   | Purpose                                                                  |
| -------------------------------- | ---------------------------------------------------------- | --------- | ------------------------------------------------------------------------ |
| provider-kubernetes              | `xpkg.upbound.io/crossplane-contrib/provider-kubernetes`   | `v0.14.1` | apply arbitrary manifests (CNPG Cluster, Strimzi Kafka, CHI, etc.)       |
| provider-helm                    | `xpkg.upbound.io/crossplane-contrib/provider-helm`         | `v0.19.0` | install operator charts when needed                                      |
| provider-http                    | `xpkg.upbound.io/crossplane-contrib/provider-http`         | `v0.27.0` | bridge to Apicurio REST + Kroxylicious admin (MVP for schema-governance) |
| provider-azure (family)          | `xpkg.upbound.io/upbound/provider-family-azure`            | `v1.5.0`  | base family                                                              |
| provider-azure-keyvault          | `xpkg.upbound.io/upbound/provider-azure-keyvault`          | `v1.5.0`  | AKV                                                                      |
| provider-azure-storage           | `xpkg.upbound.io/upbound/provider-azure-storage`           | `v1.5.0`  | Blob, queues                                                             |
| provider-azure-containerregistry | `xpkg.upbound.io/upbound/provider-azure-containerregistry` | `v1.5.0`  | ACR                                                                      |
| provider-aws (family)            | `xpkg.upbound.io/upbound/provider-family-aws`              | `v1.10.0` | base family                                                              |
| provider-aws-s3                  | `xpkg.upbound.io/upbound/provider-aws-s3`                  | `v1.10.0` | S3 buckets                                                               |
| provider-aws-secretsmanager      | `xpkg.upbound.io/upbound/provider-aws-secretsmanager`      | `v1.10.0` | ASM                                                                      |
| provider-aws-ecr                 | `xpkg.upbound.io/upbound/provider-aws-ecr`                 | `v1.10.0` | ECR                                                                      |
| provider-gcp (family)            | `xpkg.upbound.io/upbound/provider-family-gcp`              | `v1.5.0`  | base family                                                              |
| provider-gcp-storage             | `xpkg.upbound.io/upbound/provider-gcp-storage`             | `v1.5.0`  | GCS                                                                      |
| provider-gcp-secretmanager       | `xpkg.upbound.io/upbound/provider-gcp-secretmanager`       | `v1.5.0`  | GSM                                                                      |
| provider-gcp-artifactregistry    | `xpkg.upbound.io/upbound/provider-gcp-artifactregistry`    | `v1.5.0`  | GAR                                                                      |
| provider-cloudflare              | `xpkg.upbound.io/milkpirate/provider-cloudflare`           | `v0.4.0`  | DNS zones + records (community, upjet)                                   |
| provider-grafana                 | `xpkg.upbound.io/grafana/provider-grafana`                 | `v0.18.0` | folders, dashboards, contact points                                      |
| provider-vault                   | `xpkg.upbound.io/upbound/provider-vault`                   | `v1.0.0`  | KV v2 + policies for p-enterprise                                        |
| provider-keycloak                | `xpkg.upbound.io/crossplane-contrib/provider-keycloak`     | `v2.4.0`  | clients, scopes, mappers (already used in ovh repo)                      |
| provider-azuread                 | `xpkg.upbound.io/upbound/provider-azuread`                 | `v1.1.0`  | Entra apps + groups (already used)                                       |
| provider-github                  | `xpkg.upbound.io/coopnorge/provider-github`                | `v0.20.0` | repos, branches, environments, secrets                                   |
| provider-sql                     | `xpkg.upbound.io/crossplane-contrib/provider-sql`          | `v0.10.0` | databases + roles inside CNPG                                            |
| provider-clickhousedbops         | `xpkg.upbound.io/altinity/provider-clickhousedbops`        | `v0.3.0`  | CH users + grants (already used)                                         |
| provider-argocd                  | `xpkg.upbound.io/crossplane-contrib/provider-argocd`       | `v0.10.0` | manage Argo `AppProject` + repo creds from claims                        |
| provider-apicurio                | —                                                          | deferred  | replaced by `provider-http` MVP, see §8.7                                |

Layout:

```
infra/crossplane/providers/
  family-azure.yaml           # one Provider per row above
  family-aws.yaml
  family-gcp.yaml
  kubernetes.yaml
  helm.yaml
  ...
```

### 8.3 Provider configs + credential wiring

Every provider that talks to a cloud or external system has a `ProviderConfig` at `infra/crossplane/provider-configs/<provider>.yaml` that reads from an `ExternalSecret`. The `ClusterSecretStore` is profile-driven (Section 9).

Pattern (Azure example):

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: provider-azure-creds
  namespace: crossplane-system
spec:
  refreshInterval: 1h
  secretStoreRef: { name: platform-store, kind: ClusterSecretStore }
  target: { name: provider-azure-creds }
  data:
    - { secretKey: credentials, remoteRef: { key: crossplane/azure-sp-json } }
---
apiVersion: azure.upbound.io/v1beta1
kind: ProviderConfig
metadata: { name: default }
spec:
  credentials:
    source: Secret
    secretRef:
      namespace: crossplane-system
      name: provider-azure-creds
      key: credentials
```

| Provider               | Secret key in store               | Format                                                     |
| ---------------------- | --------------------------------- | ---------------------------------------------------------- |
| azure / azuread        | `crossplane/azure-sp-json`        | SP JSON (clientId, clientSecret, tenantId, subscriptionId) |
| aws                    | `crossplane/aws-creds`            | INI `[default] aws_access_key_id=...`                      |
| gcp                    | `crossplane/gcp-sa-json`          | SA JSON                                                    |
| cloudflare             | `crossplane/cloudflare-api-token` | bearer token                                               |
| grafana                | `crossplane/grafana-api-key`      | URL + service-account token                                |
| vault                  | `crossplane/vault-token`          | token + addr                                               |
| keycloak               | `crossplane/keycloak-admin`       | url, client_id, client_secret                              |
| github                 | `crossplane/github-pat`           | fine-grained PAT                                           |
| kubernetes / helm      | in-cluster SA                     | no secret; `InjectedIdentity`                              |
| http (apicurio bridge) | `crossplane/apicurio-basic`       | basic-auth header                                          |

For `p-solo` and `p-hobby`, only `kubernetes` + `helm` + `http` + `cloudflare` (+ `github` if user opts in) have configs — cloud providers stay uninstalled.

### 8.4 Composition functions

| Function                     | Package                                                           | Version   | Role                                                               |
| ---------------------------- | ----------------------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| function-patch-and-transform | `xpkg.upbound.io/crossplane-contrib/function-patch-and-transform` | `v0.7.0`  | primary patching engine — every Composition uses it                |
| function-go-templating       | `xpkg.upbound.io/crossplane-contrib/function-go-templating`       | `v0.9.2`  | conditionals + loops (per-env replica math, optional sidecars)     |
| function-environment-configs | `xpkg.upbound.io/crossplane-contrib/function-environment-configs` | `v0.4.0`  | reads `EnvironmentConfig` per env, injects sizing into ctx         |
| function-auto-ready          | `xpkg.upbound.io/crossplane-contrib/function-auto-ready`          | `v0.4.0`  | marks XR Ready when MRs converge — terminal step in every pipeline |
| function-extra-resources     | `xpkg.upbound.io/crossplane-contrib/function-extra-resources`     | `v0.3.0`  | look up existing cluster state (e.g., CNPG superuser secret)       |
| function-kcl                 | `xpkg.upbound.io/crossplane-contrib/function-kcl`                 | `v0.11.0` | escape hatch for complex generation (Kroxylicious filter chains)   |

All function CRs live at `infra/crossplane/functions/`. A "standard pipeline" looks like:

```yaml
pipeline:
  - { step: load-env, functionRef: { name: function-environment-configs } }
  - { step: lookup-existing, functionRef: { name: function-extra-resources } }
  - { step: render, functionRef: { name: function-go-templating } }
  - { step: patch, functionRef: { name: function-patch-and-transform } }
  - { step: ready, functionRef: { name: function-auto-ready } }
```

KCL is only used in compositions that need to generate N managed resources from one list field (Kroxylicious filters, schema-artifact bulk import).

### 8.5 EnvironmentConfigs (per-env sizing)

Three `EnvironmentConfig` objects at `infra/crossplane/environment-configs/`:

```yaml
apiVersion: apiextensions.crossplane.io/v1beta1
kind: EnvironmentConfig
metadata: { name: env-prod }
data:
  env: prod
  pg: { instances: 3, storageGi: 100, instanceClass: standard-2x }
  redis: { replicas: 3, storageGi: 20 }
  kafka: { brokers: 3, storageGi: 200, retentionHours: 168 }
  clickhouse: { shards: 1, replicas: 2, keepers: 3, storageGi: 500 }
  opensearch: { masters: 3, data: 3, storageGi: 100 }
  defaults: { backup: { enabled: true, retentionDays: 30 } }
```

Equivalent `env-staging` and `env-dev` files reduce replicas to `1`, storage to `10Gi`, backups off. Claims select with `environment.environmentConfigs[].ref.name` patched from `spec.env`.

### 8.6 XRD bundles — all four ship Day-1

Layout:

```
infra/crossplane/
  xrds/
    core/{xpostgrescluster,xrediscluster,xrabbitmqcluster,xkafkacluster,xkafkatopic,xclickhousecluster,xopensearchcluster,xbucket,xsecretbinding}.yaml
    obs-identity/{xserviceobservability,xgrafanaapp,xkeycloakclient,xoidcapp}.yaml
    schema-gov/{xregistryinstance,xschemagroup,xschemaartifact,xkafkaproxyplane,xvirtualkafkacluster,xkafkaprotocolfilter,xdatacontract,xglobalruleset,xrecordencryptionfilter,xrecordvalidationfilter,xauthorizationfilter}.yaml
    cloud-bootstrap/{xk8scluster,xkeyvault,xcontainerregistry,xdnszone.yaml}
  compositions/
    core/...
    obs-identity/...
    schema-gov/...
    cloud-bootstrap/...
  claims/
    dev/{pg-app.yaml, redis-app.yaml, kafka-shared.yaml, ...}
    staging/...
    prod/...
```

All XRDs are `cluster-scoped: true`, version `v1alpha1` Day-1, with `served: true, referenceable: true`. Claims are namespaced (`<Name>Claim`).

### 8.7 Bundle A — Core service primitives

#### XPostgresCluster

| Field                   | Type                               | Default                  | Notes                                  |
| ----------------------- | ---------------------------------- | ------------------------ | -------------------------------------- | --- | --- | -------------- |
| `spec.size`             | enum `xs                           | s                        | m                                      | l`  | `s` | profile-mapped |
| `spec.version`          | string                             | `16`                     | CNPG image tag suffix                  |
| `spec.databases[]`      | `[{name, owner}]`                  | `[]`                     | one CNPG `Database` + role per entry   |
| `spec.pooler`           | `{enabled, replicas, mode}`        | `{true, 2, transaction}` | pgBouncer                              |
| `spec.backup`           | `{enabled, target, retentionDays}` | from env-config          | wal-g via CNPG `BarmanObjectStore`     |
| `spec.observability`    | `{prometheus, dashboard}`          | `{true, true}`           | composed `ServiceMonitor` + Grafana CM |
| `spec.connectionSecret` | string                             | `<claim>-conn`           | published to claim namespace           |

Composition pipeline: `load-env` → `lookup-existing` (existing backup bucket secret) → `render` (gotemplating computes instances/storage from `size` + env) → `patch` (writes CNPG `Cluster`, CNPG `Pooler`, `ExternalSecret` for superuser, `ServiceMonitor`, `PrometheusRule`, Grafana dashboard `ConfigMap`) → `auto-ready` (Ready when CNPG `Cluster.status.phase == Cluster in healthy state`).

Connection details: `host, port, username, password, uri, ca.crt` → secret `<claim>-conn`.

Example claim (`infra/crossplane/claims/dev/pg-aegis.yaml`):

```yaml
apiVersion: pn.cloud/v1alpha1
kind: PostgresClusterClaim
metadata: { name: aegis, namespace: aegis }
spec:
  env: dev
  size: xs
  databases:
    - { name: aegis, owner: aegis_app }
  pooler: { enabled: true, replicas: 1, mode: transaction }
```

#### XRedisCluster

KubeBlocks `Cluster` with Redis cluster definition. Fields: `size`, `replicas`, `persistence`, `tls`. Composition generates KubeBlocks `Cluster` + `OpsRequest` (resize) + ESO secret. Connection details: `host, port, password`.

#### XRabbitMQCluster

`RabbitmqCluster` (cluster-operator) + `Vhost`/`User`/`Permission` from topology-operator. Spec: `size, replicas, vhosts[], users[{name, tags, permissions}]`. Composition uses `provider-kubernetes` to apply CRs; topology operator is installed once via `provider-helm` at platform bootstrap (not per-claim).

#### XKafkaCluster

Strimzi `Kafka` (KRaft) + `KafkaNodePool` (broker pool + controller pool). Spec: `size, brokerReplicas, controllerReplicas, storage{class,size}, listeners{plain,tls,external}, authentication{type}`. Composition emits one `Kafka` + 2 `KafkaNodePool`. Connection details: `bootstrap, ca.crt, client.properties`.

#### XKafkaTopic

Lightweight wrapper over Strimzi `KafkaTopic`. Spec: `cluster, partitions, replicas, retentionMs, cleanupPolicy, config{}`. Composition is single MR. Cited as the boundary between platform team and app team: apps file `KafkaTopicClaim`, platform owns `XKafkaCluster`.

#### XClickHouseCluster

Altinity `ClickHouseInstallation` + `ClickHouseKeeperInstallation` + `clickhousedbops` `User`. Spec: `size, shards, replicas, keepers, storage{class,size}, version, image (default altinity stable), users[{name, networks, grants}]`. Composition uses `provider-kubernetes` for CHI/CHKI and `provider-clickhousedbops` for users/grants. Image default uses Altinity-stable image with `skip_binary_checksum_checks=1` (per ovh-repo lesson — see CLAUDE.md note). Connection details: `host, port, native_port, username, password`.

#### XOpenSearchCluster

OpenSearch operator `OpenSearchCluster`. Spec: `size, masters, data, ingest, storage{class,size}, security{enabled, adminPassword}`. Connection details: `host, port, username, password, ca.crt`.

#### XBucket

Cloud-neutral bucket. Spec: `provider (s3|azureblob|r2|gcs), name, versioning, lifecycle{}, publicRead`. Composition switches on `provider` via `function-go-templating` and emits one of: AWS `Bucket`, Azure `Account`+`Container`, Cloudflare R2 `Bucket`, GCS `Bucket`. Connection details normalized to `endpoint, region, accessKeyId, secretAccessKey, bucket`.

#### XSecretBinding

Glue. Spec: `targetNamespace, sourceKey, name, store (optional override)`. Composition emits a single `ExternalSecret` referencing the profile-default `ClusterSecretStore` (Section 9). Lets app teams pull from the platform store without writing ESO directly.

### 8.8 Bundle B — Observability + identity

#### XServiceObservability

One claim = `ServiceMonitor` + `PrometheusRule` + Grafana dashboard `ConfigMap` (sidecar-discovered) + Grafana `Folder` (via `provider-grafana`).

| Field                | Default         | Notes                                                 |
| -------------------- | --------------- | ----------------------------------------------------- |
| `spec.selector`      | required        | matches app Service                                   |
| `spec.metricsPath`   | `/metrics`      |                                                       |
| `spec.slos[]`        | `[]`            | each generates a recording + alert rule               |
| `spec.dashboardJSON` | required        | inlined or fetched via `provider-http` from a Git URL |
| `spec.alertingTo`    | `pager-default` | resolves to a Grafana contact point                   |

#### XGrafanaApp

Spec: `name, folder, dashboards[{uid, json}], alertRules[], contactPoints[]`. Pure `provider-grafana` composition.

#### XKeycloakClient

Spec: `realm, clientId, redirectUris[], scopes[], groupMappers[{group, claim}], serviceAccount{enabled, roles[]}`. Composition emits `Client` + `ClientScope` + `ProtocolMapper` + (if service account) `ServiceAccountRoleMapping`. Connection details: `clientId, clientSecret`.

#### XOIDCApp

Higher-level wrapper. Spec: `name, realm, redirectUris[], audience[]`. Composes one `XKeycloakClient` (nested XR) + one ESO `ExternalSecret` writing `OIDC_CLIENT_ID/SECRET/ISSUER/REDIRECT_URI` to the app namespace. This is the unit apps reference.

### 8.9 Bundle C — Schema governance + Kroxylicious

Per the spec at `docs/superpowers/specs/2026-05-23-crossplane-schema-governance-and-kroxylicious-design.md`. Day-1 uses `provider-http` to drive Apicurio REST + Kroxylicious admin until a typed `provider-apicurio` lands.

| XRD                     | Backing resources                                                                                | Provider                      |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------- |
| XRegistryInstance       | Apicurio Registry `Deployment` + `Service` + Postgres backing via `XPostgresCluster`             | kubernetes + nested XR        |
| XSchemaGroup            | Apicurio `/groups/<id>` POST                                                                     | http                          |
| XSchemaArtifact         | Apicurio `/groups/<g>/artifacts/<id>` POST with `X-Registry-ArtifactType`                        | http                          |
| XGlobalRuleSet          | Apicurio `/admin/rules` PUT (validity, compatibility)                                            | http                          |
| XDataContract           | XSchemaArtifact + XGlobalRuleSet + XSchemaGroup wiring; one declarative unit per topic-contract  | nested XRs                    |
| XKafkaProxyPlane        | Kroxylicious `Deployment` + `Service` + `ConfigMap` (rendered via function-kcl from filter list) | kubernetes                    |
| XVirtualKafkaCluster    | Kroxylicious VirtualCluster config block (CM patch)                                              | kubernetes                    |
| XKafkaProtocolFilter    | one entry in Kroxylicious filter chain                                                           | kubernetes (CM patch via kcl) |
| XRecordEncryptionFilter | KMS-backed Kroxylicious filter; envelope key via `XSecretBinding`                                | kubernetes + http             |
| XRecordValidationFilter | Apicurio-backed validation filter                                                                | kubernetes + http             |
| XAuthorizationFilter    | OPA-backed Kroxylicious filter; policy via CM                                                    | kubernetes                    |

MVP caveats:

- `provider-http` calls are not idempotent on partial failure; compositions include `forProvider.expectedResponse.statusCode in [200,201,409]` so retries don't fail on "already exists".
- Drift detection is statusCode-based only — content drift won't be caught Day-1. Tracked in §16 follow-up: build typed `provider-apicurio` (upjet from openapi).

### 8.10 Bundle D — Cloud bootstrap

These XRDs let Layer 7 (Terraform/Ansible) hand off ongoing cloud state to Crossplane after Day-0.

| XRD                | Spec fields           | Backing resources |
| ------------------ | --------------------- | ----------------- | -------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| XK8sCluster        | `provider (aks        | eks               | gke      | hetzner                                                   | contabo), region, nodePools[{name,size,count,labels,taints}], network{}, version`                                      | provider-specific `Cluster` + node pool MRs; on hetzner/contabo composes `XBootstrapServer` chain — see Section 13 |
| XKeyVault          | `provider (akv        | asm               | gsm      | vault), name, accessPolicies[]`                           | AKV `Vault` / AWS `Secret` namespace / GSM `SecretManagerSecret` parent / Vault `Mount`                                |
| XContainerRegistry | `provider (ghcr       | acr               | ecr      | gar                                                       | harbor), name, sku, replications[]`                                                                                    | ACR `Registry` / ECR `Repository` / GAR `Repository`; ghcr is a no-op composition (org-level, managed by GitHub)   |
| XDNSZone           | `provider (cloudflare | route53           | azuredns | clouddns), zone, records[{name,type,value,ttl,proxied?}]` | provider-cloudflare `Zone` + `Record` (Day-1 primary); other providers ship XRD + stub Composition, full impl deferred |

Connection details from `XKeyVault` published as `<name>-store-creds` — directly consumable by Section 9 `ClusterSecretStore`.

### 8.11 Composition selection — profile + env

Compositions are pinned per profile via `compositionRevisionSelector`. Each profile (Section 6) ships `crossplane/composition-pins.yaml`:

```yaml
# profiles/p-startup-small/crossplane/composition-pins.yaml
postgresclusters.pn.cloud:
  compositionRef: { name: xpostgrescluster-cnpg-singlenode }
kafkaclusters.pn.cloud:
  compositionRef: { name: xkafkacluster-strimzi-kraft-small }
```

p-solo and p-hobby select `*-singlenode` compositions that disable HA + backups. p-startup-scale and p-enterprise select `*-ha` variants that require ≥3 nodes and enable wal-g backup + cross-AZ topology spread. Same XRD, different Composition — apps don't see the difference.

### 8.12 Day-1 vs follow-up

Ships in this PR:

- Crossplane core `1.17.3` install (Helm via Argo)
- All 24 providers + provider-configs wired to ESO
- All 6 composition functions installed
- Three `EnvironmentConfig` objects (dev/staging/prod)
- All 4 XRD bundles (28 XRDs total)
- One Composition per XRD (the "small/dev" variant) + one HA variant for the 9 Core XRDs
- Per-env claims at `infra/crossplane/claims/<env>/` for the 3 reference apps (Section 11): Postgres, Redis, one Kafka topic, one ServiceObservability, one OIDC app
- `provider-http`-based MVP for the 11 schema-governance XRDs

Deferred (follow-up issues, see Section 16):

- Typed `provider-apicurio` (replaces http-based bridge)
- `XBucket` GCS branch (only S3/Azure/R2 implemented Day-1)
- Full `XDNSZone` impl for route53/azuredns/clouddns (Cloudflare only Day-1)
- Crossplane v2 migration (namespaced XRs)
- Realtime compositions (`--enable-realtime-compositions=true`)
- HA variants of obs/identity/schema-gov XRDs (Day-1 ships single-variant for these)
- Drift detection for http-based schema-governance compositions

### 8.13 Cross-references

- Section 6 — profiles inject sizing via `EnvironmentConfig` selection + `compositionRevisionSelector`
- Section 9 — ESO `ClusterSecretStore` profile choice feeds every provider config
- Section 10 — Helm library chart consumes XR connection-detail secrets via `existingSecret` keys
- Section 11 — ApplicationSet matrix templates claims out of `infra/crossplane/claims/<env>/`
- Section 13 — Bootstrap XRDs (`XK8sCluster`, `XKeyVault`) are the Terraform/Ansible handoff target
- Section 15 — MCP server exposes `xrd.list`, `xrd.describe`, `claim.render` over these XRDs for Aegis

## Section 9 — Terraform + Ansible bootstrap (Kubespray-style + 7 cloud modules)

Layer 7 is **optional**. The template's default mode is BYO-kubeconfig: the cluster already exists, Terraform only provisions non-cluster cloud resources (DNS, object storage, managed DBs, IAM), and Ansible never runs. The opt-in path takes bare VPS/VMs from a provider API to a working kubeadm cluster in one `task bootstrap:cluster` invocation, Kubespray-style: every knob in `group_vars`, no embedded business logic.

### 9.1 Two modes

| Mode                     | Trigger                             | Terraform scope                            | Ansible scope                                       | Profiles                                                 |
| ------------------------ | ----------------------------------- | ------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------- |
| BYO-kubeconfig (default) | `cluster.bringup: false` in profile | DNS, object storage, IAM, managed services | not invoked                                         | `p-solo`, `p-hobby`, `p-startup-scale`, `p-enterprise`   |
| Full bringup (opt-in)    | `cluster.bringup: true` in profile  | VPS + private net + firewall + LB          | hardening + kubeadm + CNI + Longhorn prep + WG mesh | `p-startup-small`, `p-enterprise` (multi-region variant) |

`p-startup-scale` deliberately uses managed K8s (Hetzner managed / GKE / EKS / AKS) and skips Ansible entirely; bringup mode is reserved for self-hosted clusters where the founder wants Hetzner Cloud + k3s/kubeadm economics.

### 9.2 Repo layout

```
infra/
  terraform/
    modules/
      contabo/            # sibling provider, stub until 0.1.0
      hetzner-cloud/      # hetznercloud/hcloud
      hetzner-robot/      # panta/hetzner (interim) → sibling provider
      ovh/                # ovh/ovh
      azure/              # hashicorp/azurerm
      aws/                # hashicorp/aws
      gcp/                # hashicorp/google
      cloudflare/         # cloudflare/cloudflare — DNS + R2 + Workers
      proxmox/            # Telmate/proxmox — on-prem
      _shared/            # tags, naming, state backend wiring
    envs/
      dev/
      staging/
      prod/
  ansible/
    inventory/
      hosts.yml           # generated by `task bootstrap:inventory` from TF outputs
    group_vars/
      all.yml
      control_plane.yml
      workers.yml
      bastion.yml
    host_vars/
    roles/
    playbooks/
      cluster.yml
      scale.yml
      reset.yml
      upgrade.yml
      backup.yml
```

Each env stack at `infra/terraform/envs/<env>/` is a thin composition: it calls 1–N modules with values fed from `profiles/<id>/terraform.tfvars`.

### 9.3 Module surface (uniform contract)

Every cloud module implements the same input/output contract so envs can swap providers without changing the env stack.

| Input                  | Type           | Notes                                    |
| ---------------------- | -------------- | ---------------------------------------- |
| `name_prefix`          | string         | drives all resource names                |
| `region`               | string         | provider-native region ID                |
| `node_pools`           | `list(object)` | `{role, count, size, image, disks}`      |
| `private_network_cidr` | string         | `10.50.0.0/24` default to match ovh repo |
| `firewall_rules`       | `list(object)` | allow/deny, ports, sources               |
| `load_balancer`        | `object`       | optional; `null` skips                   |
| `managed_k8s`          | `object`       | optional; if set, skips VPS provisioning |
| `managed_db`           | `list(object)` | optional Postgres/MySQL/Redis            |
| `tags`                 | `map(string)`  | merged with profile-level tags           |

| Output                                                   | Used by                           |
| -------------------------------------------------------- | --------------------------------- |
| `nodes` (`list({name,public_ip,private_ip,role,disks})`) | Ansible inventory generator       |
| `kubeconfig` (when `managed_k8s` set)                    | written to keyring via secretspec |
| `lb_endpoint`                                            | DNS module + Helm ingress values  |
| `private_network_id`                                     | sibling modules in same env       |
| `state_inputs`                                           | Crossplane Provider creds via ESO |

### 9.4 Provider pins

| Module        | Provider                               | Pin       | Status                                                                               |
| ------------- | -------------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| contabo       | `proficientnow/contabo` (sibling repo) | `~> 0.1`  | stub Day-1; resources `cntb_instance`, `cntb_private_network`, `cntb_object_storage` |
| hetzner-cloud | `hetznercloud/hcloud`                  | `~> 1.48` | Day-1                                                                                |
| hetzner-robot | `panta/hetzner`                        | `~> 1.0`  | interim; sibling provider replaces post-0.1                                          |
| ovh           | `ovh/ovh`                              | `~> 0.49` | Day-1                                                                                |
| azure         | `hashicorp/azurerm`                    | `~> 4.0`  | scaffolded, nightly smoke only                                                       |
| aws           | `hashicorp/aws`                        | `~> 5.70` | scaffolded, nightly smoke only                                                       |
| gcp           | `hashicorp/google`                     | `~> 6.10` | scaffolded, nightly smoke only                                                       |
| cloudflare    | `cloudflare/cloudflare`                | `~> 4.40` | Day-1 (DNS + R2 + Workers)                                                           |
| proxmox       | `Telmate/proxmox`                      | `~> 3.0`  | Day-1 for on-prem path                                                               |

Terraform itself pinned `>= 1.9, < 2.0` in `versions.tf`.

### 9.5 State backend

Profile-driven, single source in `profiles/<id>/terraform.tfvars` under `state_backend`. The env stack reads the profile and renders `backend.tf` at `task bootstrap:init`.

| Profile           | Default backend                          | Override knob                                       |
| ----------------- | ---------------------------------------- | --------------------------------------------------- |
| `p-solo`          | `local`                                  | n/a                                                 |
| `p-hobby`         | `local`                                  | upgrade to `s3` (Cloudflare R2) on first cloud push |
| `p-startup-small` | `s3` (R2)                                | swap to TF Cloud free tier                          |
| `p-startup-scale` | `azurerm` (matches ovh repo convention)  | `s3` / `gcs` / `remote`                             |
| `p-enterprise`    | `azurerm` + state locking via blob lease | encrypted, customer-managed key                     |

No backend secrets land in git: keys come from secretspec via OS keyring / AKV (Section 4).

### 9.6 Profile-driven .tfvars

`profiles/<machineId>/terraform.tfvars` is the only file a founder edits. The env stack reads it via `-var-file`.

```hcl
# profiles/p-startup-small/terraform.tfvars
name_prefix = "acme"
region      = "hel1"
state_backend = {
  type   = "s3"
  bucket = "acme-tfstate"
  key    = "envs/prod/terraform.tfstate"
  region = "auto"
  endpoint = "https://<account>.r2.cloudflarestorage.com"
}
cluster = {
  bringup            = true
  kube_version       = "1.32.13"
  cni                = "calico"
  container_manager  = "containerd"
  etcd_deployment    = "stacked"
}
node_pools = [
  { role = "control_plane", count = 3, size = "cax21", image = "debian-12", disks = [] },
  { role = "worker",        count = 3, size = "cax31", image = "debian-12", disks = [{mount="/var/lib/longhorn", size_gb=200}] },
]
load_balancer = { type = "lb11", algorithm = "round_robin" }
managed_db    = []
```

### 9.7 Ansible inventory generation

`task bootstrap:inventory` shells out to `terraform output -json nodes` and renders `infra/ansible/inventory/hosts.yml`. No hand-edited inventories.

```yaml
# generated, do not edit
all:
  children:
    control_plane:
      hosts:
        acme-cp-1: { ansible_host: 10.50.0.11, public_ip: 65.x.x.11 }
        acme-cp-2: { ansible_host: 10.50.0.12, public_ip: 65.x.x.12 }
        acme-cp-3: { ansible_host: 10.50.0.13, public_ip: 65.x.x.13 }
    workers:
      hosts:
        acme-wk-1: { ansible_host: 10.50.0.21, public_ip: 65.x.x.21, longhorn_disk: /dev/sdb }
        acme-wk-2: { ansible_host: 10.50.0.22, public_ip: 65.x.x.22, longhorn_disk: /dev/sdb }
        acme-wk-3: { ansible_host: 10.50.0.23, public_ip: 65.x.x.23, longhorn_disk: /dev/sdb }
```

### 9.8 group_vars surface (Kubespray-style)

Everything is a variable. Profile materializer (Section 11) writes the right defaults into `group_vars/all.yml`; founders override in `host_vars/<host>.yml`.

| Variable                 | Default                                        | Notes                                |
| ------------------------ | ---------------------------------------------- | ------------------------------------ |
| `kube_version`           | `1.32.13`                                      | matches ovh repo; Knative compat     |
| `kube_network_plugin`    | `calico`                                       | `calico` / `cilium` / `flannel`      |
| `container_manager`      | `containerd`                                   | or `cri-o`                           |
| `etcd_deployment_type`   | `stacked`                                      | or `external`                        |
| `kube_proxy_mode`        | `iptables`                                     | or `ipvs`                            |
| `ingress_provider`       | `none`                                         | Helm installs ingress later via Argo |
| `pod_cidr`               | `10.244.0.0/16`                                |                                      |
| `service_cidr`           | `10.96.0.0/12`                                 |                                      |
| `kubelet_extra_args`     | `{}`                                           |                                      |
| `apiserver_extra_args`   | `{}`                                           |                                      |
| `wireguard_mesh_enabled` | `true` on `p-startup-small`                    |                                      |
| `longhorn_node_label`    | `node.longhorn.io/create-default-disk: "true"` |                                      |
| `arc_enroll_enabled`     | `false`                                        | Azure Arc opt-in                     |
| `uems_enroll_enabled`    | `false`                                        | ManageEngine EC opt-in               |

### 9.9 Role catalog

| Role                   | Idempotent ops                                                                                                                                                                                           | Day-1                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `common`               | sysctl (`net.ipv4.ip_forward`, `net.bridge.bridge-nf-call-iptables`, `fs.inotify.max_user_*`), kernel modules (`br_netfilter`, `overlay`), ulimits, sshd hardening, `fail2ban`, `auditd`, NTP via chrony | yes                                                |
| `container_runtime`    | containerd `1.7.x` with `SystemdCgroup=true`, or cri-o per `container_manager`                                                                                                                           | yes                                                |
| `kubeadm_install`      | apt repo pin, `kubeadm/kubelet/kubectl` at `kube_version`, `kubeadm init` with config from group_vars                                                                                                    | yes                                                |
| `kubernetes_join`      | join workers + extra CPs with token from CP0 fact                                                                                                                                                        | yes                                                |
| `cni_install`          | applies manifests for selected `kube_network_plugin`; reuses Calico VXLAN cross-zone fix from ovh repo                                                                                                   | yes (Calico only Day-1; Cilium/Flannel scaffolded) |
| `longhorn_prep`        | mkfs.ext4 on extra disk, mount at `/var/lib/longhorn`, fstab UUID entry, label node, tune `vm.dirty_*`                                                                                                   | yes                                                |
| `wireguard_mesh`       | key generation, peer discovery from inventory, `wg0` interface, persistent keepalive, sysctl forward                                                                                                     | yes                                                |
| `observability_agents` | node-exporter (DaemonSet path preferred; host install only when cluster bringup not yet done), promtail, otel-collector                                                                                  | yes                                                |
| `arc_enroll`           | `azcmagent connect` with SP creds from secretspec                                                                                                                                                        | scaffolded; off by default                         |
| `uems_enroll`          | EC agent install via tenant-issued token                                                                                                                                                                 | scaffolded; off by default                         |

### 9.10 Playbooks

| Playbook      | Phases                                                                                                                                                                                                 | Notes                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `cluster.yml` | `common` → `container_runtime` → `kubeadm_install` (CP0 init) → `kubernetes_join` (CP1..N) → `cni_install` → `kubernetes_join` (workers) → `longhorn_prep` → `wireguard_mesh` → `observability_agents` | full bringup from bare VMs        |
| `scale.yml`   | `common` → `container_runtime` → `kubernetes_join` (new hosts only) → `longhorn_prep` (workers) → `wireguard_mesh` (delta peers)                                                                       | targets `--limit new_nodes`       |
| `reset.yml`   | `kubeadm reset` → remove `/etc/kubernetes`, `/var/lib/etcd`, `/var/lib/longhorn` (gated by `confirm_reset=yes`)                                                                                        | destructive, two-step confirm     |
| `upgrade.yml` | rolling CP one-by-one, then worker pools; honours `max_unavailable` per pool                                                                                                                           | uses `kubeadm upgrade plan/apply` |
| `backup.yml`  | `etcd snapshot save` to artifact dir + optional R2/Blob push, Longhorn `BackupTarget` reconcile trigger                                                                                                | cron-friendly                     |

### 9.11 Verb wiring (Section 1)

```yaml
# Taskfile bootstrap namespace
bootstrap:init: # terraform init for selected env+profile
bootstrap:plan: # terraform plan
bootstrap:apply: # terraform apply, then regenerate ansible inventory
bootstrap:inventory: # regenerate hosts.yml from TF outputs
bootstrap:cluster: # ansible-playbook cluster.yml
bootstrap:scale: # ansible-playbook scale.yml --limit new_nodes
bootstrap:reset: # ansible-playbook reset.yml -e confirm_reset=yes
bootstrap:upgrade: # ansible-playbook upgrade.yml -e kube_version=...
bootstrap:backup: # ansible-playbook backup.yml
bootstrap:destroy: # terraform destroy, gated
```

All verbs read `ENV` and `PROFILE` env vars (set by the launcher from `profiles/<id>/`). No positional args, no implicit cwd.

### 9.12 Module sub-feature matrix

| Module        | VPS/VM | Private net        | Firewall | LB          | Managed K8s   | Managed DB    | Object storage          |
| ------------- | ------ | ------------------ | -------- | ----------- | ------------- | ------------- | ----------------------- |
| contabo       | stub   | stub               | stub     | n/a         | n/a           | n/a           | stub                    |
| hetzner-cloud | yes    | yes                | yes      | yes         | yes (managed) | n/a           | n/a (use R2/S3)         |
| hetzner-robot | yes    | yes (vSwitch)      | host fw  | n/a         | n/a           | n/a           | n/a                     |
| ovh           | yes    | yes (vRack)        | yes      | yes         | yes (MKS)     | yes           | yes (Object Storage S3) |
| azure         | yes    | yes (VNet)         | NSG      | LB/AppGW    | AKS           | Postgres Flex | Blob                    |
| aws           | yes    | yes (VPC)          | SG       | NLB/ALB     | EKS           | RDS           | S3                      |
| gcp           | yes    | yes (VPC)          | FW rules | TCP/HTTP LB | GKE           | CloudSQL      | GCS                     |
| cloudflare    | n/a    | n/a                | n/a      | n/a         | n/a           | n/a           | R2 + DNS + Workers      |
| proxmox       | yes    | yes (Linux bridge) | host fw  | n/a         | n/a           | n/a           | n/a                     |

### 9.13 Borrowed forensic patterns from ovh

| ovh artifact                      | How it lands here                                                    |
| --------------------------------- | -------------------------------------------------------------------- |
| WireGuard 10.50.0.0/24 mesh       | `wireguard_mesh` role default CIDR                                   |
| Calico VXLAN cross-zone fix       | baked into `cni_install` defaults for multi-DC profiles              |
| Longhorn SC zone audit            | preflight check in `longhorn_prep` warns on asymmetric per-node disk |
| Arc enrollment workflow           | `arc_enroll` role, off by default                                    |
| Region naming (`ap-south-1` etc.) | `region_label` group_var, used in node names + CR tags               |

### 9.14 Day-1 scope

| Item                                   | Day-1                                                                                                                          | Follow-up                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Hetzner Cloud module                   | yes                                                                                                                            | —                                                                                |
| Contabo module                         | stub (provider 0.1.0 prerequisite)                                                                                             | wire real resources after sibling provider 0.1.0                                 |
| Cloudflare module (DNS + R2 + Workers) | yes                                                                                                                            | —                                                                                |
| OVH module                             | yes (matches ovh repo conventions)                                                                                             | —                                                                                |
| Azure / AWS / GCP modules              | scaffolded, nightly smoke only                                                                                                 | promote to supported per profile demand                                          |
| Hetzner Robot                          | `panta/hetzner` interim                                                                                                        | swap to sibling provider                                                         |
| Proxmox module                         | yes                                                                                                                            | —                                                                                |
| Playbooks `cluster.yml`, `scale.yml`   | yes                                                                                                                            | `upgrade.yml`, `reset.yml`, `backup.yml`                                         |
| Roles                                  | `common`, `container_runtime`, `kubeadm_install`, `kubernetes_join`, `cni_install` (Calico), `longhorn_prep`, `wireguard_mesh` | Cilium/Flannel CNI variants; `observability_agents`, `arc_enroll`, `uems_enroll` |
| State backends                         | local + `azurerm` + `s3` (R2-compatible)                                                                                       | `gcs`, `remote` (TF Cloud)                                                       |
| Inventory generator                    | yes                                                                                                                            | —                                                                                |
| Founders never touch                   | `hosts.yml`, `versions.tf`, `backend.tf` — all generated                                                                       | —                                                                                |

Cross-refs: secrets feeding Terraform/Ansible from secretspec → Section 4; profile materializer that writes `terraform.tfvars` + `group_vars/all.yml` → Section 11; Crossplane providers that consume TF-output kubeconfigs/cloud creds → Section 8; ApplicationSet that lights up Argo against the freshly bootstrapped cluster → Section 7.

## Section 10 — Secret backend + container registry defaults + profile-aware swap

Two cross-cutting concerns the founder never wants to think about, and the agent needs strict APIs for: where secrets live, and where images live. Both are profile-driven; switching profile rewrites both surfaces in one PR.

### 10.1 Secret backend matrix

| Backend   | In-cluster surface                               | Auth                                            | Profiles                                           | Day-1                 |
| --------- | ------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------- | --------------------- |
| `keyring` | none — apps read from env via secretspec at boot | OS keyring (gnome-keyring / Keychain / wincred) | p-solo, p-hobby                                    | yes                   |
| `akv`     | ESO `ClusterSecretStore` kind `azurekv`          | SP client-cred OR workload-identity (federated) | p-startup-small (default), p-startup-scale (Azure) | yes                   |
| `asm`     | ESO `ClusterSecretStore` kind `aws`              | IRSA (EKS) or static IAM (k3s)                  | p-startup-scale (AWS)                              | scaffolded, no CI     |
| `gsm`     | ESO `ClusterSecretStore` kind `gcpsm`            | Workload Identity (GKE)                         | p-startup-scale (GCP)                              | scaffolded, no CI     |
| `vault`   | ESO `ClusterSecretStore` kind `vault` (KV v2)    | Kubernetes auth method                          | p-enterprise                                       | manifests only, no CI |

Hard rule: `keyring` never reaches the cluster. p-solo and p-hobby apps render plain `env:` from secretspec at `task launch` time; ESO is not installed. This keeps the dev path zero-credential.

### 10.2 ESO topology

ESO 0.10+ runs once per cluster in `eso-system`. ClusterSecretStores are cluster-scoped; the app namespace only references them by name.

```yaml
# infra/helm/lib-chart/templates/clustersecretstore-akv.yaml (rendered per profile)
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: backend-default
spec:
  provider:
    azurekv:
      vaultUrl: { { .Values.secrets.akv.vaultUrl } }
      authType: WorkloadIdentity
      serviceAccountRef:
        name: eso-akv
        namespace: eso-system
  refreshInterval: { { .Values.secrets.refreshInterval | default "1h" } }
```

Every backend ships a sibling template; the profile materializer picks exactly one and deletes the others before rendering. Name is always `backend-default` so app charts never branch on backend.

### 10.3 XSecretBinding (XRD) — app-facing API

Defined in Section 8. The app-author writes:

```yaml
apiVersion: platform.x.io/v1alpha1
kind: XSecretBinding
metadata: { name: api-secrets, namespace: app-api }
spec:
  refs:
    - localKey: DATABASE_URL
      remoteKey: app-api/database-url
    - localKey: STRIPE_KEY
      remoteKey: app-api/stripe-key
  rotation: 24h
```

Composition fans out to one `ExternalSecret` per backend with `secretStoreRef: backend-default`. The author never names AKV/ASM/GSM/Vault. Switching profile re-binds without app-side edits.

### 10.4 Rotation policy

| Layer                | Mechanism                                                                        | Source of truth                      |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------ |
| App declares cadence | `META.yaml: secrets.rotation: 24h`                                               | per-app                              |
| ESO pulls remote     | `ClusterSecretStore.spec.refreshInterval`                                        | profile (default `1h`)               |
| Pod observes change  | ESO writes `Secret` → Reloader restart annotation                                | lib-chart default                    |
| CI validates         | Nightly `task secrets:test-rotation` rotates a probe key and asserts pod restart | repo `.github/workflows/nightly.yml` |

Rotation cadence shorter than ESO refresh interval is rejected by `task profile:lint`. No silent drift.

### 10.5 Container registry matrix

| Registry | Profile default                  | Push auth                      | Pull auth                                    | Day-1              |
| -------- | -------------------------------- | ------------------------------ | -------------------------------------------- | ------------------ |
| GHCR     | p-solo, p-hobby, p-startup-small | OIDC from GitHub Actions       | dockerconfigjson via ESO                     | yes — push working |
| ACR      | p-startup-scale (Azure)          | OIDC federated (no admin user) | AKS managed identity OR ESO dockerconfigjson | scaffolded         |
| ECR      | p-startup-scale (AWS)            | OIDC → AssumeRole              | IRSA on node SA OR ESO dockerconfigjson      | scaffolded         |
| GAR      | p-startup-scale (GCP)            | OIDC → Workload Identity       | GKE node SA OR ESO dockerconfigjson          | scaffolded         |
| Harbor   | p-enterprise (self-host)         | robot account via ESO          | ESO dockerconfigjson                         | scaffolded         |

Default tag scheme is `ghcr.io/<org>/<svc>:<git-sha>` with `@sha256:` digest pin propagated into the ApplicationSet matrix output (see Section 5.6).

### 10.6 imagePullSecrets wiring

Two-tier, both rendered by lib-chart:

| Tier           | Resource                                                                           | When used                              |
| -------------- | ---------------------------------------------------------------------------------- | -------------------------------------- |
| Namespace      | `Secret/regcred` materialized by ESO from backend-default key `registry/<profile>` | every pod in that namespace by default |
| ServiceAccount | `serviceAccount.imagePullSecrets[].name=regcred`                                   | apps that override the default SA      |

No app chart hardcodes the registry hostname. Lib-chart consumes `.Values.image.registry` (`ghcr.io` default), `.Values.image.repository` (`<org>/<svc>`), `.Values.image.digest` (preferred over `tag`). Profile values files override `registry` only.

### 10.7 Mirror strategy (optional, profile-flag)

| Mode          | Mechanism                                                 | Use case                                               |
| ------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Off (default) | direct pulls from upstream registry                       | every profile by default                               |
| Spegel        | DaemonSet, P2P among nodes via SerfNet                    | p-startup-small / p-startup-scale, bandwidth-sensitive |
| Distribution  | self-hosted `registry:2` behind ingress + ESO-backed auth | p-enterprise, air-gapped clusters                      |

Toggled via `profile.registry.mirror: { none | spegel | distribution }`. Spegel ships as an optional Helm dep behind a flag; Distribution ships as a manifest in `profiles/p-enterprise/` only.

### 10.8 Profile materializer behavior

`task profile:set <id>` rewrites four touchpoints in one PR:

| File                                       | Change                                |
| ------------------------------------------ | ------------------------------------- |
| `infra/helm/lib-chart/values.yaml`         | `secrets.backend`, `image.registry`   |
| `infra/crossplane/clustersecretstore.yaml` | exactly one backend rendered          |
| `argocd/appset/*.yaml`                     | matrix `image.registry` column        |
| `secretspec.toml`                          | backend block (keyring vs AKV vs ...) |

`task profile:diff <id>` runs the same rewrite in a temp tree and prints a unified diff against `HEAD`. Output is structured (JSON) when invoked by the MCP server (`profile_diff` tool), human-readable otherwise. No `kubectl` mutation — the founder commits, ArgoCD reconciles.

### 10.9 Failure modes + plain-English errors

| Symptom                                                   | Surfaced by                               | Auto-fix hint                                                               |
| --------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| ClusterSecretStore `NotReady` after profile swap          | `task launch` post-check polls ESO status | `task secrets:reauth` re-runs SP login / WI binding                         |
| ExternalSecret `SecretSyncedError` for missing remote key | `task launch`, MCP `app_status`           | print remote key path + backend, suggest `task secrets:push <key>`          |
| `ImagePullBackOff` after registry swap                    | `task launch` waits for Deployment ready  | check `regcred` Secret exists in ns; if not, `task registry:bind <profile>` |
| Rotation cadence < ESO refresh                            | `task profile:lint`                       | print both numbers, suggest raising refreshInterval or relaxing cadence     |
| Mirror flag flipped on but Spegel CRD missing             | `task profile:lint`                       | `task profile:apply` re-renders the optional dep                            |

Every error references the exact file path that owns the fix. No "see the docs."

### 10.10 Day-1 vs deferred

| Item                                                          | This PR                  | Deferred                                          |
| ------------------------------------------------------------- | ------------------------ | ------------------------------------------------- |
| ESO 0.10 installed + AKV ClusterSecretStore                   | yes                      | —                                                 |
| keyring fallback wired end-to-end (no ESO for p-solo/p-hobby) | yes                      | —                                                 |
| XSecretBinding XRD + composition                              | yes (Section 8)          | —                                                 |
| GHCR push from CI (OIDC)                                      | yes                      | —                                                 |
| ACR/ECR/GAR ClusterSecretStore templates rendered             | yes                      | —                                                 |
| ACR/ECR/GAR exercised in CI                                   | scaffolded, manual smoke | nightly matrix                                    |
| Vault HA manifests under `profiles/p-enterprise/`             | yes, docs + helm values  | not exercised in CI                               |
| Spegel optional dep + flag                                    | yes                      | enabling it as default for p-startup-\*           |
| Distribution self-hosted mirror                               | manifest only            | full air-gap walkthrough                          |
| Nightly rotation probe job                                    | yes (single AKV key)     | full matrix across backends                       |
| `task profile:diff` JSON output for MCP                       | yes                      | richer schema with cost-delta column (Section 12) |

Cross-refs: XRD shape in Section 8; ApplicationSet matrix consumption in Section 5; MCP `profile_diff` / `app_status` tool surface in Section 13; cost band per backend rolls up into Section 12.

## Section 11 — Launcher CLI + MCP server (Layer 0a + Layer 0b — the dual-surface product)

The product surface. Two front doors over the same internal API: a wizard for humans, an MCP server for agents. Everything else in this spec (Layers 1–7) is plumbing these two surfaces drive.

### 11.1 Surface map

| Surface      | Entry point                                        | Audience                                     | Transport            | State                             |
| ------------ | -------------------------------------------------- | -------------------------------------------- | -------------------- | --------------------------------- |
| Launcher CLI | `npx create-platform@latest`                       | Founder / vibe-coder (new repo)              | TTY prompts          | Writes new monorepo               |
| Launcher CLI | `task init`                                        | Same, inside an existing checkout            | TTY prompts          | Writes in place                   |
| Launcher CLI | `task add:app`, `task add:env`, `task claim:infra` | Founder, post-init                           | TTY prompts          | Mutates existing tree             |
| MCP server   | `npx @ts-monorepo-template/mcp-server`             | Agents (Aegis, Claude Code, Codex, Cursor)   | stdio (JSON-RPC)     | Read + propose, never auto-mutate |
| MCP server   | `ghcr.io/ts-monorepo-template/mcp-server:<tag>`    | Agent orchestration (k8s sidecar, Aegis pod) | stdio over container | Same                              |

Single source of truth: both surfaces import `internal/cli/src/core/` — the wizard is a TTY shell over the same functions the MCP server exposes as tools. No drift possible by construction.

### 11.2 Repo layout

```
internal/
  cli/
    package.json                # bin: create-platform, ts-monorepo
    src/
      bin/create-platform.ts    # npx entry — bootstraps new repo
      bin/task-init.ts          # task init entry — runs in existing checkout
      core/                     # shared with MCP server
        profiles.ts             # list/describe/recommend
        materialize.ts          # copy template + value-swap
        apps.ts                 # add-app, list-apps, describe-app
        xrds.ts                 # list/describe XRDs, scaffold claims
        cost.ts                 # deterministic cost simulator
        tradeoff.ts             # diff two profiles or two states
        validate.ts             # cross-layer dry-run validator
        propose.ts              # structured patch + ADR draft
        adr.ts                  # ADR emit
        audit.ts                # decisions.jsonl chain writer
      recommender/
        rubric.yaml             # auditable scoring matrix
        score.ts                # pure function: answers → ranked profiles
        score.test.ts
      wizard/
        prompts.ts              # @clack/prompts flow
        questions.ts            # the 10 recommender questions
  mcp-server/
    package.json                # bin: ts-monorepo-mcp
    src/
      server.ts                 # MCP stdio server
      tools/                    # one file per tool, each re-exports schema + handler
        list_profiles.ts
        describe_profile.ts
        recommend_profile.ts
        list_apps.ts
        describe_app.ts
        add_app.ts
        list_xrds.ts
        describe_xrd.ts
        claim_infra.ts
        simulate_cost.ts
        explain_tradeoff.ts
        validate_plan.ts
        propose_change.ts
        nx_cloud_*.ts           # see Section 3
      schemas/                  # JSON Schema for every tool I/O
    Dockerfile
  templates/
    adr.md.template
    monorepo-skeleton/          # the thing materialize.ts copies
data/
  cloud-prices/
    hetzner.yaml
    contabo.yaml
    ovh.yaml
    aws.yaml
    azure.yaml
    gcp.yaml
    cloudflare.yaml
    ghcr.yaml
docs/
  adrs/                         # 0001-..., 0002-..., emitted by launcher
  agents/aegis.md               # MCP integration guide
.audit/
  decisions.jsonl               # sha256-chained audit log
```

### 11.3 Launcher CLI — wizard flow

Seven stages. Each stage emits an ADR + an audit entry. User can `--profile p-startup-small --yes` to skip prompts (CI / scripted use).

| #   | Stage               | Output                                                   |
| --- | ------------------- | -------------------------------------------------------- |
| 1   | Project identity    | name, slug (kebab), git remote (optional)                |
| 2   | Profile recommender | 10 questions → ranked profile + reasoning                |
| 3   | Cloud selection     | conditional on profile; multi-cloud for p-startup-scale+ |
| 4   | Secret backend      | founder labels mapped to ESO ClusterSecretStore          |
| 5   | Domain + TLS        | apex domain + Cloudflare zone (default) or "skip"        |
| 6   | Reference apps      | go / python / rust / all / none                          |
| 7   | Materialize         | write tree, push to remote, print next-3-commands        |

Tooling: `@clack/prompts` (modern TTY UX, narrow API, no boxen-style noise). Same library used in `task add:*` flows post-init.

### 11.4 Profile recommender — auditable scoring

Ten questions, deterministic rubric. The rubric is data, not code — sits in `internal/cli/src/recommender/rubric.yaml`. `score.ts` is a pure function over `(answers, rubric) → ranked[]`. Fully unit-testable; the matrix change shows up in PR review.

| Question ID         | Prompt                                            | Type                      | Weight on profile fit |
| ------------------- | ------------------------------------------------- | ------------------------- | --------------------- |
| team_size           | How many engineers ship code?                     | enum 1 / 2-5 / 6-20 / 20+ | high                  |
| env_count           | How many envs (dev/stg/prod/...)?                 | int                       | high                  |
| target_budget_usd   | Monthly infra budget ceiling                      | int                       | high                  |
| compliance_floor    | None / SOC2 / HIPAA / FedRAMP                     | enum                      | high                  |
| workload_shape      | Stateless web / batch / streaming / mixed         | enum                      | medium                |
| ha_level            | Best-effort / single-AZ / multi-AZ / multi-region | enum                      | high                  |
| observability_depth | Logs only / +metrics / +traces / +eBPF            | enum                      | medium                |
| secret_backend      | Keyring / cloud KMS / Vault / "pick for me"       | enum                      | medium                |
| registry            | GHCR / cloud-native / Harbor / "pick for me"      | enum                      | low                   |
| cdn_edge            | None / Cloudflare / Cloud-native edge             | enum                      | low                   |

Scoring output:

```json
{
  "ranked": [
    {
      "profile": "p-startup-small",
      "score": 0.87,
      "reasons": [
        "budget $80 fits $30-150 band",
        "3 envs aligns with 3-node k3s",
        "secret_backend=keyring → Vault-on-cluster fits Hetzner"
      ]
    },
    {
      "profile": "p-hobby",
      "score": 0.41,
      "reasons": ["budget fits", "team_size=4 outgrows single VPS"]
    },
    { "profile": "p-startup-scale", "score": 0.22, "reasons": ["budget $80 below $300 floor"] }
  ],
  "recommended": "p-startup-small",
  "rubric_version": "1.0.0",
  "rubric_sha256": "..."
}
```

`rubric_sha256` is recorded in the ADR so a future audit can prove which version of the rubric produced the recommendation.

### 11.5 Materialization

`materialize.ts` is the only function that writes the monorepo. Idempotent (re-runs detect existing files, refuse to overwrite without `--force`).

| Step                        | Source                                             | Target                                       | Substitutions               |
| --------------------------- | -------------------------------------------------- | -------------------------------------------- | --------------------------- |
| Copy skeleton               | `internal/templates/monorepo-skeleton/`            | `<cwd>/<slug>/`                              | `{{slug}}`, `{{org}}`       |
| Profile values → Nx         | `profiles/<id>/nx/preset.json`                     | `nx.json` (merge)                            | namedInputs, targetDefaults |
| Profile values → Helm       | `profiles/<id>/helm-values/`                       | `infra/helm/apps/*/values.{env}.yaml`        | per-env overlays            |
| Profile values → Crossplane | `profiles/<id>/crossplane/composition-pins.yaml`   | `infra/crossplane/compositions/`             | revision pins               |
| Profile values → Terraform  | `profiles/<id>/terraform.tfvars`                   | `infra/terraform/<cloud>/terraform.tfvars`   | node counts, regions        |
| Profile values → Ansible    | `profiles/<id>/ansible/group_vars.yml`             | `infra/ansible/group_vars/all.yml`           | kubelet args, swap          |
| secretspec                  | `profiles/<id>/secretspec.toml`                    | `<root>/secretspec.toml`                     | provider, scope             |
| Reference apps              | `internal/templates/apps/{go,python,rust}/`        | `apps/<name>/`                               | go.mod path, pyproject name |
| ADRs                        | `internal/templates/adr.md.template` × N decisions | `docs/adrs/NNNN-<slug>.md`                   | rendered                    |
| Audit log                   | —                                                  | `.audit/decisions.jsonl`                     | one line per stage          |
| Git                         | —                                                  | `git init && git remote add origin <remote>` | optional push               |

Final output: a "what's next" panel with exactly three commands, profile-aware:

```text
Your platform is ready at ./acme-platform/

Next 3 commands:
  cd acme-platform
  task launch       # provisions + deploys per profile p-startup-small
  task open         # opens grafana + argocd + repo in browser

Docs: ./README.md
ADRs: ./docs/adrs/
```

### 11.6 ADR auto-emission

One ADR per major decision: profile choice, cloud choice, secret backend, registry, domain/TLS strategy, reference-app selection. Template at `internal/templates/adr.md.template`:

```markdown
# ADR {{number}} — {{title}}

- Status: accepted
- Date: {{date}}
- Decision-maker: launcher-cli@{{cli_version}}
- Rubric: {{rubric_version}} (sha256:{{rubric_sha256}})

## Context

{{context}}

## Decision

{{decision}}

## Alternatives considered

{{#alternatives}}

- {{name}} — score {{score}} — {{why_not}}
  {{/alternatives}}

## Consequences

{{consequences}}

## Audit

- decisions.jsonl entry: line {{line_no}}, sha256:{{entry_sha256}}
```

### 11.7 Decision audit log

`.audit/decisions.jsonl` — append-only, sha256-chained. Same pattern as the `evidence-cataloger` chain in the ovh repo (CLAUDE.md reference: storage-incident-response). One JSON object per line:

```json
{
  "ts": "2026-06-02T14:22:11Z",
  "seq": 4,
  "question": "secret_backend",
  "answer": "keyring",
  "answer_label": "OS keyring (Just Me / Side Project)",
  "reasoning": "profile=p-startup-small but team_size=1 → keyring acceptable; can swap later via task migrate:secrets",
  "alternatives": [
    { "id": "vault-on-cluster", "rejected_because": "ops cost > value for team_size=1" },
    { "id": "akv", "rejected_because": "no Azure subscription declared" }
  ],
  "rubric_version": "1.0.0",
  "cli_version": "0.1.0",
  "prev_sha256": "f3a1...",
  "entry_sha256": "9b22..."
}
```

`prev_sha256` of entry N = `entry_sha256` of entry N-1. Genesis entry uses `"prev_sha256": "0".repeat(64)`. `task audit:verify` walks the chain; any tamper breaks verification.

### 11.8 MCP server — tool catalog

Stdio JSON-RPC, MCP spec compliant. Every tool ships a JSON Schema (Draft 2020-12) for both input and output. Schemas live at `internal/mcp-server/src/schemas/` and are re-exported from `@ts-monorepo-template/mcp-server/schemas` for agent-side type generation.

| Tool              | Purpose                                          | Day-1 status                                       |
| ----------------- | ------------------------------------------------ | -------------------------------------------------- |
| list_profiles     | Enumerate the 5 profiles + cost bands            | impl                                               |
| describe_profile  | Full profile detail incl. layer-by-layer choices | impl                                               |
| recommend_profile | Run rubric against caller-supplied answers       | impl                                               |
| list_apps         | Current apps in the repo (reads `apps/`)         | impl                                               |
| describe_app      | Per-app metadata: lang, chart, env matrix, deps  | impl                                               |
| add_app           | Scaffold new app (calls `core/apps.ts`)          | stub (returns `not_yet_implemented`, schema final) |
| list_xrds         | XRDs available from Layer 6                      | impl                                               |
| describe_xrd      | XRD schema + example claim                       | impl                                               |
| claim_infra       | Scaffold an XR claim under the right env         | stub                                               |
| simulate_cost     | Per-layer $/mo from `data/cloud-prices/`         | impl (deterministic)                               |
| explain_tradeoff  | Diff between two profiles or two states          | impl (deterministic)                               |
| validate_plan     | Dry-run validate across all 7 layers             | stub                                               |
| propose_change    | Structured patch + ADR draft + audit entry       | stub                                               |
| nx*cloud*\*       | See Section 3 (run summary, cache stats, etc.)   | impl (read-only)                                   |

Stub responses are well-typed, not errors:

```json
{
  "status": "not_yet_implemented",
  "tracking_issue": "https://github.com/ts-monorepo-template/platform/issues/N",
  "expected_milestone": "v0.2",
  "schema_stable": true
}
```

Stable schemas now means agent code written against v0.1 keeps compiling against v0.2.

### 11.9 Tool schema shape (example: `recommend_profile`)

```ts
// internal/mcp-server/src/schemas/recommend_profile.ts
export const inputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  required: ['answers'],
  properties: {
    answers: {
      type: 'object',
      required: ['team_size', 'env_count', 'target_budget_usd', 'compliance_floor'],
      properties: {
        team_size: { enum: ['1', '2-5', '6-20', '20+'] },
        env_count: { type: 'integer', minimum: 1, maximum: 10 },
        target_budget_usd: { type: 'integer', minimum: 0 },
        compliance_floor: { enum: ['none', 'soc2', 'hipaa', 'fedramp'] },
        workload_shape: { enum: ['stateless-web', 'batch', 'streaming', 'mixed'] },
        ha_level: { enum: ['best-effort', 'single-az', 'multi-az', 'multi-region'] },
        observability_depth: { enum: ['logs', 'logs+metrics', 'logs+metrics+traces', '+ebpf'] },
        secret_backend: { enum: ['keyring', 'cloud-kms', 'vault', 'auto'] },
        registry: { enum: ['ghcr', 'cloud-native', 'harbor', 'auto'] },
        cdn_edge: { enum: ['none', 'cloudflare', 'cloud-native'] },
      },
    },
  },
} as const

export const outputSchema = {
  type: 'object',
  required: ['ranked', 'recommended', 'rubric_version', 'rubric_sha256'],
  properties: {
    ranked: {
      type: 'array',
      items: {
        type: 'object',
        required: ['profile', 'score', 'reasons'],
        properties: {
          profile: {
            enum: ['p-solo', 'p-hobby', 'p-startup-small', 'p-startup-scale', 'p-enterprise'],
          },
          score: { type: 'number', minimum: 0, maximum: 1 },
          reasons: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    recommended: { type: 'string' },
    rubric_version: { type: 'string' },
    rubric_sha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
  },
} as const
```

### 11.10 Cost simulator data model

`data/cloud-prices/<provider>.yaml` is the only source of cost. Files are hand-maintained for Day-1, refreshed by a scheduled CI job (Renovate-style, see Section 14).

```yaml
# data/cloud-prices/hetzner.yaml
provider: hetzner
currency: EUR
last_updated: 2026-05-28
source: https://www.hetzner.com/cloud
skus:
  - id: cx22
    vcpu: 2
    ram_gb: 4
    disk_gb: 40
    price_monthly: 4.59
    egress_tb_included: 20
  - id: cx32
    vcpu: 4
    ram_gb: 8
    disk_gb: 80
    price_monthly: 7.59
    egress_tb_included: 20
storage:
  - id: volume-ssd
    unit: gb-month
    price: 0.0476
```

`simulate_cost` reads the profile's resource shape, fans out across SKUs, returns:

```json
{
  "profile": "p-startup-small",
  "monthly_total_usd": 73,
  "by_layer": {
    "compute": 24,
    "storage": 12,
    "egress": 8,
    "registry": 0,
    "secrets": 0,
    "observability_saas": 29
  },
  "by_provider": { "hetzner": 44, "grafana-cloud": 29 },
  "assumptions": ["3x cx32", "100GB longhorn replicated", "1TB egress", "GHCR free tier"],
  "prices_as_of": "2026-05-28"
}
```

### 11.11 Aegis integration

`docs/agents/aegis.md` documents the contract. Discovery happens via standard MCP — Aegis lists tools, picks `recommend_profile` / `simulate_cost` / `propose_change` for planning, calls `validate_plan` before any mutating call. Mutations always pass through `propose_change`, which emits a patch + ADR draft + audit entry; Aegis does not write the tree directly. The launcher CLI applies the patch after human approval (or after Aegis's own policy gate if running headless).

```text
Aegis ──stdio──> mcp-server ──reads──> profiles/, data/cloud-prices/, infra/
                            ──proposes──> .proposed/<id>/patch.diff
                                          .proposed/<id>/adr-draft.md
                                          .proposed/<id>/audit-entry.json
task accept:proposal -- <id>   # human or Aegis applies
```

### 11.12 Day-1 vs deferred

| Capability                                                                             | Day-1 (this PR)                         | Deferred                                             |
| -------------------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| `create-platform` wizard for p-solo, p-hobby                                           | ships, end-to-end                       | —                                                    |
| Wizard for p-startup-small, p-startup-scale, p-enterprise                              | materializes + compiles                 | nightly CI validation gated to Section 14            |
| Profile recommender + rubric                                                           | ships                                   | rubric v1.1 with compliance fan-out                  |
| ADR + audit-log chain                                                                  | ships                                   | `task audit:verify` shell helper                     |
| MCP server stdio                                                                       | ships                                   | streamable-HTTP transport                            |
| MCP tools — read-only set                                                              | impl                                    | —                                                    |
| MCP tools — mutating set (`add_app`, `claim_infra`, `validate_plan`, `propose_change`) | stubs with stable schemas               | impl in v0.2                                         |
| Cost simulator                                                                         | deterministic from `data/cloud-prices/` | weekly Renovate-style price refresh job (Section 14) |
| MCP Docker image                                                                       | published to GHCR                       | —                                                    |
| Aegis integration doc                                                                  | ships                                   | reference Aegis policy bundle                        |

### 11.13 Coupled sections

| Need                                                         | See                  |
| ------------------------------------------------------------ | -------------------- |
| Verb surface that the wizard prints in "next 3 commands"     | Section 4 (Taskfile) |
| Profile schema and the 5 directories under `profiles/`       | Section 5            |
| Nx Cloud tool schemas (`nx_cloud_*`)                         | Section 3            |
| Helm values overlays that materialization writes             | Section 7            |
| Crossplane XRDs that `list_xrds` / `describe_xrd` introspect | Section 8            |
| Terraform / Ansible variables that materialization writes    | Section 9            |
| Nightly CI that validates the three larger profiles          | Section 14           |

## Section 12 — Day-1 reference apps (Go + Python + Rust hello-world end-to-end)

Three minimal services prove the polyglot pipeline end-to-end. Same contract, same endpoints, same telemetry shape, three languages. If all three pass `task smoke` on `p-solo`, the platform is wired correctly.

### 12.1 Why three apps

| Reason                   | What it proves                                                            |
| ------------------------ | ------------------------------------------------------------------------- | --- | ----------------------------------- |
| Polyglot Nx works        | Go + Python + Rust build/test/lint via community plugins (Section 3)      |
| Contract is real         | All three import generated bindings from `packages/contracts/`            |
| Lib-chart is generic     | Same Helm values shape produces same K8s posture across languages         |
| Crossplane claims work   | Each app provisions its own PG + Redis + Kafka topic via XRDs (Section 8) |
| Observability is uniform | Comparable Prometheus metrics + OTel traces + JSON logs across stacks     |
| MCP/agent demo           | Aegis can `platform.app.add(lang=go                                       | py  | rs)` and the result looks identical |

If a fourth language is added later (Node/TS, Java), it follows the same shape.

### 12.2 Shared contract — `packages/contracts/`

Single source of truth. `buf` (v1.40+) generates per-language bindings into language-native locations Nx targets pick up.

```protobuf
// packages/contracts/proto/user/v1/user.proto
syntax = "proto3";
package user.v1;

message User {
  string id = 1;
  string email = 2;
  string display_name = 3;
  google.protobuf.Timestamp created_at = 4;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
}
```

`buf.gen.yaml` output targets:

| Language | Plugin                                                       | Output                               |
| -------- | ------------------------------------------------------------ | ------------------------------------ |
| Go       | `buf.build/protocolbuffers/go` + `buf.build/grpc/go`         | `packages/contracts/gen/go/user/v1/` |
| Python   | `buf.build/protocolbuffers/python` + `buf.build/grpc/python` | `packages/contracts/gen/py/user/v1/` |
| Rust     | `buf.build/community/neoeinstein-prost` + `tonic`            | `packages/contracts/gen/rs/user_v1/` |

`task contracts` runs `buf lint && buf breaking --against '.git#branch=main' && buf generate`. Nx wires it as a dependency of each app's `build` target so codegen is automatic.

### 12.3 Endpoint contract (identical across all three)

| Path             | Method | Purpose                                                 |
| ---------------- | ------ | ------------------------------------------------------- |
| `/healthz`       | GET    | Liveness — returns 200 + `{status:"ok"}`                |
| `/readyz`        | GET    | Readiness — checks PG + Redis + Kafka — returns 200/503 |
| `/metrics`       | GET    | Prometheus exposition (port 9090)                       |
| `/v1/users`      | GET    | List users (paginated)                                  |
| `/v1/users`      | POST   | Create user — publishes `user.created` to Kafka         |
| `/v1/users/{id}` | GET    | Read-through Redis cache → PG fallback                  |

gRPC equivalents on port 9000 mirror REST (via `UserService` from contract).

### 12.4 App 1 — `apps/go-hello/`

| Concern     | Choice                                                                            |
| ----------- | --------------------------------------------------------------------------------- |
| Go version  | 1.24                                                                              |
| HTTP router | `chi` v5                                                                          |
| OTel        | `go.opentelemetry.io/contrib/instrumentation/{net/http,database/sql,redis,kafka}` |
| Logging     | `zerolog` → JSON to stdout                                                        |
| Config      | `kelseyhightower/envconfig` + `secretspec` resolution at startup                  |
| Postgres    | `pgx` v5 (no ORM — hand-rolled SQL + `sqlc` is opt-in)                            |
| Redis       | `redis/go-redis` v9                                                               |
| Kafka       | `segmentio/kafka-go`                                                              |
| Tests       | `testing` + `testcontainers-go` for PG/Redis/Kafka                                |
| Container   | Multi-stage `golang:1.24-alpine` → `gcr.io/distroless/static-debian12:nonroot`    |
| Nx project  | `apps/go-hello/project.json` with `@nx-go/nx-go`                                  |

Layout:

```
apps/go-hello/
  cmd/server/main.go
  internal/{handlers,store,events,telemetry,config}/
  internal/store/user.go            # pgx CRUD on User
  internal/events/kafka.go          # producer/consumer
  Dockerfile
  project.json                       # nx targets: build, test, lint, container
  values.yaml                        # lib-chart base
  values.dev.yaml | values.staging.yaml | values.prod.yaml
  META.yaml
  AGENTS.md
  README.md
```

### 12.5 App 2 — `apps/py-hello/`

| Concern       | Choice                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| Python        | 3.13                                                                                |
| Web framework | FastAPI + uvicorn                                                                   |
| OTel          | `opentelemetry-instrument` auto-instruments fastapi + sqlalchemy + redis + aiokafka |
| Logging       | `structlog` → JSON to stdout                                                        |
| Config        | `pydantic-settings` + `secretspec` provider                                         |
| Postgres      | `asyncpg` + `SQLAlchemy 2` async                                                    |
| Redis         | `redis-py` async                                                                    |
| Kafka         | `aiokafka`                                                                          |
| Tests         | `pytest-asyncio` + `testcontainers-python`                                          |
| Deps          | `uv` (lockfile + venv); pinned in `pyproject.toml`                                  |
| Container     | Multi-stage `python:3.13-slim` → distroless `python3`                               |
| Nx project    | `apps/py-hello/project.json` with `@nxlv/python`                                    |

Layout:

```
apps/py-hello/
  src/py_hello/{app,handlers,store,events,telemetry,config}.py
  pyproject.toml                    # uv-managed
  uv.lock
  Dockerfile
  project.json
  values.yaml | values.{env}.yaml
  META.yaml | AGENTS.md | README.md
```

### 12.6 App 3 — `apps/rs-hello/`

| Concern       | Choice                                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Rust          | 1.83 stable                                                                |
| Web framework | `axum` 0.7 + `tower-http`                                                  |
| OTel          | `tracing-opentelemetry` + `opentelemetry-otlp` (gRPC)                      |
| Logging       | `tracing` + `tracing-subscriber` JSON formatter                            |
| Config        | `figment` (env + toml + secretspec layer)                                  |
| Postgres      | `sqlx` 0.8 with compile-time query checking                                |
| Redis         | `redis` crate (tokio runtime)                                              |
| Kafka         | `rdkafka` (librdkafka FFI)                                                 |
| Tests         | `cargo test` + `testcontainers-rs`                                         |
| Container     | Multi-stage `rust:1.83-slim` (cargo-chef cache) → distroless `cc-debian12` |
| Nx project    | `apps/rs-hello/project.json` with `@monodon/rust`                          |

Layout:

```
apps/rs-hello/
  src/{main.rs,handlers.rs,store.rs,events.rs,telemetry.rs,config.rs}
  Cargo.toml
  Dockerfile
  project.json
  values.yaml | values.{env}.yaml
  META.yaml | AGENTS.md | README.md
```

### 12.7 Identical telemetry contract

All three apps emit comparable signals. The smoke test (12.10) asserts this.

| Signal             | Shape                                                                                                                                                           | Source                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Prometheus metrics | `http_requests_total{method,route,status}`, `http_request_duration_seconds_bucket{...}`, `pg_pool_in_use`, `kafka_messages_produced_total{topic}`               | OTel Prometheus exporter on `:9090/metrics`             |
| OTel traces        | OTLP/gRPC to collector at `otel-collector.observability:4317`; resource attrs `service.name=<app>`, `service.version=<git-sha>`, `deployment.environment=<env>` | Auto-instrumentation + manual spans on `POST /v1/users` |
| JSON logs          | One event per line: `{ts, level, msg, trace_id, span_id, service.name, ...attrs}`                                                                               | stdout — captured by node-level log shipper             |

Field names are normalized — `trace_id` and `span_id` are surfaced identically in all three log formats so Loki/Tempo correlation works.

### 12.8 Lib-chart values + Crossplane claims

Each app ships one Crossplane claim per backing service per environment. Claims reference XRDs from Section 8.

```
infra/crossplane/claims/dev/
  go-hello-pg.yaml      # XPostgresCluster claim — size: small
  go-hello-redis.yaml   # XRedisCluster claim    — size: small
  go-hello-topic.yaml   # XKafkaTopic claim      — topic: user.created
  py-hello-pg.yaml | py-hello-redis.yaml | py-hello-topic.yaml
  rs-hello-pg.yaml | rs-hello-redis.yaml | rs-hello-topic.yaml
```

`values.yaml` (per app) wires the lib-chart (Section 5):

```yaml
# apps/go-hello/values.yaml
appName: go-hello
image:
  repository: ghcr.io/<org>/go-hello
  tag: '' # set by Argo via image-updater or commit-sha
service:
  http: { port: 8080 }
  grpc: { port: 9000 }
  metrics: { port: 9090 }
observability:
  otel: { enabled: true, endpoint: otel-collector.observability:4317 }
  prometheus: { scrape: true }
secrets:
  esoStore: cluster-secret-store # profile-driven
  items:
    - { name: pg-dsn, key: go-hello/pg-dsn }
    - { name: redis-url, key: go-hello/redis-url }
    - { name: kafka-brokers, key: kafka/brokers }
networkPolicy:
  egressAllow: [postgres, redis, kafka, otel-collector]
```

Per-env values override only what differs (replicas, HPA bounds, resource requests, image tag pinning).

### 12.9 Nx targets per app

| Target             | Go                               | Python                        | Rust                          |
| ------------------ | -------------------------------- | ----------------------------- | ----------------------------- |
| `build`            | `go build ./cmd/server`          | `uv build`                    | `cargo build --release`       |
| `test`             | `go test ./...`                  | `pytest`                      | `cargo test`                  |
| `test:integration` | testcontainers PG/Redis/Kafka    | testcontainers PG/Redis/Kafka | testcontainers PG/Redis/Kafka |
| `lint`             | `golangci-lint run`              | `ruff check && mypy`          | `cargo clippy -- -D warnings` |
| `container`        | BuildKit (Section 4)             | BuildKit                      | BuildKit                      |
| `chart:lint`       | `helm lint` against lib-chart    | same                          | same                          |
| `chart:render`     | `helm template` to local out dir | same                          | same                          |

All targets `dependsOn: ["contracts:generate"]` so `buf generate` runs first.

### 12.10 Cross-language smoke test — `tests/smoke/cross-lang.test.ts`

Single TS test (Vitest) that runs against a live `p-solo` k3d cluster after `task launch`. Asserts behavioral parity.

```ts
// tests/smoke/cross-lang.test.ts
import { describe, it, expect } from 'vitest'
import { createUserClient } from '@org/contracts/gen/ts/user/v1' // ts gen for tests only

const endpoints = [
  { name: 'go-hello', url: 'http://go-hello.dev.svc.cluster.local:9000' },
  { name: 'py-hello', url: 'http://py-hello.dev.svc.cluster.local:9000' },
  { name: 'rs-hello', url: 'http://rs-hello.dev.svc.cluster.local:9000' },
]

describe('cross-lang parity', () => {
  for (const ep of endpoints) {
    it(`${ep.name} create + read round-trip`, async () => {
      const client = createUserClient(ep.url)
      const created = await client.createUser({ email: 'a@b.c', displayName: 'Test' })
      expect(created.id).toMatch(/^[0-9a-f-]{36}$/)
      const fetched = await client.getUser({ id: created.id })
      expect(fetched).toEqual(created)
    })

    it(`${ep.name} emits JSON logs with trace_id`, async () => {
      const logs = await fetchPodLogs(ep.name)
      const parsed = logs
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
      expect(parsed.every((l) => 'trace_id' in l && 'service.name' in l)).toBe(true)
    })

    it(`${ep.name} exposes comparable Prometheus metrics`, async () => {
      const metrics = await fetch(`${ep.url.replace(':9000', ':9090')}/metrics`).then((r) =>
        r.text(),
      )
      expect(metrics).toMatch(/^http_requests_total\b/m)
      expect(metrics).toMatch(/^http_request_duration_seconds_bucket\b/m)
    })
  }
})
```

A second smoke (`tests/smoke/tempo-correlation.test.ts`) queries Tempo for a trace ID surfaced in the JSON log and confirms a span with `service.name=<app>` exists. Day-1 validates Loki/Tempo correlation works for all three.

### 12.11 Per-app META.yaml (machine-readable)

```yaml
# apps/go-hello/META.yaml
schema: 'platform.app/v1'
id: go-hello
language: go
languageVersion: '1.24'
framework: chi
endpoints:
  http: 8080
  grpc: 9000
  metrics: 9090
dependencies:
  postgres: { xrd: XPostgresCluster, size: small }
  redis: { xrd: XRedisCluster, size: small }
  kafka: { xrd: XKafkaTopic, topics: [user.created] }
contracts:
  - packages/contracts/proto/user/v1/user.proto
profiles:
  p-solo: { replicas: 1, hpa: false }
  p-hobby: { replicas: 1, hpa: false }
  p-startup-small: { replicas: 2, hpa: { min: 2, max: 5 } }
```

Aegis / MCP reads this to answer `platform.app.describe(id="go-hello")` without parsing source.

### 12.12 Per-profile validation matrix

| Profile           | Where validated                               | What runs                                     |
| ----------------- | --------------------------------------------- | --------------------------------------------- |
| `p-solo`          | Day-1 PR — `task launch && task smoke` on k3d | All 3 apps + cross-lang.test.ts must be green |
| `p-hobby`         | Nightly CI — ephemeral single-VPS k3s         | All 3 apps + cross-lang + tempo-correlation   |
| `p-startup-small` | Nightly CI — ephemeral 3x Hetzner + Longhorn  | Same + Longhorn PVC restart survives pod kill |
| `p-startup-scale` | Nightly CI — ephemeral managed K8s            | Same + multi-AZ pod anti-affinity assert      |
| `p-enterprise`    | Nightly CI (gated, costly)                    | Same + Vault HA path + mesh mTLS assert       |

Nightly failures open an Issue against the affected profile; Day-1 only blocks on `p-solo`.

### 12.13 Day-1 vs deferred

| Item                                                         | Day-1 (this PR)               | Deferred                            |
| ------------------------------------------------------------ | ----------------------------- | ----------------------------------- |
| 3 apps build + test locally via Nx                           | yes                           | —                                   |
| Multi-stage Dockerfiles + BuildKit (Section 4)               | yes                           | —                                   |
| Lib-chart values + per-env overrides                         | yes                           | —                                   |
| Crossplane claims per app per env                            | yes                           | —                                   |
| `task launch` deploys all 3 to k3d (`p-solo`)                | yes                           | —                                   |
| Cross-lang smoke + Tempo correlation smoke green on `p-solo` | yes                           | —                                   |
| `p-hobby` / `p-startup-small` nightly CI                     | yes (scheduled workflow)      | —                                   |
| `p-startup-scale` / `p-enterprise` nightly CI                | scaffolded, opt-in flag       | full enablement (cost-gated)        |
| 4th language (Node/TS app)                                   | —                             | follow-up — same shape              |
| App-level SLO + alert rules                                  | basic rate/error/latency only | richer SLOs in Section 11 follow-up |
| Load-test harness (k6/vegeta) per app                        | —                             | follow-up                           |
| Chaos suite (litmus/chaos-mesh) per app                      | —                             | follow-up                           |

These three apps are the conformance suite for the platform. Any change to lib-chart (Section 5), Crossplane XRDs (Section 8), or observability defaults (Section 11) must keep all three smoke tests green or the change is rejected.

## Section 13 — PR shape & sequencing (commits, gates, branching for this single big PR)

One PR. ~200+ files. 16 commits. Each commit is independently green on CI; no fixup squashes, no merge commits, conflict-rebase only.

### 13.1 Branching policy

| Item                            | Value                                                                  |
| ------------------------------- | ---------------------------------------------------------------------- |
| Source branch                   | `feat/platform-foundation`                                             |
| Target                          | `main`                                                                 |
| Merge mode                      | Rebase-and-merge (linear history required)                             |
| Merge commits                   | Forbidden                                                              |
| Force-push to branch            | Allowed (author only, never after review starts)                       |
| Squash on merge                 | Forbidden — preserve all 16 commits                                    |
| Protected branch rule on `main` | Linear history + required signed commits + 4 review checks (see §13.4) |

Rebase workflow when `main` advances:

```bash
git fetch origin
git rebase origin/main
# resolve, re-run gates per commit:
task ci:per-commit
git push --force-with-lease
```

### 13.2 Commit graph

Every row is one commit. `Gate` lists the CI checks that MUST be green at that commit's SHA. Later commits inherit all earlier gates (a check, once required, never regresses).

| #   | Commit subject                                                              | Scope (top-level paths)                                                                                                  | New gate added at this commit                                                                                                   |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| C1  | docs: specs + adrs + platform overview                                      | `docs/architecture/`, `docs/agents/`, `docs/founder/`, `docs/adrs/`                                                      | `markdownlint`, `vale`, `link-check`                                                                                            |
| C2  | feat(cli): launcher scaffolding + verb surface + devenv                     | `internal/cli/`, `Taskfile.yml`, `.envrc`, `devenv.nix`, `devenv.lock`, `secretspec.toml`                                | `go vet`, `go test`, `task --list` smoke, `devenv test`                                                                         |
| C3  | feat(contracts): buf schemas + codegen + bindings                           | `packages/contracts/`, `buf.yaml`, `buf.gen.yaml`, generated `gen/{go,ts,py,rs}/`                                        | `buf lint`, `buf breaking`, `buf generate --dry-run`                                                                            |
| C4  | feat(apps): go-hello + py-hello + rs-hello + tests                          | `apps/go-hello/`, `apps/py-hello/`, `apps/rs-hello/`, per-app `project.json`                                             | `nx affected -t lint,test,build`, polyglot type-check (`tsc`, `mypy`, `cargo check`, `go build`)                                |
| C5  | feat(build): dockerfile templates + per-app dockerfile + container workflow | `internal/templates/dockerfiles/`, `apps/*/Dockerfile`, `.github/workflows/container-build.yml`                          | `hadolint`, BuildKit smoke build (no push), `cosign verify-blob` dry-run                                                        |
| C6  | feat(helm): library chart + per-app charts                                  | `infra/helm/lib-chart/`, `infra/helm/apps/{go,py,rs}-hello/`                                                             | `helm lint`, `helm template`, `kubeval`, `kube-linter`, `polaris audit`                                                         |
| C7  | feat(argocd): root + appprojects + applicationsets + kargo                  | `infra/argocd/root/`, `infra/argocd/projects/`, `infra/argocd/appsets/`, `infra/argocd/kargo/`                           | `argocd app-validation` (offline render), `kargo lint`                                                                          |
| C8  | feat(crossplane): providers + functions + xrds + compositions               | `infra/crossplane/providers/`, `infra/crossplane/functions/`, `infra/crossplane/xrds/`, `infra/crossplane/compositions/` | `crossplane beta validate`, `up xpkg build --dry-run`, `kcl vet` for KCL functions                                              |
| C9  | feat(crossplane): per-env claims (dev, staging, prod)                       | `infra/crossplane/claims/{dev,staging,prod}/`                                                                            | claim render via `crossplane beta render` against C8 compositions                                                               |
| C10 | feat(terraform): modules + envs (7 cloud modules)                           | `infra/terraform/modules/{contabo,hetzner,ovh,azure,aws,gcp,cloudflare}/`, `infra/terraform/envs/`                       | `terraform fmt -check`, `terraform validate`, `tflint`, `tfsec`, `terraform plan -lock=false` against mock backends             |
| C11 | feat(ansible): roles + playbooks + inventory templates                      | `infra/ansible/roles/`, `infra/ansible/playbooks/`, `infra/ansible/inventories/`                                         | `ansible-lint`, `yamllint`, `ansible-playbook --syntax-check`, molecule converge (docker driver) for one role                   |
| C12 | feat(mcp): server with deferred-tool stubs                                  | `internal/mcp-server/`, `internal/mcp-server/tools/`                                                                     | MCP schema validation, contract tests against `packages/contracts/`, deferred-stub conformance test                             |
| C13 | feat(profiles): 5 curated profiles                                          | `profiles/{p-solo,p-hobby,p-startup-small,p-startup-scale,p-enterprise}/`                                                | profile-schema validation, cross-ref check (claims ↔ helm-values ↔ tfvars ↔ secretspec), `task launch --profile=<id> --dry-run` |
| C14 | ci: nightly profile bringup matrix + e2e per profile                        | `.github/workflows/nightly-bringup.yml`, `.github/workflows/e2e-profile.yml`                                             | `actionlint`, `zizmor`, workflow dry-render via `act -n`                                                                        |
| C15 | feat(recommender): cost simulator + cloud price data                        | `internal/recommender/`, `internal/cost-simulator/`, `data/cloud-prices/`                                                | price-data schema validation, recommender unit tests, snapshot diff against committed fixtures                                  |
| C16 | docs(site): marketing site refresh + agent + founder guides                 | `docs/founder/`, `docs/agents/`, `apps/marketing-site/` (Astro)                                                          | `astro check`, `astro build`, broken-link, lighthouse-ci budget                                                                 |

### 13.3 Per-commit gate matrix

Gates are cumulative. A green commit at `Cn` runs every gate listed at `C1..Cn`.

| Gate                                            | First required at | Job name in `.github/workflows/pr.yml` |
| ----------------------------------------------- | ----------------- | -------------------------------------- |
| markdownlint + vale + link-check                | C1                | `docs-lint`                            |
| go vet + go test + devenv test                  | C2                | `cli-test`                             |
| buf lint + buf breaking                         | C3                | `contracts`                            |
| `nx affected -t lint,test,build`                | C4                | `nx-affected`                          |
| polyglot type-check (tsc + mypy + cargo check)  | C4                | `polyglot-typecheck`                   |
| hadolint + BuildKit smoke build                 | C5                | `container-smoke`                      |
| helm lint + kubeval + kube-linter + polaris     | C6                | `helm-validate`                        |
| argocd app-validation + kargo lint              | C7                | `argo-validate`                        |
| crossplane beta validate + render               | C8                | `xp-validate`                          |
| crossplane claim render per env                 | C9                | `xp-claims`                            |
| terraform fmt/validate/tflint/tfsec + plan      | C10               | `tf-validate`                          |
| ansible-lint + molecule converge                | C11               | `ansible-validate`                     |
| mcp schema + contract tests                     | C12               | `mcp-validate`                         |
| profile schema + cross-ref + `launch --dry-run` | C13               | `profile-validate`                     |
| actionlint + zizmor + `act -n`                  | C14               | `workflow-validate`                    |
| recommender tests + price-data schema           | C15               | `recommender`                          |
| astro check + lighthouse-ci                     | C16               | `site-build`                           |

All gates run on every PR push via matrix-fanout against `git log --reverse origin/main..HEAD`. A red intermediate commit fails the PR even if `HEAD` is green.

`task ci:per-commit` locally walks the same matrix:

```bash
task ci:per-commit
# iterates: for each sha in $(git log --format=%H --reverse origin/main..HEAD); do
#   git checkout $sha && task ci:gates-for-commit
# done
```

### 13.4 Required reviews (block merge)

| Label                   | Owner team (CODEOWNERS) | What they sign off on                                                                                       |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `needs-spec-review`     | `@platform/spec`        | Sections 1–3 alignment, ADRs, XRD contracts, profile shape                                                  |
| `needs-arch-review`     | `@platform/arch`        | Helm lib-chart shape, Argo ApplicationSet matrix, Crossplane composition graph, Nx target graph             |
| `needs-security-review` | `@platform/security`    | cosign keyless OIDC, secretspec + ESO wiring, NetworkPolicy defaults, RBAC, SBOM, `tfsec`/`zizmor` findings |
| `needs-cost-review`     | `@platform/cost`        | Profile cost bands, recommender outputs, Nx Cloud token model, cloud-price data freshness                   |

Branch-protection rule on `main`: all four labels must resolve to "approved" before merge button enables. Reviews dismiss on force-push.

### 13.5 CODEOWNERS additions

Appended to `.github/CODEOWNERS` in C1 (so every later commit lands under an owner from the start):

```
/docs/architecture/        @platform/arch @platform/spec
/docs/agents/              @platform/spec
/docs/founder/             @platform/dx
/docs/adrs/                @platform/arch
/internal/cli/             @platform/dx
/internal/mcp-server/      @platform/agents
/internal/recommender/     @platform/cost
/internal/cost-simulator/  @platform/cost
/internal/templates/       @platform/build
/packages/contracts/       @platform/spec
/apps/go-hello/            @platform/dx
/apps/py-hello/            @platform/dx
/apps/rs-hello/            @platform/dx
/apps/marketing-site/      @platform/dx
/infra/helm/               @platform/arch
/infra/argocd/             @platform/arch
/infra/crossplane/         @platform/arch @platform/security
/infra/terraform/          @platform/infra @platform/security
/infra/ansible/            @platform/infra
/profiles/                 @platform/spec @platform/cost
/data/cloud-prices/        @platform/cost
/.github/workflows/        @platform/build @platform/security
```

### 13.6 PR description template

The PR body is checked by a `pr-body-lint` job (regex match on required H2 headings). Template lives at `.github/pull_request_template.md` and is populated by `task pr:open`:

```markdown
## Summary

One-paragraph statement of intent. Link to Section 1 of the design spec.

## What changed

Bulleted enumeration grouped by commit (C1..C16). Each bullet names the top-level path and the Section number it implements.

## Why now

Justification anchored to the layered architecture (Sections 1–3). Call out which alternatives were rejected and link the ADR.

## Test plan

- [ ] Per-commit gates green on CI (see §13.3 matrix)
- [ ] `task launch --profile=p-solo --dry-run` clean
- [ ] `task launch --profile=p-hobby --dry-run` clean
- [ ] `crossplane beta render` clean for all three envs
- [ ] `terraform plan` clean for all 7 cloud modules
- [ ] MCP server `tools/list` returns the documented surface
- [ ] Marketing site builds and lighthouse-ci budget passes

## Migration

Greenfield. No live data. No existing user impact. Profile defaults are p-solo (local k3d) — no cloud spend on `task launch` without explicit profile flag.

## Follow-ups

List deferred items (linked to issues): see §13.9.
```

### 13.7 Labels

| Label                      | Purpose              | Auto-applied by                                   |
| -------------------------- | -------------------- | ------------------------------------------------- |
| `needs-spec-review`        | Required-review gate | `pr-label` workflow on open                       |
| `needs-arch-review`        | Required-review gate | same                                              |
| `needs-security-review`    | Required-review gate | same                                              |
| `needs-cost-review`        | Required-review gate | same                                              |
| `size/xxl`                 | Informational        | PR-size action                                    |
| `area/platform-foundation` | Routing              | path-based labeler                                |
| `breaking-change: no`      | Truth marker         | author-asserted, verified by `buf breaking` on C3 |

### 13.8 What ships Day-1 in this PR

| Item                                                                 | Ships in this PR? |
| -------------------------------------------------------------------- | ----------------- |
| 16-commit graph, each green on PR CI                                 | Yes               |
| 5 profiles, all selectable via `task launch --profile=`              | Yes               |
| 3 hello apps (go/py/rs) building, testing, packaging into images     | Yes               |
| Helm library chart + 3 app charts                                    | Yes               |
| ApplicationSet + Kargo Pipelines for dev → staging → prod            | Yes               |
| All 4 XRD bundles defined and rendering                              | Yes               |
| 7 Terraform cloud modules with green plan against mock backends      | Yes               |
| Ansible roles with one molecule-converge'd role                      | Yes               |
| MCP server with deferred-tool stubs (schema-complete, behavior-stub) | Yes               |
| Cost recommender with seeded price data                              | Yes               |
| Marketing site refresh                                               | Yes               |
| Nightly profile bringup workflow committed (disabled by default)     | Yes               |
| 4 required-review labels enforced on merge                           | Yes               |

### 13.9 Deferred (linked issues filed in C1)

| Deferred item                                                                     | Reason                                                                                                    |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Real cloud bringup in nightly matrix                                              | Needs billing accounts wired; ships as scheduled workflow but `workflow_dispatch`-only until secrets land |
| MCP deferred-tool implementations (cost-simulate-live, claim-apply)               | Stubs ship in C12; live wiring after profile bringup is proven                                            |
| `terraform-provider-contabo` GA + `terraform-provider-hetzner-robot` upstream PRs | Sibling OSS repos; tracked in their own milestones                                                        |
| PowerPack opt-in flow                                                             | Free-tier default works; PowerPack switch lands as a follow-up PR                                         |
| Vault HA composition for `p-enterprise`                                           | XRD shape ships; composition impl follows in a focused PR                                                 |

### 13.10 Local commit-ladder verification

Before pushing, the author runs:

```bash
task ci:per-commit                    # walks C1..C16, asserts each gate set
task pr:body-lint                     # checks .github/pull_request_template.md compliance
task pr:codeowners-check              # asserts every new file matches a CODEOWNERS rule
git log --format='%H %s' origin/main..HEAD | wc -l   # must equal 16
git log --merges origin/main..HEAD                   # must be empty
```

A non-16-commit count or any merge commit fails `task pr:open` and blocks PR creation.

### 13.11 Rebase discipline during review

| Situation                                               | Action                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `main` advances, no conflicts                           | Rebase, force-push-with-lease, re-run `task ci:per-commit`                                        |
| `main` advances, conflicts in 1–2 commits               | Rebase, fix in-place at the offending commit (not at HEAD), re-run gates from that commit forward |
| Review feedback on commit Cn                            | Amend Cn via `git rebase -i origin/main` with `edit` marker; never add a "fix Cn" commit at HEAD  |
| Reviewer requests new scope outside the 16-commit graph | Reject; file follow-up issue; do not grow the PR                                                  |

The 16-commit graph is a contract. Adding C17 requires re-opening the spec review.

## Section 14 — End-to-end test plan + nightly CI matrix (per-profile bringup validation)

A profile is "real" only when a nightly job provisions it from zero, deploys the three reference apps, runs the smoke pack, and tears down — with all artifacts uploaded. No green nightly = profile not shipped.

### 14.1 Test matrix overview

| Profile         | Nightly                         | Provisioner                   | Cluster                         | Tear-down                  | Day-1 gate                     |
| --------------- | ------------------------------- | ----------------------------- | ------------------------------- | -------------------------- | ------------------------------ |
| p-solo          | every night                     | k3d 5.x                       | local in runner                 | always                     | ships green                    |
| p-hobby         | every night                     | Terraform Hetzner             | k3s on 1 VPS                    | always (ephemeral project) | ships green                    |
| p-startup-small | every night (week 1: weekly)    | Terraform Hetzner + Ansible   | k3s 3-node + Longhorn + wg-mesh | always                     | green within 1 week post-merge |
| p-startup-scale | weekly + on Crossplane change   | Terraform AKS or EKS          | managed K8s, 3 AZ               | always                     | green within 1 month           |
| p-enterprise    | manual `workflow_dispatch` only | Terraform 2-region + Vault HA | federated K8s + mesh            | manual                     | gated, no auto-run             |

Each row is a separate job in `.github/workflows/nightly.yml` with `strategy.matrix.profile`. Failures isolate per profile; a Hetzner outage cannot block p-solo from going green.

### 14.2 nightly.yml shape

```yaml
# .github/workflows/nightly.yml
name: nightly
on:
  schedule: [{ cron: "0 2 * * *" }]
  workflow_dispatch:
    inputs:
      profiles:
        description: comma-separated profile IDs (default: all auto)
        required: false
jobs:
  bringup:
    strategy:
      fail-fast: false
      matrix:
        include:
          - profile: p-solo
            runner: ubuntu-24.04
            schedule: nightly
          - profile: p-hobby
            runner: ubuntu-24.04
            schedule: nightly
          - profile: p-startup-small
            runner: ubuntu-24.04
            schedule: nightly
          - profile: p-startup-scale
            runner: ubuntu-24.04
            schedule: weekly
          - profile: p-enterprise
            runner: ubuntu-24.04
            schedule: manual
    runs-on: ${{ matrix.runner }}
    timeout-minutes: 90
    steps:
      - uses: actions/checkout@v4
      - uses: cachix/install-nix-action@v27
      - uses: cachix/cachix-action@v15
        with: { name: devenv }
      - run: nix profile install nixpkgs#devenv
      - run: devenv shell -- task profile:select PROFILE=${{ matrix.profile }}
      - run: devenv shell -- task profile:validate
      - run: devenv shell -- task ci:bringup PROFILE=${{ matrix.profile }}
      - run: devenv shell -- task ci:smoke PROFILE=${{ matrix.profile }}
      - run: devenv shell -- task ci:observability:assert PROFILE=${{ matrix.profile }}
      - run: devenv shell -- task ci:cost:simulate PROFILE=${{ matrix.profile }}
      - if: always()
        run: devenv shell -- task ci:evidence:collect PROFILE=${{ matrix.profile }}
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: evidence-${{ matrix.profile }}-${{ github.run_id }}
          path: .ci/evidence/${{ matrix.profile }}/
      - if: always()
        run: devenv shell -- task ci:teardown PROFILE=${{ matrix.profile }}
```

`schedule: weekly|manual` rows are skipped on cron runs by a guard step (omitted for brevity); `workflow_dispatch.inputs.profiles` overrides the guard.

### 14.3 Per-profile bringup sequences

| Profile         | bringup steps (in order)                                                                                                                                                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| p-solo          | `k3d cluster create` → install Crossplane + ESO + ArgoCD via Helm → `kubectl apply -k bootstrap/p-solo` → wait apps Ready                                                                                                                           |
| p-hobby         | `terraform -chdir=bootstrap/terraform/hetzner apply -var profile=p-hobby` (1 VPS, ephemeral project) → `ansible-playbook ansible/single-node.yml` → `helm install` core → wait apps Ready                                                           |
| p-startup-small | `terraform … apply -var profile=p-startup-small` (3 VPS + private network) → `ansible-playbook ansible/cluster.yml` (k3s + Calico + Longhorn + wg-mesh) → bootstrap ArgoCD → render ApplicationSet for envs={dev,staging,prod} → wait Ready per env |
| p-startup-scale | `terraform … apply` (AKS or EKS, 3-AZ node pools) → install Linkerd → bootstrap ArgoCD + ESO (AKV or ASM) → render ApplicationSet → wait Ready per env                                                                                              |
| p-enterprise    | manual only: 2-region cluster + Vault HA + cosign admission policy + Linkerd multi-cluster gateway; smoke runs with `--enforce-cosign`                                                                                                              |

Ephemeral cloud accounts: `HETZNER_TOKEN_CI`, `AZURE_TENANT_ID_CI`, `AWS_ROLE_ARN_CI` are scoped to throwaway projects/subscriptions with hard spend caps. Teardown is always attempted via `if: always()`.

### 14.4 Smoke test pack (runs on every profile, every env)

| ID   | Check                                           | Pass criterion                                                                       |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| S-01 | HTTP `/healthz` on go-hello, py-hello, rs-hello | 200 within 60s of Ready                                                              |
| S-02 | Prometheus scrape of `/metrics`                 | `up{job=~"go-hello\|py-hello\|rs-hello"} == 1` for ≥2 consecutive scrapes            |
| S-03 | Expected counter advances                       | `http_requests_total{service=~".+-hello"}` delta > 0 over 30s                        |
| S-04 | OTel trace go→py→rs                             | single trace in Tempo with 3 spans, parent-child correct, `service.name` set per hop |
| S-05 | XPostgresCluster claim                          | `status.conditions[type=Ready].status == True` within bringup budget                 |
| S-06 | XKafkaTopic claim                               | Ready + producer-consumer roundtrip succeeds                                         |
| S-07 | XBucket claim                                   | Ready + write+read of a 1MB blob succeeds                                            |
| S-08 | Image Updater (dev env)                         | push new image tag, Updater commits new SHA to env values within 5 min               |
| S-09 | Kargo Promotion staging→prod                    | promotion blocks until AnalysisRun PASS; on PASS, prod manifest updates              |
| S-10 | ESO sync                                        | a probe `ExternalSecret` materializes the test secret into the cluster               |
| S-11 | cosign verify (p-enterprise only)               | unsigned image is rejected at admission; signed image admitted                       |

Each smoke step writes JSON to `.ci/evidence/<profile>/smoke/<id>.json` with `pass: bool`, `evidence: [...]`. Smoke pack is implemented as one Nx target per check so failures localize.

### 14.5 Observability parity assertions

`task ci:observability:assert` cross-checks the three reference apps emit identical telemetry shape. This is the load-bearing test for Layer 5 — if one app drifts, the lib-chart contract is broken.

| Dimension    | Required set                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Metric names | `http_request_duration_seconds`, `http_requests_total`, `db_query_duration_seconds`, `cache_hit_ratio`, `kafka_message_lag`        |
| Log fields   | `timestamp`, `level`, `msg`, `trace_id`, `span_id`, `service.name`, `http.method`, `http.status_code`                              |
| Trace shape  | exactly 3-tier hierarchy: edge (go-hello) → mid (py-hello) → leaf (rs-hello); span attrs include `service.name` and `peer.service` |

Implementation: PromQL queries the metric set per service; LogQL queries a sample log and JSON-decodes against a schema; TraceQL fetches a recent trace and walks the tree. All three are codified in `tools/ci/observability-assert/`.

### 14.6 Profile materialization validation

```bash
# tools/ci/profile-validate.sh
for p in p-solo p-hobby p-startup-small p-startup-scale p-enterprise; do
  task profile:select PROFILE=$p
  task profile:validate || { echo "FAIL: $p"; exit 1; }
done
```

`profile:validate` (defined in the Taskfile, see Section 2) re-runs JSON-Schema validation of every materialized file (`terraform.tfvars`, `helm-values/*.yaml`, `argocd/appset-overrides.yaml`, `nx/preset.json`) plus a Crossplane render dry-run against the pinned composition revision. Exit 0 = profile is internally consistent. This runs on every PR, not just nightly.

### 14.7 MCP server validation (Aegis test harness)

A scripted scenario in `tools/ci/mcp-harness/` exercises the agent surface end-to-end against a locally-spawned MCP server.

| Step | MCP call                                                       | Golden fixture                                                                                     |
| ---- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | `list_profiles`                                                | `fixtures/list_profiles.json` (5 profiles, IDs + cost bands)                                       |
| 2    | `recommend_profile({ team_size: 1, budget_usd_month: 10 })`    | `fixtures/recommend_hobby.json` (returns `p-hobby`)                                                |
| 3    | `simulate_cost({ profile: "p-startup-small", apps: 3 })`       | `fixtures/cost_startup_small.json` (±10% tolerance band)                                           |
| 4    | `propose_change({ profile: "p-hobby", request: "add redis" })` | `fixtures/propose_redis.json` (diff against `helm-values/` and `crossplane/composition-pins.yaml`) |

Diffs against fixtures use a structured comparator (not text diff) so numeric tolerance bands hold. Fixture drift requires intentional update with `task ci:mcp:fixtures:update` plus reviewer sign-off.

### 14.8 Chaos tests (opt-in)

Runs only when `CHAOS=1` is set on the workflow dispatch input, or on the weekly p-startup-scale schedule. Uses chaos-mesh (Layer 5 add-on) on the live bringup before teardown.

| Scenario          | Injection                        | Recovery SLO                                                    |
| ----------------- | -------------------------------- | --------------------------------------------------------------- |
| Node kill         | drain + terminate one VPS / node | apps Ready again within 5 min, no data loss in XPostgresCluster |
| Postgres pod kill | `kubectl delete pod` on primary  | new primary elected, writes resume within 60s                   |
| Network partition | iptables drop between two nodes  | apps degrade gracefully, recover within 2 min of healing        |
| Disk fill         | dd a large file on one node      | Longhorn evicts replica, no app crashloop                       |

Chaos failures do not fail the profile job by default — they emit a `chaos-report.json` artifact. Promotion of a chaos scenario to "must-pass" is a separate PR per scenario.

### 14.9 Cost simulator validation

`task ci:cost:simulate` invokes the cost simulator with the profile's actual rendered manifests and asserts the result lands inside the profile's documented `$/mo` band:

| Profile         | band      | tolerance   |
| --------------- | --------- | ----------- |
| p-solo          | $0        | exact       |
| p-hobby         | $5-20     | within band |
| p-startup-small | $30-150   | within band |
| p-startup-scale | $300-1500 | within band |
| p-enterprise    | $2k+      | floor only  |

Out-of-band fails the job — keeps the profile cost claim honest as defaults drift.

### 14.10 Evidence bundle

Every job, pass or fail, emits a sealed evidence bundle modeled on the `evidence-cataloger` pattern from the adjacent ovh repo (sha256 chain of custody — see Section 17).

```
.ci/evidence/<profile>/
  manifest.sha256
  catalog.md
  custody.log
  bringup/        # tf plan+state, ansible logs, helm install output
  smoke/          # S-01..S-11 JSON
  observability/  # PromQL/LogQL/TraceQL responses
  cost/           # simulator output + computed band check
  chaos/          # if CHAOS=1
  teardown/       # tf destroy logs
```

Bundles are uploaded as workflow artifacts and retained 30 days. A nightly summary job aggregates green/red across the matrix and posts to the project's status page.

### 14.11 Sibling OSS provider validation (out of scope here)

`terraform-provider-contabo` and `terraform-provider-hetzner-robot` carry their own `acceptance_tests` jobs gated on `TF_ACC=1` plus per-repo test-account credentials. The template repo's nightly does not run provider acceptance tests; it consumes pinned releases. See Section 9 for the provider-repo CI shape.

### 14.12 What ships in this PR vs deferred

| Item                                              | Day-1 (this PR)                      | Deferred                                                     |
| ------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------ |
| `nightly.yml` skeleton + matrix                   | yes                                  | —                                                            |
| p-solo bringup green                              | yes                                  | —                                                            |
| p-hobby bringup green (ephemeral Hetzner project) | yes                                  | —                                                            |
| Smoke pack S-01..S-10                             | yes                                  | S-11 (cosign admission) ships with p-enterprise              |
| Observability parity assertions                   | yes                                  | —                                                            |
| Profile materialization validation (PR + nightly) | yes                                  | —                                                            |
| MCP harness with 4 golden fixtures                | yes                                  | —                                                            |
| Cost simulator band check                         | yes                                  | —                                                            |
| Evidence bundle + sha256 manifest                 | yes                                  | —                                                            |
| p-startup-small green                             | scaffold only                        | full green within 1 week post-merge                          |
| p-startup-scale green                             | scaffold only (manual trigger works) | weekly nightly green within 1 month                          |
| p-enterprise gated workflow                       | gated stub                           | full bringup + cosign admission + multi-region — separate PR |
| Chaos scenarios                                   | scaffold + opt-in flag               | promotion to must-pass per scenario                          |
| Provider acceptance tests                         | —                                    | live in sibling repos                                        |

## Section 15 — Documentation surface (founder docs + agent META.yaml + ADR system + audit log)

Two audiences, four surfaces, one source of truth. Every directory ships `README.md` (human) + `META.yaml` (agent) + `AGENTS.md` (agent verbs). Every architectural choice emits an ADR. Every founder decision appends to a hash-chained audit log.

### 15.1 Surface map

| Surface        | Path                     | Audience                    | Format                      | Day-1     |
| -------------- | ------------------------ | --------------------------- | --------------------------- | --------- |
| Marketing site | `apps/marketing/`        | Founders                    | Next.js (Section 1)         | yes       |
| Public docs    | `apps/docs-public/`      | Engineers                   | Astro Starlight             | yes       |
| Agent metadata | `**/META.yaml`           | Agents (MCP)                | YAML (schema-validated)     | 30+ files |
| Verb playbooks | `**/AGENTS.md`           | Agents (Claude/Codex/Aegis) | Markdown                    | 6 levels  |
| ADR system     | `docs/adrs/NNNN-*.md`    | Both                        | Markdown + YAML frontmatter | 12+ ADRs  |
| Audit log      | `.audit/decisions.jsonl` | Both                        | JSONL + sha256 chain        | yes       |

### 15.2 Marketing site — `apps/marketing/`

Five required pages. No marketing fluff; each page answers one founder question.

| Route               | Question answered           | Source of truth                          |
| ------------------- | --------------------------- | ---------------------------------------- |
| `/`                 | What is this?               | Hand-written                             |
| `/pricing`          | Which profile do I pick?    | Generated from `profiles/*/META.yaml`    |
| `/quickstart`       | How do I get to deployed?   | Hand-written + verified by CI            |
| `/troubleshoot`     | Why did `task launch` fail? | `internal/errors/catalog.yaml`           |
| `/glossary`         | What does "XRD" mean?       | `internal/glossary/terms.yaml`           |
| `/how-to/<profile>` | How do I run this profile?  | Generated from `profiles/<id>/README.md` |
| `/architecture`     | What are the 7 layers?      | Hand-written + Mermaid                   |

Pricing page renders the canonical profile table:

```tsx
// apps/marketing/app/pricing/page.tsx
import { loadProfiles } from '@platform/profile-loader' // reads profiles/*/META.yaml
export default async function Pricing() {
  const profiles = await loadProfiles()
  return <ProfileComparisonTable profiles={profiles} />
}
```

Quickstart is CI-verified: a job runs `npx create-platform@latest --profile p-hobby --dry-run` and asserts the documented three commands match emitted output (see Section 1.7).

### 15.3 Troubleshooting catalog — `internal/errors/catalog.yaml`

Top 20 errors, plain-English fix. Same file feeds (a) marketing `/troubleshoot`, (b) launcher CLI error renderer (Section 1.4), (c) MCP `errors.lookup` tool (Section 0b).

```yaml
# internal/errors/catalog.yaml
- code: TOOL_MISSING_DEVENV
  founder: "devenv isn't installed. Run `curl -L https://install.devenv.sh | sh` then re-run `task launch`."
  engineer: 'devenv 1.x required for toolchain pinning (Section 2).'
  link: /troubleshoot/tool-missing-devenv

- code: AKV_SECRET_NOT_FOUND
  founder: "We couldn't find your database password in Azure Key Vault. Run `task secret:set db.password`."
  engineer: 'ESO ClusterSecretStore.spec.provider.azurekv.vaultUrl mismatch — check profile secretspec.toml.'
  link: /troubleshoot/akv-secret-not-found
```

### 15.4 Public docs site — `apps/docs-public/`

Astro Starlight 0.30+. Reference docs only; how-tos live on marketing site.

| Section       | Contents                                        | Generated?                            |
| ------------- | ----------------------------------------------- | ------------------------------------- |
| Layers        | One page per layer 0a–7                         | partial (from `META.yaml`)            |
| Verbs         | Every Taskfile target                           | yes (`task --list-all` + frontmatter) |
| XRDs          | One page per XRD bundle                         | yes (from `META.yaml` + JSON Schema)  |
| Apps          | One page per `infra/helm/apps/<svc>/`           | yes (from `Chart.yaml` + `META.yaml`) |
| Profiles      | One page per profile                            | yes (from `profiles/<id>/META.yaml`)  |
| Cloud modules | One page per `infra/terraform/modules/<cloud>/` | yes                                   |
| Ansible roles | One page per `infra/ansible/roles/<role>/`      | yes                                   |

Generation runs in CI via `task docs:gen`. Drift between code and docs fails the build.

### 15.5 Agent META.yaml — schema and cascade

Schema at `internal/schemas/meta-v1.schema.json`. Discriminated union on `kind`.

```yaml
# internal/schemas/meta-v1.schema.json (excerpt)
$schema: 'https://json-schema.org/draft/2020-12/schema'
$id: 'https://ts-monorepo-template.dev/schemas/meta-v1.json'
type: object
required: [apiVersion, kind, metadata, spec]
properties:
  apiVersion: { const: 'platform.dev/v1' }
  kind:
    enum:
      [App, Library, XRD, Composition, Profile, CloudModule, AnsibleRole, Workflow, Helm, AdrIndex]
  metadata:
    required: [name, owner]
    properties:
      name: { type: string, pattern: '^[a-z0-9-]+$' }
      owner: { type: string }
      tags: { type: array, items: { type: string } }
```

Cascade rule: agents reading directory `D` MUST resolve `META.yaml` by walking `D → parent → ... → repo root` and merging shallow, child-wins. Same rule as `AGENTS.md`.

### 15.6 META.yaml examples (Day-1 set)

App (mirrors Section 2):

```yaml
# apps/api/META.yaml
apiVersion: platform.dev/v1
kind: App
metadata:
  name: api
  owner: platform-team
  tags: [http, public]
spec:
  language: typescript
  framework: hono
  port: 3000
  build:
    nxTarget: api:build
    dockerfile: apps/api/Dockerfile
  runtime:
    helmChart: infra/helm/apps/api
    profiles: [p-solo, p-hobby, p-startup-small, p-startup-scale, p-enterprise]
  claims:
    - xrd: XPostgres
      name: api-pg
    - xrd: XCache
      name: api-redis
  observability:
    slo:
      availability: 99.5
      latencyP99Ms: 300
```

XRD:

```yaml
# infra/crossplane/xrds/xpostgres/META.yaml
apiVersion: platform.dev/v1
kind: XRD
metadata:
  name: XPostgres
  owner: platform-team
  tags: [database, stateful]
spec:
  group: data.platform.dev
  version: v1
  capabilities: [pitr, replication, metrics]
  dependencies: [eso, crossplane-provider-helm]
  costBand:
    p-solo: $0
    p-hobby: $0
    p-startup-small: $0
    p-startup-scale: $15
    p-enterprise: $200
  connectionSecret:
    keys: [host, port, user, password, database, sslmode]
  compositions:
    p-solo: cnpg-single
    p-hobby: cnpg-single
    p-startup-small: cnpg-ha
    p-startup-scale: rds-managed
    p-enterprise: rds-multi-az
```

Profile:

```yaml
# profiles/p-startup-small/META.yaml
apiVersion: platform.dev/v1
kind: Profile
metadata:
  name: p-startup-small
  owner: platform-team
  founderLabel: 'Early Startup'
  tags: [vps, k3s, longhorn]
spec:
  costBandUsdMo: [30, 150]
  bootstrap:
    cloud: hetzner
    nodeCount: 3
    kubernetes: k3s
    storage: longhorn
  secrets:
    backend: vault
  registry: ghcr
  argocd:
    appsetOverrides: profiles/p-startup-small/argocd/appset-overrides.yaml
  defaultClaims:
    postgres: cnpg-ha
    cache: redis-sentinel
    blob: minio
```

Day-1 META.yaml inventory (30+): 6 apps, 4 libraries, 4 XRD bundles × ~3 XRDs each, 5 profiles, 7 cloud modules, ~6 Ansible roles.

### 15.7 Validation — `task meta:validate`

```yaml
# Taskfile.yml (excerpt)
meta:validate:
  desc: Validate every META.yaml against meta-v1 schema
  cmds:
    - find . -name META.yaml -not -path "./node_modules/*" | xargs -I{} ajv validate -s internal/schemas/meta-v1.schema.json -d {}
```

CI gate: PR blocked on schema failure. MCP `meta.validate` tool wraps the same command.

### 15.8 AGENTS.md cascade (6 levels)

| Level    | File                   | Scope                                               |
| -------- | ---------------------- | --------------------------------------------------- |
| Root     | `AGENTS.md`            | Founder-safe verbs, project rules, never-do list    |
| Apps     | `apps/AGENTS.md`       | App-build conventions; per-app override below       |
| Per-app  | `apps/<svc>/AGENTS.md` | Architecture invariants, common tasks               |
| Packages | `packages/AGENTS.md`   | Library conventions; per-lib override below         |
| Internal | `internal/AGENTS.md`   | Schemas, error catalog, glossary editing rules      |
| Infra    | `infra/AGENTS.md`      | Helm/Crossplane/Terraform conventions               |
| Profiles | `profiles/AGENTS.md`   | Profile authoring rules; per-profile override below |

Child overrides parent; agents merge by walking up. Same rule as METADATA.

Per-app template (`apps/<svc>/AGENTS.md`):

```markdown
# AGENTS.md — <svc>

## What this app is

One sentence. <svc> serves <purpose> on port <p>.

## Build / test / lint

- Build: `task build:<svc>`
- Test: `task test:<svc>`
- Lint: `task lint:<svc>`

## Architecture invariants

- Never import from sibling apps; use `packages/<lib>` only.
- Database access via XPostgres claim only; no raw connection strings.
- All outbound HTTP through `packages/http-client` (instrumented).

## Common tasks

- Add endpoint: see "How to add a new endpoint" below.
- Claim new infra: see "How to claim infra" below.

## Out of scope

- Cross-service orchestration → use Workflow.
- Bulk data jobs → use Job kind, not API endpoint.

## How to claim infra

Edit `apps/<svc>/META.yaml` → `spec.claims[]`. Run `task xrd:render` to preview.

## How to add a new endpoint

1. Add route in `apps/<svc>/src/routes/`.
2. Add OpenAPI spec entry.
3. `task test:<svc>` to verify contract.
```

Per-XRD template (`infra/crossplane/xrds/<x>/AGENTS.md`):

```markdown
# AGENTS.md — <XRD>

## What this XRD owns

One sentence. <XRD> provisions <resource> with <invariants>.

## When to claim this vs an alternative

| Use this | Use alternative |
| <small/single-AZ case> | <multi-region/HA case → XOther> |

## Connection details published

- `host`, `port`, `user`, `password`, `database`, `sslmode`

## Sizing guidance per profile

| Profile | Composition | Notes |
| p-solo | cnpg-single | 1 replica, ephemeral |
| p-hobby | cnpg-single | 1 replica, PVC |
| p-startup-small | cnpg-ha | 3 replicas, Longhorn |
| p-startup-scale | rds-managed | managed, single-AZ |
| p-enterprise | rds-multi-az | managed, multi-AZ |
```

### 15.9 ADR system — `docs/adrs/NNNN-<topic>.md`

Auto-emitted by launcher (Section 0a) on every architectural fork. Manual ADRs follow the same shape.

```markdown
---
id: 0007
date: 2026-06-02
status: accepted # proposed | accepted | superseded | deprecated
context: |
  Founder selected p-hobby profile. Single VPS, no HA budget.
decision: |
  Use cnpg-single composition for XPostgres claims. Backups to S3-compatible
  object storage (Backblaze B2 by default at this cost band).
alternatives:
  - id: cnpg-ha
    rejected_because: 'Requires 3 nodes; out of cost band $5-20/mo.'
  - id: rds-managed
    rejected_because: 'Founder chose self-hosted; no managed-service cost.'
consequences:
  - 'PITR window limited to B2 retention (default 7d).'
  - 'Single-node failure = downtime until restore.'
supersedes: []
supersededBy: null
emitted_by: launcher
audit_decision_id: 7c4f1a...
---

# ADR-0007 — Use cnpg-single for XPostgres claims on p-hobby

(body — markdown freeform)
```

Day-1 inventory (12+ ADRs auto-emitted by launcher on default `p-hobby` run):

| ID   | Topic                                      |
| ---- | ------------------------------------------ |
| 0001 | Choose p-hobby profile                     |
| 0002 | Use Contabo as bootstrap cloud             |
| 0003 | k3s over full kubeadm                      |
| 0004 | Single-node cluster (no HA)                |
| 0005 | GHCR as container registry                 |
| 0006 | ESO + OS keyring as secret backend         |
| 0007 | cnpg-single for XPostgres                  |
| 0008 | Redis (no Sentinel) for XCache             |
| 0009 | MinIO single-node for XBlob                |
| 0010 | Caddy ingress                              |
| 0011 | Cosign keyless OIDC for image signing      |
| 0012 | ApplicationSet matrix scoped to single env |

Template at `docs/adrs/_template.md`. Index page at `docs/adrs/README.md` regenerated by `task adr:index`.

### 15.10 Decision audit log — `.audit/decisions.jsonl`

Append-only, sha256-chained. Mirrors evidence-cataloger pattern from ovh `storage-incident-response`.

Schema per line:

```json
{
  "ts": "2026-06-02T14:33:21Z",
  "actor": "founder",
  "decision_id": "7c4f1a3d9b...",
  "profile": "p-hobby",
  "question": "Pick database composition for XPostgres",
  "answer": "cnpg-single",
  "reasoning": "Cost band $5-20/mo; single VPS; no HA budget",
  "alternatives": ["cnpg-ha", "rds-managed"],
  "adr_emitted": "0007",
  "sha256_prev": "a91e...",
  "sha256_self": "b3d2..."
}
```

`sha256_self = sha256(sha256_prev || canonical_json(line_without_sha256_self))`. Genesis line: `sha256_prev = "0".repeat(64)`.

Verbs:

| Verb                | Behavior                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `task audit:append` | Internal — called by launcher / MCP / CI to append a line atomically (flock)                             |
| `task audit:verify` | Walks the chain, asserts `sha256_self` matches recomputed; exits 1 on first break with line number       |
| `task audit:export` | Renders `.audit/decisions.jsonl` to `docs/audit/timeline.md` (human-readable, grouped by date + profile) |
| `task audit:diff`   | Compares two audit log snapshots; shows added/superseded decisions                                       |

Verify implementation (Go, ~80 LOC) under `internal/cli/audit-verify/`. Tested against tampered fixtures in CI.

### 15.11 Day-1 vs deferred

| Day-1 (this PR)                                                                               | Deferred                                                     |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Marketing site: `/`, `/pricing`, `/quickstart`, `/troubleshoot`, `/glossary`, `/architecture` | Marketing blog, case studies                                 |
| `/how-to/p-hobby` and `/how-to/p-solo`                                                        | Other 3 profile how-tos                                      |
| `apps/docs-public/` with layer + verb + XRD + app + profile reference, autogenerated          | Per-cloud-module deep-dive pages                             |
| `internal/schemas/meta-v1.schema.json` + validator + CI gate                                  | meta-v2 / breaking-change migration tool                     |
| 30+ META.yaml across apps/libs/XRDs/profiles/cloud-modules/Ansible-roles                      | Workflow-kind METAs                                          |
| `task meta:validate` wired into pre-commit + CI                                               | MCP `meta.lint` (style rules beyond schema)                  |
| 12+ auto-emitted ADRs for `p-hobby` default run                                               | ADR auto-emit for all 5 profiles                             |
| ADR template + `task adr:new` + `task adr:index`                                              | ADR supersede-chain visualizer                               |
| `.audit/decisions.jsonl` + `task audit:{append,verify,export}`                                | Audit log signing (cosign blob signature per N lines)        |
| AGENTS.md cascade at 6 levels with per-app + per-XRD templates                                | AGENTS.md linter (style + required-section check)            |
| Troubleshooting catalog: 20 entries                                                           | Catalog → 100+ entries; auto-link from launcher stack traces |

Cross-references: launcher verbs (Section 1), MCP doc tools (Section 0b), error catalog feeds launcher renderer (Section 1.4), META.yaml `costBand` consumed by cost API (Section 0b.4), audit log integrity verb runs in CI release gate (Section 13).

## Section 16 — Sibling OSS provider repos (Contabo + Hetzner Robot)

Two OSS Terraform providers live in sibling repositories, referenced by Section 1's bootstrap extension and Section 7's cloud modules. This template ships a catalog + stub modules in Day-1; the providers themselves are scaffolded in follow-up PRs in their own repos.

### 16.1 Why sibling repos (not in-tree)

| Reason                         | Detail                                                                                                                |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Independent release cadence    | Providers tag + ship to Terraform Registry on their own clock; template repo doesn't gate on provider releases        |
| Registry publish contract      | Terraform Registry requires `terraform-provider-<name>` repo naming + GPG-signed tags; in-tree subdirs cannot publish |
| Reusable outside this template | Anyone using Contabo or Hetzner Robot with Terraform benefits; not coupled to ts-monorepo-template                    |
| Distinct license boundary      | Providers are pure Apache-2.0; template is open-core (Section 0)                                                      |

### 16.2 Provider matrix

| Provider                           | Repo                                                         | Status                                                                  | Upstream alternative                                           | Day-1 in template           |
| ---------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------- |
| `terraform-provider-contabo`       | `github.com/shaiknoorullah/terraform-provider-contabo`       | Greenfield, not yet published                                           | None (Contabo has no official TF provider)                     | Stub module + catalog entry |
| `terraform-provider-hetzner-robot` | `github.com/shaiknoorullah/terraform-provider-hetzner-robot` | Conditional fork of `panta/hetzner` (only if upstream stalls >3 months) | `hetznercloud/hcloud` for Cloud API; `panta/hetzner` for Robot | Stub module + catalog entry |

### 16.3 terraform-provider-contabo

#### 16.3.1 Scope

Resources and datasources mirror the table from Section 1 (verb surface for bootstrap extension):

| Kind     | Resource                                                             | Datasource                                            |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| Compute  | `contabo_instance`                                                   | `contabo_instance`, `contabo_instances`               |
| Network  | `contabo_private_network`, `contabo_private_network_attachment`      | `contabo_private_network`, `contabo_private_networks` |
| Image    | `contabo_snapshot`, `contabo_image`                                  | `contabo_image`, `contabo_images`                     |
| Storage  | `contabo_object_storage_bucket`, `contabo_object_storage_credential` | `contabo_object_storage`, `contabo_object_storages`   |
| Security | `contabo_firewall`, `contabo_firewall_rule`                          | `contabo_firewall`                                    |
| Misc     | `contabo_secret`, `contabo_tag`                                      | `contabo_secret`, `contabo_tag`                       |

#### 16.3.2 Toolchain

| Tool                         | Version | Role                                                                          |
| ---------------------------- | ------- | ----------------------------------------------------------------------------- |
| Go                           | 1.24    | Build toolchain                                                               |
| `terraform-plugin-framework` | v1.13+  | Provider SDK (Plugin Framework, not legacy SDKv2)                             |
| `terraform-plugin-mux`       | v0.18+  | Allow legacy SDKv2 resources during transition (none expected for greenfield) |
| `oapi-codegen`               | v2.4+   | Generate client from Contabo OpenAPI spec                                     |
| `goreleaser`                 | v2.x    | Cross-platform build + GPG-signed release artifacts                           |
| `tfplugindocs`               | v0.21+  | Generate `docs/` from schema + examples                                       |
| `golangci-lint`              | v1.62+  | Lint                                                                          |
| `gofumpt`                    | latest  | Format (stricter than gofmt)                                                  |
| GPG                          | n/a     | Signing key registered on Terraform Registry                                  |

#### 16.3.3 Repo layout

```
terraform-provider-contabo/
  .github/workflows/
    ci.yml          # go test + lint + acceptance matrix
    release.yml     # tag → goreleaser → registry publish
    docs.yml        # tfplugindocs generate (PR check)
  internal/
    client/         # oapi-codegen output (vendored, regenerated by `task client:gen`)
    provider/       # provider.go, data sources, resources
    plan_modifiers/ # e.g., requires_reinstall (private network attach)
  examples/
    provider/
    resources/<name>/
    data-sources/<name>/
  docs/             # tfplugindocs output (committed)
  openapi/          # vendored Contabo OpenAPI spec + version pin
  templates/        # tfplugindocs templates
  CHANGELOG.md
  LICENSE           # Apache-2.0
  CODE_OF_CONDUCT.md
  SECURITY.md
  README.md
  META.yaml         # machine-readable provider catalog entry
  Taskfile.yml      # verbs: client:gen, build, test, acc, docs, release
  go.mod
  main.go
```

#### 16.3.4 Roadmap

| Tag      | Scope                                                                                                                                    | Gate                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `v0.0.1` | Provider config + `contabo_instance` CRUD                                                                                                | Compiles, unit tests pass                                   |
| `v0.0.5` | `contabo_private_network` + `_attachment` with `RequiresReinstall` plan-modifier (eth1 attach forces instance reinstall per Contabo API) | Acceptance test covers attach → reinstall → detach          |
| `v0.0.8` | `contabo_snapshot` + `contabo_image`                                                                                                     | Acceptance tests on ephemeral instance                      |
| `v0.1.0` | **Registry publish milestone** — full resource set above + acceptance tests + docs + GPG signing                                         | Published to `registry.terraform.io/shaiknoorullah/contabo` |
| `v0.2.0` | `contabo_object_storage_*` + `contabo_firewall` + `contabo_secret` + `contabo_tag`                                                       | Acceptance tests                                            |
| `v1.0.0` | API stability commitment + breaking-change policy                                                                                        | Two consecutive 0.x releases with no schema breaks          |

#### 16.3.5 Plan modifier — `RequiresReinstall`

Encodes the Contabo gotcha (from this repo's CLAUDE.md): attaching/detaching `eth1` requires instance reinstall, which destroys the disk.

```go
// internal/plan_modifiers/requires_reinstall.go
// Forces resource replacement when private network attachment changes,
// AND surfaces a plan warning so operators see the destroy upfront.
func RequiresReinstall() planmodifier.String { ... }
```

Used in `contabo_private_network_attachment.instance_id` schema. `terraform plan` shows `# forces replacement` with explanation; CLI launcher (Section 4) intercepts and surfaces plain-English warning.

#### 16.3.6 Test strategy

| Layer             | Trigger                            | Scope                                                  |
| ----------------- | ---------------------------------- | ------------------------------------------------------ |
| Unit              | every push                         | Client parsing, plan-modifier logic, schema validation |
| Acceptance        | `TF_ACC=1` + secret-gated workflow | Real Contabo API against ephemeral test account        |
| Acceptance matrix | release branch + nightly           | Go 1.22 / 1.23 / 1.24                                  |

Ephemeral test account credentials in repo secrets: `CONTABO_CLIENT_ID`, `CONTABO_CLIENT_SECRET`, `CONTABO_API_USER`, `CONTABO_API_PASSWORD`. Acceptance tests `defer` resource cleanup; nightly cleanup job sweeps orphans by tag `tf-acc-test=true`.

#### 16.3.7 Release + governance

| Aspect               | Choice                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Cadence              | Every 2 weeks pre-1.0, monthly post-1.0                                                       |
| License              | Apache-2.0                                                                                    |
| Maintainer           | `@shaiknoorullah` (single maintainer; doc'd in README)                                        |
| Code of Conduct      | Contributor Covenant 2.1                                                                      |
| Security policy      | `SECURITY.md` with embargo policy (private disclosure → 90-day embargo → coordinated release) |
| Conventional Commits | Required; release notes auto-generated by goreleaser                                          |

### 16.4 terraform-provider-hetzner-robot

#### 16.4.1 Scope

| Resource                 | Notes                                            |
| ------------------------ | ------------------------------------------------ |
| `hetzner_robot_server`   | Includes `rescue` + `reinstall` lifecycle        |
| `hetzner_robot_boot`     | Rescue / linux / vnc boot config                 |
| `hetzner_robot_ip`       | Single IP management (reverse DNS, separate MAC) |
| `hetzner_robot_subnet`   | Subnet routing + reverse DNS                     |
| `hetzner_robot_vswitch`  | vSwitch + server attachments                     |
| `hetzner_robot_firewall` | Firewall rules per server                        |
| `hetzner_robot_failover` | Failover IP routing                              |
| `hetzner_robot_key`      | SSH key registration                             |

#### 16.4.2 Upstream-first decision

| Step | Action                                                                                                                                    |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Use `panta/hetzner` directly. Vendor + pin in Section 7 Terraform module                                                                  |
| 2    | Track upstream issue tracker for unmaintained signals (no release in 3 months, no maintainer response on critical bugs)                   |
| 3    | Open issues + PRs upstream for gaps we hit                                                                                                |
| 4    | Only if upstream stalls >3 months on a blocker, **fork** as `terraform-provider-hetzner-robot`, using the Contabo provider template above |
| 5    | If forked, contribute fixes back upstream where possible; goal is reconvergence, not permanent fork                                       |

Fork triggers (documented in `providers/README.md`):

- No upstream release in 90 days AND open critical bug we hit
- Maintainer publicly archives the repo
- Licensing change incompatible with Apache-2.0 use

### 16.5 Day-1 in this template PR

This PR ships **only** the catalog + stubs. The actual sibling repos are scaffolded in follow-up PRs in their own repos.

| Artifact                      | Path                                             | Behavior                                                                                                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider catalog              | `providers/README.md`                            | Lists both providers + status + roadmap + current published version + fallback recommendations                                                                                                                                            |
| Provider META                 | `providers/META.yaml`                            | Machine-readable for MCP server (Section 0b) and Aegis (`docs/agents/aegis.md`)                                                                                                                                                           |
| Contabo stub module           | `infra/terraform/modules/contabo/`               | `main.tf` with `# UNDER DEVELOPMENT` header + `terraform { required_providers { contabo = { source = "shaiknoorullah/contabo", version = "~> 0.1" } } }` and a `precondition` that fails with plain-English error if provider unpublished |
| Hetzner Robot stub            | `infra/terraform/modules/hetzner-robot/`         | Same pattern, references `panta/hetzner` directly (no fork yet)                                                                                                                                                                           |
| Profile materializer fallback | `profiles/p-hobby/`, `profiles/p-startup-small/` | If `contabo` provider not yet published, materializer rewrites bootstrap to use `hcloud` (Hetzner Cloud) — documented in profile README under "Provider fallback"                                                                         |
| Aegis cross-link              | `docs/agents/aegis.md`                           | Sibling-repo discovery block: provider repos, their META URLs, current status                                                                                                                                                             |

#### 16.5.1 Stub module shape

```hcl
# infra/terraform/modules/contabo/main.tf
# UNDER DEVELOPMENT — terraform-provider-contabo is pre-v0.1.0 and not yet
# published to the Terraform Registry. This module will start working
# automatically once the provider ships its v0.1.0 release.
#
# Track status: https://github.com/shaiknoorullah/terraform-provider-contabo
# Current fallback for p-hobby / p-startup-small: Hetzner Cloud (hcloud).

terraform {
  required_version = ">= 1.9"
  required_providers {
    contabo = {
      source  = "shaiknoorullah/contabo"
      version = "~> 0.1"
    }
  }
}

# Fail fast with a clear message if the provider isn't installable yet.
data "external" "provider_check" {
  program = ["${path.module}/scripts/check-provider-published.sh"]
}

resource "null_resource" "guard" {
  lifecycle {
    precondition {
      condition     = data.external.provider_check.result.published == "true"
      error_message = <<-EOT
        terraform-provider-contabo is not yet published to the Registry.
        Use the p-hobby or p-startup-small profile with the hcloud fallback,
        or wait for v0.1.0. See providers/README.md.
      EOT
    }
  }
}
```

#### 16.5.2 META.yaml shape (machine-readable)

```yaml
# providers/META.yaml
schema: providers.v1
providers:
  - id: contabo
    repo: https://github.com/shaiknoorullah/terraform-provider-contabo
    registry_source: shaiknoorullah/contabo
    status: pre-release
    current_version: null
    next_milestone: v0.0.1
    publish_milestone: v0.1.0
    license: Apache-2.0
    maintainer: shaiknoorullah
    fallback_for_profiles:
      p-hobby: hcloud
      p-startup-small: hcloud
    used_by_modules:
      - infra/terraform/modules/contabo
  - id: hetzner-robot
    repo_upstream: https://github.com/panta/terraform-provider-hetzner
    repo_fork: https://github.com/shaiknoorullah/terraform-provider-hetzner-robot
    fork_active: false
    fork_trigger: upstream_stall_90d
    status: upstream-first
    registry_source: panta/hetzner
    license: Apache-2.0
    used_by_modules:
      - infra/terraform/modules/hetzner-robot
```

### 16.6 CI shape (per provider repo, scaffolded in follow-up PRs)

| Workflow      | Trigger  | Steps                                                                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`      | push, PR | `go test ./...` + `golangci-lint run` + `gofumpt -l` + acceptance matrix Go 1.22/1.23/1.24 (gated on `TF_ACC=1` + secrets present) |
| `release.yml` | tag `v*` | `goreleaser release` → cross-platform binaries + GPG sign + GitHub release + Terraform Registry webhook fires                      |
| `docs.yml`    | PR       | `tfplugindocs generate` → diff check; PR fails if docs drift from schema                                                           |

### 16.7 Follow-up PRs (not Day-1)

| PR              | Repo                               | Scope                                                                                                                                                                                               |
| --------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1               | `terraform-provider-contabo`       | Repo scaffold + `v0.0.1` (provider config + `contabo_instance` CRUD)                                                                                                                                |
| 2               | `terraform-provider-contabo`       | `v0.0.5` private network + reinstall plan-modifier                                                                                                                                                  |
| 3               | `terraform-provider-contabo`       | `v0.0.8` snapshot + image                                                                                                                                                                           |
| 4               | `terraform-provider-contabo`       | `v0.1.0` registry publish + remaining resources                                                                                                                                                     |
| 5               | `ts-monorepo-template`             | Once `contabo` v0.1.0 lands, remove `UNDER DEVELOPMENT` guards in `infra/terraform/modules/contabo/`; flip profile materializer default away from hcloud fallback for `p-hobby` / `p-startup-small` |
| 6 (conditional) | `terraform-provider-hetzner-robot` | Fork scaffold only if upstream stall trigger fires                                                                                                                                                  |

### 16.8 Cross-references

| Concern                                                           | See                                         |
| ----------------------------------------------------------------- | ------------------------------------------- |
| How the launcher CLI surfaces "provider not yet published" errors | Section 4 (Launcher CLI)                    |
| Profile materializer fallback logic                               | Section 13 (Profiles)                       |
| Aegis discovery of sibling repos                                  | Section 17 (MCP server + Aegis)             |
| Cloud bootstrap modules consuming these providers                 | Section 7 (Bootstrap — Terraform + Ansible) |
| Why no in-tree provider build                                     | Section 0 (Open-core boundaries)            |

## Section 17 — Risks, open questions, explicit non-goals

### 17.1 Risk register

Ten tracked risks. Each has a trigger condition, blast radius, and a concrete mitigation that ships in this PR (or is explicitly deferred).

| #   | Risk                                   | Trigger                                                                         | Blast radius                                                                      | Mitigation (ships Day-1 unless noted)                                                                                                                                                                         |
| --- | -------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Nx 22 lands inside the review window   | Nx 22.0.0 GA before merge                                                       | `project.json` schema drift across ~20 projects; Nx Cloud token format may change | Pin `nx@~21.x` in root `package.json`; Renovate group rule `nx-monorepo` blocks 22 until separate spec; CI asserts `nx --version` matches pin                                                                 |
| R2  | Crossplane v2 migration                | `apiextensions.crossplane.io/v2alpha1` becomes default                          | All four XRD bundles (Section 8) need rewrite                                     | Pin Crossplane core `1.17.x` in `crossplane/packages.yaml`; v2 migration is a follow-up spec; ApplicationSet for Crossplane apps pinned to v1 chart                                                           |
| R3  | `provider-apicurio` never materializes | Schema-governance adoption accelerates faster than upstream provider            | XRD `xschemaregistries.platform.pn.dev` stuck on `provider-http` MVP path         | `provider-http` MVP is acceptable indefinitely (Section 8 §8.4); upgrade is a non-breaking composition swap                                                                                                   |
| R4  | Profile × axis combinatorial explosion | Users request arbitrary axis combinations beyond the 5 named profiles           | Nightly CI matrix blows past free-tier minutes                                    | Nightly tests only the 5 named profile bringups end-to-end; arbitrary axis combos require an issue + reproduction before they enter CI                                                                        |
| R5  | Cloud spend on nightly bringup CI      | Hetzner/Contabo/OVH provisioning runs nightly                                   | Real money, potentially unbounded                                                 | `task teardown` verb is mandatory post-step; budget caps via provider spend-limit APIs (Cloudflare, Hetzner Cloud, Contabo); circuit-breaker step `check-budget` skips bringup when month-to-date spend > cap |
| R6  | OSS provider maintainership burden     | `terraform-provider-contabo` + `terraform-provider-hetzner-robot` accrue issues | Community expectation mismatch                                                    | `SECURITY.md` + `CONTRIBUTING.md` state "best-effort, side-project SLA"; explicit co-maintainer recruitment notice in README; no SLA on issue triage                                                          |
| R7  | MCP spec churn                         | MCP protocol revision changes tool-call schema                                  | Layer 0b MCP server (Section 4) breaks for Aegis/Claude/Cursor                    | Pin `@modelcontextprotocol/sdk` to one minor; internal `Tool` interface wraps SDK so swap is a single-file change; conformance test against pinned spec                                                       |
| R8  | Founder confusion on first-run errors  | Wizard hits an unhandled error mid-bringup                                      | #1 abandonment cause; silent attrition                                            | Error catalog at `cli/errors/catalog.yaml` with `code`, `cause`, `fix`; CI gate `error-catalog-completeness` fails if any thrown code lacks a documented fix                                                  |
| R9  | "Everything in one PR" un-reviewable   | 200+ files land in one PR                                                       | Reviewer fatigue → rubber-stamp → security blind spots                            | Structured PR description with section-by-section index; per-layer `CODEOWNERS` triggers sub-review; per-layer security ADR cross-linked from PR body (Section 16)                                            |
| R10 | Multi-cloud Terraform module drift     | A change works on Hetzner but breaks on Azure/AWS/GCP                           | Bootstrap (Layer 7) silently regresses on untested cloud                          | Matrix CI per module × per cloud with provider version pinned; `terraform-modules-matrix` workflow gates merge                                                                                                |

### 17.2 Risk-to-section pointers

| Risk   | Owning section                   | Owning file                               |
| ------ | -------------------------------- | ----------------------------------------- |
| R1     | §3 (Nx)                          | `package.json`, `renovate.json`           |
| R2     | §8 (Crossplane)                  | `crossplane/packages.yaml`                |
| R3     | §8.4                             | `xrds/schema-governance/composition.yaml` |
| R4, R5 | §11 (CI matrix) + §12 (profiles) | `.github/workflows/nightly-bringup.yaml`  |
| R6     | §13 (OSS providers)              | `terraform-provider-contabo/SECURITY.md`  |
| R7     | §4 (MCP)                         | `mcp-server/src/tools/interface.ts`       |
| R8     | §2 (CLI)                         | `cli/errors/catalog.yaml`                 |
| R9     | §16 (review process)             | `.github/PULL_REQUEST_TEMPLATE.md`        |
| R10    | §7 (bootstrap)                   | `terraform/modules/*/test/`               |

### 17.3 Open questions (tracked, non-blocking)

Logged as issues with the `question` label. None block PR merge.

| ID  | Question                                                                           | Why parked                                                                     | Resolution path                                                                       |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Q-a | Vault vs Crossplane-managed Vault for self-hosted secret backend on `p-enterprise` | Both work; choice depends on operator preference                               | Decide when first `p-enterprise` user requests self-hosted; default stays AKV/ASM/GSM |
| Q-b | Garden / Wing / Encore as alternative orchestrators                                | Nx + Helm + Argo covers the surface; alternatives add maintenance              | Revisit only if a profile demands one                                                 |
| Q-c | GUI editor for the profile system                                                  | CLI wizard is sufficient for Audience 1; MCP is sufficient for Audience 2      | Park until usage data shows wizard friction                                           |
| Q-d | Web playground for the MCP server                                                  | Local stdio transport is the canonical path                                    | Consider if/when SaaS launcher phase starts                                           |
| Q-e | IDE plugins beyond `AGENTS.md` cascade                                             | AGENTS.md works in Cursor, Claude Code, Codex, Continue today                  | Defer until a host editor lacks AGENTS.md support                                     |
| Q-f | Federated multi-cluster management                                                 | ApplicationSet covers basic federation; full fleet story is a separate product | Defer to a "fleet management" spec                                                    |

### 17.4 Explicit non-goals

Recorded so future maintainers don't relitigate.

| #   | Non-goal                                                               | Rationale                                                                                   | Revisit trigger                               |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| N1  | Backstage-style developer portal                                       | Out of scope for an open-core monorepo template; portals are a separate product category    | None planned                                  |
| N2  | SaaS launcher in this PR                                               | Deferred to commercial phase                                                                | Commercial-phase kickoff                      |
| N3  | Billing system for SaaS phase                                          | Stripe/LemonSqueezy integrations land with the SaaS phase, not Day-1                        | Commercial-phase kickoff                      |
| N4  | Windows-native development                                             | `devenv` covers macOS + Linux + WSL2; Windows-native adds toolchain breakage surface        | Clear founder demand + WSL2 inadequacy report |
| N5  | Custom service mesh                                                    | Use Linkerd or Istio; mesh is a profile-level choice, not a bespoke component               | None planned                                  |
| N6  | Custom CNI                                                             | Use Cilium/Calico via the bootstrap layer                                                   | None planned                                  |
| N7  | Bare-metal cloud (Equinix Metal, Latitude.sh, OVH bare-metal) on Day-1 | Terraform modules can extend later; Hetzner Robot already covers the budget bare-metal slot | User-driven PR                                |
| N8  | Cloudflare Pages for the web-app tier on Day-1                         | Workers-only on Day-1; Pages is a separate compute model                                    | User-driven PR                                |

### 17.5 Day-1 vs follow-up

| Concern                    | Day-1 (this PR)                                                                     | Follow-up                                              |
| -------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Risk register              | All 10 risks documented in this section + mitigations wired into the relevant files | Quarterly risk-register review issue                   |
| Error catalog              | `cli/errors/catalog.yaml` + CI completeness gate                                    | Auto-fix-hint quality audit                            |
| Budget circuit-breaker     | `check-budget` step in `nightly-bringup.yaml` + provider spend-limit APIs           | Per-profile budget tuning once nightly run data exists |
| Crossplane v2 migration    | Pinned to 1.17.x; migration deferred                                                | Separate spec when v2 GA                               |
| Nx 22 evaluation           | Renovate group rule blocks 22                                                       | Separate spec once 22 is stable                        |
| MCP SDK version            | Pinned; internal `Tool` interface in place                                          | Re-pin per MCP spec rev                                |
| Bare-metal / Pages support | Not present; non-goal documented                                                    | User-driven PR if/when demand surfaces                 |

### 17.6 Sign-off criteria for this section

The risk register is considered live and binding from merge. Any future PR that:

- bumps Nx major → must update R1 with new pin + Renovate rule
- bumps Crossplane major → must update R2 + ship XRD migration
- adds a new cloud module → must update R10 with matrix-CI coverage
- adds a new wizard error code → must update R8's catalog or fail the `error-catalog-completeness` gate

… is required to amend the relevant row in §17.1 in the same PR.

## Section 18 — Glossary + Approval log + Citations

Closes the spec. Three subsections: terminology dictionary, sign-off rows, numbered references used across Sections 1–17.

### 18.1 Glossary

Alphabetical. One line each. Cross-references to the section where the term is load-bearing.

| Term               | Definition                                                                                                                         | Section |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------- |
| ADR                | Architecture Decision Record — short markdown file capturing one decision, its context, alternatives, and consequences.            | 17      |
| AGENTS.md          | Cascading agent-guidance file; nearest-ancestor-wins lookup from any working directory; machine-readable counterpart to README.md. | 0b, 16  |
| ApplicationSet     | Argo CD controller that templates `Application` resources from a generator (matrix, git, list, cluster).                           | 5, 6    |
| buf                | Protobuf toolchain (`buf lint`, `buf generate`, `buf breaking`); replaces hand-rolled `protoc` pipelines.                          | 3       |
| cargo-chef         | Rust Docker layer-caching helper that splits dependency build from source build for cache reuse.                                   | 4       |
| Composition        | Crossplane pipeline that fulfills an XR by composing managed resources, optionally through Functions.                              | 6, 8    |
| cosign             | Sigstore image-signing tool; keyless mode signs via OIDC identity (GitHub Actions token).                                          | 4       |
| cspell             | Streaming spell checker with per-repo dictionaries; runs in lefthook pre-commit.                                                   | 2       |
| devenv             | Cachix Nix-based reproducible dev environment; declared in `devenv.nix`, activated by direnv.                                      | 2       |
| direnv             | Per-directory env loader; auto-activates devenv shell on `cd`.                                                                     | 2       |
| DTE                | Distributed Task Execution — Nx Cloud feature that fans out a task graph across remote agents.                                     | 3       |
| ESO                | External Secrets Operator — pulls secrets from AKV/ASM/GSM/Vault/keyring into Kubernetes `Secret`s.                                | 2, 6    |
| Function           | Crossplane composition-pipeline step (function-patch-and-transform, function-go-templating, function-kcl).                         | 6, 8    |
| GHCR               | GitHub Container Registry — default OCI registry; profile-driven swap to ACR/ECR/GAR/Harbor.                                       | 4       |
| GitOps             | Reconcile-from-git operating model; cluster state derives from a tracked branch via Argo CD.                                       | 5, 6    |
| Helm library chart | Chart with `type: library`; exports named templates consumed by other charts; ships no resources itself.                           | 5       |
| Kargo              | Argo project for staged promotion of artifacts across environments via Stages + Freight.                                           | 5       |
| KCL                | KusionStack configuration language used by Crossplane `function-kcl` for typed composition logic.                                  | 6, 8    |
| Kubespray          | Ansible-based Kubernetes installer; reference for the configurable bootstrap path.                                                 | 7       |
| lefthook           | Go-based git-hook runner; parallel, language-agnostic; replaces husky for polyglot repos.                                          | 2       |
| MCP                | Model Context Protocol — Anthropic-originated agent protocol for tool + resource exposure.                                         | 0b      |
| nx affected        | Nx command that derives the impacted project set from a git base and runs targets only on it.                                      | 3       |
| Nx Cloud           | SaaS for Nx remote cache + DTE; free tier default in this spec, PowerPack opt-in.                                                  | 3       |
| OTel               | OpenTelemetry — vendor-neutral traces/metrics/logs SDK + collector.                                                                | 5       |
| PnT                | Patch and Transform — Crossplane composition pattern implemented by function-patch-and-transform.                                  | 6, 8    |
| PowerPack          | Nrwl's paid Nx extensions (conformance, owners, enterprise auth); opt-in only.                                                     | 3       |
| secretspec         | Cachix declared-secrets contract; `secretspec.toml` declares required env vars + provider hints.                                   | 2       |
| tsdown             | Rolldown-powered TypeScript bundler; tsup successor; faster cold builds.                                                           | 3       |
| tfplugindocs       | HashiCorp Terraform plugin docs generator; emits `docs/` from schema + examples.                                                   | 7       |
| XR                 | Crossplane Composite Resource — an instance of an XRD, fulfilled by a Composition.                                                 | 6, 8    |
| XRD                | Crossplane CompositeResourceDefinition — the type spec for an XR (OpenAPI schema + claim names).                                   | 6, 8    |

### 18.2 Approval log

Sign once the full spec (Sections 1–17) has been read end-to-end. One row per review axis. Notes column captures conditional approvals or follow-ups that don't block Day-1.

| Review axis           | Date       | Approver       | Decision                              | Notes          |
| --------------------- | ---------- | -------------- | ------------------------------------- | -------------- |
| Architecture review   | YYYY-MM-DD | \***\*\_\*\*** | approve / approve-with-notes / reject | \***\*\_\*\*** |
| Security review       | YYYY-MM-DD | \***\*\_\*\*** | approve / approve-with-notes / reject | \***\*\_\*\*** |
| Cost review           | YYYY-MM-DD | \***\*\_\*\*** | approve / approve-with-notes / reject | \***\*\_\*\*** |
| Spec review (overall) | YYYY-MM-DD | \***\*\_\*\*** | approve / approve-with-notes / reject | \***\*\_\*\*** |

Decision semantics:

| Decision           | Meaning                                                                |
| ------------------ | ---------------------------------------------------------------------- |
| approve            | Day-1 PR may merge as specified.                                       |
| approve-with-notes | Day-1 may merge; notes become tracked follow-ups (Section 17 backlog). |
| reject             | Spec returns to author with notes; no Day-1 merge.                     |

### 18.3 Citations

Numbered, stable across the spec. Cite as `[N]` in prose; cite as `[N §sub]` when pointing at a sub-section of a long doc.

| #   | Reference                                                                                                                                          | Where used |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `pnow-ats-v2/docs/2026-05-23-dev-env-design.md` — internal dev-env spec (devenv + secretspec + lefthook patterns).                                 | 2          |
| 2   | `ovh/docs/superpowers/specs/2026-05-23-crossplane-schema-governance-and-kroxylicious-design.md` — XRD + Kroxylicious + Apicurio governance design. | 6, 8       |
| 3   | `research-ts-monorepo-template.md` handoff — toolchain + Nx plugin survey + community-plugin shortlist.                                            | 3          |
| 4   | `research-frontend-stack.md` handoff — frontend bundler + SSR + Next/Remix evaluation.                                                             | 3          |
| 5   | Nx 21 docs — https://nx.dev/ — workspace, plugins, affected, release.                                                                              | 3          |
| 6   | Nx Cloud docs — https://nx.app/ — remote cache, DTE, PowerPack, token model.                                                                       | 3          |
| 7   | Crossplane docs — https://docs.crossplane.io/ — providers, compositions, functions, XRDs.                                                          | 6, 8       |
| 8   | Apicurio Registry 3 docs — https://www.apicur.io/registry/docs/apicurio-registry/3.x/ — schema registry, compatibility rules.                      | 8          |
| 9   | Kroxylicious docs — https://kroxylicious.io/ — Kafka proxy filter framework.                                                                       | 8          |
| 10  | Strimzi docs — https://strimzi.io/documentation/ — Kafka operator.                                                                                 | 8          |
| 11  | CloudNativePG docs — https://cloudnative-pg.io/documentation/ — Postgres operator.                                                                 | 8          |
| 12  | KubeBlocks docs — https://kubeblocks.io/docs/ — multi-engine data operator.                                                                        | 8          |
| 13  | RabbitMQ Cluster Operator docs — https://www.rabbitmq.com/kubernetes/operator/operator-overview — RMQ operator.                                    | 8          |
| 14  | Altinity ClickHouse Operator docs — https://github.com/Altinity/clickhouse-operator — CHI / CHK operator.                                          | 8          |
| 15  | External Secrets Operator docs — https://external-secrets.io/ — `ClusterSecretStore`, providers.                                                   | 2, 6       |
| 16  | devenv docs — https://devenv.sh/ — Nix-based devenv definitions, profiles, processes.                                                              | 2          |
| 17  | secretspec docs — https://github.com/cachix/secretspec — declared-secrets contract + providers.                                                    | 2          |
| 18  | agents.md spec — https://agents.md/ — cascading AGENTS.md convention.                                                                              | 16         |
| 19  | Model Context Protocol spec — https://modelcontextprotocol.io/ — tools, resources, prompts.                                                        | 0b         |
| 20  | Contabo OpenAPI spec — https://api.contabo.com/api.yaml — provider input for oapi-codegen.                                                         | 7          |
| 21  | Hetzner Robot API docs — https://robot.hetzner.com/doc/webservice/en.html — dedicated/Robot endpoints.                                             | 7          |
| 22  | Argo CD ApplicationSet docs — https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/ — matrix + cluster generators.              | 5, 6       |
| 23  | Kargo docs — https://docs.kargo.io/ — Stages, Freight, promotion policies.                                                                         | 5          |
| 24  | Sigstore cosign docs — https://docs.sigstore.dev/cosign/overview/ — keyless OIDC signing.                                                          | 4          |
| 25  | terraform-plugin-framework docs — https://developer.hashicorp.com/terraform/plugin/framework — provider scaffolding.                               | 7          |
| 26  | oapi-codegen docs — https://github.com/oapi-codegen/oapi-codegen — OpenAPI to Go client.                                                           | 7          |
| 27  | tfplugindocs docs — https://github.com/hashicorp/terraform-plugin-docs — provider docs generator.                                                  | 7          |
| 28  | `ovh/docs/2026-04-21-plan-d-event-infra-design.md` — existing event-infra spec referenced for Layer 8 alignment.                                   | 8          |

### 18.4 Day-1 vs follow-up

| Item                                                                          | Day-1                                                         | Follow-up                       |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------- |
| Glossary in repo as `docs/GLOSSARY.md`                                        | yes                                                           | —                               |
| Approval-log rows signed                                                      | yes (architecture + spec); security + cost may be conditional | full sign-off before any GA tag |
| Citations resolved to permalinks (commit-pinned for internal repos)           | yes                                                           | —                               |
| `META.yaml` mirror of glossary for MCP `glossary.lookup` tool                 | —                                                             | follow-up (see Section 0b)      |
| Citation linter (`task docs:citations:check`) — verifies every `[N]` resolves | —                                                             | follow-up                       |

End of spec.

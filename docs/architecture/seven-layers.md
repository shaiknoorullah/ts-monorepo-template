# Seven layers (plus 0a + 0b)

Authoritative source: [`docs/superpowers/specs/2026-06-03-platform-foundation-design.md`](../superpowers/specs/2026-06-03-platform-foundation-design.md) Section 1.2.

The platform exposes two front doors (Layer 0a for founders, Layer 0b for agents) over seven layered concerns. Each layer is replaceable independently; the layer above only consumes the verb surface or the typed schema of the layer below.

## Layer 0a — Launcher CLI + marketing site

Audience: founders. Entry point: `npx create-platform@latest` or `task init`. Outputs a materialized monorepo, an ADR chain, and an audit-log seed.

## Layer 0b — MCP server

Audience: agents (Claude / Codex / Cursor / Aegis). Entry point: stdio JSON-RPC. Tool catalog in spec Section 1.8.

## Layer 1 — Verb surface (Taskfile)

Vendor-neutral verbs (`task <verb>`). The only surface engineers type into day-to-day. Everything below this line is replaceable without engineer retraining.

## Layer 2 — Toolchain + secrets

`devenv.nix` pins Go / Python / Rust / Node versions. `secretspec.toml` declares every required env var. Local cache is the OS keyring; team / shared secrets come from Azure Key Vault via ESO.

## Layer 3 — Build orchestration (Nx + Nx Cloud)

Nx 21 graph spans all four languages via community plugins. Nx Cloud token lives only in GitHub Actions secrets; local runs fall back to local cache.

## Layer 4 — Container build (BuildKit + cosign)

Per-language multi-stage Dockerfiles. Cosign keyless OIDC signs every image on the GHA runner identity. No long-lived signing keys.

## Layer 5 — App runtime (Helm library chart)

Apps depend on `infra/helm/lib-chart` only. Per-app charts ship three files: `Chart.yaml`, `values.yaml`, `values.<env>.yaml`.

## Layer 6 — Platform infra (Crossplane)

Stateful infra — Postgres / cache / blob / topic — is provisioned only via XRD claims. Apps consume connection details via `ExternalSecret` referencing a Crossplane-published secret.

## Layer 7 — Bootstrap (Terraform + Ansible)

Opt-in. Seven cloud modules: Contabo, Hetzner Cloud, OVH, Azure, AWS, GCP, Cloudflare. Ansible roles are Kubespray-style configurable.

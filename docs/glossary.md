# Glossary

Authoritative source: spec [Section 18.1](./superpowers/specs/2026-06-03-platform-foundation-design.md). This file mirrors the glossary so docs-site readers and agents can resolve terms without parsing the long spec.

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

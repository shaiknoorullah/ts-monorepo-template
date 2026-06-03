# ADR-0006: YAML configuration hierarchy with c12 + Zod

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** @shaiknoorullah

## Context

This template originally used flat `.env.example` files (one per stack — see `.env.saas-commons.example`) to describe service config. Three problems compounded:

1. **No hierarchy.** A dev-only override required either copy-pasting the entire `.env.example` or splitting it across `.env`, `.env.local`, `.env.dev` with `dotenv-flow`-style merging. Multi-tenant overrides (per-tenant DB schema, per-tenant feature-flag tokens) were not expressible at all.
2. **No types.** `.env` is `string -> string`. Anything richer (a list of brokers, a nested OIDC client config, a SecretRef pointer) becomes ad-hoc string encoding the consumer must decode.
3. **No comments / no structure.** Operators couldn't tell which keys were required, which were SecretRefs, and which were optional features.

For comparison see [`.env.saas-commons.example`](../../.env.saas-commons.example) — every section starts with a comment block explaining the encoding because the format can't express it.

## Decision

Adopt **YAML** as the canonical config format, layered via [`c12`](https://github.com/unjs/c12) (UnJS), validated by **Zod**.

```
config/
├── schema.ts        # Zod — source of truth
├── base.yaml        # defaults
├── dev.yaml         # $extends ./base.yaml
├── test.yaml
├── staging.yaml
├── prod.yaml
└── tenants/<slug>.yaml   # $extends ../<env>.yaml
```

`.env` is now an **artifact**, not a source. `repo env render <env>` produces `docker/.env.rendered` from the YAML hierarchy for docker-compose consumption.

### Why c12

- UnJS family (same ecosystem as citty, defu, ohash that the rest of `@internal/cli` uses).
- Native support for `$extends` chains — exactly the layering model we want.
- Env-aware merging (NODE_ENV-based defaults) and watch mode out of the box.
- Tiny — ~10kb gzipped. No transitive dotfile-format zoo.

### Why Zod

- Schema-first; TS types are derived (`z.infer<typeof AppConfigSchema>`) so there's exactly one source of truth.
- Already in the catalog (`zod` is pinned cluster-wide).
- Friendly error messages — config-loader prints exact dotted path + reason on validation failure.
- Composable with the `SecretRef` discriminated union for secret pointers.

### Why YAML (over TOML / JSON5 / TS)

- TOML doesn't nest naturally — multi-level sections become noisy `[a.b.c]` headers.
- JSON5 still bans comments in CI tooling (jq, yq, etc.) and lacks `$extends`.
- TS configs (`config.dev.ts`) bake conditional logic into config — defeats the goal of describing intent declaratively. Reserved for the (rare) cases where computation is unavoidable.
- YAML wins by being the format Kubernetes/Helm/GitHub-Actions/Compose already use; reuse the muscle memory.

## Consequences

### Positive

- One declarative layer expresses dev/test/staging/prod/tenant overrides.
- SecretRefs are typed, not string-encoded — `provider`/`path` is enforced.
- Validation happens at load-time, not at first-use. Misconfigured prod fails fast.
- Env-var escape hatch (`${VAR}`) preserves 12-factor compatibility for hostnames injected by k8s ConfigMaps.

### Negative

- One more file format for newcomers to learn (mitigated: K8s/Helm/Compose all use YAML anyway).
- Tooling chain (`c12` + `yaml` + `zod`) adds ~30kb to the `@internal/cli` bundle. Acceptable for a CLI.

### Neutral / Follow-up

- `.env.saas-commons.example` is preserved with a deprecation comment until the conversion to `config/saas-commons.yaml` is verified end-to-end. Tracker: AGENT-TODO in the conversion test.
- `@pkg/config` is the runtime loader for services — uses the same schema, no separate codepath.

## Alternatives considered

- **dotenv-flow** with `.env.dev`, `.env.staging`, `.env.prod`. Rejected: no schema, no nested structure, no secret typing.
- **Hand-rolled JSON + custom merger.** Rejected: every team writes a different merger; c12 already exists.
- **Helm-style Go templates.** Rejected: pulls in a Go dependency to the JS toolchain.

## References

- [c12](https://github.com/unjs/c12)
- [Zod](https://zod.dev)
- [The Twelve-Factor App — Config](https://12factor.net/config)
- `config/README.md` for layering rules
- `internal/cli/src/commands/env/render.ts` for the render contract

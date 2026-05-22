# `config/` — YAML configuration hierarchy

Declarative config for every service in this monorepo. **YAML (not .env)** is
the default; `.env` is only ever a rendered artifact for docker-compose.

## Files

| File | Purpose |
|---|---|
| `schema.ts` | Zod schema — **the source of truth**. TS types derived via `z.infer<typeof AppConfigSchema>`. |
| `base.yaml` | Shared defaults across all environments. |
| `dev.yaml` | Local developer-laptop overrides (extends `base.yaml`). |
| `test.yaml` | CI / Vitest / Testcontainers (extends `base.yaml`). |
| `staging.yaml` | Staging cluster (extends `base.yaml`). |
| `prod.yaml` | Production cluster (extends `base.yaml`). |
| `tenants/*.yaml` | Per-tenant overrides (extend the relevant env file). |
| `saas-commons.yaml` | Declarative replacement for `.env.saas-commons.example`. |

## Layering rules

1. `base.yaml` defines defaults.
2. `<env>.yaml` extends `base.yaml` via [`c12`](https://github.com/unjs/c12)'s
   `$extends: ./base.yaml`.
3. Tenant configs extend the relevant env file via `$extends: ../<env>.yaml`.
4. **Secrets** are resolved at runtime from ESO/Vault/KV/AWS-SM — never
   committed. Use a `SecretRef` (`{ provider, path }`) anywhere a literal
   secret would otherwise sit.
5. **Env-var escape hatch (12-factor):** Any string value of the form
   `${VAR_NAME}` is read from `process.env` at load time. Useful for hostnames
   injected by k8s ConfigMaps. If unset, the loader fails fast.
6. **Validation:** Every load passes through `AppConfigSchema.parse(...)`.
   Missing required fields fail at startup, not at first use.

## Usage

```bash
# Render to a flat .env (docker-compose consumes this):
repo env render dev                  # -> docker/.env.rendered

# Show the merged config (secrets redacted):
repo env show dev

# Validate a YAML file:
repo env validate prod
```

From application code:

```ts
import { loadConfig } from '@pkg/config'      // wraps c12 + the schema
const cfg = await loadConfig()                  // picks env from NODE_ENV
```

## SecretRef

```yaml
database:
  password:
    provider: vault          # vault | eso | azure-kv | aws-sm | env
    path: secret/data/prod/db#password
    devFallback: dev         # only used when NODE_ENV !== 'production'
```

- `provider: env` reads `path` as an env-var name (12-factor mode).
- `provider: vault` reads from HashiCorp Vault via the cluster's
  External Secrets Operator binding (NOT direct from Vault — ESO mediates).
- `provider: azure-kv` / `aws-sm` similarly funnel through ESO.

## Adding a new field

1. Add it to `schema.ts` with a sensible default if you can.
2. Set the value (or default) in `base.yaml`.
3. Override in `dev.yaml` / `staging.yaml` / `prod.yaml` if needed.
4. Bump `@pkg/config` minor version via `repo new changeset`.

If the new field carries a secret, follow the SecretRef contract — never inline.

# AGENTS.md — profiles/

Cascade rule: nearest `AGENTS.md` wins; child overrides parent.

## What lives here

The 5 named profiles (`p-solo`, `p-hobby`, `p-startup-small`, `p-startup-scale`, `p-enterprise`) plus any user forks. Each profile is a directory matching the layout in spec section 1.5.

## Authoring rules

- Every profile ships `README.md` + `META.yaml` + `terraform.tfvars` + `ansible/group_vars.yml` + `crossplane/composition-pins.yaml` + `helm-values/` + `secretspec.toml` + `argocd/appset-overrides.yaml` + `nx/preset.json`.
- `META.yaml` validates against `internal/schemas/meta-v1.schema.json` with `kind: Profile`.
- `task profile:fork` creates new profiles. CI matrix gates only the 5 named profiles; forks are user-owned.

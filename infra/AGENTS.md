# AGENTS.md — infra/

Cascade rule: nearest `AGENTS.md` wins; child overrides parent.

## What lives here

Helm, Crossplane, Terraform, Ansible, Argo CD. Spec section 1.2 layers 5, 6, 7.

## Conventions

- Helm: apps depend only on `infra/helm/lib-chart`. Per-app charts are three files (`Chart.yaml`, `values.yaml`, `values.<env>.yaml`).
- Crossplane: XRDs under `infra/crossplane/xrds/<x>/` with one `META.yaml` per XRD. Compositions selected per profile via `profiles/<id>/crossplane/composition-pins.yaml`.
- Terraform: one module per cloud under `infra/terraform/modules/<cloud>/`. Plans run against mock backends in CI (spec section 13.2 row C10).
- Ansible: roles are Kubespray-style configurable; molecule converge runs on at least one role in CI (spec section 13.2 row C11).

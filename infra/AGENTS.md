# AGENTS.md — infra/

Cascade rule: nearest `AGENTS.md` wins; child overrides parent.

## What lives here

Helm, Crossplane, Terraform, Ansible, Argo CD. Spec section 1.2 layers 5, 6, 7.

## Conventions

### Helm

- Apps depend only on `infra/helm/lib-chart`. Per-app charts are three files (`Chart.yaml`, `values.yaml`, `values.<env>.yaml`).
- SecurityContext FLOOR + NetworkPolicy default-deny are enforced by the `lib-chart` library chart. Apps cannot relax them; they can only narrow further.

### Crossplane

- XRDs under `infra/crossplane/xrds/<x>/` with one `META.yaml` per XRD. Each XRD owns one resource family (`XPostgres`, `XCache`, `XBlob`, ...).
- Compositions selected per profile via `profiles/<id>/crossplane/composition-pins.yaml`.
- Stateful infra is Crossplane-only. App Helm charts never provision DBs.

### Argo CD

- Root app at `infra/argocd/root/`. ApplicationSet matrices fan out per env.
- Promotion via Kargo Stages (Day-1: `go-hello`). Do not hand-promote.

### Terraform / Ansible (Layer 7)

- Terraform: one module per cloud under `infra/terraform/modules/<cloud>/`. Plans run against mock backends in CI (spec section 13.2 row C10).
- Ansible: roles are Kubespray-style configurable; molecule converge runs on at least one role in CI (spec section 13.2 row C11).
- Bootstrap is opt-in: default assumes a working kubeconfig.

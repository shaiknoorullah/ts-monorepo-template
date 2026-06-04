#!/usr/bin/env bats

@test "infra/argocd/META.yaml exists" {
  [ -f infra/argocd/META.yaml ]
}

@test "META.yaml layer is 7-multi-env-promotion" {
  grep -q '^layer: 7-multi-env-promotion$' infra/argocd/META.yaml
}

@test "appprojects directory exists" {
  [ -d infra/argocd/appprojects ]
}

@test "sync-windows directory exists" {
  [ -d infra/argocd/sync-windows ]
}

@test "kargo/pipelines directory exists" {
  [ -d infra/kargo/pipelines ]
}

@test "META.yaml mcp_endpoints declares /argocd/promote" {
  grep -q 'POST /argocd/promote' infra/argocd/META.yaml
}

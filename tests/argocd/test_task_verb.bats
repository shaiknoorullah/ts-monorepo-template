#!/usr/bin/env bats

@test "Taskfile declares argocd:validate task" {
  task --list-all | grep -q '^\* argocd:validate:'
}

@test "Taskfile declares argocd:render task" {
  task --list-all | grep -q '^\* argocd:render:'
}

@test "task argocd:validate succeeds" {
  task argocd:validate
}

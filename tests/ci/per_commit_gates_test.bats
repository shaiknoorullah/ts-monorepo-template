#!/usr/bin/env bats

PR_WF=.github/workflows/pr.yml

@test "pr.yml references tf-validate job" {
  run grep -E "tf-validate" "$PR_WF"
  [ "$status" -eq 0 ]
}

@test "ci:gates-for-commit calls terraform:fmt + validate" {
  run grep -E "terraform:fmt|terraform:validate" Taskfile.yml
  [ "$status" -eq 0 ]
}

@test "every env stack has the static fmt-check artifact" {
  for e in dev staging prod; do
    [ -f "infra/terraform/envs/$e/main.tf" ] || { echo "env $e missing main.tf"; return 1; }
    [ -f "infra/terraform/envs/$e/terraform.tfvars" ] || { echo "env $e missing tfvars"; return 1; }
  done
  run terraform -chdir=infra/terraform fmt -check -recursive
  [ "$status" -eq 0 ]
}

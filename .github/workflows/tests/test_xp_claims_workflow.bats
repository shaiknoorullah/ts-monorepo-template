#!/usr/bin/env bats

@test "xp-claims workflow exists" {
  [ -f .github/workflows/xp-claims.yml ]
}

@test "xp-claims workflow declares the xp-claims job" {
  [ "$(yq eval '.jobs | keys | .[0]' .github/workflows/xp-claims.yml)" = "xp-claims" ]
}

@test "xp-claims workflow installs yq, ajv-cli and crossplane CLI" {
  grep -q 'mikefarah/yq-action' .github/workflows/xp-claims.yml || \
    grep -q 'yq --version' .github/workflows/xp-claims.yml
  grep -q 'ajv-cli' .github/workflows/xp-claims.yml
  grep -q 'crossplane' .github/workflows/xp-claims.yml
}

@test "xp-claims workflow runs parse + render harnesses" {
  grep -q 'parse_claims.sh' .github/workflows/xp-claims.yml
  grep -q 'render_all.sh' .github/workflows/xp-claims.yml
}

@test "pr.yml requires the xp-claims job" {
  grep -q 'xp-claims' .github/workflows/pr.yml
}

@test "actionlint passes on xp-claims workflow" {
  command -v actionlint >/dev/null 2>&1 || skip "actionlint not installed"
  actionlint .github/workflows/xp-claims.yml
}

#!/usr/bin/env bash
# Render every claim under infra/crossplane/claims/{dev,staging,prod}
# against the matching Phase-8 composition + EnvironmentConfig + functions.
#
# Usage:
#   render_all.sh                          # render all, exit non-zero on first failure
#   render_all.sh --print dev/<file>.yaml  # print rendered output for one claim
#
# NOTE: The crossplane render CLI (v1.17.3) requires:
#   - composite-resource (file)
#   - composition (file)            <- one file, not a directory
#   - functions   (file or dir)
# We pick the composition file per (claim kind, env). This deviates from the
# plan's "$COMPOSITIONS dir" sketch which targeted the now-renamed
# `crossplane beta render`.
set -euo pipefail

ROOT="infra/crossplane"
CLAIMS="${ROOT}/claims"
COMPOSITIONS="${ROOT}/compositions"
FUNCTIONS="${ROOT}/functions"
ENV_CONFIGS="${ROOT}/environment-configs"

if ! command -v crossplane >/dev/null 2>&1; then
  echo "ERROR: crossplane CLI not installed" >&2
  exit 2
fi

print_one=""
if [[ "${1:-}" == "--print" ]]; then
  print_one="${2:?--print requires a relative claim path}"
fi

# Stage the function manifests Crossplane render will load.
# Only function packages with renderable images / runtime hints are used.
fn_dir=$(mktemp -d)
trap 'rm -rf "${fn_dir}"' EXIT
cp "${FUNCTIONS}/patch-and-transform.yaml" \
   "${FUNCTIONS}/go-templating.yaml" \
   "${FUNCTIONS}/environment-configs.yaml" \
   "${FUNCTIONS}/extra-resources.yaml" \
   "${FUNCTIONS}/auto-ready.yaml" \
   "${FUNCTIONS}/kcl.yaml" \
   "${fn_dir}/"

# Choose a Composition file per claim kind and env.
# Variants are picked per spec §8.4 sizing intent:
#   - prod  → ha variant where available
#   - dev/staging → singlenode/default variant
composition_for() {
  local kind="$1" env="$2"
  case "${kind}" in
    PostgresClusterClaim)
      if [[ "${env}" == "prod" ]]; then
        echo "${COMPOSITIONS}/core/xpostgrescluster-cnpg-ha.yaml"
      else
        echo "${COMPOSITIONS}/core/xpostgrescluster-cnpg-singlenode.yaml"
      fi
      ;;
    RedisClusterClaim)
      if [[ "${env}" == "prod" ]]; then
        echo "${COMPOSITIONS}/core/xrediscluster-kubeblocks-ha.yaml"
      else
        echo "${COMPOSITIONS}/core/xrediscluster-kubeblocks-singlenode.yaml"
      fi
      ;;
    BucketClaim)
      if [[ "${env}" == "prod" ]]; then
        echo "${COMPOSITIONS}/core/xbucket-multiprovider-ha.yaml"
      else
        echo "${COMPOSITIONS}/core/xbucket-multiprovider.yaml"
      fi
      ;;
    KafkaTopicClaim)
      echo "${COMPOSITIONS}/core/xkafkatopic-strimzi.yaml"
      ;;
    ServiceObservabilityClaim)
      echo "${COMPOSITIONS}/obs-identity/xserviceobservability-default.yaml"
      ;;
    KeycloakClientClaim)
      echo "${COMPOSITIONS}/obs-identity/xkeycloakclient-default.yaml"
      ;;
    *)
      echo ""
      ;;
  esac
}

render_one() {
  local claim="$1"
  local kind env composition
  kind=$(yq eval '.kind' "${claim}")
  env=$(yq eval '.metadata.namespace' "${claim}")
  composition=$(composition_for "${kind}" "${env}")
  if [[ -z "${composition}" ]]; then
    echo "SKIP (no composition mapping): kind=${kind} ${claim}" >&2
    return 0
  fi
  if [[ ! -f "${composition}" ]]; then
    echo "MISSING composition: ${composition} for ${claim}" >&2
    return 1
  fi

  crossplane render \
    "${claim}" \
    "${composition}" \
    "${fn_dir}" \
    -e "${ENV_CONFIGS}"
}

if [[ -n "${print_one}" ]]; then
  render_one "${CLAIMS}/${print_one}"
  exit 0
fi

fail=0
for env in dev staging prod; do
  while IFS= read -r -d '' f; do
    if ! render_one "${f}" >/dev/null; then
      echo "RENDER FAIL: ${f}" >&2
      fail=1
    fi
  done < <(find "${CLAIMS}/${env}" -maxdepth 1 -name '*.yaml' ! -name 'kustomization.yaml' -print0)
done
exit "${fail}"

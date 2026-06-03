#!/usr/bin/env bash
# infra/build/container.sh — Nx run-commands wrapper.
# Resolves <svc> -> apps/<svc>/build.yaml -> Dockerfile path + platforms + tags
# and invokes docker buildx with GHA cache (or local cache) and the rendered
# tags from spec Section 5.9.
#
# Usage:
#   infra/build/container.sh <svc>
#   infra/build/container.sh --dry-run <svc>
#   infra/build/container.sh --map-error '<buildx error string>'
#
# Cache mode: defaults to GHA scopes (matching the dry-run contract). Set
# LOCAL_CACHE=1 to write to the local FS cache at .cache/buildx/<svc> instead.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"

map_error() {
  local msg="$1"
  case "$msg" in
    *"failed to compute cache key: not found"*)
      echo "Lockfile changed since last build. Run \`task install\` then retry." ;;
    *"denied: permission_denied"*)
      echo "Registry login expired. Run \`task auth:registry\`." ;;
    *"exec format error"*)
      echo "You built for the wrong CPU. Add \`linux/arm64\` to \`build.yaml::platforms\` or run on amd64." ;;
    *"no space left on device"*)
      echo "BuildKit cache is full. Run \`task cache:prune\` (frees ~/.cache/buildx)." ;;
    *)
      echo "buildx failed: $msg" ;;
  esac
}

if [ "${1:-}" = "--map-error" ]; then
  shift
  map_error "$1"
  exit 0
fi

DRY_RUN=0
if [ "${1:-}" = "--dry-run" ]; then
  DRY_RUN=1
  shift
fi

svc="${1:-}"
if [ -z "$svc" ]; then
  echo "usage: $0 [--dry-run|--map-error] <svc>" >&2
  exit 2
fi

build_yaml="$repo_root/apps/$svc/build.yaml"
dockerfile="$repo_root/apps/$svc/Dockerfile"

if [ ! -f "$build_yaml" ]; then
  echo "FAIL: apps/$svc/build.yaml not found" >&2
  exit 2
fi
if [ ! -f "$dockerfile" ]; then
  echo "FAIL: apps/$svc/Dockerfile not found" >&2
  exit 2
fi

# Extract platforms list (one per line) from build.yaml.
platforms=$(python3 -c "
import yaml, sys
d = yaml.safe_load(open(sys.argv[1]))
print(','.join(d.get('platforms', ['linux/amd64'])))
" "$build_yaml")

# Per-arch GHA cache scopes. Use the first arch for the scope suffix when
# building multi-arch (buildx handles the per-platform cache fanout itself).
primary_arch=$(echo "$platforms" | cut -d, -f1 | sed 's|linux/||')

org="${GITHUB_REPOSITORY_OWNER:-local}"
gh_repo="${GITHUB_REPOSITORY:-}"
repo_name="${gh_repo##*/}"
repo_name="${repo_name:-ts-monorepo-template}"
sha="${GITHUB_SHA:-$(git -C "$repo_root" rev-parse HEAD 2>/dev/null || echo 0000000000000000000000000000000000000000)}"
short_sha="${sha:0:7}"
branch="${GITHUB_REF_NAME:-$(git -C "$repo_root" rev-parse --abbrev-ref HEAD 2>/dev/null || echo local)}"

# Tagging strategy — spec Section 5.9.
tags=( "ghcr.io/${org}/${svc}:sha-${sha}" )
if [ -n "${GITHUB_EVENT_NAME:-}" ] && [ "${GITHUB_EVENT_NAME}" = "pull_request" ] && [ -n "${PR_NUMBER:-}" ]; then
  tags+=( "ghcr.io/${org}/${svc}:pr-${PR_NUMBER}-sha-${short_sha}" )
fi
if [ -n "${branch}" ] && [ "${branch}" != "HEAD" ]; then
  tags+=( "ghcr.io/${org}/${svc}:${branch}" )
fi

tag_flags=""
for t in "${tags[@]}"; do
  tag_flags="$tag_flags --tag $t"
done

# Cache flags. Defaults to GHA cache scopes (matching dry-run contract).
# Set LOCAL_CACHE=1 to use a local FS cache instead.
if [ "${LOCAL_CACHE:-0}" = "1" ]; then
  cache_from="--cache-from=type=local,src=${repo_root}/.cache/buildx/${svc}"
  cache_to="--cache-to=type=local,dest=${repo_root}/.cache/buildx/${svc},mode=max"
else
  cache_from="--cache-from=type=gha,scope=${svc}-${primary_arch}"
  cache_to="--cache-to=type=gha,mode=max,scope=${svc}-${primary_arch}"
fi

push_flag="--push"
if [ "${PUSH:-1}" = "0" ] || [ "$DRY_RUN" = "1" ]; then
  push_flag="--load"
fi

cmd=(
  docker buildx build
  --platform "$platforms"
  --file "apps/$svc/Dockerfile"
  $tag_flags
  "$cache_from"
  "$cache_to"
  --provenance=true
  --sbom=true
  "$push_flag"
  "."
)

if [ "$DRY_RUN" = "1" ]; then
  printf '%s ' "${cmd[@]}"
  printf '\n'
  exit 0
fi

cd "$repo_root"
if ! "${cmd[@]}"; then
  map_error "$(tail -n1 /tmp/buildx-err.log 2>/dev/null || echo 'unknown')" >&2
  exit 1
fi

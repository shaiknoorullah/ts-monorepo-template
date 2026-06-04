#!/usr/bin/env bash
# tools/ci/cloud-prices/refresh.sh
#
# Weekly cloud price data refresh — scrapes upstream pricing pages,
# validates each output against cloud-prices-v1 schema, then atomically
# swaps the file in data/cloud-prices/.
#
# Invoked by .github/workflows/refresh-cloud-prices.yml on cron + dispatch.
# The workflow opens a Renovate-style PR with the chore(cloud-prices) prefix
# whenever the run produces any diff.

set -euo pipefail

DATA_DIR="data/cloud-prices"
TARGETS=(hetzner contabo ovh azure aws gcp cloudflare gha)

mkdir -p "${DATA_DIR}"

for cloud in "${TARGETS[@]}"; do
  echo "refreshing ${cloud}"
  python3 "tools/ci/cloud-prices/scrape_${cloud}.py" \
    > "${DATA_DIR}/${cloud}.yaml.tmp"
  # validate against schema before swapping in
  ajv validate \
    -s internal/schemas/cloud-prices-v1.schema.json \
    -d "${DATA_DIR}/${cloud}.yaml.tmp"
  mv "${DATA_DIR}/${cloud}.yaml.tmp" "${DATA_DIR}/${cloud}.yaml"
done

git diff --stat -- "${DATA_DIR}"

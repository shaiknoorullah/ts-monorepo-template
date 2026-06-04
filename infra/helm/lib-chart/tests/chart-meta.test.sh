#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
chart=infra/helm/lib-chart
test -f "$chart/Chart.yaml" || { echo "Chart.yaml missing"; exit 1; }
grep -qx 'type: library'    "$chart/Chart.yaml" || { echo "not library"; exit 1; }
grep -qx 'version: 0.1.0'   "$chart/Chart.yaml" || { echo "version mismatch"; exit 1; }
grep -qx 'name: lib-chart'  "$chart/Chart.yaml" || { echo "name mismatch"; exit 1; }
grep -q  "kubeVersion: '>=1.29.0-0'" "$chart/Chart.yaml" || { echo "kubeVersion mismatch"; exit 1; }
test -f "$chart/values.schema.json" || { echo "schema missing"; exit 1; }
python3 -c "import json,sys; s=json.load(open('$chart/values.schema.json')); \
  assert s['\$schema']=='https://json-schema.org/draft/2020-12/schema', 'schema dialect'; \
  assert 'image' in s['required'], 'image required missing'; \
  assert 'service' in s['required'], 'service required missing'; \
  ru=s['properties']['pod']['properties']['securityContext']['properties']['runAsUser']; \
  assert ru['minimum']==1000, 'runAsUser floor wrong'"
helm lint "$chart" >/tmp/helm-lint.out 2>&1 || { cat /tmp/helm-lint.out; exit 1; }
grep -q '1 chart(s) linted, 0 chart(s) failed' /tmp/helm-lint.out
echo OK

#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test -f project.json
jq -e '.name == "contracts"' project.json >/dev/null
jq -e '.targets.generate.executor == "nx:run-commands"' project.json >/dev/null
jq -e '.targets.lint.executor == "nx:run-commands"' project.json >/dev/null
jq -e '.targets["breaking-check"].executor == "nx:run-commands"' project.json >/dev/null
jq -e '.targets.generate.outputs | index("{projectRoot}/gen/go") != null' project.json >/dev/null
jq -e '.targets.generate.outputs | index("{projectRoot}/gen/ts") != null' project.json >/dev/null
jq -e '.targets.generate.outputs | index("{projectRoot}/gen/rs") != null' project.json >/dev/null
jq -e '.targets.generate.outputs | index("{projectRoot}/gen/py") != null' project.json >/dev/null
jq -e '.tags | index("scope:contracts") != null' project.json >/dev/null
echo "PASS"

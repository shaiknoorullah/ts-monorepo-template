#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
wf=.github/workflows/container-build.yml
test -f "$wf" || { echo "$wf missing"; exit 1; }
python3 - "$wf" <<'PY'
import sys, yaml
wf = yaml.safe_load(open(sys.argv[1]))
jobs = wf.get("jobs", {})
assert "helm-validate" in jobs, "helm-validate job missing"
j = jobs["helm-validate"]
assert j.get("runs-on") == "ubuntu-24.04", "runs-on must be ubuntu-24.04"
steps = j.get("steps", [])
names = [s.get("name", "") for s in steps]
required = [
    "Checkout",
    "Install helm",
    "Install kubeconform",
    "Run helm-validate",
]
for r in required:
    assert any(r in n for n in names), f"missing step containing: {r}"
# Pinned versions
text = open(sys.argv[1]).read()
assert "v3.16.3" in text, "helm v3.16.3 pin missing"
assert "0.6.7"  in text, "kubeconform 0.6.7 pin missing"
PY
echo OK

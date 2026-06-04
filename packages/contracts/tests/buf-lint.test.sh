#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
buf lint
test -f src/proto/user/v1/user.proto
grep -q "service UserService" src/proto/user/v1/user.proto
grep -q "rpc CreateUser" src/proto/user/v1/user.proto
grep -q "rpc GetUser" src/proto/user/v1/user.proto
grep -q "rpc ListUsers" src/proto/user/v1/user.proto
echo "PASS"

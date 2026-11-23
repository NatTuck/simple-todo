#!/usr/bin/env bash
set -euo pipefail

# Build locally and sync the static site to the server over SSH.
HOST="${DEPLOY_HOST:-nat@simple-todo.ironbeard.com}"
TARGET="${DEPLOY_TARGET:-/var/www/simple-todo}"

cd "$(dirname "$0")/.."

npm run build

rsync -az --delete --delay-updates --chmod=D755,F644 \
  -e ssh \
  dist/ "$HOST:$TARGET/"

echo "Deployed to https://simple-todo.ironbeard.com"

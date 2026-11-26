#!/usr/bin/env bash
# Copies the app's engine packs into public/packs/.
# Usage: scripts/sync-packs.sh [path-to-SuperRev-app-repo]
# With no path, sparse-clones the packs from GitHub (needs `gh auth`).
set -euo pipefail
cd "$(dirname "$0")/.."
SRC="${1:-}"
if [ -z "$SRC" ]; then
  SRC=$(mktemp -d)
  trap 'rm -rf "$SRC"' EXIT
  git clone -q --depth 1 --filter=blob:none --sparse -b feat/plan-2-audio-engine \
    "https://github.com/digiforcebusiness-cmyk/SuperRev.git" "$SRC"
  git -C "$SRC" sparse-checkout set assets/sounds/packs
fi
mkdir -p public/packs
cp -r "$SRC/assets/sounds/packs/." public/packs/
echo "packs: $(ls public/packs | wc -l) engines, $(du -sh public/packs | cut -f1)"

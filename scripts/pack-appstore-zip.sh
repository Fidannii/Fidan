#!/usr/bin/env bash
# Build a lean App-Store-ready ZIP (no node_modules / .git).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${1:-/opt/cursor/artifacts/downloads}"
NAME="MetroBuilder-2.0.0-appstore"
STAGE="$(mktemp -d)"
ZIP="$OUT_DIR/${NAME}.zip"

mkdir -p "$OUT_DIR"
cd "$ROOT"
npm run cap:sync

mkdir -p "$STAGE/$NAME"
tar -C "$ROOT" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=android/.gradle \
  --exclude=android/app/build \
  --exclude=android/build \
  --exclude=ios/App/Pods \
  --exclude=ios/App/build \
  --exclude=.DS_Store \
  -cf - . | tar -C "$STAGE/$NAME" -xf -

cp "$ROOT/APPSTORE_START.md" "$STAGE/$NAME/LIESMICH_APPSTORE.md"

cd "$STAGE"
rm -f "$ZIP"
zip -qr "$ZIP" "$NAME"
rm -rf "$STAGE"

echo "Created: $ZIP"
ls -lh "$ZIP"

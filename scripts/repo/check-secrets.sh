#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TRACKED_FILES="$(git ls-files | grep -Ev '(^|/)(node_modules|dist|coverage)/|(^|/)README\.md$|(^|/)\.env(\..*)?\.example$' || true)"

if [[ -z "$TRACKED_FILES" ]]; then
  echo "No tracked files to scan."
  exit 0
fi

PATTERN='sk_(live|test)_[A-Za-z0-9]{12,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----'

MATCHES=""

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  FILE_MATCHES="$(grep -nE "$PATTERN" "$file" || true)"

  if [[ -n "$FILE_MATCHES" ]]; then
    MATCHES+="${file}"$'\n'"${FILE_MATCHES}"$'\n'
  fi
done <<< "$TRACKED_FILES"

if [[ -n "$MATCHES" ]]; then
  echo "Potential secrets found in tracked files:"
  echo "$MATCHES"
  exit 1
fi

echo "No obvious secrets found in tracked files."

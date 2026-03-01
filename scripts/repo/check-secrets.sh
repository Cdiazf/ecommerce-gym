#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

TRACKED_FILES="$(git ls-files | rg -v '(^|/)(node_modules|dist|coverage)/|(^|/)README\.md$|(^|/)\.env(\..*)?\.example$')"

if [[ -z "$TRACKED_FILES" ]]; then
  echo "No tracked files to scan."
  exit 0
fi

PATTERN='sk_(live|test)_[A-Za-z0-9]{12,}|-----BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY-----'

MATCHES="$(printf '%s\n' "$TRACKED_FILES" | xargs rg -n --no-heading --pcre2 "$PATTERN" || true)"

if [[ -n "$MATCHES" ]]; then
  echo "Potential secrets found in tracked files:"
  echo "$MATCHES"
  exit 1
fi

echo "No obvious secrets found in tracked files."

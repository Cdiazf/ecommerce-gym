#!/usr/bin/env bash

set -euo pipefail

ENV_FILE="${1:-.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE"
  exit 1
fi

required_vars=(
  APP_DOMAIN
  CORS_ORIGIN
  VITE_API_URL
  AUTH_TOKEN_SECRET
  ADMIN_USER
  ADMIN_PASSWORD
  PGUSER
  PGPASSWORD
  CULQI_SECRET_KEY
  CULQI_WEBHOOK_SECRET
)

placeholder_patterns=(
  "replace-"
  "change-me"
  "example.com"
  "shop.example.com"
  "sk_live_replace_me"
  "sk_test_replace_me"
  "<owner>"
  "<repo>"
)

failures=()

get_value() {
  local var_name="$1"
  local line

  line="$(grep -E "^${var_name}=" "$ENV_FILE" | tail -n 1 || true)"

  if [[ -z "$line" ]]; then
    return 1
  fi

  printf '%s' "${line#*=}"
}

for var_name in "${required_vars[@]}"; do
  value="$(get_value "$var_name" || true)"

  if [[ -z "$value" ]]; then
    failures+=("Missing required variable: $var_name")
    continue
  fi

  for pattern in "${placeholder_patterns[@]}"; do
    if [[ "$value" == *"$pattern"* ]]; then
      failures+=("Variable $var_name still contains a placeholder-like value: $value")
      break
    fi
  done
done

if [[ "$(get_value APP_DOMAIN || true)" == "localhost" ]]; then
  echo "Warning: APP_DOMAIN=localhost. This is acceptable for local validation only."
fi

if [[ "$(get_value CORS_ORIGIN || true)" == "https://localhost" ]]; then
  echo "Warning: CORS_ORIGIN=https://localhost. This is acceptable for local validation only."
fi

if [[ "$(get_value VITE_API_URL || true)" == "https://localhost/api" ]]; then
  echo "Warning: VITE_API_URL=https://localhost/api. This is acceptable for local validation only."
fi

if ((${#failures[@]} > 0)); then
  echo "Production env validation failed for $ENV_FILE:"
  printf ' - %s\n' "${failures[@]}"
  exit 1
fi

echo "Production env validation passed for $ENV_FILE."

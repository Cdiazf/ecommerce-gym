#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-https://localhost/api}"
HEALTH_URL="${HEALTH_URL:-https://localhost/health}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-}"
USER_NAME="${USER_NAME:-cliente}"
USER_PASS="${USER_PASS:-}"
CURL_INSECURE="${CURL_INSECURE:-true}"

if [[ -z "${ADMIN_PASS}" ]]; then
  echo "ADMIN_PASS is required."
  exit 1
fi

if [[ -z "${USER_PASS}" ]]; then
  echo "USER_PASS is required."
  exit 1
fi

CURL_OPTS=(-sS)
if [[ "${CURL_INSECURE}" == "true" ]]; then
  CURL_OPTS+=(-k)
fi

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local headers=()
  if (( $# > 3 )); then
    shift 3
    headers=("$@")
  fi
  local response
  local status
  local payload

  if [[ -n "${body}" ]]; then
    if (( ${#headers[@]} > 0 )); then
      response="$(curl "${CURL_OPTS[@]}" -X "${method}" "${url}" "${headers[@]}" -H 'Content-Type: application/json' -d "${body}" -w $'\n%{http_code}')" || return 1
    else
      response="$(curl "${CURL_OPTS[@]}" -X "${method}" "${url}" -H 'Content-Type: application/json' -d "${body}" -w $'\n%{http_code}')" || return 1
    fi
  else
    if (( ${#headers[@]} > 0 )); then
      response="$(curl "${CURL_OPTS[@]}" -X "${method}" "${url}" "${headers[@]}" -w $'\n%{http_code}')" || return 1
    else
      response="$(curl "${CURL_OPTS[@]}" -X "${method}" "${url}" -w $'\n%{http_code}')" || return 1
    fi
  fi

  status="${response##*$'\n'}"
  payload="${response%$'\n'*}"
  printf '%s\n%s' "${status}" "${payload}"
}

expect_status() {
  local expected="$1"
  local response="$2"
  local status payload
  status="$(printf '%s' "${response}" | head -n 1)"
  payload="$(printf '%s' "${response}" | tail -n +2)"

  if [[ "${status}" != "${expected}" ]]; then
    echo "${payload}" >&2
    fail "Expected HTTP ${expected}, got ${status}"
  fi

  printf '%s' "${payload}"
}

expect_status_one_of() {
  local allowed="$1"
  local response="$2"
  local status payload
  status="$(printf '%s' "${response}" | head -n 1)"
  payload="$(printf '%s' "${response}" | tail -n +2)"

  case ",${allowed}," in
    *",${status},"*) ;;
    *)
      echo "${payload}" >&2
      fail "Expected HTTP one of [${allowed}], got ${status}"
      ;;
  esac

  printf '%s' "${payload}"
}

extract_json() {
  local field="$1"
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const obj=JSON.parse(d); const val=obj['${field}']; if (val === undefined || val === null) process.exit(2); console.log(typeof val === 'string' ? val : JSON.stringify(val));});"
}

echo "1/6 Health"
health_payload="$(request GET "${HEALTH_URL}" "" )" || fail "Health endpoint unreachable"
expect_status "200" "${health_payload}" >/dev/null
pass "Health endpoint"

echo "2/6 Public catalog"
products_payload="$(request GET "${BASE_URL}/products" "" )" || fail "Products endpoint unreachable"
products_json="$(expect_status "200" "${products_payload}")"
printf '%s' "${products_json}" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const arr=JSON.parse(d); if (!Array.isArray(arr) || arr.length === 0) process.exit(1);});" || fail "Products payload is empty"
pass "Public catalog"

echo "3/6 Admin login"
admin_login_payload="$(request POST "${BASE_URL}/auth/login" "{\"username\":\"${ADMIN_USER}\",\"password\":\"${ADMIN_PASS}\"}")" || fail "Admin login request failed"
admin_login_json="$(expect_status_one_of "200,201" "${admin_login_payload}")"
ADMIN_TOKEN="$(printf '%s' "${admin_login_json}" | extract_json accessToken)" || fail "Admin login missing token"
ADMIN_ROLE="$(printf '%s' "${admin_login_json}" | extract_json role)" || fail "Admin login missing role"
[[ "${ADMIN_ROLE}" == "ADMIN" ]] || fail "Admin login returned role ${ADMIN_ROLE}"
pass "Admin login"

echo "4/6 User login"
user_login_payload="$(request POST "${BASE_URL}/auth/login" "{\"username\":\"${USER_NAME}\",\"password\":\"${USER_PASS}\"}")" || fail "User login request failed"
user_login_json="$(expect_status_one_of "200,201" "${user_login_payload}")"
USER_TOKEN="$(printf '%s' "${user_login_json}" | extract_json accessToken)" || fail "User login missing token"
pass "User login"

echo "5/6 Admin protected endpoints"
admin_users_payload="$(request GET "${BASE_URL}/admin/users" "" -H "Authorization: Bearer ${ADMIN_TOKEN}")" || fail "Admin users request failed"
expect_status "200" "${admin_users_payload}" >/dev/null
admin_payments_payload="$(request GET "${BASE_URL}/admin/payments" "" -H "Authorization: Bearer ${ADMIN_TOKEN}")" || fail "Admin payments request failed"
expect_status "200" "${admin_payments_payload}" >/dev/null
pass "Admin protected endpoints"

echo "6/6 User protected endpoints"
my_orders_payload="$(request GET "${BASE_URL}/orders/my" "" -H "Authorization: Bearer ${USER_TOKEN}")" || fail "My orders request failed"
expect_status "200" "${my_orders_payload}" >/dev/null
addresses_payload="$(request GET "${BASE_URL}/me/addresses" "" -H "Authorization: Bearer ${USER_TOKEN}")" || fail "Addresses request failed"
expect_status "200" "${addresses_payload}" >/dev/null
pass "User protected endpoints"

echo "Staging smoke test passed."

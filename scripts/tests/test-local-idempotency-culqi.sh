#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
LOGIN_USER="${LOGIN_USER:-cliente}"
LOGIN_PASS="${LOGIN_PASS:-123456}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"
ORDER_PRODUCT_ID="${ORDER_PRODUCT_ID:-shoe-01}"
ALT_PRODUCT_ID="${ALT_PRODUCT_ID:-shirt-01}"
ORDER_QUANTITY="${ORDER_QUANTITY:-1}"
POLL_SECONDS="${POLL_SECONDS:-30}"
ADDRESS_LABEL="${ADDRESS_LABEL:-Idempotency Test Address}"
USE_HTTPS="${USE_HTTPS:-false}"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

info() {
  echo "[INFO] $1"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

curl_base() {
  if [[ "$USE_HTTPS" == "true" ]]; then
    curl -k -sS "$@"
  else
    curl -sS "$@"
  fi
}

json_get() {
  local key="$1"
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d||'{}');const v=j['${key}'];if(v===undefined||v===null){process.exit(2)};process.stdout.write(typeof v==='string'?v:JSON.stringify(v));});"
}

json_array_contains_id() {
  local wanted_id="$1"
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const arr=JSON.parse(d||'[]');if(!Array.isArray(arr)||!arr.some(i=>i.id==='${wanted_id}'))process.exit(2);});"
}

poll_until_field() {
  local label="$1"
  local url="$2"
  local field="$3"

  local elapsed=0
  while [ "$elapsed" -lt "$POLL_SECONDS" ]; do
    local body
    body="$(curl_base "$url")" || fail "${label}: request failed"

    if echo "$body" | json_get "$field" >/dev/null 2>&1; then
      echo "$body"
      return 0
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  fail "${label}: field ${field} not available after ${POLL_SECONDS}s"
}

require_cmd curl
require_cmd node
require_cmd bash

info "1/9 User login"
login_body="$(curl_base -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$LOGIN_USER\",\"password\":\"$LOGIN_PASS\"}")" \
  || fail "User login request failed"
token="$(echo "$login_body" | json_get accessToken)" || fail "User login failed"

info "2/9 Admin login"
admin_login_body="$(curl_base -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")" \
  || fail "Admin login request failed"
admin_token="$(echo "$admin_login_body" | json_get accessToken)" || fail "Admin login failed"

info "3/9 Ensure product stock"
curl_base -X POST "$BASE_URL/inventory/stock" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $admin_token" \
  -d "{\"productId\":\"$ORDER_PRODUCT_ID\",\"variantId\":null,\"quantityOnHand\":100,\"status\":\"ACTIVE\"}" >/dev/null \
  || fail "Failed to upsert inventory for $ORDER_PRODUCT_ID"

curl_base -X POST "$BASE_URL/inventory/stock" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $admin_token" \
  -d "{\"productId\":\"$ALT_PRODUCT_ID\",\"variantId\":null,\"quantityOnHand\":100,\"status\":\"ACTIVE\"}" >/dev/null \
  || fail "Failed to upsert inventory for $ALT_PRODUCT_ID"

info "4/9 Create shipping address"
address_body="$(curl_base -X POST "$BASE_URL/me/addresses" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -d "{
    \"label\":\"$ADDRESS_LABEL\",
    \"recipientName\":\"Cliente Demo\",
    \"phone\":\"999888777\",
    \"line1\":\"Av. Principal 123\",
    \"district\":\"Miraflores\",
    \"city\":\"Lima\",
    \"region\":\"Lima\",
    \"postalCode\":\"15074\",
    \"reference\":\"Porton negro\"
  }")" || fail "Create shipping address failed"
address_id="$(echo "$address_body" | json_get id)" || fail "Shipping address id missing"

info "5/9 Create YAPE order with Idempotency-Key"
order_key="local-order-idem-001"
order_payload="{\"shippingAddressId\":\"$address_id\",\"paymentMethod\":\"YAPE\",\"items\":[{\"productId\":\"$ORDER_PRODUCT_ID\",\"quantity\":$ORDER_QUANTITY}]}"
order_body_1="$(curl_base -X POST "$BASE_URL/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -H "Idempotency-Key: $order_key" \
  -d "$order_payload")" || fail "Create order request failed"
order_id_1="$(echo "$order_body_1" | json_get id)" || fail "First order response missing id"

info "6/9 Repeat same order request and expect same order id"
order_body_2="$(curl_base -X POST "$BASE_URL/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -H "Idempotency-Key: $order_key" \
  -d "$order_payload")" || fail "Repeated order request failed"
order_id_2="$(echo "$order_body_2" | json_get id)" || fail "Second order response missing id"
[[ "$order_id_1" == "$order_id_2" ]] || fail "Idempotent repeat returned a different order id"

info "7/9 Reuse same key with different payload and expect 409"
status_code="$(
  curl_base -o /tmp/agent-ai-idem-order.out -w '%{http_code}' -X POST "$BASE_URL/orders" \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $token" \
    -H "Idempotency-Key: $order_key" \
    -d "{\"shippingAddressId\":\"$address_id\",\"paymentMethod\":\"YAPE\",\"items\":[{\"productId\":\"$ALT_PRODUCT_ID\",\"quantity\":1}]}"
)"
[[ "$status_code" == "409" ]] || fail "Expected 409 for idempotency key reuse with different payload, got $status_code"

info "8/9 Replay local Culqi webhook as paid"
bash scripts/payments/send-culqi-webhook.sh "$order_id_1" paid "$BASE_URL/payments/culqi/webhook" >/dev/null \
  || fail "Local Culqi webhook replay failed"

info "8.1/9 Wait payment approval"
payment_body="$(poll_until_field "Payment" "$BASE_URL/payments/$order_id_1" status)"
payment_status="$(echo "$payment_body" | json_get status)" || fail "Payment status missing"
[[ "$payment_status" == "APPROVED" ]] || fail "Payment status is $payment_status (expected APPROVED)"

info "8.2/9 Wait shipment creation"
shipment_body="$(poll_until_field "Shipment" "$BASE_URL/shipments/$order_id_1" id)"
shipment_id="$(echo "$shipment_body" | json_get id)" || fail "Shipment id missing"

info "9/9 Validate order visibility"
orders_body="$(curl_base "$BASE_URL/orders/my" -H "Authorization: Bearer $token")" || fail "Get orders/my failed"
echo "$orders_body" | json_array_contains_id "$order_id_1" || fail "orders/my missing $order_id_1"

echo "[PASS] Local idempotency + Culqi replay flow OK"
echo "[PASS] orderId=$order_id_1"
echo "[PASS] paymentStatus=$payment_status"
echo "[PASS] shipmentId=$shipment_id"

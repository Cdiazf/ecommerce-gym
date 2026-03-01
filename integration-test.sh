#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
LOGIN_USER="${LOGIN_USER:-cliente}"
LOGIN_PASS="${LOGIN_PASS:-123456}"
ADMIN_USER="${ADMIN_USER:-admin}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"
ORDER_PRODUCT_ID="${ORDER_PRODUCT_ID:-shoe-01}"
ORDER_QUANTITY="${ORDER_QUANTITY:-1}"
POLL_SECONDS="${POLL_SECONDS:-30}"
ADDRESS_LABEL="${ADDRESS_LABEL:-Casa Principal}"

fail() {
  echo "[FAIL] $1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

json_get() {
  local key="$1"
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d||'{}');const v=j['${key}'];if(v===undefined||v===null){process.exit(2)};process.stdout.write(String(v));});"
}

json_assert_not_null() {
  local field="$1"
  node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const j=JSON.parse(d||'null');if(j===null||j['${field}']==null){process.exit(2)};});"
}

poll_until_not_null() {
  local label="$1"
  local url="$2"
  local field="$3"

  local elapsed=0
  while [ "$elapsed" -lt "$POLL_SECONDS" ]; do
    local body
    body="$(curl -sS "$url")" || fail "${label}: request failed"

    if echo "$body" | json_assert_not_null "$field" 2>/dev/null; then
      echo "$body"
      return 0
    fi

    sleep 1
    elapsed=$((elapsed + 1))
  done

  fail "${label}: not available after ${POLL_SECONDS}s"
}

require_cmd curl
require_cmd node

echo "[INFO] 1/6 Login"
login_body="$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$LOGIN_USER\",\"password\":\"$LOGIN_PASS\"}")" || fail "Login request failed"

token="$(echo "$login_body" | json_get accessToken)" || fail "Login failed or accessToken missing"

echo "[INFO] 1.1/6 Admin login"
admin_login_body="$(curl -sS -X POST "$BASE_URL/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$ADMIN_USER\",\"password\":\"$ADMIN_PASS\"}")" || fail "Admin login request failed"

admin_token="$(echo "$admin_login_body" | json_get accessToken)" || fail "Admin login failed or accessToken missing"

echo "[INFO] 2/6 Catalog check"
products_body="$(curl -sS "$BASE_URL/products")" || fail "Products endpoint failed"
echo "$products_body" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const arr=JSON.parse(d||'[]');if(!Array.isArray(arr)){process.exit(2)};if(!arr.some(p=>p.id==='${ORDER_PRODUCT_ID}'))process.exit(3);});" \
  || fail "Product ${ORDER_PRODUCT_ID} not found in catalog"

echo "[INFO] 3/6 Ensure inventory stock"
curl -sS -X POST "$BASE_URL/inventory/stock" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $admin_token" \
  -d "{\"productId\":\"$ORDER_PRODUCT_ID\",\"variantId\":null,\"quantityOnHand\":100,\"status\":\"ACTIVE\"}" >/dev/null \
  || fail "Failed to upsert inventory stock"

echo "[INFO] 4/8 Ensure shipping address"
address_body="$(curl -sS -X POST "$BASE_URL/me/addresses" \
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
    \"reference\":\"Puerta negra\",
    \"isDefault\":true
  }")" || fail "Create shipping address failed"

address_id="$(echo "$address_body" | json_get id)" || fail "Shipping address id missing"

echo "[INFO] 5/8 Shipping quote"
quote_body="$(curl -sS -X POST "$BASE_URL/shipping/quote" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -d "{\"addressId\":\"$address_id\",\"items\":[{\"productId\":\"$ORDER_PRODUCT_ID\",\"quantity\":$ORDER_QUANTITY}]}")" \
  || fail "Shipping quote failed"
echo "$quote_body" | json_assert_not_null shippingCost || fail "Shipping quote missing shippingCost"

echo "[INFO] 6/8 Cart roundtrip"
curl -sS -X POST "$BASE_URL/cart/items" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -d "{\"productId\":\"$ORDER_PRODUCT_ID\",\"quantity\":$ORDER_QUANTITY}" >/dev/null \
  || fail "Add to cart failed"

cart_body="$(curl -sS "$BASE_URL/cart" -H "Authorization: Bearer $token")" || fail "Get cart failed"
echo "$cart_body" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const arr=JSON.parse(d||'[]');if(!Array.isArray(arr)||!arr.some(i=>i.productId==='${ORDER_PRODUCT_ID}'))process.exit(2);});" \
  || fail "Cart does not contain ${ORDER_PRODUCT_ID}"

echo "[INFO] 7/8 Create order"
order_body="$(curl -sS -X POST "$BASE_URL/orders" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $token" \
  -d "{\"paymentMethod\":\"AUTO\",\"shippingAddressId\":\"$address_id\",\"items\":[{\"productId\":\"$ORDER_PRODUCT_ID\",\"quantity\":$ORDER_QUANTITY}]}")" \
  || fail "Create order request failed"

order_id="$(echo "$order_body" | json_get id)" || fail "Order creation failed: id missing"
order_total="$(echo "$order_body" | json_get totalAmount)" || fail "Order total missing"

echo "[INFO] 8/8 Wait payment for orderId=$order_id"
payment_body="$(poll_until_not_null "Payment" "$BASE_URL/payments/$order_id" id)"

payment_status="$(echo "$payment_body" | json_get status)" || fail "Payment status missing"
[ "$payment_status" = "APPROVED" ] || fail "Payment status is $payment_status (expected APPROVED)"

echo "[INFO] 8.1/8 Wait shipment for orderId=$order_id"
shipment_body="$(poll_until_not_null "Shipment" "$BASE_URL/shipments/$order_id" id)"

shipment_status="$(echo "$shipment_body" | json_get status)" || fail "Shipment status missing"
[ "$shipment_status" = "CREATED" ] || fail "Shipment status is $shipment_status (expected CREATED)"

echo "[INFO] 8.2/8 Validate admin visibility"
admin_orders_body="$(curl -sS "$BASE_URL/admin/orders" -H "Authorization: Bearer $admin_token")" || fail "Admin orders request failed"
echo "$admin_orders_body" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const arr=JSON.parse(d||'[]');if(!Array.isArray(arr)||!arr.some(o=>o.id==='${order_id}'))process.exit(2);});" \
  || fail "Admin orders missing order ${order_id}"

echo "[PASS] Integration flow OK"
echo "[PASS] orderId=$order_id"
echo "[PASS] total=$order_total"
echo "[PASS] payment=$(echo "$payment_body" | json_get id)"
echo "[PASS] shipment=$(echo "$shipment_body" | json_get id)"

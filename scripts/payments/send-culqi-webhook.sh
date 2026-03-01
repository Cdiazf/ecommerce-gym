#!/usr/bin/env bash

set -euo pipefail

if [[ "$#" -lt 2 || "$#" -gt 4 ]]; then
  echo "Usage: $0 <internal_order_id> <paid|expired|failed> [endpoint] [external_order_id]" >&2
  exit 1
fi

INTERNAL_ORDER_ID="$1"
STATE="$2"
ENDPOINT="${3:-http://localhost:3000/payments/culqi/webhook}"
EXTERNAL_ORDER_ID="${4:-ord_live_test_$(date +%s)}"

case "$STATE" in
  paid|expired|failed) ;;
  *)
    echo "Invalid state: $STATE (expected: paid, expired, failed)" >&2
    exit 1
    ;;
esac

PAYLOAD="$(cat <<JSON
{
  "type": "order.status.changed",
  "data": {
    "object": {
      "id": "$EXTERNAL_ORDER_ID",
      "order_number": "$INTERNAL_ORDER_ID",
      "payment_code": "CULQI-CODE-$INTERNAL_ORDER_ID",
      "state": "$STATE",
      "metadata": {
        "internalOrderId": "$INTERNAL_ORDER_ID",
        "paymentMethod": "YAPE"
      }
    }
  }
}
JSON
)"

curl -i -X POST "$ENDPOINT" \
  -H 'Content-Type: application/json' \
  -d "$PAYLOAD"

#!/usr/bin/env bash
set -euo pipefail

# ImpactMap AI Smoke Test Script
# Tests live CloudFront endpoint and API Gateway HTTP API

API_URL="${1:-http://localhost:8000}"

echo "=== Running ImpactMap Smoke Tests against $API_URL ==="

# 1. Check GET /health
echo "[1/4] Checking GET /health..."
HEALTH_RESP=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$HEALTH_RESP" | tail -n1)
BODY=$(echo "$HEALTH_RESP" | head -n -1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "FAILED: GET /health returned $HTTP_CODE: $BODY"
  exit 1
fi
echo "PASSED (200 OK)"

# 2. Check GET /meta
echo "[2/4] Checking GET /meta..."
META_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/meta")
if [ "$META_CODE" -ne 200 ]; then
  echo "FAILED: GET /meta returned $META_CODE"
  exit 1
fi
echo "PASSED (200 OK)"

# 3. Check POST /scenarios with valid scenario
echo "[3/4] Checking POST /scenarios (Valid)..."
SCENARIO_JSON="contracts/examples/scenario.json"
POST_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/scenarios" \
  -H "Content-Type: application/json" \
  -d @"$SCENARIO_JSON")
HTTP_CODE=$(echo "$POST_RESP" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ] && [ "$HTTP_CODE" -ne 202 ]; then
  echo "FAILED: POST /scenarios returned $HTTP_CODE"
  exit 1
fi
echo "PASSED ($HTTP_CODE Success)"

# 4. Check POST /scenarios with invalid body -> 400 with VALIDATION_ERROR
echo "[4/4] Checking POST /scenarios (Invalid input rejection)..."
BAD_RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/scenarios" \
  -H "Content-Type: application/json" \
  -d '{"hazard": "flood", "daily_rain_mm": [-5.0]}')
HTTP_CODE=$(echo "$BAD_RESP" | tail -n1)
BODY=$(echo "$BAD_RESP" | head -n -1)
if [ "$HTTP_CODE" -ne 400 ]; then
  echo "FAILED: Invalid POST did not return 400 (got $HTTP_CODE)"
  exit 1
fi
if [[ "$BODY" != *"VALIDATION_ERROR"* ]]; then
  echo "FAILED: Response does not contain VALIDATION_ERROR: $BODY"
  exit 1
fi
echo "PASSED (400 VALIDATION_ERROR properly returned)"

echo "=== ALL SMOKE TESTS PASSED! ==="

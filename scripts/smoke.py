import sys
import json
from pathlib import Path
from fastapi.testclient import TestClient

from services.api.app.main import app

def run_smoke_tests():
    print("=== Running ImpactMap Smoke Tests via TestClient ===")
    client = TestClient(app)

    # 1. /health
    print("[1/4] Checking GET /health...")
    r = client.get("/health")
    assert r.status_code == 200, f"Health check failed: {r.status_code}"
    assert r.json()["status"] == "ok"
    assert "x-request-id" in r.headers
    print("PASSED (200 OK)")

    # 2. /meta
    print("[2/4] Checking GET /meta...")
    r = client.get("/meta")
    assert r.status_code == 200, f"Meta check failed: {r.status_code}"
    print("PASSED (200 OK)")

    # 3. /scenarios valid
    print("[3/4] Checking POST /scenarios with valid payload...")
    example_path = Path("contracts/examples/scenario.json")
    with open(example_path, "r", encoding="utf-8") as f:
        scenario_data = json.load(f)
    r = client.post("/scenarios", json=scenario_data)
    assert r.status_code in (200, 202), f"Scenario create failed: {r.status_code}"
    assert len(r.json()["cache_key"]) == 32
    print(f"PASSED ({r.status_code} Success)")

    # 4. /scenarios invalid
    print("[4/4] Checking POST /scenarios input rejection...")
    bad_payload = {"hazard": "flood", "daily_rain_mm": [-5.0]}
    r = client.post("/scenarios", json=bad_payload)
    assert r.status_code == 400, f"Expected 400, got {r.status_code}"
    body = r.json()
    assert "error" in body
    assert body["error"]["code"] == "VALIDATION_ERROR"
    print("PASSED (400 VALIDATION_ERROR properly returned)")

    print("=== ALL SMOKE TESTS PASSED! ===")

if __name__ == "__main__":
    run_smoke_tests()

import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "x-request-id" in response.headers


def test_meta_endpoint():
    response = client.get("/meta")
    assert response.status_code == 200
    data = response.json()
    assert "versions" in data
    assert "region_id" in data
    assert "x-request-id" in response.headers


def test_regions_and_hazards():
    r_resp = client.get("/regions")
    assert r_resp.status_code == 200
    assert len(r_resp.json()) >= 1

    h_resp = client.get("/hazards")
    assert h_resp.status_code == 200
    assert len(h_resp.json()) >= 1


def test_scenarios_library():
    response = client.get("/scenarios/library")
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 2
    assert any(i["slug"] == "baseline-dry" for i in items)


def test_create_scenario_valid():
    payload = {
        "hazard": "flood",
        "region_id": "pilot_01",
        "start_date": "2026-10-25",
        "daily_rain_mm": [25.0, 40.0, 15.0],
        "antecedent_30d_mm": 120.0,
        "spatial": {"type": "uniform"},
        "closure_factor": 1.0,
        "failure_mode": "independent",
        "n_samples": 200,
        "seed": 42,
        "forced_closed": [],
        "forced_open": []
    }
    response = client.post("/scenarios", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "done"
    assert len(data["cache_key"]) == 32
    assert "x-request-id" in response.headers


def test_create_scenario_invalid_validation_error_shape():
    # Invalid: 11 days of rain (> 10 limit)
    payload = {
        "hazard": "flood",
        "region_id": "pilot_01",
        "start_date": "2026-10-25",
        "daily_rain_mm": [20.0] * 11,
        "antecedent_30d_mm": 120.0,
        "spatial": {"type": "uniform"}
    }
    response = client.post("/scenarios", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "daily_rain_mm" in str(data["error"]["field"])
    assert "request_id" in data["error"]
    assert "x-request-id" in response.headers


def test_results_and_explain_endpoints():
    cache_key = "a1b2c3d4e5f60718293a4b5c6d7e8f90"

    # Results summary
    res_resp = client.get(f"/results/{cache_key}")
    assert res_resp.status_code == 200
    assert res_resp.json()["cache_key"] == cache_key

    # Columnar segments
    seg_resp = client.get(f"/results/{cache_key}/segments")
    assert seg_resp.status_code == 200
    assert "segment_ids" in seg_resp.json()

    # Segment explain
    sexp_resp = client.get(f"/segments/102/explain?cache_key={cache_key}")
    assert sexp_resp.status_code == 200
    assert sexp_resp.json()["segment_id"] == 102

    # Facility explain
    fexp_resp = client.get(f"/facilities/fac_00017/explain?cache_key={cache_key}")
    assert fexp_resp.status_code == 200
    assert fexp_resp.json()["facility_id"] == "fac_00017"


def test_whatif_and_compare():
    whatif_resp = client.post("/whatif", json={
        "base_cache_key": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
        "forced_closed": [108],
        "forced_open": [102]
    })
    assert whatif_resp.status_code == 200

    comp_resp = client.get("/compare?a=key11111111111111111111111111111&b=key22222222222222222222222222222")
    assert comp_resp.status_code == 200
    assert "people_cut_off_delta" in comp_resp.json()


def test_model_card_and_backtests():
    mc_resp = client.get("/model-card")
    assert mc_resp.status_code == 200
    assert "metrics" in mc_resp.json()

    bt_resp = client.get("/backtests")
    assert bt_resp.status_code == 200
    assert len(bt_resp.json()) >= 1

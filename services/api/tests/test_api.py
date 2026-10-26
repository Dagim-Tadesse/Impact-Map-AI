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


def test_ready_endpoint():
    response = client.get("/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    assert data["capabilities"]["map_data"] is True
    assert data["capabilities"]["graph"] is True
    assert data["capabilities"]["terrain"] is True
    assert data["capabilities"]["model"] is True
    assert data["capabilities"]["calibration"] is True


def test_create_scenario_valid():
    payload = {
        "hazard": "flood",
        "region_id": "awash_01",
        "start_date": "2026-10-25",
        "daily_rain_mm": [25.0, 40.0, 15.0],
        "antecedent_30d_mm": 120.0,
        "spatial": {"type": "uniform"},
        "closure_factor": 1.0,
        "failure_mode": "independent",
        "n_samples": 50,
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

    # Verify result has execution_mode live_model
    res_resp = client.get(f"/results/{data['cache_key']}")
    assert res_resp.status_code == 200
    assert res_resp.json()["execution_mode"] == "live_model"


def test_create_scenario_unsupported_region():
    payload = {
        "hazard": "flood",
        "region_id": "unsupported_region_xyz",
        "start_date": "2026-10-25",
        "daily_rain_mm": [20.0],
        "antecedent_30d_mm": 120.0,
        "spatial": {"type": "uniform"}
    }
    response = client.post("/scenarios", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "region_id" in data["error"]["field"]


def test_create_scenario_unsupported_hazard():
    payload = {
        "hazard": "landslide",
        "region_id": "awash_01",
        "start_date": "2026-10-25",
        "daily_rain_mm": [20.0],
        "antecedent_30d_mm": 120.0,
        "spatial": {"type": "uniform"}
    }
    response = client.post("/scenarios", json=payload)
    assert response.status_code == 400
    data = response.json()
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "hazard" in data["error"]["field"]


def test_create_scenario_invalid_validation_error_shape():
    # Invalid: 11 days of rain (> 10 limit)
    payload = {
        "hazard": "flood",
        "region_id": "awash_01",
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
    # 404 on arbitrary unknown keys (no fabricated results!)
    fake_key = "a1b2c3d4e5f60718293a4b5c6d7e8f99"
    assert client.get(f"/results/{fake_key}").status_code == 404
    assert client.get(f"/results/{fake_key}/segments").status_code == 404
    assert client.get(f"/jobs/job-not-real-1234").status_code == 404
    assert client.get(f"/segments/102/explain?cache_key={fake_key}").status_code == 404
    assert client.get(f"/facilities/fac_00010/explain?cache_key={fake_key}").status_code == 404

    # Preset demo scenarios load properly with precomputed_demo badge
    preset_key = "baseline-dry"
    res_resp = client.get(f"/results/{preset_key}")
    assert res_resp.status_code == 200
    assert res_resp.json()["execution_mode"] == "precomputed_demo"

    seg_resp = client.get(f"/results/{preset_key}/segments")
    assert seg_resp.status_code == 200
    assert "segment_ids" in seg_resp.json()

    sexp_resp = client.get(f"/segments/102/explain?cache_key={preset_key}")
    assert sexp_resp.status_code == 200
    assert sexp_resp.json()["segment_id"] == 102

    fexp_resp = client.get(f"/facilities/fac_00010/explain?cache_key={preset_key}")
    assert fexp_resp.status_code == 200
    assert fexp_resp.json()["facility_id"] == "fac_00010"


def test_whatif_and_compare():
    # 404 on unknown base key
    bad_whatif = client.post("/whatif", json={
        "base_cache_key": "not-a-real-base-key-12345678",
        "forced_closed": [108]
    })
    assert bad_whatif.status_code == 404

    # Successful whatif branching from preset
    whatif_resp = client.post("/whatif", json={
        "base_cache_key": "baseline-dry",
        "forced_closed": [108],
        "forced_open": [102]
    })
    assert whatif_resp.status_code == 200

    # 404 on comparing non-existent keys
    bad_comp = client.get("/compare?a=key11111111111111111111111111111&b=key22222222222222222222222222222")
    assert bad_comp.status_code == 404

    # Valid compare between presets
    comp_resp = client.get("/compare?a=baseline-dry&b=awash-2020-replay")
    assert comp_resp.status_code == 200
    assert "people_cut_off_delta" in comp_resp.json()


def test_model_card_and_backtests():
    mc_resp = client.get("/model-card")
    assert mc_resp.status_code == 200
    assert "metrics" in mc_resp.json()

    bt_resp = client.get("/backtests")
    assert bt_resp.status_code == 200
    assert len(bt_resp.json()) >= 1


def test_static_map_layers():
    fac_resp = client.get("/data/facilities.geojson")
    assert fac_resp.status_code == 200
    data = fac_resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 13

    comm_resp = client.get("/data/communities.geojson")
    assert comm_resp.status_code == 200
    cdata = comm_resp.json()
    assert cdata["type"] == "FeatureCollection"
    assert len(cdata["features"]) == 263


def test_demo_cascade():
    idx_resp = client.get("/demo/index.json")
    assert idx_resp.status_code == 200
    data = idx_resp.json()
    assert "demos" in data
    assert len(data["demos"]) == 3

    step_resp = client.get("/demo/awash-2020-replay/step_1.json")
    assert step_resp.status_code == 200
    sdata = step_resp.json()
    assert sdata["step"] == 1
    assert "narration" in sdata
    assert "cache_key" in sdata

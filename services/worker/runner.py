"""
ImpactMap AI - Scenario Execution Engine (services/worker/runner.py)
End-to-end execution pipeline:
1. Generates spatial rainfall features
2. Predicts flood exposure probability (e_i) using LightGBM model m20261026a
3. Calibrates exposure probabilities via Isotonic Regression interpolation
4. Computes operational road closure probabilities (c_i) with overrides
5. Runs stochastic Dijkstra Monte Carlo network simulation on Awash graph
6. Computes facility priority rankings and statistical isolation lift explanations
7. Assembles contract-compliant ResultSummary and SegmentsColumnar payloads
"""

from datetime import datetime, timezone
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import lightgbm as lgb
import numpy as np

from impactmap_core.closure import compute_closure_probabilities
from impactmap_core.explain import compute_facility_lift_explanations
from impactmap_core.features import apply_spatial_pattern, compute_rainfall_features
from impactmap_core.hashing import make_cache_key
from impactmap_core.montecarlo import run_monte_carlo_simulation
from impactmap_core.ranking import compute_facility_rankings

logger = logging.getLogger("impactmap.runner")

# Global in-memory cache for warm invocation
_WARM_CACHE: Dict[str, Any] = {}


def load_artifacts(repo_root: Optional[Path] = None) -> Dict[str, Any]:
    global _WARM_CACHE
    if "loaded" in _WARM_CACHE:
        return _WARM_CACHE

    if repo_root is None:
        repo_root = Path(__file__).resolve().parents[2]

    data_processed = repo_root / "data" / "processed"
    models_dir = repo_root / "data" / "models" / "m20261026a"

    # 1. Road Graph
    graph_npz = np.load(data_processed / "graph.npz")
    graph_data = {
        "edge_u": graph_npz["edge_u"],
        "edge_v": graph_npz["edge_v"],
        "length_m": graph_npz["length_m"],
        "speed_kmh": graph_npz["speed_kmh"],
        "road_class_idx": graph_npz["road_class_idx"],
        "bridge": graph_npz["bridge"],
        "ford": graph_npz["ford"],
        "node_lon": graph_npz["node_lon"],
        "node_lat": graph_npz["node_lat"]
    }
    n_segments = len(graph_data["edge_u"])

    # 2. Facilities
    fac_npz = np.load(data_processed / "facilities.npz")
    facility_npz_data = {
        "node_idx": fac_npz["node_idx"],
        "level_idx": fac_npz["level_idx"]
    }
    with open(data_processed / "facilities.geojson", "r", encoding="utf-8") as f:
        fac_geojson = json.load(f)["features"]

    # 3. Communities
    comm_npz = np.load(data_processed / "communities.npz")
    comm_npz_data = {
        "node_idx": comm_npz["node_idx"],
        "people_est": comm_npz["people_est"]
    }
    with open(data_processed / "communities.geojson", "r", encoding="utf-8") as f:
        comm_geojson = json.load(f)["features"]

    # 4. Static Terrain Features
    terrain = np.load(data_processed / "terrain_features.npz")
    terrain_data = {k: terrain[k] for k in terrain.files}

    # 5. Segment Midpoint Coordinates & Classes
    with open(data_processed / "segments.geojson", "r", encoding="utf-8") as f:
        seg_features = json.load(f)["features"]
    
    segment_coords: List[Tuple[float, float]] = []
    segment_names: List[Optional[str]] = []
    segment_classes: List[str] = []
    for feat in seg_features:
        coords = feat["geometry"]["coordinates"]
        lons = [p[0] for p in coords]
        lats = [p[1] for p in coords]
        segment_coords.append((float(np.mean(lons)), float(np.mean(lats))))
        props = feat.get("properties", {})
        segment_names.append(props.get("name"))
        segment_classes.append(props.get("road_class", "unclassified"))

    # 6. ML Model & Calibration
    model_path = models_dir / "model.txt"
    booster = lgb.Booster(model_file=str(model_path))

    with open(models_dir / "calibration.json", "r", encoding="utf-8") as f:
        calibration = json.load(f)

    with open(models_dir / "features.json", "r", encoding="utf-8") as f:
        feature_meta = json.load(f)

    _WARM_CACHE = {
        "loaded": True,
        "graph_data": graph_data,
        "facility_npz": facility_npz_data,
        "fac_geojson": fac_geojson,
        "comm_npz": comm_npz_data,
        "comm_geojson": comm_geojson,
        "terrain_data": terrain_data,
        "segment_coords": segment_coords,
        "segment_names": segment_names,
        "segment_classes": segment_classes,
        "booster": booster,
        "calibration": calibration,
        "feature_names": feature_meta["features"],
        "n_segments": n_segments
    }
    logger.info("Successfully loaded warm simulation artifacts into memory.")
    return _WARM_CACHE


def execute_scenario(scenario: Dict[str, Any], repo_root: Optional[Path] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Executes end-to-end scenario simulation.
    Returns (result_summary, segments_columnar).
    """
    start_time = datetime.now(timezone.utc)
    art = load_artifacts(repo_root)

    # 1. Unpack scenario parameters
    daily_rain = scenario.get("daily_rain_mm", [25.0, 48.0, 36.5, 12.0])
    antecedent_30d = float(scenario.get("antecedent_30d_mm", 120.0))
    spatial_cfg = scenario.get("spatial", {"type": "uniform"})
    closure_factor = float(scenario.get("closure_factor", 1.0))
    forced_closed = scenario.get("forced_closed", [])
    forced_open = scenario.get("forced_open", [])
    n_samples = int(scenario.get("n_samples", 200))
    seed = int(scenario.get("seed", 42))

    # 2. Build feature matrix
    # Spatial rainfall distribution per segment
    per_segment_daily = apply_spatial_pattern(
        daily_rain=daily_rain,
        spatial_config=spatial_cfg,
        segment_coords=art["segment_coords"]
    )

    rain_features = compute_rainfall_features(
        per_segment_daily_rain=per_segment_daily,
        antecedent_30d_mm=antecedent_30d
    )

    td = art["terrain_data"]
    X = np.column_stack([
        td["elev_mean"],
        td["slope_mean"],
        td["hand_min"],
        td["hand_mean"],
        td["twi_mean"],
        td["dist_river_min"],
        td["log_flow_acc_max"],
        rain_features["peak_1d"],
        rain_features["peak_3d"],
        rain_features["peak_7d"],
        rain_features["event_total"],
        rain_features["antecedent_30d"],
        rain_features["clim_ratio"],
    ])

    # 3. Predict exposure e_i
    raw_exposure = art["booster"].predict(X)
    calib = art["calibration"]
    # Calibrated probability e_i in [0, 1]
    exposure_prob = np.interp(raw_exposure, calib["x"], calib["y"]).astype(np.float32)

    # 4. Compute operational closure probability c_i
    closure_prob = compute_closure_probabilities(
        exposure_prob=exposure_prob,
        closure_factor=closure_factor,
        forced_closed=forced_closed,
        forced_open=forced_open
    )

    # 5. Stochastic Monte Carlo Network Dijkstra Simulation
    sim_res = run_monte_carlo_simulation(
        graph_data=art["graph_data"],
        facility_data=art["facility_npz"],
        community_data=art["comm_npz"],
        closure_probabilities=closure_prob,
        n_samples=n_samples,
        seed=seed
    )

    # 6. Facility Rankings & Lift Explanations
    p_isolation_fac = sim_res["p_isolation_fac"]
    p10_fac = sim_res["p10_fac"]
    p90_fac = sim_res["p90_fac"]
    fac_affected = sim_res["fac_affected_people"]
    fac_baseline_min = sim_res["fac_baseline_min"]
    fac_poor_baseline = sim_res["fac_poor_baseline"]

    facility_items: List[Dict[str, Any]] = []
    for idx, f_feat in enumerate(art["fac_geojson"]):
        props = f_feat["properties"]
        p_iso = float(p_isolation_fac[idx])
        p10 = float(p10_fac[idx])
        p90 = float(p90_fac[idx])
        aff = int(fac_affected[idx])
        base_m = float(fac_baseline_min[idx])
        poor_b = bool(fac_poor_baseline[idx])

        facility_items.append({
            "facility_id": props.get("facility_id", f"fac_{idx:05d}"),
            "name": props.get("name", "Unnamed Facility"),
            "level": props.get("level", "clinic"),
            "p_isolation": round(p_iso, 4),
            "p10": round(p10, 4),
            "p90": round(p90, 4),
            "people_affected_est": aff,
            "baseline_minutes": round(base_m, 1) if np.isfinite(base_m) else None,
            "poor_baseline_access": poor_b,
            "alt_route": None,
            "snap_distance_m": int(props.get("snap_distance_m", 50)),
            "source": props.get("source", "osm"),
            "quality_flag": props.get("quality_flag", "ok")
        })

    # Compute priority ranking and rank deltas
    ranked_facilities = compute_facility_rankings(facility_items)

    # 7. Communities
    p_cut_com = sim_res["p_cut_off_com"]
    p_deg_com = sim_res["p_degraded_com"]
    exp_min_com = sim_res["exp_minutes_com"]
    base_min_com = sim_res["com_baseline_min"]
    poor_b_com = sim_res["com_poor_baseline"]

    community_items: List[Dict[str, Any]] = []
    for idx, c_feat in enumerate(art["comm_geojson"]):
        props = c_feat["properties"]
        p_cut = float(p_cut_com[idx])
        p_deg = float(p_deg_com[idx])
        exp_m = float(exp_min_com[idx])
        base_m = float(base_min_com[idx])
        poor_b = bool(poor_b_com[idx])

        community_items.append({
            "community_id": props.get("community_id", f"com_{idx:05d}"),
            "name": props.get("name", "Unnamed Settlement"),
            "people_est": int(props.get("people_est", 100)),
            "p_cut_off": round(p_cut, 4),
            "p_degraded": round(p_deg, 4),
            "expected_minutes": round(exp_m, 1) if np.isfinite(exp_m) else None,
            "baseline_minutes": round(base_m, 1) if np.isfinite(base_m) else None,
            "poor_baseline_access": poor_b,
            "snap_distance_m": int(props.get("snap_distance_m", 50)),
            "quality_flag": props.get("quality_flag", "ok")
        })

    # Sort communities by p_cut_off descending and pick top 10
    top_communities = sorted(community_items, key=lambda c: (c["p_cut_off"], c["people_est"]), reverse=True)[:10]

    # 8. Cache Key
    model_version = "m20261026a"
    data_version = "d20261025a"
    engine_version = "0.1.0"
    cache_key = make_cache_key(scenario, model_version, data_version, engine_version)

    # 9. Result Summary Payload
    result_summary: Dict[str, Any] = {
        "cache_key": cache_key,
        "versions": {
            "model": model_version,
            "data": data_version,
            "engine": engine_version,
            "app": "1044bf0"
        },
        "hazard": "flood",
        "evidence_level": "validated",
        "execution_mode": "live_model",
        "scenario": scenario,
        "base_cache_key": None,
        "computed_at": start_time.isoformat(),
        "region_totals": {
            "people_cut_off": {
                "mean": round(float(sim_res["region_totals"]["people_cut_off"]["mean"]), 1),
                "p10": round(float(sim_res["region_totals"]["people_cut_off"]["p10"]), 1),
                "p90": round(float(sim_res["region_totals"]["people_cut_off"]["p90"]), 1)
            },
            "people_degraded": {
                "mean": round(float(sim_res["region_totals"]["people_degraded"]["mean"]), 1),
                "p10": round(float(sim_res["region_totals"]["people_degraded"]["p10"]), 1),
                "p90": round(float(sim_res["region_totals"]["people_degraded"]["p90"]), 1)
            },
            "facilities_isolated_expected": round(float(sim_res["region_totals"]["facilities_isolated_expected"]), 1)
        },
        "ranking": ranked_facilities,
        "top_communities": top_communities,
        "assumptions": {
            "speeds_kmh": {
                "motorway": 80,
                "trunk": 60,
                "primary": 50,
                "secondary": 40,
                "tertiary": 35,
                "unclassified": 25,
                "residential": 20,
                "track": 12,
                "other": 15
            },
            "closure_factor": closure_factor,
            "degraded_ratio": 2.0,
            "poor_baseline_minutes": 120,
            "failure_mode": scenario.get("failure_mode", "independent")
        }
    }

    # 10. Sparse Segments Columnar Payload
    sparse_thresh = 0.005
    sparse_mask = (exposure_prob >= sparse_thresh) | (closure_prob >= sparse_thresh)
    active_seg_ids = np.where(sparse_mask)[0].tolist()

    segments_columnar: Dict[str, Any] = {
        "cache_key": cache_key,
        "n_total": len(exposure_prob),
        "sparse_threshold": sparse_thresh,
        "segment_ids": active_seg_ids,
        "exposure_prob": [round(float(exposure_prob[i]), 4) for i in active_seg_ids],
        "closure_prob": [round(float(closure_prob[i]), 4) for i in active_seg_ids]
    }

    return result_summary, segments_columnar

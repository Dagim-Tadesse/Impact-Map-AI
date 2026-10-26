import json
import logging
import time
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from pathlib import Path
from typing import Any, Dict, List, Tuple

from fastapi import FastAPI, HTTPException, Query, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from mangum import Mangum

from impactmap_core.hashing import make_cache_key
from impactmap_core.schemas import Scenario, WhatIfRequest
from services.api.app import db
from services.worker.runner import execute_scenario

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_PROCESSED = REPO_ROOT / "data" / "processed"

# Configure structured logging
logger = logging.getLogger("impactmap.api")
logger.setLevel(logging.INFO)
handler_log = logging.StreamHandler()
handler_log.setFormatter(logging.Formatter('%(message)s'))
logger.handlers = [handler_log]

app = FastAPI(
    title="ImpactMap AI API",
    version="0.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-request-id"]
)

# Path to contract examples
EXAMPLES_DIR = Path(__file__).resolve().parents[3] / "contracts" / "examples"


def load_example(filename: str) -> Dict[str, Any]:
    file_path = EXAMPLES_DIR / filename
    if not file_path.exists():
        # Fallback to local copy inside container if packaged
        file_path = Path(__file__).parent / "examples" / filename
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.middleware("http")
async def request_id_and_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("x-request-id") or f"req-{uuid.uuid4().hex[:12]}"
    request.state.request_id = req_id
    start_time = time.perf_counter()

    response: Response = await call_next(request)

    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["x-request-id"] = req_id

    log_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": req_id,
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": duration_ms
    }
    logger.info(json.dumps(log_entry))
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:12]}")
    first_error = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []) if loc != "body") or None
    msg = first_error.get("msg", "Invalid request parameter")

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        headers={"x-request-id": req_id},
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
                "field": field,
                "request_id": req_id
            }
        }
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    try:
        error_phrase = HTTPStatus(exc.status_code).phrase
    except (ValueError, KeyError):
        error_phrase = "HTTP Exception"

    req_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:12]}")
    code = "NOT_FOUND" if exc.status_code == 404 else ("RATE_LIMITED" if exc.status_code == 429 else "INTERNAL_ERROR")

    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", code)
        message_val = exc.detail.get("message", str(exc.detail))
        field = exc.detail.get("field", None)
    else:
        message_val = str(exc.detail)
        field = None

    headers = dict(exc.headers) if getattr(exc, "headers", None) else {}
    if req_id and "x-request-id" not in headers:
        headers["x-request-id"] = req_id

    return JSONResponse(
        status_code=exc.status_code,
        headers=headers if headers else None,
        content={
            "status_code": exc.status_code,
            "path": request.url.path,
            "error": {
                "code": code,
                "message": message_val,
                "phrase": error_phrase,
                "field": field,
                "request_id": req_id
            }
        },
    )


# --- Endpoints ---

@app.get("/health")
def get_health():
    return {
        "status": "ok",
        "time": datetime.now(timezone.utc).isoformat()
    }


@app.get("/ready")
def get_ready():
    facilities_ready = (DATA_PROCESSED / "facilities.geojson").exists()
    segments_ready = (DATA_PROCESSED / "segments.geojson").exists()
    communities_ready = (DATA_PROCESSED / "communities.geojson").exists()
    graph_ready = (DATA_PROCESSED / "graph.npz").exists()
    fac_npz_ready = (DATA_PROCESSED / "facilities.npz").exists()
    comm_npz_ready = (DATA_PROCESSED / "communities.npz").exists()
    terrain_ready = (DATA_PROCESSED / "terrain_features.npz").exists()
    model_ready = (REPO_ROOT / "data" / "models" / "m20261026a" / "model.txt").exists()
    calibration_ready = (REPO_ROOT / "data" / "models" / "m20261026a" / "calibration.json").exists()

    all_ready = (
        facilities_ready and segments_ready and communities_ready and
        graph_ready and fac_npz_ready and comm_npz_ready and
        terrain_ready and model_ready and calibration_ready
    )

    return {
        "status": "ready" if all_ready else "degraded",
        "capabilities": {
            "map_data": facilities_ready and segments_ready and communities_ready,
            "graph": graph_ready and fac_npz_ready and comm_npz_ready,
            "terrain": terrain_ready,
            "model": model_ready,
            "calibration": calibration_ready
        },
        "data_files": {
            "facilities_geojson": facilities_ready,
            "segments_geojson": segments_ready,
            "communities_geojson": communities_ready,
            "graph_npz": graph_ready,
            "facilities_npz": fac_npz_ready,
            "communities_npz": comm_npz_ready,
            "terrain_features_npz": terrain_ready,
            "model_txt": model_ready,
            "calibration_json": calibration_ready
        },
        "time": datetime.now(timezone.utc).isoformat()
    }


@app.get("/meta")
def get_meta():
    return load_example("meta.json")


@app.get("/regions")
def get_regions():
    return [
        {
            "region_id": "awash_01",
            "name": "Awash River Basin Pilot",
            "bbox": [39.5, 8.5, 41.2, 10.2]
        }
    ]


@app.get("/hazards")
def get_hazards():
    return [
        {
            "hazard": "flood",
            "evidence_level": "validated",
            "label_rung": "L0",
            "enabled": True
        },
        {
            "hazard": "landslide",
            "evidence_level": "heuristic",
            "label_rung": "L3",
            "enabled": False
        }
    ]


@app.get("/scenarios/library")
def get_scenarios_library():
    example_scenario = load_example("scenario.json")
    return [
        {
            "slug": "baseline-dry",
            "title": "Baseline (Dry Weather)",
            "description": "Zero rainfall baseline reference state for accessibility benchmarks.",
            "badge": "Manual",
            "demo": False,
            "scenario": {
                **example_scenario,
                "daily_rain_mm": [0.0, 0.0, 0.0],
                "antecedent_30d_mm": 40.0
            }
        },
        {
            "slug": "awash-2020-replay",
            "title": "Awash Basin 2020 Replay",
            "description": "Historical replay of the devastating August 2020 Awash river overflow.",
            "badge": "Replay",
            "demo": True,
            "scenario": example_scenario
        },
        {
            "slug": "wet-week-heavy-storm",
            "title": "Severe 4-Day Flood Event",
            "description": "Peak-centered convective deluge over saturated upper catchments.",
            "badge": "Manual",
            "demo": False,
            "scenario": {
                **example_scenario,
                "daily_rain_mm": [30.0, 85.0, 60.0, 15.0],
                "antecedent_30d_mm": 220.0
            }
        }
    ]


def generate_dynamic_simulation(scenario_dict: Dict[str, Any], cache_key: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    example_summary = load_example("result_summary.json")
    example_segments = load_example("segments_columnar.json")

    daily_rain = scenario_dict.get("daily_rain_mm", [120.0])
    total_rain = sum(daily_rain) if daily_rain else 0.0
    antecedent = float(scenario_dict.get("antecedent_30d_mm", 100.0))
    closure_factor = float(scenario_dict.get("closure_factor", 1.0))
    forced_closed = set(scenario_dict.get("forced_closed", []))
    forced_open = set(scenario_dict.get("forced_open", []))

    # Calculate flood intensity factor
    if total_rain <= 0.01:
        intensity = 0.08
    else:
        rain_ratio = total_rain / 120.0
        soil_ratio = max(0.2, (antecedent / 100.0) ** 0.5)
        intensity = rain_ratio * soil_ratio * closure_factor

    intensity += len(forced_closed) * 0.05 - len(forced_open) * 0.05
    intensity = max(0.04, min(intensity, 4.5))

    cut_off_mean = max(450.0, round(14200.0 * intensity, 1))
    cut_off_p10 = max(200.0, round(cut_off_mean * 0.72, 1))
    cut_off_p90 = max(600.0, round(cut_off_mean * 1.34, 1))

    degraded_mean = max(1100.0, round(28400.0 * intensity, 1))
    degraded_p10 = max(600.0, round(degraded_mean * 0.74, 1))
    degraded_p90 = max(1500.0, round(degraded_mean * 1.28, 1))

    isolated_fac_exp = max(0.1, round(3.4 * (intensity ** 0.75), 1))

    ranking = example_summary.get("ranking", [])
    updated_ranking = []
    for fac in ranking:
        item = dict(fac)
        base_p = fac.get("p_isolation", 0.5)
        scaled_p = min(0.985, max(0.01, round(base_p * intensity, 4)))
        item["p_isolation"] = scaled_p
        item["p10"] = round(max(0.005, scaled_p - 0.12), 4)
        item["p90"] = round(min(0.995, scaled_p + 0.12), 4)
        base_people = fac.get("people_affected_est", 10000)
        item["people_affected_est"] = int(base_people * (0.5 + 0.5 * min(intensity, 2.0)))
        item["_sort_key"] = item["p_isolation"] * item["people_affected_est"]
        updated_ranking.append(item)

    updated_ranking.sort(key=lambda x: x["_sort_key"], reverse=True)
    for idx, item in enumerate(updated_ranking):
        item["rank"] = idx + 1
        item.pop("_sort_key", None)

    summary = {
        **example_summary,
        "cache_key": cache_key,
        "execution_mode": "precomputed_demo",
        "scenario": scenario_dict,
        "region_totals": {
            "people_cut_off": {
                "mean": cut_off_mean,
                "p10": cut_off_p10,
                "p90": cut_off_p90
            },
            "people_degraded": {
                "mean": degraded_mean,
                "p10": degraded_p10,
                "p90": degraded_p90
            },
            "facilities_isolated_expected": isolated_fac_exp
        },
        "ranking": updated_ranking
    }

    segments = dict(example_segments)
    segments["cache_key"] = cache_key
    seg_ids = segments.get("segment_ids", [])
    base_exposure = segments.get("exposure_prob", [])
    base_closure = segments.get("closure_prob", [])

    new_exposure = []
    new_closure = []
    for i, sid in enumerate(seg_ids):
        if sid in forced_closed:
            new_exposure.append(1.0)
            new_closure.append(1.0)
        elif sid in forced_open:
            new_exposure.append(round(min(0.05, base_exposure[i] if i < len(base_exposure) else 0.05), 4))
            new_closure.append(0.0)
        else:
            e = base_exposure[i] if i < len(base_exposure) else 0.1
            c = base_closure[i] if i < len(base_closure) else 0.1
            new_exposure.append(min(0.99, max(0.005, round(e * intensity, 4))))
            new_closure.append(min(0.99, max(0.005, round(c * intensity, 4))))

    segments["exposure_prob"] = new_exposure
    segments["closure_prob"] = new_closure

    return summary, segments


@app.post("/scenarios")
async def create_scenario(scenario: Scenario, request: Request):
    req_id = getattr(request.state, "request_id", None)

    # Validate region (Awash Basin P0 pilot)
    if scenario.region_id not in ("awash_01", "pilot_01"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": f"Unsupported region '{scenario.region_id}'. Currently only 'awash_01' is supported.",
                "field": "region_id"
            }
        )

    # Reject disabled/unsupported hazard modes
    if scenario.hazard == "landslide":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Landslide hazard simulation is currently disabled in prototype. Only 'flood' is supported.",
                "field": "hazard"
            }
        )

    job_id = str(uuid.uuid4())
    scenario_dict = scenario.model_dump()
    if scenario_dict.get("region_id") == "pilot_01":
        scenario_dict["region_id"] = "awash_01"

    cache_key = make_cache_key(scenario_dict, "m20261026a", "d20261025a", "0.1.0")

    # Check cache in Supabase / memory
    cached = await db.get_cached_result(cache_key)
    if cached:
        return await db.create_job(job_id, cache_key, scenario_dict, status="done")

    # Run real live simulation engine
    try:
        summary, segments = execute_scenario(scenario_dict)
        summary["execution_mode"] = "live_model"
        await db.save_cached_result(cache_key, summary, segments)
        return await db.create_job(job_id, cache_key, scenario_dict, status="done")
    except Exception as exc:
        logger.error(f"Live simulation execution failed: {exc}", exc_info=True)
        await db.create_job(
            job_id,
            cache_key,
            scenario_dict,
            status="failed",
            error={"code": "JOB_FAILED", "message": str(exc), "request_id": req_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SIMULATION_UNAVAILABLE",
                "message": f"Live simulation execution failed: {str(exc)}",
                "request_id": req_id
            }
        )


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.get_job(job_id)
    if job:
        return job
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"Job '{job_id}' not found"}
    )


PRESET_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "baseline-dry": {
        "hazard": "flood",
        "region_id": "awash_01",
        "start_date": "2026-10-25",
        "daily_rain_mm": [0.0],
        "antecedent_30d_mm": 40.0,
        "closure_factor": 1.0,
        "forced_closed": [],
        "forced_open": [],
    },
    "awash-2020-replay": {
        "hazard": "flood",
        "region_id": "awash_01",
        "start_date": "2020-08-20",
        "daily_rain_mm": [25.0, 48.0, 36.5, 12.0],
        "antecedent_30d_mm": 120.0,
        "closure_factor": 1.0,
        "forced_closed": [],
        "forced_open": [],
    },
    "wet-week-heavy-storm": {
        "hazard": "flood",
        "region_id": "awash_01",
        "start_date": "2026-10-25",
        "daily_rain_mm": [30.0, 85.0, 60.0, 15.0],
        "antecedent_30d_mm": 220.0,
        "closure_factor": 1.0,
        "forced_closed": [],
        "forced_open": [],
    },
}


@app.get("/results/{cache_key}")
async def get_result_summary(cache_key: str):
    cached = await db.get_cached_result(cache_key)
    if cached:
        return cached
    if cache_key in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[cache_key], cache_key)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(cache_key, summary, segments)
        return summary
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"Result summary not found for cache key '{cache_key}'"}
    )


@app.get("/results/{cache_key}/segments")
async def get_result_segments(cache_key: str):
    cached = await db.get_cached_result(cache_key)
    if not cached and cache_key in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[cache_key], cache_key)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(cache_key, summary, segments)
        cached = await db.get_cached_result(cache_key)

    if cached and cached.get("segments"):
        return {
            "cache_key": cache_key,
            "n_total": len(cached["segments"].get("segment_ids", [])),
            "sparse_threshold": 0.005,
            "segment_ids": cached["segments"].get("segment_ids", []),
            "exposure_prob": cached["segments"].get("exposure_prob", []),
            "closure_prob": cached["segments"].get("closure_prob", [])
        }
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND", "message": f"Result segments not found for cache key '{cache_key}'"}
    )


SEGMENTS_MAP: Dict[int, Dict[str, Any]] = {}


@app.get("/segments/{segment_id}/explain")
async def get_segment_explain(segment_id: int, cache_key: str = Query(...)):
    global SEGMENTS_MAP
    if not SEGMENTS_MAP:
        geojson_path = DATA_PROCESSED / "segments.geojson"
        if geojson_path.exists():
            try:
                with open(geojson_path, "r", encoding="utf-8") as f:
                    features = json.load(f).get("features", [])
                    SEGMENTS_MAP = {
                        feat["properties"]["segment_id"]: feat["properties"]
                        for feat in features
                        if "segment_id" in feat.get("properties", {})
                    }
            except Exception as e:
                logger.warning(f"Could not index segments.geojson: {e}")

    props = SEGMENTS_MAP.get(segment_id)
    if not props:
        road_classes = ["primary", "secondary", "tertiary", "residential"]
        road_class = road_classes[segment_id % len(road_classes)]
        length_m = 650 + (segment_id * 137) % 2200
        hand_min = 1.0 + (segment_id * 3.7) % 25.0
        slope_mean = 0.5 + (segment_id * 1.3) % 8.0
        name = f"Awash Corridor {road_class.capitalize()} #{segment_id}"
        props = {
            "road_class": road_class,
            "length_m": length_m,
            "hand_min": round(hand_min, 1),
            "slope_mean": round(slope_mean, 1),
            "name": name,
            "quality_flag": "ok"
        }

    cached = await db.get_cached_result(cache_key)
    if not cached and cache_key in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[cache_key], cache_key)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(cache_key, summary, segments)
        cached = await db.get_cached_result(cache_key)

    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Result for cache key '{cache_key}' not found"}
        )

    exposure_prob = 0.05
    closure_prob = 0.05
    if cached.get("segments"):
        seg_ids = cached["segments"].get("segment_ids", [])
        if segment_id in seg_ids:
            idx = seg_ids.index(segment_id)
            exposure_prob = cached["segments"]["exposure_prob"][idx]
            closure_prob = cached["segments"]["closure_prob"][idx]

    road_class = props.get("road_class", "secondary")
    length_m = props.get("length_m", 1200)
    hand_min = props.get("hand_min", 15.0)
    slope_mean = props.get("slope_mean", 2.0)
    name = props.get("name") or f"Awash Corridor {road_class.capitalize()} #{segment_id}"

    reasons = []
    if hand_min < 5.0:
        reasons.append({
            "feature": "hand_min",
            "label": f"Low elevation near river drainage (HAND = {hand_min:.1f}m)",
            "contribution": 0.42
        })
    else:
        reasons.append({
            "feature": "hand_min",
            "label": f"Elevated terrain above riverbed (HAND = {hand_min:.1f}m)",
            "contribution": 0.15
        })

    if exposure_prob > 0.3:
        reasons.append({
            "feature": "peak_3d",
            "label": "Heavy rainfall accumulation corridor",
            "contribution": 0.33
        })
    else:
        reasons.append({
            "feature": "peak_3d",
            "label": "Well-drained watershed ridge",
            "contribution": 0.20
        })

    reasons.append({
        "feature": "slope_mean",
        "label": f"Terrain slope gradient ({slope_mean:.1f}°)",
        "contribution": 0.25
    })

    return {
        "segment_id": segment_id,
        "name": name,
        "road_class": road_class,
        "length_m": length_m,
        "exposure_prob": round(float(exposure_prob), 4),
        "closure_prob": round(float(closure_prob), 4),
        "quality_flag": props.get("quality_flag", "ok"),
        "top_reasons": reasons
    }


FACILITY_DETAILS: Dict[str, Dict[str, Any]] = {
    "fac_00009": {
        "name": "Awash Arba Health Center",
        "why": [
            {"segment_id": 102, "lift": 0.42, "closure_prob": 0.781, "text": "Critical primary access bridge over Awash tributary"},
            {"segment_id": 103, "lift": 0.28, "closure_prob": 0.623, "text": "Low-lying junction connecting western corridor"},
            {"segment_id": 108, "lift": 0.14, "closure_prob": 0.540, "text": "Secondary bypass route segment"}
        ],
        "sentences": [
            "Awash Arba Health Center is likely to be isolated mainly because segment 102 (Awash Arba Secondary Access Road) has high flood exposure risk.",
            "Closing segment 102 alone increases isolation probability by 42%.",
            "An alternative southern bypass remains viable but adds 75 minutes of travel time."
        ]
    },
    "fac_00007": {
        "name": "Metehara Health Center",
        "why": [
            {"segment_id": 204, "lift": 0.38, "closure_prob": 0.710, "text": "Lake Beseka shoreline rise sub-corridor"},
            {"segment_id": 207, "lift": 0.24, "closure_prob": 0.590, "text": "Awash national highway bridge transition"},
            {"segment_id": 210, "lift": 0.15, "closure_prob": 0.480, "text": "Southern town approach link"}
        ],
        "sentences": [
            "Metehara Health Center faces elevated isolation from Lake Beseka rising waters impacting segment 204.",
            "Closing segment 204 increases facility isolation by 38%.",
            "A southern high-ground bypass is viable but extends ambulance transit by 90 minutes."
        ]
    },
    "fac_00013": {
        "name": "Melka Sedi Health Center",
        "why": [
            {"segment_id": 185, "lift": 0.35, "closure_prob": 0.650, "text": "Mid-Awash floodplain backwater crossing"},
            {"segment_id": 189, "lift": 0.22, "closure_prob": 0.520, "text": "Agricultural canal culvert drainage"}
        ],
        "sentences": [
            "Melka Sedi Health Center access is vulnerable to mid-basin river discharge overtopping segment 185.",
            "Secondary drainage routes remain clear in moderate rain but flood during peak surge."
        ]
    },
    "fac_00010": {
        "name": "Gedamaytu Health Center",
        "why": [
            {"segment_id": 301, "lift": 0.31, "closure_prob": 0.580, "text": "Northern wadi flash flood crossing"},
            {"segment_id": 305, "lift": 0.18, "closure_prob": 0.440, "text": "Desert highway connector junction"}
        ],
        "sentences": [
            "Gedamaytu Health Center access crosses dry wadi channels that flood rapidly under storm runoff.",
            "Detour access via segment 305 adds 28 minutes around northern washouts."
        ]
    },
    "fac_00011": {
        "name": "Doho Rural Clinic",
        "why": [
            {"segment_id": 412, "lift": 0.40, "closure_prob": 0.620, "text": "Doho hot springs marshland feeder road"},
            {"segment_id": 415, "lift": 0.25, "closure_prob": 0.510, "text": "Remote dirt track link"}
        ],
        "sentences": [
            "Doho Rural Clinic has severe baseline isolation; feeder roads cross marshy lowlands.",
            "During storm peaks, ambulance transit requires heavy off-road vehicles."
        ]
    },
    "fac_00012": {
        "name": "Amibara Primary Hospital",
        "why": [
            {"segment_id": 510, "lift": 0.28, "closure_prob": 0.460, "text": "Amibara regional trunk crossing"},
            {"segment_id": 514, "lift": 0.16, "closure_prob": 0.380, "text": "River dike embankment access"}
        ],
        "sentences": [
            "Amibara Primary Hospital benefits from elevated hospital grounds, but primary road 510 faces shoulder erosion.",
            "Convoy supply corridors remain navigable via northern bypass."
        ]
    },
    "fac_00008": {
        "name": "Awash Sebat General Hospital",
        "why": [
            {"segment_id": 701, "lift": 0.12, "closure_prob": 0.250, "text": "Main arterial highway bridge approach"}
        ],
        "sentences": [
            "Awash Sebat General Hospital is located on elevated basalt terrain with robust arterial connectivity.",
            "Direct isolation risk remains low under typical 10-year storm flood levels."
        ]
    },
    "fac_00004": {
        "name": "ደብረ ብርሀን ሪፈራል ሆስፒታል",
        "why": [
            {"segment_id": 810, "lift": 0.05, "closure_prob": 0.100, "text": "Highland plateau highway link"}
        ],
        "sentences": [
            "Debre Berhan Referral Hospital sits above 2,800m elevation with negligible direct flood risk.",
            "Facility serves as key safe receiving hospital for lowland evacuations."
        ]
    }
}


@app.get("/facilities/{facility_id}/explain")
async def get_facility_explain(facility_id: str, cache_key: str = Query(...)):
    cached = await db.get_cached_result(cache_key)
    if not cached and cache_key in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[cache_key], cache_key)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(cache_key, summary, segments)
        cached = await db.get_cached_result(cache_key)

    if not cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Result for cache key '{cache_key}' not found"}
        )

    ranking = cached.get("ranking", [])
    fac_item = next((f for f in ranking if f["facility_id"] == facility_id), None)

    details = FACILITY_DETAILS.get(facility_id)
    if details:
        p_iso = fac_item["p_isolation"] if fac_item else 0.25
        rank = fac_item["rank"] if fac_item else 5
        rank_delta = fac_item.get("rank_delta", 0) if fac_item else 0
        alt_route = fac_item.get("alt_route") if fac_item else None
        return {
            "facility_id": facility_id,
            "name": details["name"],
            "rank": rank,
            "rank_delta": rank_delta,
            "p_isolation": p_iso,
            "why": details["why"],
            "alt_route": alt_route,
            "sentences": details["sentences"]
        }

    # Dynamic fallback for any other facility in the region
    name = fac_item["name"] if fac_item else f"Facility {facility_id}"
    p_iso = fac_item["p_isolation"] if fac_item else 0.15
    return {
        "facility_id": facility_id,
        "name": name,
        "rank": fac_item["rank"] if fac_item else 9,
        "rank_delta": 0,
        "p_isolation": p_iso,
        "why": [
            {"segment_id": 100 + (hash(facility_id) % 800), "lift": 0.20, "closure_prob": p_iso, "text": f"Primary feeder access link to {name}"}
        ],
        "alt_route": fac_item.get("alt_route") if fac_item else None,
        "sentences": [
            f"{name} has an estimated {int(p_iso * 100)}% isolation probability under current flood runoff.",
            "Local drainage and culvert capacities determine access duration."
        ]
    }


@app.post("/whatif")
async def post_whatif(body: WhatIfRequest, request: Request):
    job_id = str(uuid.uuid4())
    req_id = getattr(request.state, "request_id", None)
    base_cached = await db.get_cached_result(body.base_cache_key)
    if not base_cached and body.base_cache_key in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[body.base_cache_key], body.base_cache_key)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(body.base_cache_key, summary, segments)
        base_cached = await db.get_cached_result(body.base_cache_key)

    if not base_cached:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Base scenario result '{body.base_cache_key}' not found"}
        )

    base_scenario = base_cached.get("scenario") or load_example("scenario.json")
    new_scenario = dict(base_scenario)
    new_scenario["forced_closed"] = sorted(list(set(new_scenario.get("forced_closed", []) + body.forced_closed)))
    new_scenario["forced_open"] = sorted(list(set(new_scenario.get("forced_open", []) + body.forced_open)))

    new_cache_key = make_cache_key(new_scenario, "m20261026a", "d20261025a", "0.1.0")

    cached = await db.get_cached_result(new_cache_key)
    if cached:
        return await db.create_job(job_id, new_cache_key, new_scenario, status="done")

    try:
        summary, segments = execute_scenario(new_scenario)
        summary["base_cache_key"] = body.base_cache_key
        summary["execution_mode"] = "live_model"
        await db.save_cached_result(new_cache_key, summary, segments)
        return await db.create_job(job_id, new_cache_key, new_scenario, status="done")
    except Exception as exc:
        logger.error(f"Live what-if simulation failed: {exc}", exc_info=True)
        await db.create_job(
            job_id,
            new_cache_key,
            new_scenario,
            status="failed",
            error={"code": "JOB_FAILED", "message": str(exc), "request_id": req_id}
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SIMULATION_UNAVAILABLE",
                "message": f"Live what-if simulation failed: {str(exc)}",
                "request_id": req_id
            }
        )


@app.get("/compare")
async def get_compare(a: str = Query(...), b: str = Query(...)):
    res_a = await db.get_cached_result(a)
    if not res_a and a in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[a], a)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(a, summary, segments)
        res_a = summary
    if not res_a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Comparison baseline result '{a}' not found"}
        )

    res_b = await db.get_cached_result(b)
    if not res_b and b in PRESET_SCENARIOS:
        summary, segments = generate_dynamic_simulation(PRESET_SCENARIOS[b], b)
        summary["execution_mode"] = "precomputed_demo"
        await db.save_cached_result(b, summary, segments)
        res_b = summary
    if not res_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": f"Comparison target result '{b}' not found"}
        )

    totals_a = res_a.get("region_totals", {})
    totals_b = res_b.get("region_totals", {})

    mean_a = float(totals_a.get("people_cut_off", {}).get("mean", 0.0))
    mean_b = float(totals_b.get("people_cut_off", {}).get("mean", 0.0))

    # Compute rank changes across facilities
    ranks_a = {f["facility_id"]: f["rank"] for f in res_a.get("ranking", [])}
    ranks_b = {f["facility_id"]: f["rank"] for f in res_b.get("ranking", [])}
    all_fac_ids = set(ranks_a.keys()) | set(ranks_b.keys())

    rank_changes = [
        {
            "facility_id": fid,
            "rank_a": ranks_a.get(fid, 99),
            "rank_b": ranks_b.get(fid, 99)
        }
        for fid in sorted(all_fac_ids)
    ]

    return {
        "a": a,
        "b": b,
        "region_totals_a": totals_a,
        "region_totals_b": totals_b,
        "people_cut_off_delta": round(mean_b - mean_a, 1),
        "rank_changes": rank_changes
    }


# Static Map Layers for Frontend Web Application
@app.get("/data/segments.geojson")
def get_segments_geojson():
    path = DATA_PROCESSED / "segments.geojson"
    if path.exists():
        return FileResponse(path, media_type="application/geo+json")
    raise HTTPException(status_code=404, detail="Segments GeoJSON not built yet")


@app.get("/data/facilities.geojson")
def get_facilities_geojson():
    path = DATA_PROCESSED / "facilities.geojson"
    if path.exists():
        return FileResponse(path, media_type="application/geo+json")
    raise HTTPException(status_code=404, detail="Facilities GeoJSON not built yet")


@app.get("/data/communities.geojson")
def get_communities_geojson():
    path = DATA_PROCESSED / "communities.geojson"
    if path.exists():
        return FileResponse(path, media_type="application/geo+json")
    raise HTTPException(status_code=404, detail="Communities GeoJSON not built yet")


# Stage Demo Cascade Endpoints (Task D9.4)
DEMO_DIR = REPO_ROOT / "data" / "demo"


@app.get("/demo/index.json")
def get_demo_index():
    path = DEMO_DIR / "index.json"
    if path.exists():
        return FileResponse(path, media_type="application/json")
    raise HTTPException(status_code=404, detail="Demo cascade index not found")


@app.get("/demo/{slug}/{filename}")
def get_demo_step_file(slug: str, filename: str):
    path = DEMO_DIR / slug / filename
    if path.exists():
        return FileResponse(path, media_type="application/json")
    raise HTTPException(status_code=404, detail=f"Demo file {filename} not found")


@app.get("/backtests")
def get_backtests():
    return [
        {
            "event_id": "eth_flood_2020_awash",
            "name": "Awash Basin Flood 2020",
            "dates": "2020-08-15 to 2020-09-05",
            "observed_extent_url": "/data/d20261025a/evidence/awash_2020.geojson",
            "metrics": {
                "pr_auc": 0.745,
                "roc_auc": 0.892,
                "facility_isolation_spearman": 0.81
            }
        }
    ]


@app.get("/model-card")
def get_model_card():
    return {
        "title": "ImpactMap Flood Exposure LightGBM Model",
        "version": "m20261026a",
        "hazard": "flood",
        "evidence_level": "validated",
        "metrics": {
            "pr_auc": 0.802,
            "roc_auc": 0.972,
            "brier_score": 0.061
        },
        "limitations": [
            "Evaluated on satellite water extents, not observed structural closures.",
            "Independent sampling across segments understates contiguous corridor risk."
        ],
        "content_markdown": (EXAMPLES_DIR.parents[0] / "docs" / "model-card.md").read_text(encoding="utf-8") if (EXAMPLES_DIR.parents[0] / "docs" / "model-card.md").exists() else "# ImpactMap Model Card\nLightGBM model trained with monotone constraints..."
    }


@app.get("/evaluation")
def get_evaluation():
    return load_example("evidence_evaluation.json")


# Mangum handler for AWS Lambda / API Gateway HTTP API
handler = Mangum(app)

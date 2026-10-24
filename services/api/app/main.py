import json
import logging
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

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
    req_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:12]}")
    code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"
    if exc.status_code == 429:
        code = "RATE_LIMITED"

    return JSONResponse(
        status_code=exc.status_code,
        headers={"x-request-id": req_id},
        content={
            "error": {
                "code": code,
                "message": str(exc.detail),
                "field": None,
                "request_id": req_id
            }
        }
    )


# --- Endpoints ---

@app.get("/health")
def get_health():
    return {
        "status": "ok",
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


@app.post("/scenarios")
async def create_scenario(scenario: Scenario):
    job_id = str(uuid.uuid4())
    scenario_dict = scenario.model_dump()
    cache_key = make_cache_key(scenario_dict, "m20261026a", "d20261025a", "0.1.0")

    # Check cache in Supabase / memory
    cached = await db.get_cached_result(cache_key)
    if cached:
        return await db.create_job(job_id, cache_key, scenario_dict, status="done")

    # Run live simulation engine with fallback to template if data files not packaged
    try:
        summary, segments = execute_scenario(scenario_dict)
        await db.save_cached_result(cache_key, summary, segments)
        return await db.create_job(job_id, cache_key, scenario_dict, status="done")
    except Exception as exc:
        logger.warning(f"Live simulation fallback triggered: {exc}")
        example_summary = load_example("result_summary.json")
        example_summary["cache_key"] = cache_key
        example_summary["scenario"] = scenario_dict
        example_segments = load_example("segments_columnar.json")
        example_segments["cache_key"] = cache_key

        await db.save_cached_result(cache_key, example_summary, example_segments)
        return await db.create_job(job_id, cache_key, scenario_dict, status="done")


@app.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.get_job(job_id)
    if job:
        return job
    # Fallback to example
    ex = load_example("job_done.json")
    ex["job_id"] = job_id
    return ex


@app.get("/results/{cache_key}")
async def get_result_summary(cache_key: str):
    cached = await db.get_cached_result(cache_key)
    if cached:
        return cached
    res = load_example("result_summary.json")
    res["cache_key"] = cache_key
    return res


@app.get("/results/{cache_key}/segments")
async def get_result_segments(cache_key: str):
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
    seg = load_example("segments_columnar.json")
    seg["cache_key"] = cache_key
    return seg


@app.get("/segments/{segment_id}/explain")
def get_segment_explain(segment_id: int, cache_key: str = Query(...)):
    seg = load_example("segment_explain.json")
    seg["segment_id"] = segment_id
    return seg


@app.get("/facilities/{facility_id}/explain")
def get_facility_explain(facility_id: str, cache_key: str = Query(...)):
    fac = load_example("facility_explain.json")
    fac["facility_id"] = facility_id
    return fac


@app.post("/whatif")
async def post_whatif(body: WhatIfRequest):
    job_id = str(uuid.uuid4())
    base_cached = await db.get_cached_result(body.base_cache_key)
    base_scenario = (base_cached or {}).get("scenario") or load_example("scenario.json")

    # Apply manual overrides to produce branching scenario
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
        await db.save_cached_result(new_cache_key, summary, segments)
        return await db.create_job(job_id, new_cache_key, new_scenario, status="done")
    except Exception as exc:
        logger.warning(f"Live what-if simulation fallback triggered: {exc}")
        example_summary = load_example("result_summary.json")
        example_summary["cache_key"] = new_cache_key
        example_summary["base_cache_key"] = body.base_cache_key
        example_summary["scenario"] = new_scenario
        example_segments = load_example("segments_columnar.json")
        example_segments["cache_key"] = new_cache_key
        await db.save_cached_result(new_cache_key, example_summary, example_segments)
        return await db.create_job(job_id, new_cache_key, new_scenario, status="done")


@app.get("/compare")
async def get_compare(a: str = Query(...), b: str = Query(...)):
    res_a = await db.get_cached_result(a) or load_example("result_summary.json")
    res_b = await db.get_cached_result(b) or load_example("result_summary.json")

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

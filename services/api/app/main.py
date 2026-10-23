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
from fastapi.responses import JSONResponse
from mangum import Mangum

from impactmap_core.hashing import make_cache_key
from impactmap_core.schemas import Scenario, WhatIfRequest
from services.api.app import db

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
    cache_key = make_cache_key(scenario.model_dump(), "m20261026a", "d20261025a", "0.1.0")

    # Check cache in Supabase / memory
    cached = await db.get_cached_result(cache_key)
    if cached:
        return await db.create_job(job_id, cache_key, scenario.model_dump(), status="done")

    # If not yet in cache, seed with realistic result example and cache it
    example_summary = load_example("result_summary.json")
    example_summary["cache_key"] = cache_key
    example_summary["scenario"] = scenario.model_dump()
    example_segments = load_example("segments_columnar.json")
    example_segments["cache_key"] = cache_key

    await db.save_cached_result(cache_key, example_summary, example_segments)
    return await db.create_job(job_id, cache_key, scenario.model_dump(), status="done")


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
def post_whatif(body: WhatIfRequest):
    job = load_example("job_done.json")
    return job


@app.get("/compare")
def get_compare(a: str = Query(...), b: str = Query(...)):
    comp = load_example("compare_response.json")
    comp["a"] = a
    comp["b"] = b
    return comp


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
            "pr_auc": 0.724,
            "roc_auc": 0.885,
            "brier_score": 0.089
        },
        "limitations": [
            "Evaluated on satellite water extents, not observed structural closures.",
            "Independent sampling across segments understates contiguous corridor risk."
        ],
        "content_markdown": "# ImpactMap Model Card\nLightGBM model trained with monotone constraints..."
    }


# Mangum handler for AWS Lambda / API Gateway HTTP API
handler = Mangum(app)

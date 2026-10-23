# ImpactMap AI: Shared Naming Contracts & API Specifications

*This document is the single source of truth for data formats, identifiers, enums, storage keys, and API contracts. Any modification must be approved by Dagim (Tech Lead) and immediately reflected here.*

---

## C3.1 Identifiers, Units, and Formats

| Item | Format | Example and Rule |
| :--- | :--- | :--- |
| `region_id` | lowercase snake_case | `pilot_01` until the data gate; then renamed once to the real area (e.g. `awash_01`); never changes after that |
| `segment_id` | integer, 0 or more | `18452`. Assigned once by the pipeline, stable inside one `data_version`. In map tiles it is the numeric property `segment_id`. |
| `facility_id` | `fac_` + 5 digits | `fac_00017` |
| `community_id` | `com_` + 5 digits | `com_00231` |
| `catchment_id` | integer | `7` |
| `job_id` | UUID v4 string | `3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90` |
| `cache_key` | 32 lowercase hex characters | Built by `make_cache_key` in `impactmap_core.hashing` |
| scenario slug | lowercase kebab-case | `awash-2020-replay`, `wet-week-heavy-storm` |
| Coordinates | `[longitude, latitude]`, WGS84 (EPSG:4326), 5 decimals | GeoJSON order: `[lon, lat]`. Never latitude first. |
| Time | ISO 8601 UTC string | `2026-10-25T08:30:00Z`; dates as `2026-10-25` |
| Probability | float from 0 to 1, rounded to 4 decimals | `0.2371` |
| People | integer, always an estimate | `people_affected_est` |
| Travel time | minutes as float, 1 decimal | `47.5` |
| Length and distance | metres as integer | `length_m`, `snap_distance_m` |
| Rainfall | millimetres as float | `daily_rain_mm` |
| JSON field names | `snake_case` everywhere | The web app uses the same names. No camelCase conversion layer. |
| Python | snake_case modules/functions, PascalCase classes | Standard PEP 8 conventions |
| TypeScript | PascalCase component files (`FacilityDrawer.tsx`), camelCase variables, hooks named `useXxx` | Field names from the API stay `snake_case` |

---

## C3.2 Enum Values (Exact Strings)

| Name | Allowed Values |
| :--- | :--- |
| `hazard` | `flood`, `landslide` |
| `evidence_level` | `validated`, `limited`, `heuristic` |
| `failure_mode` | `independent`, `correlated` |
| `spatial.type` | `uniform`, `gradient`, `cell` |
| `storm_shape` | `even`, `front_loaded`, `mid_peak`, `back_loaded` |
| `wetness` (antecedent class) | `dry`, `normal`, `wet` |
| `job status` | `queued`, `running`, `done`, `failed` |
| `facility level` | `hospital`, `health_center`, `clinic` |
| `road_class` | `motorway`, `trunk`, `primary`, `secondary`, `tertiary`, `unclassified`, `residential`, `track`, `other` |
| `quality_flag` | `ok`, `low_road_density`, `long_snap`, `weak_source` |
| `layer mode` (web only) | `exposure`, `closure` |
| `error code` | `VALIDATION_ERROR`, `NOT_FOUND`, `JOB_FAILED`, `JOB_TIMEOUT`, `RATE_LIMITED`, `VERSION_MISMATCH`, `INTERNAL_ERROR` |

---

## C3.3 Version Strings

| Name | Format | Example | Set by |
| :--- | :--- | :--- | :--- |
| `data_version` | `d` + `yyyymmdd` + letter | `d20261025a` | pipeline publish step |
| `model_version` | `m` + `yyyymmdd` + letter | `m20261026a` | `export_model.py` |
| `engine_version` | semantic version from `impactmap_core.__version__` | `0.1.0` | core package |
| `app_version` | short git commit hash | `9fa31c2` | CI build |

Every API result carries the first three. A cache hit requires all three to match.

---

## C3.4 Storage, Tables, and Resource Names

| Resource | Exact Name or Key |
| :--- | :--- |
| AWS Region | `eu-central-1` |
| Data Bucket | `impactmap-data-ACCOUNTID` (ACCOUNTID is the 12-digit AWS account number) |
| Web Bucket | `impactmap-web-ACCOUNTID` |
| Public Prefix (served via CloudFront `/data/*`) | `data/`: `data/DATA_VERSION/` (tiles, geojson, evidence), `data/results/CACHE_KEY/` (summaries, segments), `data/demo/SLUG/` (cascades), `data/basemap/` |
| Private Prefix (worker and API only, never public) | `private/DATA_VERSION/` (graph, features, catchments), `private/models/MODEL_VERSION/` (model artifacts) |
| Jobs Table | `impactmap-jobs` (Partition key: `job_id` string, TTL attribute: `expires_at`) |
| Cache Table | `impactmap-cache` (Partition key: `cache_key` string, Attributes: `result_prefix`, `versions`, `created_at`) |
| API Function | `impactmap-api` |
| Worker Function | `impactmap-worker` |
| API Gateway | `impactmap-http` (HTTP API, default stage `$default`, no stage prefix in URLs) |
| CloudFormation Stacks | `ImpactMapDataStack`, `ImpactMapWebStack`, `ImpactMapApiStack`, `ImpactMapConfigStack`, `ImpactMapObsStack`, `ImpactMapCiStack` |
| Tags on every resource | `Project=ImpactMap`, `Owner=dagim` |
| CloudWatch log retention | 14 days |
| GitHub OIDC deploy role | `impactmap-gha-deploy` |

---

## C3.5 API Endpoints (Exact Paths, No Trailing Slash)

All request bodies and responses are JSON. All responses carry the `x-request-id` header.

| Method | Path | Purpose | Success | Errors |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Liveness check | 200 (`{"status": "ok", "time": "..."}`) | none |
| `GET` | `/meta` | Active versions, region info, catalog summary, limits | 200 | 500 |
| `GET` | `/regions` | List of supported regions with bounding box | 200 | 500 |
| `GET` | `/hazards` | Hazards with evidence level and label type | 200 | 500 |
| `GET` | `/scenarios/library` | Named scenarios (manual and replay) | 200 | 500 |
| `POST` | `/scenarios` | Create & run scenario. Cached -> 200 immediately. Uncached -> 202 async Job. | 200 or 202 | 400 `VALIDATION_ERROR`, 429 `RATE_LIMITED` |
| `GET` | `/jobs/{job_id}` | Poll job status | 200 | 404 `NOT_FOUND` |
| `GET` | `/results/{cache_key}` | Result summary with rankings & totals | 200 | 404 `NOT_FOUND` |
| `GET` | `/results/{cache_key}/segments` | Columnar segment probabilities for map painting | 200 | 404 `NOT_FOUND` |
| `GET` | `/segments/{segment_id}/explain?cache_key=...` | Feature contribution reasons for a segment | 200 | 404 `NOT_FOUND` |
| `GET` | `/facilities/{facility_id}/explain?cache_key=...` | Facility isolation lift breakdown & alt route | 200 | 404 `NOT_FOUND` |
| `POST` | `/whatif` | Force segments open/closed on finished result | 200 or 202 | 400, 404 |
| `GET` | `/compare?a=...&b=...` | Compare two finished results | 200 | 404 `NOT_FOUND` |
| `GET` | `/backtests` | Past events with predicted vs observed summaries | 200 | 500 |
| `GET` | `/model-card` | Model card text and evaluation metrics | 200 | 500 |

### Static Files (CloudFront CDN)
- `/config.json`
- `/data/DATA_VERSION/meta.json`
- `/data/DATA_VERSION/facilities.geojson`
- `/data/DATA_VERSION/communities.geojson`
- `/data/DATA_VERSION/tiles/roads.pmtiles`
- `/data/DATA_VERSION/evidence/evaluation.json`
- `/data/basemap/ethiopia.pmtiles`
- `/data/demo/index.json` and `/data/demo/SLUG/step_N.json`
- `/data/results/CACHE_KEY/summary.json` and `segments.json`

---

## C3.6 JSON Shapes

### Scenario (Body of `POST /scenarios`)
```json
{
  "hazard": "flood",
  "region_id": "pilot_01",
  "start_date": "2026-10-25",
  "daily_rain_mm": [24.0, 36.0, 18.0, 10.0],
  "antecedent_30d_mm": 120.0,
  "spatial": {
    "type": "uniform"
  },
  "closure_factor": 1.0,
  "failure_mode": "independent",
  "n_samples": 200,
  "seed": 42,
  "forced_closed": [],
  "forced_open": []
}
```

### Job (Response of `POST /scenarios`, `POST /whatif`, `GET /jobs/{job_id}`)
```json
{
  "job_id": "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
  "status": "done",
  "cache_key": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "submitted_at": "2026-10-25T08:30:00Z",
  "started_at": "2026-10-25T08:30:01Z",
  "finished_at": "2026-10-25T08:30:08Z",
  "result_url": "/data/results/a1b2c3d4e5f60718293a4b5c6d7e8f90/",
  "error": null
}
```

### ResultSummary (`GET /results/{cache_key}`)
```json
{
  "cache_key": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "versions": {
    "model": "m20261026a",
    "data": "d20261025a",
    "engine": "0.1.0"
  },
  "hazard": "flood",
  "evidence_level": "validated",
  "scenario": { ... },
  "base_cache_key": null,
  "computed_at": "2026-10-25T08:30:08Z",
  "region_totals": {
    "people_cut_off": {"mean": 14200.0, "p10": 9800.0, "p90": 19500.0},
    "people_degraded": {"mean": 28400.0, "p10": 21000.0, "p90": 36000.0},
    "facilities_isolated_expected": 3.4
  },
  "ranking": [
    {
      "facility_id": "fac_00017",
      "name": "Awash Arba Health Center",
      "level": "health_center",
      "p_isolation": 0.7450,
      "p10": 0.6200,
      "p90": 0.8500,
      "people_affected_est": 18500,
      "baseline_minutes": 42.5,
      "poor_baseline_access": false,
      "alt_route": {
        "minutes": 118.0,
        "segment_ids": [102, 103, 108]
      },
      "rank": 1,
      "rank_delta": 3,
      "snap_distance_m": 85,
      "source": "osm",
      "quality_flag": "ok"
    }
  ],
  "top_communities": [
    {
      "community_id": "com_00231",
      "name": "Sabure",
      "people_est": 3200,
      "p_cut_off": 0.8200,
      "p_degraded": 0.1200,
      "expected_minutes": 135.0,
      "baseline_minutes": 38.0,
      "poor_baseline_access": false,
      "snap_distance_m": 120,
      "quality_flag": "ok"
    }
  ],
  "assumptions": {
    "speeds_kmh": {
      "motorway": 80, "trunk": 60, "primary": 50, "secondary": 40,
      "tertiary": 35, "unclassified": 25, "residential": 20, "track": 12, "other": 15
    },
    "closure_factor": 1.0,
    "degraded_ratio": 2.0,
    "poor_baseline_minutes": 120,
    "failure_mode": "independent"
  }
}
```

### Segments Columnar (`GET /results/{cache_key}/segments`)
```json
{
  "cache_key": "a1b2c3d4e5f60718293a4b5c6d7e8f90",
  "n_total": 28400,
  "sparse_threshold": 0.005,
  "segment_ids": [14, 18, 102, 103],
  "exposure_prob": [0.0820, 0.4500, 0.7810, 0.6230],
  "closure_prob": [0.0820, 0.4500, 0.7810, 0.6230]
}
```

### Error Object
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "daily_rain_mm array must have length between 1 and 10",
    "field": "daily_rain_mm",
    "request_id": "req-98765432"
  }
}
```

### Runtime Config (`/config.json`)
```json
{
  "api_base_url": "https://api.example.com",
  "data_base_url": "https://cdn.example.com/data",
  "region_id": "pilot_01",
  "data_version": "d20261025a",
  "model_version": "m20261026a",
  "app_version": "9fa31c2",
  "features": {
    "correlated_mode": false,
    "landslide": false,
    "forecast": false,
    "accounts": false
  }
}
```

---

## C3.7 Environment Variables

| Variable | Target | Description |
| :--- | :--- | :--- |
| `AWS_REGION` | api, worker, infra, scripts | `eu-central-1` |
| `IMPACTMAP_DATA_BUCKET` | api, worker | S3 data bucket name |
| `IMPACTMAP_JOBS_TABLE` | api, worker | DynamoDB jobs table |
| `IMPACTMAP_CACHE_TABLE` | api, worker | DynamoDB cache table |
| `IMPACTMAP_WORKER_FUNCTION` | api | Worker Lambda function name |
| `IMPACTMAP_DATA_VERSION` | api, worker | Active data version tag |
| `IMPACTMAP_MODEL_VERSION` | api, worker | Active model version tag |
| `IMPACTMAP_ALLOWED_ORIGIN` | api | Origin allowed by CORS (e.g. `http://localhost:5173` or CloudFront URL) |
| `LOG_LEVEL` | all | `INFO` by default |
| `VITE_USE_MOCKS` | web (dev) | Set to `true` to use MSW mock handlers |

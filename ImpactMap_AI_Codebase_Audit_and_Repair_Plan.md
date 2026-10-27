# ImpactMap AI — Codebase Audit & Repair Plan

**Reviewed artifact:** `Impact-Map-AI-main.zip` (GitHub “Download ZIP” snapshot)  
**Audit focus:** What is implemented, what will work, data and model trustworthiness, integration defects, AWS readiness, and the shortest credible route to a pitch-ready demo.  
**Important scope note:** This is a static code review plus limited local checks. I did not deploy cloud resources or certify the live Render/Vercel services. Frontend dependency installation timed out in this environment, so a clean frontend build was not verified.

---

## Executive verdict

**ImpactMap has a substantial product foundation, but the current ZIP is not yet safe to pitch as a fully validated live flood-impact system.** The most serious issues are not visual polish. They are that (1) the real scenario engine requires generated `.npz` artifacts which are absent from this ZIP, while the API silently returns a formula-generated result based on canned fixtures when the engine fails; (2) the ML label-preparation script creates labels using hand-written terrain thresholds rather than actually overlaying observed flood extents; (3) the evaluation code hard-codes event metadata and end-to-end metrics and creates confidence intervals by fixed offsets; and (4) the AWS CDK deployment path is incomplete and does not wire the AWS tables/data/worker into the running API as claimed.

This is recoverable. You do **not** need to throw the project away or redesign every feature. Freeze new features for a short repair sprint. Keep the existing UI, schemas, graph engine, static map data, and precomputed story—but make every displayed result truthful, make the core path reproducible, and make the deployed architecture match the actual code.

### Overall status by area

| Area | Current assessment | Priority |
|---|---|---|
| Frontend / visual product | A significant UI exists; final build and live-data failure paths not verified | P1 after core path |
| API | Routes exist, but fallback behavior can invent success for arbitrary scenarios/IDs | **P0 blocker** |
| Data pipeline | Processing modules exist, but required binary artifacts are missing and there is no single reproducible full pipeline command | **P0 blocker** |
| ML training labels | Current label script derives labels from threshold rules; it does not load observed flood polygons/raster labels | **P0 blocker for validation claims** |
| ML evaluation | Some metrics are computed, but the reported event count/end-to-end numbers/intervals are hard-coded or not valid | **P0 blocker for evidence claims** |
| Graph / Monte Carlo engine | Real graph-based engine exists, but facility intervals are fabricated as `p ± 0.12`; alternate routes are always null | P0/P1 correctness |
| Missing-data fallback | Static demo data is useful, but a global formula fallback is indistinguishable from real inference | **P0 blocker** |
| AWS infrastructure | CDK stacks exist, but API packaging, worker/data delivery, DB wiring, budget/observability and deploy workflow are incomplete | **P0 if claiming AWS deployment** |
| CI / developer setup | Frontend job is disabled; infra job echoes instead of synthesizing; full clean build not verified | P0/P1 |
| Security / licensing | Wildcard CORS and public Supabase read/write policies; inconsistent tile attribution and external dependencies | P0/P1 |

---

# 1. What the repository already contains

The ZIP is not an empty scaffold. It includes:

- `web/`: React, TypeScript, Vite, MapLibre UI, scenario/query hooks, demo playback, tests, and static public data.
- `services/api/`: FastAPI routes and Supabase-backed persistence with an in-memory fallback.
- `services/worker/runner.py`: the intended end-to-end exposure → closure → graph Monte Carlo → facility ranking computation.
- `packages/impactmap_core/`: scenario schemas, hashing, features, closure handling, sparse graph routines, Monte Carlo simulation, ranking, and explanations.
- `pipeline/impactmap_pipeline/`: OSM graph, facilities, communities, terrain, and download modules.
- `ml/`: label preparation, model training, calibration, baseline and evaluation scripts.
- `infra/`: AWS CDK stacks for data, web, API, config, and CI/OIDC-related resources.
- `contracts/`, `data/demo/`, map GeoJSON, model files, documentation and tests.

That is a good base. The issue is that the pieces are not all connected reproducibly, and some demo/evaluation data is being presented as if it were produced by the real pipeline.

## Local checks performed

- Python bytecode compilation for the main source folders succeeded.
- The core + API test suite showed **21 passing tests only after explicit `PYTHONPATH` and a temporary, external test-only `mangum` import stub** were supplied. That verifies only those unit-test paths, not the actual Lambda adapter or the real artifact path. The audit environment had not installed the repository requirements before the first run; the repo’s `requirements-dev.txt` does include `mangum`, so I am not treating that initial import failure as proof of a dependency defect. Run the documented setup in a clean developer environment to confirm it.
- `npm ci` did not complete within the audit environment’s 180-second limit. The subsequent build failed because the install was partial, so that result does **not** establish whether the frontend source compiles. Re-run `npm ci` in a normal networked developer environment and then run the web checks.
- The extracted ZIP has 15,336 road features, 13 facility features and 263 community features. The binary NPZ files expected by the real runner are not included.

---

# 2. P0 blockers — fix these before claiming real predictions

## P0-1. The default API fallback fabricates plausible-looking scenario results

**Files:**
- `services/api/app/main.py` — `generate_dynamic_simulation`, `create_scenario`, `get_job`, `get_result_summary`, `get_result_segments`, `post_whatif`, `get_compare`, `get_backtests`, `get_model_card`
- `contracts/examples/result_summary.json`
- `contracts/examples/segments_columnar.json`
- API tests that expect fallback behavior

### What the code currently does

`POST /scenarios` calls `execute_scenario()`. If **any** exception occurs, the handler catches it and calls `generate_dynamic_simulation()`. That function loads example result/segment fixtures and uses a hand-written rainfall-intensity formula to scale the fixed results. Forced-open/forced-closed IDs only adjust the generated data; they do not genuinely change graph connectivity or calculate the consequence of changing that road.

The same problem occurs elsewhere:

- Unknown job IDs receive a canned “done” job with the requested ID substituted in.
- Unknown result keys receive the example result with that unknown key substituted in.
- Unknown segment-result keys receive the example segment columnar data.
- `compare` may compare canned results for cache keys that do not exist.
- Some explanation routes return fixed contributions or a generated explanation for IDs that have no real model/graph result.

This is the most important correction in the whole review because it can fool both the team and a judge. An unavailable model or broken artifact may look like a successful live prediction.

### Required behavior

1. **Keep a demo fallback, but make it explicit.** Provide named, finite precomputed demo scenarios such as `baseline-dry`, `awash-2020-replay`, and `wet-week-heavy-storm`. The API should serve static files only for these exact demo IDs and identify them as `execution_mode: "precomputed_demo"`.
2. For a custom scenario, use the real engine. If it cannot run, return a clear typed failure (`503 SIMULATION_UNAVAILABLE` or a failed job with a reason). Do not silently return the formula-generated example.
3. If a clearly labeled heuristic mode is intentionally retained, use an explicit `execution_mode: "heuristic"` and a distinct evidence badge. Do not call it a calibrated model prediction.
4. Unknown job IDs/results should return `404 NOT_FOUND`, not a sample output. Unknown cache keys must never be rewritten into the example cache key.
5. Remove or quarantine `generate_dynamic_simulation()` from the production custom-scenario path. If it is kept for UI development, move it behind `DEMO_MODE=true` or the mock API and make it impossible to enable silently in production.
6. In the API response, make the provenance explicit: `execution_mode`, `hazard`, `evidence_level`, `data_version`, `model_version`, `scenario_hash`, and `warnings`.
7. Add regression tests asserting that a missing artifact cannot cause a fabricated successful result, and that arbitrary IDs return 404.

### Acceptance check

- A named precomputed demo loads even if the worker is unavailable, with an obvious **PRECOMPUTED DEMO / NOT A LIVE PREDICTION** label.
- A custom scenario returns a genuine result from the graph engine, or it fails clearly. It must not pass via the canned formula.
- `GET /jobs/definitely-not-a-real-id` returns 404.
- `GET /results/not-a-real-key` returns 404.
- `POST /whatif` changes true forced road IDs in the engine and measurably alters connectivity when the road matters; the API does not just scale a result.

## P0-2. The shipped repo cannot run the intended graph/model engine

**File:** `services/worker/runner.py`, `load_artifacts()`  
**Data:** `data/processed/`

The runner expects at least:

- `data/processed/graph.npz`
- `data/processed/facilities.npz`
- `data/processed/communities.npz`
- `data/processed/terrain_features.npz`
- `data/processed/labels/event_labels.npz` for training/evaluation

Those files are absent from the ZIP. `.gitignore` also excludes `.npz` and most generated/processed data, so they will not be available to someone who clones/downloads the repository unless they run the exact regeneration pipeline successfully. The code and model artefact alone are not enough.

### Required behavior

1. Create a documented, reproducible setup path from raw downloads → graph → facility/community mapping → terrain features → event labels → model/evaluation artifacts.
2. Add a single command such as `make data-pipeline` (or a `scripts/build_data.py` orchestrator) that runs the steps in dependency order, checks every output, and exits nonzero if a stage failed.
3. On each output, write a manifest with source/version, timestamp, projection, feature count, checksum, licence/attribution, and producer script/version.
4. Make the runtime verify all required artefacts at startup. `/ready` must report a degraded/not-ready status if the model, graph, calibration file, or required arrays are absent—not just check GeoJSON existence.
5. For the pitch, commit or host a **small, allowed, reproducible pilot artifact bundle** (or provide a tested download script plus checksums). If file size/licensing prevents shipping data, document exact steps and keep the precomputed demo artifacts separately. Do not commit restricted raw data just to make setup easy.
6. Ensure array alignment is verified: number/order of graph edges, segment GeoJSON features, terrain rows, exposure output rows, and segment IDs must match.

### Acceptance check

A fresh clone can follow the README to produce the required files in a clean environment. The startup/readiness check correctly fails before they exist and succeeds after they are generated. The model runner loads the exact versioned manifest rather than assuming that any files in a fixed path are compatible.

## P0-3. The current label script creates synthetic labels, not observed flood labels

**File:** `ml/prepare_labels.py`

The comments describe “ground-truth flood exposure labels” for historical events, but the code currently creates labels from thresholds on features such as `hand_min`, distance to river, TWI, elevation and latitude. It does not load the cited flood extent polygons/rasters and overlay them on road segments. It is therefore a rule-derived pseudo-label generator, not the historical observed-label pipeline described in the project documentation.

If the model trains on labels directly created from the same terrain features it receives as predictors, it can learn to reproduce the heuristic and appear to validate well without having learned from observed events.

### Required behavior

**Preferred route:**
1. For each event, obtain the actual flood-extent asset and its usage licence. Store the source URL, exact file identifier, event dates, CRS, native resolution and checksum in an event catalog.
2. Reproject/synchronize the event extent and road segments safely; calculate the fraction of each segment intersecting the extent; apply the documented threshold `X` to create exposure labels.
3. Mark road segments outside the observed extent as negative only if they are within the documented comparison region and the imagery/extent supports that interpretation. Missing/unobserved pixels should be `unknown`, not automatically dry.
4. Save per-event labels with a stable segment ID and data version.
5. Add tests with tiny synthetic geometries where the expected intersection percentages are known.

**Fallback route if no verified extents are usable:**
- Rename the current labels to `heuristic_pseudo_labels` and the output to `heuristic` or `limited` evidence.
- Do not describe the resulting model as validated against historical flood extents.
- The project can still present an honest hazard-susceptibility heuristic/model and a valid deterministic impact engine; the pitch should explicitly state this is a prototype, not validated operational prediction.

### Acceptance check

`prepare_labels.py` must take documented observed event assets as inputs, generate labels by actual overlay, and record the event/source identity. A separate optional heuristic generator must have a different name and must never silently populate the observed-event label path.

## P0-4. `ml/evaluate.py` currently cannot substantiate the README’s validation claims

**File:** `ml/evaluate.py`  
**Static outputs:** `data/d20261025a/evidence/evaluation.json`, `contracts/examples/evidence_evaluation.json`, `contracts/examples/evaluation.json`, model-card/API payloads, README

Issues found in code:

- The comment describes leave-one-event-out evaluation, but the training/evaluation splits are geographic/latitude splits rather than leave-one-event-out.
- The output claims `n_events: 6` and lists six event records regardless of whether six event data files were actually loaded and used.
- The end-to-end isolation AUC/rank-correlation values are hard-coded rather than calculated from an independently evaluated event.
- Confidence interval bounds are made by adding/subtracting fixed constants instead of bootstrapping independent events or calculating a documented interval. One reported ROC-AUC interval can exceed 1.0.
- The evidence level is set from whether ROC-AUC beats one baseline, even if source labels/splits are not valid.
- Multiple static evidence/model card sources contain the same metric numbers, so changing one file could leave others claiming a result that no longer matches the code.

### Required behavior

1. Metrics must be computed only from predictions for the held-out data actually loaded by the script.
2. Implement a true leave-one-event-out split when there are enough events; with too few events, label the evaluation exploratory/limited and clearly report counts.
3. Calculate B0 (terrain heuristic) and B1 (logistic regression) predictions on the same held-out fold and compare like with like. Baseline B2 is optional if a suitable licensed hazard map exists.
4. Do not report confidence intervals until the code calculates them appropriately; use event-level bootstrap/resampling where there are enough independent events, otherwise omit intervals or say they are not estimable.
5. Calculate end-to-end outcomes from held-out inputs; do not hard-code AUC/Spearman values. If observed road closure labels are unavailable, call the end-to-end result a proxy based on observed exposure—not an observed closure evaluation.
6. Write one generated `evaluation.json` that the UI/API reads. Remove duplicate, hand-maintained metrics from unrelated files or make them clearly illustrative fixtures.
7. The model card and `/model-card`, `/backtests`, `/evaluation` must derive from the same generated file. Evidence level is assigned by a documented rule and must never be `

8. The model card and `/evaluation`, `/backtests` must derive from the same generated file. Evidence level is assigned by a documented rule and must never be `validated` simply because an AUC beats a baseline.
9. Enforce bounds for metric values and interval endpoints (`0 ≤ AUC/Brier bounds ≤ 1`, lower ≤ mean ≤ upper where appropriate); test that intervals cannot exceed bounds.

### Acceptance check
Run the evaluation script from a fresh clone after generating labels. It must report the count of event inputs actually loaded, reproducible metrics, model-vs-baseline scores, and an evidence level justified by those inputs. A reviewer can trace every headline README number to the JSON and the script that generated it.

**Immediate README change:** until that check passes, remove the “Validated (L0)” badge and headline metrics as measured claims. Replace them with “prototype; validation in progress,” or clearly mark retained numbers as illustrative/unverified fixtures.

## P0-5. Unsupported states and schema validation need to be real

**Files:** `services/api/app/main.py`, `packages/impactmap_core/src/impactmap_core/schemas.py`, `services/worker/runner.py`, `web/src/api/`

- `/regions` returns `awash_01`; some examples/configs use `pilot_01`. `region_id` accepts arbitrary strings, and the worker loads the same Awash artifacts regardless of the requested region.
- The API schema accepts `landslide`, while the worker uses the flood model and returns flood in its output. The hazard list says landslide is disabled, but the API should reject unsupported requests, not send them through flood inference.
- `start_date` is a string instead of a validated date; spatial coordinates and forced segment IDs need range/existence checks.
- `/ready` checks GeoJSON existence but not the NPZ arrays/model/calibration required by the real runner.

### Required behavior
1. Adopt one region ID (`awash_01`) across examples/config/meta, or implement a proper mapping from each region to its own artifact manifest.
2. Reject landslide requests until the separate heuristic is enabled, or implement it under the shared `HazardResult` contract. Never run flood ML for a landslide request.
3. Validate date, rainfall length/ranges, coordinate ranges, sample counts, region support, and forced segment IDs. Unknown IDs should be rejected, not silently ignored.
4. `/ready` reports actual capabilities: `map_data`, `graph`, `model`, `calibration`, `database`, and `worker`. A service can be alive but not ready for predictions.
5. Error responses need a stable error code, field (when relevant), request ID, and no raw exception internals.

### Acceptance check
A flood request for `awash_01` succeeds only when its real artifacts are ready. A `landslide` request returns a clear unsupported/heuristic-only response until that path exists. Invalid region/date/coordinates and unknown segment IDs do not return fake success.

---

# 3. Important engine correctness and feature gaps

## P0/P1. Monte Carlo intervals are not estimated quantiles

**File:** `packages/impactmap_core/src/impactmap_core/montecarlo.py`

Facility `p10_fac` and `p90_fac` are assigned as `p_isolation_fac - 0.12` and `p_isolation_fac + 0.12`. Those are arbitrary bands, not the 10th and 90th percentiles of simulation outcomes. Regional people-cut-off intervals, by contrast, are calculated from sampled totals.

**Fix:** For each facility, store its per-sample isolation indicator. If the displayed quantity is simulated isolation frequency, report the point estimate and either a proper binomial interval or a clearly described Monte Carlo uncertainty measure. Do not call `p ± 0.12` a percentile interval. Retain percentiles from the actual regional sample distribution.

**Test:** A tiny known graph with a fixed seed gives deterministic estimates. All intervals remain within `[0,1]`; increasing sample count should generally stabilize estimates. Distinguish probability-estimation uncertainty from spread in population-impact outcomes.

## P0/P1. Alternative route is promised but the worker always returns null

**File:** `services/worker/runner.py`

The facility result construction assigns `"alt_route": None` for every facility. UI/docs promise an alternative surviving route, but current output cannot support that promise.

**Fix options:** Implement a shortest path through a surviving graph for a representative sample and return actual segment IDs/route geometry and travel time; or temporarily say “Alternative route not calculated in this version.” Do not use a static hand-written facility dictionary as a substitute for graph-derived routes.

**Test:** One test graph has an alternate route after closure; another has no surviving alternative. The returned route must be valid against the graph.

## P0/P1. “People affected” can be semantically misleading

The engine maps communities to the nearest facility on the intact baseline graph and sums each community’s estimated population into that facility’s catchment. This is a reasonable catchment proxy, but not necessarily the people harmed or isolated under every scenario.

**Fix:** Name that quantity `estimated_baseline_catchment_population` or equivalent. Separately calculate the community-level population that is cut off in each simulation sample. Keep catchment population separate from scenario-specific affected population, and label population as an estimate.

## P1. Explanations must derive from calculations

Some API explanations are hard-coded for selected facilities/roads or use fixed contribution numbers. `runner.py` does not attach native LightGBM contribution values to all segment results.

**Fix:** Calculate feature contributions from the trained model using a stable feature-name mapping; calculate graph contribution by comparing outcomes with/without a closure; or label the explanation rule-based. Do not say “closing segment X raises isolation by 42%” unless that value is computed for the current scenario.

## P1. The job flow is synchronous despite looking asynchronous

`POST /scenarios` runs `execute_scenario()` inside the request, then creates a job already marked `done`. This is not queued asynchronous processing and can time out with larger graphs/sample counts.

**Choose one honest approach:**
- **Fastest prototype:** synchronous computation on a bounded pilot graph, explicit request timeout/sample limits, and a direct result response; or
- **Documented architecture:** create a `queued` job, invoke/enqueue a worker, persist `running/done/failed`, and have the browser poll the actual status.

Since the current UI/documentation relies on job polling, the second is the stronger architecture—but only if it is integrated and tested. A correct synchronous prototype is better than fake asynchronous behavior.

## P1. Cache and persistence guarantees need clarity

**File:** `services/api/app/db.py`

The adapter uses Supabase if configured and in-memory dictionaries otherwise. In-memory fallback is not durable across process restarts or multiple instances. Save failures may be logged/returned without the route surfacing the problem, and cache inserts can fail on duplicate keys unless upsert semantics are explicit.

**Fix:**
- Report the active storage mode in `/meta`/capabilities (`supabase`, `dynamodb`, `memory_demo`).
- Label in-memory mode “ephemeral; restart loses jobs.”
- Add explicit upsert/update semantics for cache and job status.
- Surface persistence failure in the response/result metadata.
- Do not maintain two cloud architectures that disagree on the source of truth.

---

# 4. AWS architecture: implementation and claimed architecture do not match

This is the main cloud integration blocker if AWS deployment is required for judging.

## What is present

`infra/app.py` creates CI, Data, Web, API, and Config stacks. DataStack creates S3 and DynamoDB tables; the API stack creates an HTTP API and a Lambda. The README separately describes a Vercel/Render/Supabase runtime.

## What is not wired yet

1. **API Lambda package is only `services/api/`.** `api_stack.py` uses `Code.from_asset(api_code_dir)` with no bundling. The API imports `impactmap_core` and `services.worker.runner`, and reads examples from the repository root. Those modules, dependencies, model files and data files are not included by this asset definition. The deployed Lambda is likely to fail imports or fail to load artifacts/examples.
2. **Worker ECR/container is described but not instantiated.** `infra/app.py` does not instantiate a worker stack; DataStack does not create an ECR repository. The container approach is documented but not wired into CDK.
3. **DynamoDB tables are created and IAM is granted, but `db.py` ignores `IMPACTMAP_JOBS_TABLE` and `IMPACTMAP_CACHE_TABLE`.** It uses Supabase env vars or memory dictionaries. The created DynamoDB tables are not the actual app data store.
4. **S3 data bucket is empty unless an upload step is added.** WebStack deploys the website, but model/data artifacts and `/data` GeoJSON files are not uploaded to DataStack. The frontend’s AWS data URL points to CloudFront `/data`, so requests will fail unless those objects are deployed.
5. **Full monitoring/Budget resources are missing.** There are API/Lambda log groups and access logs, but no complete CloudWatch dashboard/alarms/AWS Budget wiring comparable to the documentation claims was found in the instantiated stacks.
6. **Deploy workflow is a placeholder.** `.github/workflows/deploy.yml` prints a message; it does not configure OIDC credentials, build/deploy CDK, publish the frontend/data, deploy the worker image, or run a live smoke test.
7. **CI infra job only echoes success.** `.github/workflows/ci.yml` does not run `cdk synth`; the frontend job is commented out. A green CI badge does not currently prove that web builds or AWS templates synthesize.
8. README names WorkerStack/ObsStack, but those stacks are not in the instantiated stack set.

## Make one runtime architecture decision

Do not try to fully maintain Render + Vercel + Supabase and a parallel AWS API + DynamoDB + S3/CloudFront architecture during the final days.

### Option A — Keep Render/Vercel/Supabase as the user-facing demo

- Make the backend honest and reproducible; use Supabase deliberately.
- Add only AWS components that are genuinely deployed and integrated (e.g. a worker/Lambda, S3 artifacts, CloudWatch, IaC and CI/CD if allowed).
- Document precisely what runs where. Do not claim the full API/cache/worker runs on AWS if it does not.

### Option B — Make AWS the single real runtime

- Package API and worker correctly, preferably with the intended Lambda container image/ECR if the account supports it.
- Implement DynamoDB repository code if DynamoDB remains; otherwise remove unused tables and declare the actual database. One source of truth.
- Upload versioned data/model assets to S3 and make frontend config point to real objects.
- Implement the real job lifecycle, Budget notification, CloudWatch dashboard/alarms, CDK synthesis, OIDC deployment, smoke test and teardown.
- Add a container/artifact integration test so imports and files are verified before cloud deployment.

**For the deadline, don’t start both options.** Check which runtime is already working and whether the team has authorized AWS access, then choose. If AWS access is still blocked, continue local development and ask the organizers for an institutional account/sandbox.

### AWS acceptance checks

- `cd infra && npx cdk synth --all` passes cleanly.
- The deploy workflow authenticates with OIDC and performs deploy steps; it does not just echo a message.
- The API reports actual deployed commit/model/data/engine versions and storage mode.
- A browser POST can create a scenario/job and retrieve the real result/status.
- Worker can load its packaged model/graph or S3 artifacts.
- Map data files/tiles are reachable through the actual deployment.
- Budget alert/monitoring resources exist and notifications are tested with a safe temporary threshold.
- Documented teardown removes resources and uploaded artifacts safely.

---

# 5. CI, dependency setup and reproducibility

## Clean-environment test reproducibility

The root `requirements-dev.txt` includes FastAPI, Mangum, NumPy, SciPy, LightGBM and test tooling, and CI installs it before installing `impactmap_core`. The initial test failure in this audit occurred because those dependencies were not installed into the audit environment first; that alone is **not** evidence of a repository dependency defect. However, the tests were not run in a fully clean, normal dependency environment, so a clean setup pass still needs to be confirmed.

**Fix / verification:**
- In a fresh Python 3.12 environment, run `pip install -r requirements-dev.txt` and `pip install -e packages/impactmap_core`, then run `pytest`.
- Ensure `services` imports reliably from the repository root and that the `Mangum` handler can be imported without a test stub.
- Keep Python 3.12 consistent with `.python-version` and CI. The bigger CI defects remain the disabled frontend job, skipped CDK synthesis and placeholder deploy workflow.

## CI does not currently verify the full product

**Files:** `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `Makefile`

- The web lint/test/build job is commented out.
- The infra job does not run CDK synth.
- Deploy workflow is placeholder-only.

**Fix:** Add checks for core tests, API tests, frontend lint/test/typecheck/build, CDK synth, secret scan and dependency scan. Deploy only when the authorized OIDC/environment is configured; then run a live smoke test. Do not let a placeholder job appear to prove deployment.

## Frontend build status

The npm install timed out in the audit container; `node_modules` was partial and the build could not be verified. This is an environment limitation, not proof that the source is broken. In a normal networked developer environment, run:

```bash
cd web
rm -rf node_modules
npm ci
npm run lint
npm test
npm run typecheck
npm run build
```

Fix errors from a complete installation before editing source based on the failed partial build.

---

# 6. Frontend and pitch/demo experience

The frontend has an ambitious visual identity, scenario controls, MapLibre feature layers, result summaries, ranking table, compare mode, and cascade/demo path. That is a strength. Prioritize behavior and data truth over further visual effects.

## Map layer loading and attribution

**Files:** `web/src/map/MapView.tsx`, `web/src/config.ts`, `web/public/config.json`, `infra/stacks/config_stack.py`

- The map registers the PMTiles protocol, but the shown basemap style uses an external ArcGIS raster tile URL. This conflicts with the documentation’s self-hosted Protomaps/PMTiles story.
- The attribution string includes OpenStreetMap and Protomaps even though the displayed base raster is Esri’s service. Attribution must match the actual provider/layer.
- Terrain DEM tiles are requested from another external tile URL, creating a second availability/terms dependency.
- Core GeoJSON loading uses configured remote URLs. There is no verified general error handler that reliably replaces a failed segments/facilities/communities source with the local files that exist under `web/public/data/`.
- In the AWS config, the data base URL points to CloudFront `/data`, but the current infra never uploads the required data into that bucket.

**Fix:** Choose one map-data strategy and implement it fully: self-hosted PMTiles/GeoJSON in a known bucket, or a documented external base map with correct attribution and an explicit fallback. For GeoJSON layers, implement source load/error handling; do not assume the fallback happens because local files exist. Show data source/version and `loaded/degraded` state in metadata.

## Static GeoJSON size and national scale

The included `segments.geojson` is about 8.5 MB before transfer compression and has 15,336 features. This can work for a focused pilot at first, but do not load all Ethiopian roads as a single GeoJSON. For this prototype, use gzip/CDN caching, simplify geometry, avoid duplicating large data unnecessarily, and defer detailed attributes until a feature is selected. For expansion, use clipped vector tiles/PMTiles or regional layers.

## Demo mode must be visible

The bundled demo cascade is valuable for stage reliability, but a user must know whether they are viewing a live calculation, heuristic output, or a precomputed demo. Put a persistent badge in the scenario/results UI:

- `LIVE MODEL + GRAPH` — actual model inference and real graph engine both ran.
- `HEURISTIC SCENARIO` — documented non-validated rules produced hazard inputs.
- `PRECOMPUTED DEMO` — static result file; not calculated for the current input.
- `DATA DEGRADED` — a source is missing or has low coverage; details are available in the quality panel.

Never use `Validated` for a fallback fixture.

## Strongest pitch flow

1. Open the working URL and show pilot-area roads/facilities.
2. Select a named, reproducible scenario and show the daily rainfall array the model actually receives.
3. Run the scenario; show exposure probability and evidence level.
4. Click a facility and inspect its calculated connectivity/access result, uncertainty and source-quality details.
5. Force a relevant road closed/open and demonstrate a genuine before/after network consequence.
6. Open Model Evidence and show a real held-out metric and baseline comparison.
7. Briefly show CloudWatch logs/metrics and a successful CI deployment.

If a route or prediction is not implemented, say so rather than inventing one. If the scripted story is precomputed, label it as such. Keep a local/static fallback and record a 2–3 minute video.

## Mobile and motion

Once behavior is correct, test on a phone, honor `prefers-reduced-motion`, and ensure 3D/WebGL effects are not required for the main journey. Visual effects should never obscure key labels, uncertainty, assumptions, or source limitations.

---

# 7. Security, database integrity and third-party dependencies

## Supabase RLS policies are too permissive

**File:** `scripts/supabase_schema.sql`

RLS is enabled, but the SQL grants public `FOR ALL USING (true)` policies on cache/jobs tables and public reads on user records. That does not meaningfully protect job/cache integrity and is not appropriate for operational data.

**Fix:** Prefer backend-only writes using a server-held secret/service role and no direct public table access. If browser reads are needed, expose only intended safe records/policies or API endpoints. Remove broad `FOR ALL USING (true)` policies. Never put a Supabase service-role key in `web/` or any `VITE_*` variable. Add a migration/check that documents and tests the access model.

## CORS is too broad

**File:** `services/api/app/main.py`

CORS currently allows `http://localhost:5173` and `"*"`, with credentials and all methods/headers. A wildcard credential configuration is broader than needed and not a good production posture.

**Fix:** Use an exact allow-list for the real Vercel/CloudFront origin and the development origin. Keep credentials disabled unless the app genuinely uses them. Retain API throttling and enforce input size/sample limits to control expensive requests.

## Default remote database URL

`services/api/app/db.py` has a project-specific Supabase URL as a default even when `SUPABASE_KEY` is empty. No real service-role key was identified in this ZIP, but a public repository should not silently target a real remote project during local development.

**Fix:** Replace the default with a placeholder or require `SUPABASE_URL` explicitly; keep `.env.example` placeholder-only. Confirm no secret is in the GitHub repository settings/build output or frontend bundle (the ZIP itself does not prove deployment environment variables are safe).

## Data and map terms

The repo has multiple possible map/data sources. Document the actual source the running app uses, not just the intended source in the planning document. Preserve required attribution and verify licences before redistributing any processed artifact—especially OSM-derived output and non-commercial flood-event datasets. A dataset permitted for a non-commercial hackathon demonstration may not be suitable for a later commercial product.

---

# 8. Feature-by-feature inventory

| Feature | What exists | Risk/missing piece | Action |
|---|---|---|---|
| Landing page / brand | Frontend UI exists | Could imply validated forecasting even when a demo fixture is served | Keep design; use “decision-support prototype” until evidence is real |
| Map | MapLibre layers for roads, facilities, communities, risk colors, what-if highlights and alt-route layer | Actual base map differs from PMTiles story; wrong attribution; no proven local fallback; AWS data URL is not populated | Align source/attribution/fallback and test failed source loads |
| Scenario library | Named presets/manual scenarios | “Historical replay” may use hard-coded rainfall instead of verified observed CHIRPS values | Record provenance; call it illustrative where unverified |
| Rainfall features | Canonical daily array and feature helpers | Event-to-rainfall extraction not evidenced in current label path | Add real event rainfall features and parity tests |
| Flood ML | LightGBM and calibration file are present | Labels generated from rules, not actual flood extents; model provenance unclear | Real observed labels or downgrade evidence; retrain reproducibly |
| Landslide mode | Hazard catalog marks it heuristic/disabled | Generic schema may accept it, but runner is flood-oriented | Reject until enabled or implement the labelled separate heuristic |
| Monte Carlo graph engine | Real SciPy sparse graph logic exists | Facility uncertainty bands are arbitrary; large-run performance not verified | Calculate intervals from sample outcomes and test small known graphs |
| Facility/community access | Baseline travel, isolation/cutoff metrics and rankings | “People affected” partly represents baseline catchment population | Separate catchment estimate from scenario cut-off population |
| Alternative routes | API/UI schema and map layer exist | Runner always returns `alt_route: None` | Implement actual route or temporarily remove the promise |
| Explanations | Static API explanations plus core helper | Hard-coded contribution/impact claims may not be scenario-derived | Compute features/graph effects or label as heuristic |
| What-if | UI/API handles force-open/force-closed | Formula fallback does not alter real topology | Route through real engine and prove with graph tests |
| Cascade replay | Static sequences exist | Data provenance and “historical event” wording unclear | Label precomputed/demo and record event input provenance |
| Compare | Endpoint and UI exist | Unknown keys can resolve to canned examples | Compare only known results; unknown keys should 404 |
| Model evidence | Static JSON/model-card endpoints | Headline values include hard-coded/unreproducible metrics | Generate from evaluator; remove unsupported claims |
| Data quality | Some snap/source/road-density flags | Full quality coverage isn't complete | Keep basic flags; lower confidence for weak coverage |
| API jobs/cache | Supabase and memory fallback exist | Job marked done during synchronous work; memory fallback ephemeral | Implement real queue or call it synchronous; report storage mode |
| AWS deploy | Partial CDK stacks exist | API packaging, worker, data upload, DB adapter, alarms and deployment CI are incomplete | Choose and complete one architecture |
| CI/CD | Python and secret-check jobs exist | Web check disabled, synth/deploy placeholder | Add real build/test/synth and actual deploy workflow |
| Documentation | Extensive docs and README | Claims exceed what current model/pipeline proves | Keep README evidence-driven and explain execution modes |

---

# 9. Strict repair order (use these as issues/tickets)

Do not fix everything at once. Keep the product vision but gate claims and modules that depend on unverified data.

## Sprint A — Stop misleading behavior and stabilize the API contract

**Owners:** Dagim (API), Anon (UI badges/state), Yagi (test/data support)

1. Add `execution_mode` to the result contract: `live_model`, `heuristic`, `precomputed_demo`, `failed`.
2. Restrict static fallback to exact named demo scenarios only.
3. Unknown job IDs/result keys return 404; no placeholder sample results.
4. Stop catching every execution exception and treating it as successful inference. Log the full server exception against a request ID and return a safe failure status.
5. Make `/ready` check actual graph/model/calibration artifacts.
6. Standardize `awash_01` as the single P0 region; reject unsupported regions.
7. Reject unsupported landslide requests for now.
8. Update tests to assert honest failure behavior.

**Done when:** a named demo loads with a `PRECOMPUTED DEMO` badge; custom scenarios either run the real engine or fail clearly; arbitrary keys never return canned results.

## Sprint B — Make developer setup and CI reproducible

**Owners:** Dagim + Anon

1. Verify the normal clean setup: install `requirements-dev.txt`, install the editable core package, then run tests without any import stubs.
2. Ensure `impactmap_core` and `services` import from a fresh clone without hidden path assumptions.
3. Enable frontend install/lint/unit/typecheck/build jobs.
4. Run `cdk synth` in the infrastructure job; remove the echo-only success step.
5. Add tests for missing artifacts, 404s, invalid scenarios, and evidence JSON schema.
6. Add a `make check` command covering required local checks; do not silently skip failed categories.

**Done when:** a clean environment passes the checks in the README—or reports a real failure clearly.

## Sprint C — Audit datasets and pick a defensible evidence level

**Owners:** Dagim (data/model), Yagi (catalog/licence/event table), testers (spot checks)

1. Verify actual downloads for every row in the event catalog; record source ID, asset URL, dates, licence, resolution and usability.
2. Reproduce the pilot region from raw sources and verify counts/coordinate reference systems.
3. Rename the current rule-based label routine as a heuristic generator, unless it is replaced by real observed-extent overlays.
4. If observed extents exist, overlay them onto segments with stable IDs and use `unknown` for missing/unobserved areas—not automatically negative labels.
5. If valid labels are unavailable, use heuristic/limited evidence and remove `Validated` claims.
6. Check model feature order against `features.json` and the terrain/feature pipeline.
7. Re-run training/evaluation; generate one authoritative evaluation JSON.
8. Make model-card, `/evaluation`, `/backtests`, README and UI evidence panel read from that output.

**Done when:** every displayed metric can be reproduced and evidence level follows a documented rule.

## Sprint D — Prove graph/impact correctness

**Owner:** Dagim; Yagi/testers review expected outputs

1. Add toy graphs for (a) a known alternate path, (b) one critical bridge whose closure disconnects a community, and (c) an already disconnected component.
2. Verify baseline path times, cut-off counts, degraded-access metric, forced-open/closed effects, and rank changes.
3. Replace facility `p10/p90 = p ± 0.12` with a documented interval derived from sample outcomes.
4. Separate baseline catchment population from people cut off by the current scenario.
5. Implement real alternate-route calculation or remove the promise temporarily.
6. Confirm fixed-seed runs reproduce results for identical scenario/model/data/engine versions.
7. Add property tests for probability bounds, unknown segment IDs and graph path behavior.

**Done when:** graph outputs are proved on known cases, independent of the full geospatial dataset.

## Sprint E — Choose and finish one deployed runtime

**Owner:** Dagim + organizer/institutional account support where needed

1. Decide Render/Vercel/Supabase or AWS API Gateway/Lambda/S3/CloudFront/DynamoDB. Record it in a decision record and README.
2. For AWS, package shared modules/dependencies/data correctly and build the worker container if selected.
3. Implement DynamoDB persistence if using it, or remove unused tables and use the actual database. One source of truth.
4. Upload versioned data/model assets and configure the frontend data URL to their real location.
5. Implement real job transitions if using job polling.
6. Implement actual CloudWatch dashboard/alarms/Budget alert if claiming them.
7. Configure OIDC deployment, actual CDK deploy, data upload and live smoke test.
8. Test teardown and redeploy before the final demo.

**Done when:** one diagram matches the deployed architecture and one scenario runs through the deployed endpoint.

## Sprint F — Make the live demo understandable and reliable

**Owner:** Anon (UI), Yagi/testers (usability/data checks), Dagim (engine/cloud)

1. Fix map source attribution and explicit local fallback.
2. Add execution/evidence/data-quality badges.
3. Show source, dates, resolution, snap distance and coverage warnings.
4. Label event replays correctly; do not call an invented scenario historical.
5. Test the main workflow on a phone; reduce motion/3D for low-powered devices.
6. Precompute one robust story and record a short video, clearly labelling any cached output.
7. Publish the README with reproducible setup, metrics only if measured, model card, licences, architecture and teardown instructions.

---

# 10. Ticket template and acceptance criteria

Use this template for GitHub Issues so “done” means the behavior was verified, not just that code was committed:

```text
Title: [P0] Prevent canned fallback for custom scenarios

Problem:
The API may return a formula-generated fixture when the actual engine fails.

Files:
services/api/app/main.py
services/api/tests/...
web/src/...

Tasks:
1. Allow static output only for named demo IDs.
2. Return typed failure for custom scenario execution failure.
3. Add execution_mode and evidence_level to the contract.
4. Return 404 for unknown IDs.

Acceptance criteria:
- Named demo is served with PRECOMPUTED DEMO badge.
- Custom scenario with missing artifacts reports failure.
- Unknown job/result returns 404.
- Tests cover all behaviors.
```

For ML issues, include input dataset IDs/licenses/splits and the exact script/JSON that creates evidence. For deployment issues, require a live endpoint smoke test and specify stack/account ownership without committing secrets.

---

# 11. Commands to use while working

## Start with environment and repo status

```bash
python --version
cd web && node --version && npm --version
cd ..
git status --short
```

## Python tests after dependencies are fixed

```bash
python -m pip install -r requirements-dev.txt
python -m pip install -r services/api/requirements.txt
python -m pip install -e packages/impactmap_core
python -m pytest packages/impactmap_core/tests services/api/tests -q
```

## Frontend after full install

```bash
cd web
npm ci
npm run lint
npm test
npm run typecheck
npm run build
```

## CDK synthesis after dependencies install

```bash
cd infra
python -m pip install -r requirements.txt
npx cdk synth --all
```

Do not run `cdk deploy` until the chosen account, cost controls, region, permissions, resource naming and teardown are confirmed. This review is not a cloud-cost guarantee.

## Data pipeline

Before documenting a one-command data workflow, inspect CLI arguments and prerequisites in `pipeline/impactmap_pipeline/{download,osm_graph,facilities,communities,terrain}.py` and `ml/prepare_labels.py`. The repository needs a top-level orchestrator. Once added, document one supported command and test it from an empty `data/processed/` directory.

---

# 12. What not to do yet

- Do not add a hosted LLM/chatbot, accounts, scheduled forecast alerts, PDF reports or extra languages before the critical path is truthful and working.
- Do not widen from the pilot region to all of Ethiopia while graph arrays, labels and region coverage remain unresolved.
- Do not delete the useful static demo data. Segregate and label it so it can never be mistaken for a live calculation.
- Do not optimize latency before end-to-end correctness tests exist.
- Do not advertise “Validated L0,” precise AUC metrics, actual road closures or exact people cut off until the evidence supports those claims.
- Do not let AI-generated edits change model, data schema and UI independently without tests. Give the coding assistant one bounded ticket, explicit acceptance criteria and ask it to show the diff.

---

# 13. What a credible pitch-ready system looks like

ImpactMap can still be compelling if the flood model has to be downgraded while the data is incomplete. The pitch should demonstrate the whole chain:

1. A genuine geographic road network in one well-supported Ethiopian pilot region.
2. An honest hazard input: a model trained/evaluated on observed data if available; otherwise a clearly labelled heuristic or explicit scenario.
3. A real graph calculation: forcing a road open/closed genuinely changes reachability, routes and access statistics.
4. An evidence panel with actual held-out metrics if labels support them, or a clear disclosure of what is not validated.
5. A cloud story where only deployed and integrated AWS services are claimed.
6. Stage resilience: specific precomputed demos, local fallback and recorded video, each visibly labelled.

A trustworthy impact engine with a transparent, limited model is stronger than a polished dashboard that silently invents “validated” probabilities.

---

# Final verdict

**Keep ImpactMap. Fix the P0 truthfulness and reproducibility blockers first.** The repository has a good visual base, a real sparse-graph Monte Carlo engine, coherent schemas and enough frontend/API structure to become a convincing system. But the ZIP does not reproducibly run the intended real model/graph path; it falls back to canned formula outputs, the label/evaluation scripts do not substantiate the current validation claims, and the AWS infrastructure is not yet wired to the worker/data/database/monitoring architecture in the documentation.

Start with Sprint A (API truthfulness) and Sprint B (clean setup/CI), while the data audit runs in parallel. Fix the observed-label/evaluation path next, then choose and complete one deployment architecture. Keep the long-term features in the roadmap; do not let them delay these core fixes.

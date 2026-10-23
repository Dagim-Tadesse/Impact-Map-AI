# ImpactMap AI: Team Work Division

*Version 1.0 · Built on Functional Documentation v0.2 · Dagim (tech lead and backend lead), Anon (frontend lead), Yagi (support developer) · Written Friday October 23, 2026 · Submission deadline Wednesday October 28, 2026*

## How to use this document

This is one paper for all three of you, in the same shape as the CRM work-division papers, but merged. Part C is common and everyone reads all of it today. Then each person reads their own part. Everyone should also skim the other parts once, so you know what the others are waiting for from you.

- **Part C**: common rules, repository structure, shared naming contracts, API contract, Git rules, configuration, progress files.
- **Part D**: Dagim (tech lead, backend, data, ML, engine, cloud).
- **Part A**: Anon (frontend lead, map application, mock server, tests, demo).
- **Part Y**: Yagi (four small, fully explained tasks) and the testers.
- **Part S**: day-by-day schedule, the cut-line, final checklists.

**How tasks are written, and why**

- **MANUAL** blocks are things a person must do by hand: accounts, tokens, console clicks, installs, downloads. They are written step by step with current information. Do these yourself and follow the steps in order. Do not ask a different AI for these steps, because it will not know our setup.
- **BUILD SPEC** blocks describe what a code file or screen must do, with exact names and contracts. These are meant to be given to an AI coding assistant together with the **context packet** in section C8, in small pieces, one file at a time. The spec and contracts are the protection against two people's code not fitting together.
- **CODE** blocks are exact code or commands, used where a mistake would break another person's work or where precision matters (hashing, contracts, infrastructure roles).
- **\[checked\]** means the fact was confirmed on October 23 against current documentation. **\[verify\]** means confirm it at that step and write down what you saw.
- **Never paste a secret** (AWS keys, bot tokens, passwords) into an AI chat, a chat group, an issue, or the repository.

**Where this document refines v0.2** (on purpose, so nobody is surprised)

| # | v0.2 said | This document does | Reason |
| --- | --- | --- | --- |
| 1 | Lambda arm64 | Lambda x86\_64 | Building arm64 container images on common laptops and the default CI runner needs emulation; x86\_64 is free of that risk and costs nothing extra inside the free allowance. |
| 2 | Web build knows the API URL | The web app reads a runtime file /config.json | The API and CDN addresses only exist after deployment; a runtime file avoids a build-order problem. |
| 3 | One SegmentRisk list | A compact columnar segments file plus a separate segment explain endpoint | 30,000 segments with reasons would be a very large response. |
| 4 | ECR repository in the Data stack | CDK's own asset repository | Less to build; same result. Cleanup is documented. |
| 5 | Reserved concurrency on every function | Reserved concurrency only if the account quota allows it; API throttling always | New accounts can have a low concurrency quota that blocks reserved concurrency \[verify in section D2\]. |
| 6 | Team gets IAM access | Only Dagim has AWS access; Anon and Yagi deploy through CI | Least privilege, and fewer accounts to protect. |
| 7 | Region not chosen | eu-central-1 (Frankfurt) | Close to Ethiopia among regions that work without opt-in. Fallback eu-west-1. |

**Timeline reality.** Today is October 23. The hard deadline is October 28, so there are five working days including today (23, 24, 25, 26, 27) and the 28th is buffer. Part S converts that into hours. The Day-1 work of the 22nd is finished first thing this morning.

# PART C. COMMON SECTION (everyone)

## C1. Team work division overview

| Member | Role | Owns | Depends on | Share of work |
| --- | --- | --- | --- | --- |
| Dagim | Tech lead and backend lead | Repo and contracts, AWS account, infrastructure code, CI/CD, data pipeline, labels, ML model and evaluation, graph engine, API, worker, observability, load test, teardown, README technical sections, architecture diagram | Nobody for the first deliverable; the labels depend on the data gate | About 55 percent |
| Anon | Frontend lead | Web application (map, scenario panel, results, compare, drawers, cascade, evidence panel), typed API client, mock server, basemap extract, translation-ready UI, web tests, phone performance, demo flow and video | Dagim's contracts and fake API (today), real API (Oct 25), evidence JSON (Oct 26) | About 35 percent |
| Yagi | Support developer | Four small tasks (Part Y): data catalog, glossary and About text, facility classification sheet, tester operations | Dagim's source list (today), facility export (Oct 24), Anon's component for static pages (Oct 26) | About 10 percent |
| Testers | Product testers | Scripted rounds, data spot checks, demo audience | A live URL | n/a |

| *FIRST ACTION TODAY: one 60-minute screen-share session with all three. Dagim shares the screen. Together: create the GitHub repository, add the skeleton folders from C2, add CONTRACTS.md, set the Git rules from C5, and push to main. Then everyone branches off. This protects the foundation.* |
| --- |

### C1.1 What unblocks what (critical path)

1. **Today by 12:00**: Dagim pushes CONTRACTS.md, contracts/openapi.yaml and contracts/examples/. Anon starts from these with a mock server.
2. **Today by end of day**: Dagim deploys the walking skeleton: a fake API behind API Gateway returning the example JSON. Anon points the app at it.
3. **Tomorrow, October 24**: Dagim exports facilities.csv for Yagi's classification sheet.
4. **October 25**: real model and engine are wired in. Anon switches from fake to real results without changing code, because the contract does not change.
5. **October 26**: evidence JSON available for the evidence panel; demo scenarios precomputed.

### C1.2 Rules of engagement

- Two status lines a day in the team chat: morning (what I do today, what blocks me) and evening (what is done, what is not). One 15-minute call at a fixed time.
- A blocker is reported within one hour. Nobody waits more than two hours on another person without saying so.
- **Contract changes** (names, shapes, endpoints) go through Dagim only, are announced in the chat, and are added to CONTRACTS.md the same hour. **Screen and component decisions** belong to Anon. If you disagree, Dagim decides within ten minutes.
- Nobody edits a file owned by another person without telling them. Ownership is in C2 and in the CODEOWNERS file.
- Commit small and often, from everyone, from today. Commit history is part of the judged documentation score.

### C1.3 Definition of done (for every task)

1. It works on the live URL or in the local run described in the task.
2. It has at least one test or a written manual check in its MODULE file.
3. CI is green on the pull request.
4. The contract still matches (no renamed field).
5. The MODULE file is updated and a teammate knows it is done.

## C2. Repository structure

The repository must follow this structure exactly. Names matter, because the infrastructure code, the API and the web app import by these paths. The repository is **public from the first commit** (the handbook requires it, and public repositories get free CI minutes) \[verify the free CI minutes on our GitHub account\]. That is why nothing secret may ever be committed.

```
impactmap/                           root of the GitHub repo
  README.md                          judges read this first (Dagim, Yagi skeleton)
  LICENSE                            MIT
  CONTRACTS.md                       copy of section C3 (single source of truth)
  Makefile                           one-word commands: make test, make lint, make deploy
  pyproject.toml                     ruff and pytest settings
  requirements-dev.txt               tools for local work
  .python-version                    3.12
  .nvmrc                             22
  .editorconfig  .gitignore  .env.example  .gitleaks.toml
  .github/
    CODEOWNERS                       who owns which folder
    pull_request_template.md
    ISSUE_TEMPLATE/                  bug.yml, confusing.yml, data-error.yml   (Yagi)
    workflows/                       ci.yml, deploy.yml, teardown.yml (manual only)
  contracts/
    openapi.yaml                     API contract (Dagim)
    examples/                        one sample JSON per shape (Dagim)
  docs/
    definitions.md                   D1 to D12 from the functional doc, frozen (Dagim)
    aws-account.md  cost.md  model-card.md  architecture.png
    data-catalog.csv                 (Yagi)      glossary.md  (Yagi)
    testing/tester-script.md         (Yagi)
    adr/                             short decision records, 0001-region.md ...
    MODULE_SETUP.md  MODULE_DATA.md  MODULE_ML.md  MODULE_ENGINE.md
    MODULE_API.md    MODULE_INFRA.md  MODULE_WEB.md  MODULE_SUPPORT.md
  data/
    README.md                        how data is built (Dagim)
    raw/  processed/                 gitignored, never committed
  pipeline/                          offline data build (Dagim)
    impactmap_pipeline/              download.py osm_graph.py facilities.py communities.py
                                     terrain.py rainfall.py labels.py tiles.py publish.py
    tests/
  ml/                                training and evaluation (Dagim)
    prepare_labels.py  train.py  evaluate.py  baselines.py  calibrate.py  export_model.py
    reports/                         evaluation outputs (small files only)
  packages/
    impactmap_core/                  shared Python package, no cloud imports (Dagim)
      pyproject.toml
      src/impactmap_core/            __init__.py (version) schemas.py scenario.py hashing.py
                                     features.py graph_io.py closure.py montecarlo.py metrics.py
                                     ranking.py explain.py whatif.py
      tests/
  services/
    api/                             FastAPI app for API Gateway (Dagim)
      app/main.py  app/routers/  app/deps.py  requirements.txt  tests/
    worker/                          container image for the heavy job (Dagim)
      Dockerfile  handler.py  requirements.txt
  infra/                             AWS CDK in Python (Dagim)
    app.py  cdk.json  requirements.txt
    stacks/                          data_stack.py web_stack.py api_stack.py config_stack.py
                                     observability_stack.py  (P1: scheduler_stack.py auth_stack.py)
  web/                               React application (Anon)
    package.json  vite.config.ts  index.html  public/config.json
    src/                             see section A1
  tests/
    integration/                     API tests against the live stack (Dagim)
    load/                            k6 scripts (Dagim)
    e2e/                             Playwright tests (Anon)
  scripts/                           smoke.sh  make_demo.py  build_all.sh (Dagim)
```

**Who owns what** (also written into .github/CODEOWNERS): Dagim owns /infra, /services, /packages, /pipeline, /ml, /contracts, /scripts, /tests/integration, /tests/load, /.github/workflows. Anon owns /web, /tests/e2e. Yagi owns /docs/data-catalog.csv, /docs/glossary.md, /docs/testing, /.github/ISSUE\_TEMPLATE. Everything else is Dagim's unless stated.

## C3. Shared naming contracts

These are exact. A renamed field breaks the other person's code. They are copied into CONTRACTS.md and are the first thing to read when something does not fit.

### C3.1 Identifiers, units and formats

| Item | Format | Example and rule |
| --- | --- | --- |
| region\_id | lowercase snake case | pilot\_01 until the data gate tonight; then renamed once to the real area (for example awash\_01); never changes after that |
| segment\_id | integer, 0 or more | 18452. Assigned once by the pipeline, stable inside one data\_version. In map tiles it is the numeric property segment\_id. |
| facility\_id | fac\_ plus 5 digits | fac\_00017 |
| community\_id | com\_ plus 5 digits | com\_00231 |
| catchment\_id | integer | 7 |
| job\_id | UUID v4 string | 3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90 |
| cache\_key | 32 lowercase hex characters | built by the function in section D8, nobody else computes it |
| scenario slug | lowercase kebab case | awash-2020-replay, wet-week-heavy-storm |
| Coordinates | \[longitude, latitude\], WGS84 (EPSG:4326), 5 decimals | GeoJSON order. Never latitude first. |
| Time | ISO 8601 UTC string | 2026-10-25T08:30:00Z ; dates as 2026-10-25 |
| Probability | float from 0 to 1, rounded to 4 decimals | 0.2371 |
| People | integer, always an estimate | people\_affected\_est |
| Travel time | minutes as float, 1 decimal | 47.5 |
| Length and distance | metres as integer | length\_m, snap\_distance\_m |
| Rainfall | millimetres as float | daily\_rain\_mm |
| JSON field names | snake\_case everywhere | The web app uses the same names. No camelCase conversion layer. |
| Python | snake\_case modules and functions, PascalCase classes |  |
| TypeScript | PascalCase component files (FacilityDrawer.tsx), camelCase variables, hooks named useXxx | field names from the API stay snake\_case |

### C3.2 Enum values (exact strings)

| Name | Allowed values |
| --- | --- |
| hazard | flood, landslide |
| evidence\_level | validated, limited, heuristic |
| failure\_mode | independent, correlated |
| spatial.type | uniform, gradient, cell |
| storm\_shape | even, front\_loaded, mid\_peak, back\_loaded |
| wetness (antecedent class) | dry, normal, wet |
| job status | queued, running, done, failed |
| facility level | hospital, health\_center, clinic |
| road\_class | motorway, trunk, primary, secondary, tertiary, unclassified, residential, track, other |
| quality\_flag | ok, low\_road\_density, long\_snap, weak\_source |
| layer mode (web only) | exposure, closure |
| error code | VALIDATION\_ERROR, NOT\_FOUND, JOB\_FAILED, JOB\_TIMEOUT, RATE\_LIMITED, VERSION\_MISMATCH, INTERNAL\_ERROR |

### C3.3 Version strings

| Name | Format | Example | Set by |
| --- | --- | --- | --- |
| data\_version | d + yyyymmdd + one letter | d20261025a | pipeline publish step |
| model\_version | m + yyyymmdd + one letter | m20261026a | export\_model.py |
| engine\_version | semantic version from impactmap\_core.**version** | 0.1.0 | package |
| app\_version | short git commit | 9fa31c2 | CI |

Every API result carries the first three. A cache hit requires all three to match (section D8).

### C3.4 Storage, tables and resource names

| Resource | Exact name or key |
| --- | --- |
| Region | eu-central-1 |
| Data bucket | impactmap-data-ACCOUNTID (ACCOUNTID is the 12-digit AWS account number) |
| Web bucket | impactmap-web-ACCOUNTID |
| Public prefix in data bucket (served by CloudFront under /data/\*) | data/ ; inside: data/DATA\_VERSION/ for map data and evidence, data/results/CACHE\_KEY/ for results, data/demo/SLUG/ for precomputed cascades, data/basemap/ for the basemap |
| Private prefix (worker and API only, never public) | private/DATA\_VERSION/ for graph and feature arrays, private/models/MODEL\_VERSION/ for the model |
| Jobs table | impactmap-jobs ; partition key job\_id (string) ; time-to-live attribute expires\_at |
| Cache table | impactmap-cache ; partition key cache\_key (string) ; attributes result\_prefix, versions, created\_at |
| API function | impactmap-api |
| Worker function | impactmap-worker |
| API | one API Gateway HTTP API named impactmap-http, default stage, no stage prefix in URLs |
| CloudFormation stacks | ImpactMapDataStack, ImpactMapWebStack, ImpactMapApiStack, ImpactMapConfigStack, ImpactMapObsStack, plus ImpactMapCiStack (deployed by hand once, never by CI) (P1: ImpactMapSchedulerStack, ImpactMapAuthStack) |
| Tags on every resource | Project=ImpactMap, Owner=dagim |
| CloudWatch log retention | 14 days |
| GitHub OIDC deploy role | impactmap-gha-deploy |

### C3.5 API endpoints (exact paths, no trailing slash)

The API is one API Gateway HTTP API in front of the impactmap-api function. All bodies and responses are JSON. All responses carry the header x-request-id. Dagim writes contracts/openapi.yaml from this section today; Anon generates the typed client from that file.

| Method | Path | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | /health | Liveness check | 200 with status ok | none |
| GET | /meta | Versions, region, data catalog summary, limits (max days, samples) | 200 | 500 |
| GET | /regions | List of regions with bounding box | 200 | 500 |
| GET | /hazards | Hazards with evidence level and label type | 200 | 500 |
| GET | /scenarios/library | Named scenarios (manual and replay) | 200 | 500 |
| POST | /scenarios | Create and run a scenario. Cached: result is returned at once. Not cached: a job is created. | 200 (cached, Job with status done) or 202 (Job queued) | 400 VALIDATION\_ERROR, 429 RATE\_LIMITED |
| GET | /jobs/{job\_id} | Poll a job | 200 | 404 NOT\_FOUND |
| GET | /results/{cache\_key} | Result summary with ranking | 200 | 404 NOT\_FOUND |
| GET | /results/{cache\_key}/segments | Columnar segment probabilities for painting the map | 200 | 404 NOT\_FOUND |
| GET | /segments/{segment\_id}/explain?cache\_key=... | Reasons one segment is risky | 200 | 404 NOT\_FOUND |
| GET | /facilities/{facility\_id}/explain?cache\_key=... | Why a facility ranks where it does, alternative route | 200 | 404 NOT\_FOUND |
| POST | /whatif | Force segments open or closed on top of a finished result | 200 or 202 as POST /scenarios | 400, 404 |
| GET | /compare?a=...&b=... | Compare two finished results | 200 | 404 NOT\_FOUND |
| GET | /backtests | Past events with predicted versus observed summaries | 200 | 500 |
| GET | /model-card | Model card text and key numbers | 200 | 500 |

Static files (served by CloudFront, not by the API): /config.json, /data/DATA\_VERSION/meta.json, /data/DATA\_VERSION/facilities.geojson, /data/DATA\_VERSION/communities.geojson, /data/DATA\_VERSION/tiles/roads.pmtiles, /data/DATA\_VERSION/evidence/evaluation.json, /data/basemap/ethiopia.pmtiles, /data/demo/index.json and /data/demo/SLUG/step\_N.json, /data/results/CACHE\_KEY/summary.json and segments.json.

### C3.6 JSON shapes (field by field)

Types: str, int, float, bool, list\[x\], obj. A question mark means the field can be null.

**Scenario** (body of POST /scenarios)

| Field | Type | Rule |
| --- | --- | --- |
| hazard | str | flood (landslide only when the feature flag is on) |
| region\_id | str | must exist in /regions |
| start\_date | str | YYYY-MM-DD |
| daily\_rain\_mm | list\[float\] | length 1 to 10, each 0 to 400 |
| antecedent\_30d\_mm | float | 0 to 600 |
| spatial | obj | type plus params. uniform: no params. gradient: direction\_deg 0 to 359, ratio 0.2 to 1.0. cell: center \[lon, lat\], radius\_km 5 to 200. |
| closure\_factor | float | 0.0 to 1.0, default 1.0 (assumed closure, section 1.2 of the functional doc) |
| failure\_mode | str | independent (default); correlated only when the flag is on |
| n\_samples | int | 50 to 500, default 200 |
| seed | int | default 42 |
| forced\_closed | list\[int\] | segment\_ids, default empty |
| forced\_open | list\[int\] | segment\_ids, default empty; must not overlap forced\_closed |

**Job** (response of POST /scenarios, POST /whatif, GET /jobs/{job\_id})

| Field | Type | Meaning |
| --- | --- | --- |
| job\_id | str |  |
| status | str | queued, running, done, failed |
| cache\_key | str | result identity |
| submitted\_at, started\_at?, finished\_at? | str | ISO UTC |
| result\_url? | str | set when done: path under /data/results/CACHE\_KEY/ |
| error? | obj | code, message, field?, request\_id |

**ResultSummary** (GET /results/{cache\_key} and data/results/CACHE\_KEY/summary.json)

| Field | Type | Meaning |
| --- | --- | --- |
| cache\_key | str |  |
| versions | obj | model, data, engine strings |
| hazard, evidence\_level | str | enums |
| scenario | obj | echo of the canonical Scenario |
| base\_cache\_key? | str | set when produced by a what-if |
| computed\_at | str | ISO UTC |
| region\_totals | obj | people\_cut\_off, people\_degraded (each obj with mean, p10, p90, floats), facilities\_isolated\_expected (float) |
| ranking | list\[FacilityImpact\] | sorted by rank ascending |
| top\_communities | list\[CommunityImpact\] | at most 50, by people affected |
| assumptions | obj | speeds\_kmh by road\_class, closure\_factor, degraded\_ratio (2.0), poor\_baseline\_minutes (120), failure\_mode |

**FacilityImpact**: facility\_id, name, level, p\_isolation, p10, p90, people\_affected\_est (int), baseline\_minutes?, poor\_baseline\_access (bool), alt\_route? (obj: minutes, segment\_ids), rank (int), rank\_delta? (int, versus baseline ordering), snap\_distance\_m (int), source (str), quality\_flag.

**CommunityImpact**: community\_id, name?, people\_est (int), p\_cut\_off, p\_degraded, expected\_minutes?, baseline\_minutes?, poor\_baseline\_access (bool), snap\_distance\_m (int), quality\_flag.

**Segments (columnar)** (GET /results/{cache\_key}/segments): cache\_key, n\_total (int), sparse\_threshold (float, 0.005), segment\_ids (list\[int\]), exposure\_prob (list\[float\]), closure\_prob (list\[float\]). The three lists have the same length and the same order. A segment that is not listed has probability 0. This keeps the payload small and lets the map paint only what matters.

**SegmentExplain**: segment\_id, name?, road\_class, length\_m, exposure\_prob, closure\_prob, quality\_flag, top\_reasons (list of obj: feature, label, contribution), where label is plain English such as Low ground next to a river.

**FacilityExplain**: facility\_id, rank, rank\_delta?, p\_isolation, why (list of at most 3 obj: segment\_id, lift, closure\_prob, text), alt\_route? (obj: minutes, segment\_ids, geometry as a GeoJSON LineString with \[lon, lat\] coordinates), sentences (list\[str\], template text for the UI to show as is).

**WhatIf** (request): base\_cache\_key, forced\_closed (list\[int\]), forced\_open (list\[int\]). Response: Job.

**Compare** (response): a, b (the two cache\_keys), region\_totals\_a, region\_totals\_b, people\_cut\_off\_delta (float), rank\_changes (list of obj: facility\_id, rank\_a, rank\_b).

**Error** (every non-2xx response): an object with one field error, itself an object with code, message, field?, request\_id.

**Runtime config** (/config.json): api\_base\_url, data\_base\_url, region\_id, data\_version, model\_version, app\_version, features (obj of bool: correlated\_mode, landslide, forecast, accounts). The UI hides anything whose feature flag is false.

**Evidence file** (data/DATA\_VERSION/evidence/evaluation.json), produced by ml/evaluate.py: evidence\_level, label\_rung (L0 to L3), n\_events (int), events (list of obj: event\_id, name, dates, country, source, split), metrics (obj: model, b0, b1, b2; each with pr\_auc, roc\_auc, brier, recall\_at\_precision, each as obj of mean, ci\_low, ci\_high), end\_to\_end (obj: auc, spearman, baseline\_auc, baseline\_spearman), limitations (list\[str\]), versions. Dagim commits a realistic example file on October 24 so the evidence panel can be built before the real numbers exist.

### C3.7 Environment variable names

| Name | Used by | Meaning |
| --- | --- | --- |
| AWS\_REGION | api, worker, scripts | eu-central-1 |
| IMPACTMAP\_DATA\_BUCKET | api, worker | data bucket name |
| IMPACTMAP\_JOBS\_TABLE, IMPACTMAP\_CACHE\_TABLE | api, worker | table names |
| IMPACTMAP\_WORKER\_FUNCTION | api | worker function name |
| IMPACTMAP\_DATA\_VERSION, IMPACTMAP\_MODEL\_VERSION | api, worker | active versions |
| IMPACTMAP\_ALLOWED\_ORIGIN | api | the one browser origin allowed by CORS |
| LOG\_LEVEL | all | INFO by default |
| VITE\_USE\_MOCKS | web (dev only) | true to use the mock server |

Secrets never go in these. They go in Parameter Store (P1), and are read at run time.

## C4. Dependency rules (what may import what)

1. **impactmap\_core** imports only the standard library, NumPy, SciPy, LightGBM and Pydantic. It never imports boto3, FastAPI, or anything that touches a network or a file path outside its arguments. This is what makes the engine testable on a laptop.
2. **services/api** and **services/worker** import impactmap\_core. They are the only code that talks to S3, DynamoDB and Lambda. The API never runs the engine; it only creates jobs and reads results.
3. **pipeline** and **ml** import impactmap\_core (especially features.py, so training and serving compute features the same way). They never import from services.
4. **infra** imports nothing from the Python packages. It only references folders (services/worker for the image, web/dist for the site).
5. **web** imports no Python and no code from other folders. Its only link to the backend is contracts/openapi.yaml (generated types) and /config.json.
6. Nothing imports from tests.

```
web  ->  (HTTP, contract only)  ->  services/api  ->  impactmap_core
                                    services/worker -> impactmap_core
pipeline, ml  ->  impactmap_core                 infra -> (folders only)
```

## C5. Git rules

- **Branches**: main is protected. Work in branches named type/owner-topic, for example feat/anon-scenario-panel, fix/dagim-snap-distance, docs/yagi-data-catalog.
- **Commit messages**: start with feat:, fix:, docs:, test:, chore:, infra: or data:, then a short sentence in present tense. Example: feat: add ranking table with sortable columns.
- **Pull requests**: one PR per task, small, with the template filled in. CI must be green. Dagim reviews Anon's and Yagi's PRs; Anon reviews Dagim's PRs that touch contracts or anything the web app consumes. Review turnaround target: two hours in working time.
- **Merging**: squash merge. Delete the branch after.
- **Never commit**: keys, tokens, .env files, raw data, large files (over 5 MB). Large artifacts go to the data bucket, not Git. gitleaks runs in CI and also as a local pre-commit hook.
- **Everyone commits** from their own account every day. The history is read by judges.
- **Conflicts**: if two people need the same file, the owner in C2 merges first and the other rebases. Ask in chat before touching someone else's folder.
- **Pull request template** (.github/pull\_request\_template.md): What this changes; Which task (module and item); How I tested it; Contract impact (none, or what changed); Screenshots if it is a screen.

## C6. Shared configuration files

**pyproject.toml** (root)

```
[tool.ruff]
line-length = 100
target-version = 'py312'

[tool.ruff.lint]
select = ['E', 'F', 'I', 'B', 'UP']

[tool.pytest.ini_options]
testpaths = ['packages', 'pipeline', 'services']
addopts = '-q'
```

**.python-version**: 3.12  ·  **.nvmrc**: 22 (a current long-term-support Node release; Node 20 is past its end of life \[verify on nodejs.org if you prefer 24\]).

**.env.example** (copy to .env for local work; .env is gitignored)

```
AWS_REGION=eu-central-1
IMPACTMAP_DATA_BUCKET=impactmap-data-ACCOUNTID
IMPACTMAP_JOBS_TABLE=impactmap-jobs
IMPACTMAP_CACHE_TABLE=impactmap-cache
IMPACTMAP_WORKER_FUNCTION=impactmap-worker
IMPACTMAP_DATA_VERSION=d20261025a
IMPACTMAP_MODEL_VERSION=m20261026a
IMPACTMAP_ALLOWED_ORIGIN=http://localhost:5173
LOG_LEVEL=INFO
```

**Makefile targets** (Dagim creates; each line under a target must start with a TAB)

| Target | Runs |
| --- | --- |
| make setup | creates the Python virtual environment and installs requirements-dev.txt and the local packages |
| make lint | ruff check . and, in web/, npm run lint |
| make test | pytest for Python and, in web/, npm test |
| make synth | cdk synth for all stacks, including the cdk-nag checks |
| make deploy | cdk deploy --all (normally done by CI, not by hand) |
| make smoke | scripts/smoke.sh against the live URL |
| make destroy | cdk destroy --all (teardown, section D11) |

## C7. Progress files (MODULE template)

Each person keeps their MODULE files in docs/ current. They are how the mentors, and the rest of the team, see what is finished. Update them in the same pull request as the work.

```
# MODULE_NAME  (owner: NAME)

## Status
Not started / In progress / Done / Blocked (reason)

## What is built
- item, file path, date

## Contract notes
- anything other modules must know

## How to test
- exact command or clicks

## Known issues
- item, severity, plan
```

Files: MODULE\_SETUP, MODULE\_INFRA, MODULE\_DATA, MODULE\_ML, MODULE\_ENGINE, MODULE\_API belong to Dagim; MODULE\_WEB to Anon; MODULE\_SUPPORT to Yagi.

## C8. Working with an AI coding assistant without creating conflicts

The rules below apply to Dagim and Anon. Yagi's tasks do not need an AI assistant, and if he uses one, he must follow the same rules.

1. **One file or one function per request.** Never ask for the whole application.
2. **Always paste the context packet first** (below), then the exact contract tables the task touches, then the BUILD SPEC for the task.
3. **Forbid invention.** The packet says: do not add endpoints, fields or libraries that are not listed. If something seems missing, the assistant must stop and say what is missing.
4. **Ask for the assumptions** the assistant made, and compare them with the contracts before accepting the code.
5. **Run it before committing**: lint, tests, and for screens, look at it in a browser at phone width and laptop width.
6. **Keep names exact.** If the assistant renames a field to camelCase, reject it.
7. **Never paste secrets** into the assistant. Replace them with placeholders.

**Context packet** (copy this at the start of every AI session)

```
Project: ImpactMap AI, a flood road-access impact system for Ethiopia, built for the AWS Community Day 2026 hackathon. I am working on TASK_NAME in the folder FOLDER.
Stack (do not change): Python 3.12 on AWS Lambda (x86_64), FastAPI + Mangum for the API, a Lambda container image for the worker, DynamoDB, S3, CloudFront, API Gateway HTTP API, AWS CDK in Python. Web: React + TypeScript + Vite + Tailwind CSS v4 + TanStack Query + Zustand + MapLibre GL JS + PMTiles. Everything must stay within free tiers.
Rules: use only the endpoints, field names, enum values and file paths in the pasted contract. All JSON field names are snake_case. Coordinates are [longitude, latitude]. Do not add libraries, endpoints or fields that are not listed. If something is missing or unclear, stop and ask me instead of guessing. Keep code small, typed, and tested. Do not rename anything. Explain your assumptions at the end.
Never include or ask for secrets.
```

# PART D. DAGIM (tech lead and backend lead)

You own everything that is not the web screen. The order below is the order of work. Items marked P0 must be done for the October 28 submission. Items marked P1 are done only after P0 is complete and tested.

## D1. Your folders and what you do not touch

You create and own: /infra, /services, /packages, /pipeline, /ml, /contracts, /scripts, /tests/integration, /tests/load, /.github/workflows, /docs (except Yagi's files and the web module file). You do not touch /web except to review pull requests. If a web change is needed, write it in the chat for Anon.

## D2. TODAY, MORNING: one-time manual setup (about 3 hours)

Do these in order. They are the Day-1 checks from section 16 of the functional document, written as steps. Record each result in docs/MODULE\_SETUP.md.

### D2.1 MANUAL: install the tools

**If you are on Windows**: install WSL2 with Ubuntu 24.04 (open PowerShell as administrator, run wsl --install -d Ubuntu-24.04, restart, create a Linux user). From now on run every Python, Docker, CDK and data command inside the Ubuntu terminal, not in PowerShell. The geospatial libraries and the tile tools are much easier on Linux. Keep the repository inside the Linux file system (your Linux home folder), not under /mnt/c, because file access is very slow across that boundary.

1. **Git**: git --version (any 2.40 or newer).
2. **Python 3.12**: python3 --version must print 3.12.x. On Ubuntu 24.04 it is the default. Install the extras: sudo apt update && sudo apt install -y python3-venv python3-pip build-essential unzip make gdal-bin libgdal-dev.
3. **Docker**: install Docker Desktop (with the WSL2 integration switched on for Ubuntu in Docker Desktop settings, Resources, WSL integration). Docker Desktop is free for personal use and education, but check its current terms on docker.com \[verify\]. Test: docker run --rm hello-world. If Docker Desktop is a problem, install Docker Engine inside Ubuntu instead; the worker image only needs docker build to work.
4. **Node.js 22** (needed for the CDK command-line tool and for Anon's web app): use nvm (install script from the nvm GitHub page), then nvm install 22 and node --version.
5. **AWS CLI v2**: install from the AWS documentation page for your platform, then aws --version must print aws-cli/2.x.
6. **AWS CDK tool**: npm install -g aws-cdk, then cdk --version must print 2.x.
7. **gitleaks** (secret scanner): you can run it through Docker later, so no install is required. Pre-commit use is optional.
8. **A good editor** with Python support.

If any check fails, fix it before continuing. Write the versions into MODULE\_SETUP.md.

### D2.2 MANUAL: the AWS account

Goal: one account that you control, protected, in one region, with a spending alarm. Only you will have access.

1. **Decide who owns the account.** The account holder must be an adult who can accept the AWS customer terms, or the organizers must provide an account. If this is not already settled, settle it now with the organizers, before spending more time. Write the answer in docs/aws-account.md.
2. **Check the plan.** Sign in to the AWS Management Console as the account owner (root user). Open Billing and Cost Management. Find the account plan: Free plan or Paid plan. Write down the plan, the credit balance, and the credit expiry date. Sources from 2026 say new accounts get 100 USD in credits (up to 200 USD with onboarding activities), and the Free plan closes after six months or when credits run out \[verify these numbers on our account\]. Use the Free plan for the hackathon. Do not upgrade to the Paid plan unless you have decided to accept possible charges.
3. **Protect the root user.** Click your account name (top right), choose Security credentials, and under Multi-factor authentication (MFA) choose Assign MFA device. Use an authenticator app. From now on do not use the root user for anything except step 4 and billing settings.
4. **Let IAM users see billing.** While signed in as root: account name, Account, scroll to IAM user and role access to Billing information, Edit, tick Activate IAM Access, Update. (Without this, your admin user cannot create budgets.)
5. **Create your admin user.** Open IAM, Users, Create user. Name: dagim-admin. Tick Provide user access to the AWS Management Console only if you want a console login; set a strong password and require nothing else. Next, choose Attach policies directly, tick AdministratorAccess. Create the user. Then open the user, Security credentials, assign an MFA device, and create an access key with the use case Command Line Interface. Download the key once. Treat it like a password.
6. **Configure the AWS CLI with a named profile.** In the terminal run aws configure --profile impactmap and paste the access key ID and secret when asked. Default region: eu-central-1. Default output: json. Test with aws sts get-caller-identity --profile impactmap; it must print your account number. Write the 12-digit account number in docs/aws-account.md (this is not a secret, but do not share the keys).
7. **Set the region in the console** to Europe (Frankfurt) eu-central-1 using the region selector. If anything we need is unavailable on the Free plan there, record it and use eu-west-1 instead, and write an ADR (docs/adr/0001-region.md).
8. **Check the Lambda concurrency quota.** Console search: Service Quotas, AWS services, AWS Lambda, Concurrent executions. Write the applied value. If it is 10 (common on new accounts), you cannot set reserved concurrency on a function, because AWS requires 10 unreserved executions. In that case we rely on API Gateway throttling and the small size of the system. Write this in the ADR.
9. **Check what the Free plan blocks.** After the skeleton deploys (D4), confirm every service worked: Lambda, API Gateway, S3, CloudFront, DynamoDB, CloudWatch. Write anything blocked in docs/aws-account.md and tell the mentor at the next checkpoint.

### D2.3 MANUAL: spending alarms (handbook requirement)

The handbook asks for a documented budget alarm. A budget only notifies you; it does not stop spending. The real protection is API throttling and not using paid services.

1. Console search: Billing and Cost Management, then Budgets in the left menu, then Create budget.
2. Under Budget setup choose **Use a template (simplified)**.
3. Choose **Zero spend budget**: it notifies when spending goes above the free allowance. Enter your email and create it.
4. Create a second budget, template **Monthly cost budget**, amount 5 (USD), your email. This template sends alerts at 85 percent of the amount, 100 percent, and when the forecast reaches 100 percent.
5. Open Billing preferences, Alert preferences, and switch on AWS Free Tier alerts with your email.
6. Take a screenshot of the Budgets list and put it in docs/cost.md with the thresholds.
7. **Honest note for the documentation:** with 0 USD of real spend you cannot fire the alarm on demand, so the evidence is the configuration and the screenshot. On October 26 you will also recreate this budget in code (ObsStack with a CfnBudget), because the handbook forbids console-only configuration in the final evaluation, and delete the manual copies after the code version works.

### D2.4 MANUAL: the GitHub repository

1. In GitHub: New repository. Name **impactmap**. **Public**. Add a README and the MIT license. Create.
2. Settings, Collaborators, Add people: add Anon and Yagi with the Write role.
3. Settings, Code security (or Advanced Security, depending on the page): switch on Dependabot alerts and security updates, Secret scanning, and Push protection. These are free for public repositories.
4. Settings, Actions, General: Workflow permissions: Read repository contents permission. Leave Allow GitHub Actions to create and approve pull requests off.
5. Settings, Rules, Rulesets, New ruleset, New branch ruleset. Name: main-protection. Enforcement: Active. Target branches: Add target, Include default branch. Tick: Restrict deletions; Require a pull request before merging (required approvals 1; allowed merge methods: Squash only); Require status checks to pass (add the check named all-checks after the first CI run exists); Block force pushes. Under Bypass list add Repository admin with the mode For pull requests only, so you can unblock yourself in an emergency without disabling the rules.
6. Settings, Secrets and variables, Actions, Variables tab, New repository variable: AWS\_REGION = eu-central-1. You will add AWS\_DEPLOY\_ROLE\_ARN in D2.6. These are variables, not secrets, because they are not confidential.
7. Clone the repository into your Linux home folder.

### D2.5 The repository skeleton (mob session)

Do this during the 60-minute call with Anon and Yagi watching. In the repository root:

```
mkdir -p .github/workflows .github/ISSUE_TEMPLATE contracts/examples docs/testing docs/adr data/raw data/processed pipeline/impactmap_pipeline pipeline/tests ml/reports packages/impactmap_core/src/impactmap_core packages/impactmap_core/tests services/api/app/routers services/api/tests services/worker infra/stacks web tests/integration tests/load tests/e2e scripts
touch data/raw/.gitkeep data/processed/.gitkeep
```

Then create these files: the .gitignore (Python, Node, CDK output cdk.out, .env, data/raw, data/processed, artifacts, .venv, node\_modules, dist), .editorconfig, .python-version, .nvmrc, .env.example, pyproject.toml, requirements-dev.txt (ruff, pytest, hypothesis, boto3, moto, numpy, scipy, lightgbm, scikit-learn, pydantic, fastapi, mangum, httpx, aws-cdk-lib, constructs, cdk-nag, pip-audit), CONTRACTS.md (paste sections C3.1 to C3.7 from this document), the MODULE files from the C7 template, and .github/CODEOWNERS:

```
/infra/ @DAGIM_GH
/services/ @DAGIM_GH
/packages/ @DAGIM_GH
/pipeline/ @DAGIM_GH
/ml/ @DAGIM_GH
/contracts/ @DAGIM_GH
/.github/workflows/ @DAGIM_GH
/web/ @ANON_GH
/tests/e2e/ @ANON_GH
/docs/data-catalog.csv @YAGI_GH
/docs/glossary.md @YAGI_GH
/docs/testing/ @YAGI_GH
```

Replace the three placeholders with the real GitHub user names. Commit as docs: repository skeleton and push to main (the ruleset is not blocking yet because the check does not exist; if the ruleset blocks you, use the admin bypass once). Then Anon and Yagi pull and branch.

Also create today docs/definitions.md by copying sections D1 to D12 of the functional document (section 3), and freeze it.

### D2.6 MANUAL: CDK bootstrap and the GitHub deploy role

We deploy from GitHub Actions without any stored AWS key, using OpenID Connect (OIDC): GitHub proves to AWS who it is with a short-lived token, and AWS lets it assume one role. The role itself is created by code (infra/stacks/ci\_stack.py), run once from your laptop.

1. **Check for an existing GitHub provider.** Console: IAM, Identity providers. If one for token.actions.githubusercontent.com exists, tell me before continuing, because an account can have only one and the code must reference it instead of creating it. In a new account there will be none.
2. **Bootstrap CDK** (creates the staging bucket, the image repository and the roles CDK uses). In the infra folder, with the virtual environment active and requirements installed:

```
cd infra
python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
export AWS_PROFILE=impactmap
cdk bootstrap aws://ACCOUNTID/eu-central-1
```

Replace ACCOUNTID with your 12-digit number. It finishes with a CDKToolkit stack in CloudFormation. Take note: this stack is not removed by our teardown; see D11.

3. **Create the file infra/stacks/ci\_stack.py** (this exact code):

```python
from aws_cdk import CfnOutput, Duration, Stack
from aws_cdk import aws_iam as iam
from constructs import Construct


class ImpactMapCiStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, *, github_repo: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        provider = iam.OpenIdConnectProvider(
            self, 'GitHubOidc',
            url='https://token.actions.githubusercontent.com',
            client_ids=['sts.amazonaws.com'],
        )
        role = iam.Role(
            self, 'DeployRole',
            role_name='impactmap-gha-deploy',
            max_session_duration=Duration.hours(1),
            assumed_by=iam.WebIdentityPrincipal(
                provider.open_id_connect_provider_arn,
                conditions={
                    'StringEquals': {'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'},
                    'StringLike': {'token.actions.githubusercontent.com:sub': f'repo:{github_repo}:ref:refs/heads/main'},
                },
            ),
        )
        # The role can only do one thing: assume the CDK bootstrap roles, which do the real deployment.
        role.add_to_policy(iam.PolicyStatement(
            actions=['sts:AssumeRole'],
            resources=[f'arn:aws:iam::{self.account}:role/cdk-hnb659fds-*'],
        ))
        CfnOutput(self, 'DeployRoleArn', value=role.role_arn)
```

The trust condition means only workflows running on the main branch of your repository can use the role. hnb659fds is the default CDK bootstrap qualifier \[verify it appears in the role names created by the bootstrap: IAM, Roles, search cdk-\].

4. **Create infra/app.py** with the CI stack only for now:

```python
import os
import aws_cdk as cdk
from stacks.ci_stack import ImpactMapCiStack

app = cdk.App()
env = cdk.Environment(account=os.environ.get('CDK_DEFAULT_ACCOUNT'), region='eu-central-1')
ImpactMapCiStack(app, 'ImpactMapCiStack', github_repo='GITHUB_OWNER/impactmap', env=env)
app.synth()
```

Create infra/cdk.json containing an object whose app key has the value python3 app.py (the command CDK runs). Then run cdk deploy ImpactMapCiStack and copy the DeployRoleArn output.

5. In GitHub add the repository variable **AWS\_DEPLOY\_ROLE\_ARN** with that ARN (Settings, Secrets and variables, Actions, Variables).
6. The stack list in section C3.4 already includes ImpactMapCiStack. It is deployed by hand, never by CI, so a pipeline mistake cannot change its own permissions.
7. Local-only safety: the access key stays in \~/.aws and never in the repo. Run gitleaks through Docker before the first push to prove the repo is clean: docker run --rm -v $(pwd):/repo ghcr.io/gitleaks/gitleaks:latest detect --source /repo --no-banner.

## D3. Contracts, today by 12:00 (P0)

**BUILD SPEC: contracts/openapi.yaml.** An OpenAPI 3.1 file describing exactly the endpoints in C3.5 with the shapes in C3.6, the error shape, and the status codes in the endpoint table. Every schema is named as in C3.6 (Scenario, Job, ResultSummary, FacilityImpact, CommunityImpact, SegmentsColumnar, SegmentExplain, FacilityExplain, WhatIfRequest, CompareResponse, ErrorResponse, EvidenceFile, RuntimeConfig). Enums use the exact strings in C3.2. Use the AI assistant with the context packet, paste C3.5 and C3.6, ask for the YAML, then review it line by line against the tables. Check it with npx @redocly/cli lint contracts/openapi.yaml and fix what it reports.

**BUILD SPEC: contracts/examples/.** One realistic JSON file per shape: scenario.json, job\_done.json, job\_queued.json, result\_summary.json (with 8 facilities), segments\_columnar.json (about 40 segments), segment\_explain.json, facility\_explain.json, error.json, meta.json, evidence\_evaluation.json, config.json. Use real-looking numbers: probabilities that differ, one facility with poor\_baseline\_access true, one with a null alt\_route. These files are what the fake API returns and what Anon's mock server serves, so they must be valid against the OpenAPI file.

Announce in the team chat that contracts are published. From this moment, changes go through you.

## D4. Walking skeleton, today to the end of the day (P0)

Goal: a deployed, CI-tested system with fake data, end to end. Everything after this replaces fake parts with real ones.

**D4.1 BUILD SPEC: fake API (services/api).** A FastAPI app wrapped with the Mangum adapter (handler name handler in app/main.py). Every endpoint in C3.5 exists. For now each returns the matching file from contracts/examples (copied into the function package at build time), except: GET /health returns the status and the current time; POST /scenarios validates the body with Pydantic models that mirror C3.6 (reject bad ranges with the Error shape and the field name) and returns job\_done.json for any valid body. Add a middleware that creates request\_id and logs one structured JSON line per request.

**D4.2 BUILD SPEC: CDK stacks.** Create these stacks in infra/stacks, each in one file, with the exact names from C3.4:

- **ImpactMapDataStack**: the data bucket (all public access blocked, encrypted, versioning off, auto-delete objects on destroy, removal policy destroy), the two DynamoDB tables with provisioned capacity of 5 read and 5 write units, TTL attribute expires\_at on the jobs table.
- **ImpactMapWebStack**: the web bucket (private), a CloudFront distribution with two origins: the web bucket at the default behavior and the data bucket at the path /data/\* (CloudFront origin access control for both, GET and HEAD only, compression on, default root object index.html, error responses 403 and 404 returning index.html with status 200 for the single-page app). A BucketDeployment that uploads web/dist. If web/dist does not exist yet, deploy a one-file placeholder page.
- **ImpactMapApiStack**: the impactmap-api Lambda function (Python 3.12, x86\_64, 512 MB, 15 s timeout) from services/api, the HTTP API with a route per endpoint to that function, CORS allowing only the CloudFront domain from the web stack and http://localhost:5173 for development, stage throttling of 10 requests per second with a burst of 20, access logging to CloudWatch Logs with 14-day retention, and reserved concurrency only if D2.2 step 8 allowed it.
- **ImpactMapConfigStack**: deploys /config.json into the web bucket with the real API and CloudFront addresses (api\_base\_url without a trailing slash; data\_base\_url is the CloudFront address plus /data) (use a BucketDeployment with a JSON source, prune off so it does not delete the site files), then invalidates the CloudFront path /config.json.
- Tag everything with Project=ImpactMap and Owner=dagim.

Add the cdk-nag checks (AwsSolutionsChecks) to app.py. Fix findings, or suppress a finding with a written reason next to the code; the reasons are evidence for the security score.

**D4.3 The two workflows (exact code).** Use the current major versions of the standard actions (checkout, setup-python, setup-node) from their Marketplace pages \[verify\]. The AWS credentials action is at version 6 \[checked: v6.x is current\].

```yaml
# .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-python@v6
        with:
          python-version: '3.12'
      - run: pip install -r requirements-dev.txt
      - run: pip install -e packages/impactmap_core
      - run: ruff check .
      - run: pytest
      - run: pip-audit -r requirements-dev.txt
  web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: npm ci
        working-directory: web
      - run: npm run lint
        working-directory: web
      - run: npm test
        working-directory: web
      - run: npm run build
        working-directory: web
  infra:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-python@v6
        with:
          python-version: '3.12'
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: npm install -g aws-cdk
      - run: pip install -r infra/requirements.txt
      - run: cdk synth --all --quiet
        working-directory: infra
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - run: docker run --rm -v ${{ github.workspace }}:/repo ghcr.io/gitleaks/gitleaks:latest detect --source /repo --no-banner
  all-checks:
    needs: [python, web, infra, secrets]
    runs-on: ubuntu-latest
    steps:
      - run: echo ok
```

Until Anon pushes the web app, the web job will fail; Dagim comments the web job out in the first commit and Anon re-enables it in his first pull request. The check required by the ruleset is **all-checks**.

```yaml
# .github/workflows/deploy.yml
name: deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  id-token: write
  contents: read
concurrency:
  group: deploy
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - uses: actions/setup-python@v6
        with:
          python-version: '3.12'
      - run: npm ci && npm run build
        working-directory: web
      - run: npm install -g aws-cdk
      - run: pip install -r infra/requirements.txt
      - uses: aws-actions/configure-aws-credentials@v6
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}
      - run: cdk deploy --all --require-approval never --exclude ImpactMapCiStack
        working-directory: infra
      - run: bash scripts/smoke.sh
```

**scripts/smoke.sh** must read the CloudFront and API addresses from the stack outputs (aws cloudformation describe-stacks) or from the deployed /config.json, then check: GET /health returns 200; GET /config.json returns JSON containing api\_base\_url; POST /scenarios with contracts/examples/scenario.json returns 200 or 202; a deliberately bad body returns 400 with the error shape. It exits with an error if any check fails.

**D4.4 Exit check for today** (write the result in MODULE\_INFRA.md): the budget alarms exist; CI is green on a pull request; deploy is green from a push to main; a browser page served from CloudFront can call the API (CORS works) and print the JSON; no key exists in the repository; Anon has the live API address and the contract examples.

## D5. Data foundation and the flood-event gate (P0, today and tomorrow)

Rules for all data work: raw downloads go to data/raw (gitignored). Each dataset has one script in pipeline/impactmap\_pipeline that reads raw files and writes data/processed. A top-level script (scripts/build\_all.sh, also make data) runs them in order. Every file you use gets a row in docs/data-catalog.csv (Yagi fills the licence text; you give him the source links, section Y1). Work on a small pilot region first; do not process the whole country.

### D5.1 MANUAL: the flood-event audit (do this first; it decides the project)

The label data is the make-or-break item. The decision gate is tonight at 20:00. Spend the first three hours of the afternoon on this and nothing else.

1. Create docs/event-audit.csv with these columns: event\_id, name, start\_date, end\_date, country, admin\_area, source, extent\_type (raster or polygon), extent\_resolution\_m, extent\_url, licence, covers\_pilot\_candidate (which candidate area), usable (yes or no), notes.
2. **Dartmouth Flood Observatory**: search the web for Dartmouth Flood Observatory Global Active Archive of Large Flood Events, open the archive page, download the event table (spreadsheet or shapefile). Filter the country column for Ethiopia, Somalia, Kenya, South Sudan, Sudan and Djibouti, and years 2000 to 2026. This gives you the list of candidate events with dates and rough areas \[verify the download format; if it needs a form, fill it in\]. Add one row per event.
3. **Global Flood Database** (flood extents from satellite images, events 2000 to 2018, resolution about 250 m, licence CC BY-NC 4.0 \[checked\]): find the project page, look for per-event downloads or the Earth Engine collection. Earth Engine needs a free non-commercial registration with Google \[verify\]; if registration is slow, skip it and use the other sources below. For each event matching your list, record whether an extent file can be downloaded.
4. **Emergency mapping extents** (newer events): search the Copernicus Emergency Management Service Rapid Mapping activation list and filter for flood activations in Ethiopia, Somalia, Kenya, South Sudan and Sudan; open each activation and check whether a flood delineation (vector polygons) can be downloaded. Also search the UN humanitarian data exchange (HDX) for flood extent Ethiopia and the UNOSAT flood portal. Record sources and licences.
5. For each row decide **usable = yes** only if all four are true: the extent is a file you can load in code (raster or polygons); the date is known; the resolution is 250 m or finer; the licence allows use in a hackathon and you recorded it.
6. Choose the pilot region. Candidates: Awash basin, the Baro-Akobo area around Gambella, the Shabelle or Genale areas in the Somali region \[verify\]. Criteria: at least three usable events with extents inside it, at least ten health facilities, a road network with hundreds of segments after simplification. The choice is made by the count of usable events.
7. **Gate at 20:00 tonight.** Count usable events: six or more with at least three in Ethiopia means rung L0; three to five means L1; fewer than three but a flood frequency or maximum-extent layer exists means L2; nothing usable means L3 (section 15 of the functional document). Write the decision, the pilot region name and the rung in docs/adr/0002-label-rung.md. Rename region\_id from pilot\_01 to the real name now, in contracts and examples, and tell everyone. Tell the mentor at the next checkpoint if the rung is L2 or L3.

### D5.2 Road graph (BUILD SPEC)

**MANUAL first**: draw the pilot region on geojson.io (free), save it as data/pilot\_region.geojson. Download the road data: curl -L -o data/raw/osm/ethiopia-latest.osm.pbf https://download.geofabrik.de/africa/ethiopia-latest.osm.pbf (create the folder first; the file is a few hundred megabytes \[verify\]). Licence: Open Database Licence, attribution required, which is why the map footer says OpenStreetMap contributors.

**pipeline/impactmap\_pipeline/osm\_graph.py** reads the pbf, clips to the pilot region, keeps roads whose highway tag is one of motorway, trunk, primary, secondary, tertiary, unclassified, residential, track (others are dropped), builds a graph whose nodes are road junctions and road ends, then **simplifies** it by merging chains of degree-2 nodes. Each remaining edge is one **segment** with a stable integer segment\_id equal to its row number. Each segment gets: u, v (node indices), length\_m, road\_class (the enum in C3.2; anything else is other), surface (text or empty), bridge (true if any part has bridge=yes), ford (true if any part has ford=yes; fords are road crossings of water and are very relevant), name (if present), and the geometry. Travel speeds are an assumption table, stored in graph.npz and shown in the UI assumptions panel:

| road\_class | km/h | road\_class | km/h |
| --- | --- | --- | --- |
| motorway | 80 | unclassified | 25 |
| trunk | 60 | residential | 20 |
| primary | 50 | track | 12 |
| secondary | 40 | other | 15 |
| tertiary | 35 | unpaved surface multiplier | 0.7 |

Outputs: data/processed/graph.npz (arrays edge\_u, edge\_v as int32; length\_m, speed\_kmh as float32; road\_class\_idx as int8; bridge, ford as bool; node\_lon, node\_lat as float64), data/processed/segments.geojson (LineString features with properties segment\_id, road\_class, length\_m, name, quality\_flag), and the road-density index per 1 km cell used for the quality flag low\_road\_density. Test: the graph has one large connected component and a printed count of small ones; segment\_ids are unique and contiguous.

**Tiles (MANUAL install, then command).** Install tippecanoe on Ubuntu: try sudo apt install tippecanoe; if the package does not exist, build it: git clone https://github.com/felt/tippecanoe, then make -j and sudo make install. Then:

```
tippecanoe -o data/processed/roads.pmtiles -l roads -Z5 -z13 --use-attribute-for-id=segment_id --no-feature-limit --no-tile-size-limit --force data/processed/segments.geojson
```

The layer name is roads and the numeric feature id of every road equals its segment\_id. This is a contract with Anon (section A3). Check the file with pmtiles show data/processed/roads.pmtiles (the pmtiles command-line tool is installed by Anon's step A2.4; you can get it from the Protomaps releases page).

### D5.3 Facilities and communities (BUILD SPEC)

**Facilities.** pipeline/impactmap\_pipeline/facilities.py collects points from OpenStreetMap (amenity hospital, clinic, doctors; healthcare tags) inside the pilot region and, if one exists with better coverage, a health-facility dataset from the humanitarian data exchange \[verify which; record the source per row\]. Level rule applied to the name and tags, in this order: contains hospital means hospital; contains health center or health centre means health\_center; contains clinic, health post, dispensary or medical means clinic; anything else keeps the guess clinic and gets quality\_flag weak\_source (Yagi's sheet fixes these, section Y3). Each facility is snapped to the nearest graph node; snap\_distance\_m is stored; more than 1,000 m sets quality\_flag long\_snap; more than 3,000 m drops the facility and logs it. Outputs: facilities.geojson (public: facility\_id, name, level, source, snap\_distance\_m, quality\_flag) and arrays in facilities.npz (node index, level index).

**Communities.** MANUAL: download the 1 km population grid for Ethiopia from the WorldPop website (the file is named like eth\_ppp\_2020\_1km\_Aggregated.tif and sits under the Global\_2000\_2020\_1km folder of data.worldpop.org \[verify the exact path and the latest year\]). Licence CC BY 4.0 \[verify\]. pipeline/impactmap\_pipeline/communities.py clips it to the pilot region, keeps cells with at least 50 estimated people, creates one community per cell (community\_id com\_ plus 5 digits), snaps it to the nearest graph node, stores snap\_distance\_m (more than 3,000 m sets long\_snap, more than 8,000 m drops it), and writes communities.geojson (community\_id, people\_est, snap\_distance\_m, quality\_flag) and communities.npz.

### D5.4 Terrain, land cover, rainfall (BUILD SPEC plus MANUAL downloads)

**Elevation.** Copernicus DEM GLO-30 is on AWS as a free public bucket; no account is needed. First check that Ethiopian tiles are in the public set (a few countries are withheld): run aws s3 ls --no-sign-request s3://copernicus-dem-30m/ and look for a folder whose name contains N09\_00\_E038\_00 (tiles are named by their south-west corner, so choose the tiles covering your region) \[checked: bucket and no-sign access exist\]. If tiles are missing, use the 90 m bucket s3://copernicus-dem-90m/ instead and write it in the ADR. Download only the tiles covering the pilot region with aws s3 cp --no-sign-request into data/raw/dem.

**terrain.py** mosaics the tiles, clips to the pilot region plus a 5 km margin, fills depressions, computes flow direction and flow accumulation, derives streams where the accumulation exceeds a threshold you tune by looking at the map, then computes per pixel: slope in degrees, height above nearest drainage (HAND) in metres, a wetness index, and distance to the nearest stream. Use the pysheds library (HAND is built in) or WhiteboxTools; both are free. Then, for every segment, sample the rasters every 30 m along its line and store: elev\_mean, slope\_mean, hand\_min, hand\_mean, twi\_mean, dist\_river\_min, log\_flow\_acc\_max.

**Land cover.** ESA WorldCover 10 m is also on AWS Open Data \[verify the bucket name and tile naming on the registry page\]. Store the most common class along each segment as landcover\_class and the fraction of cropland (class 40).

**Rainfall.** CHIRPS daily rainfall (about 5.5 km grid). Files are published as one raster per day on the Climate Hazards Center server; the daily Africa product is under a folder like products/CHIRPS-2.0/africa\_daily/tifs/p05/YEAR/ \[verify the current path and whether version 3 is preferred\]. Download only what you need: for each usable event, the days from 35 days before the event start to 10 days after, clipped to the pilot region and a margin (rasterio windows). For the climatology, use the monthly product (much smaller) and compute mean rainfall per month and cell for 1991 to 2020 as far as the monthly files allow. Store everything as small NumPy files under data/processed/rain/.

**publish.py** (end of the pipeline): assigns the data\_version (C3.3), copies public files to s3://impactmap-data-ACCOUNTID/data/DATA\_VERSION/ (meta.json, facilities.geojson, communities.geojson, tiles/roads.pmtiles) and private arrays to private/DATA\_VERSION/ (graph.npz, facilities.npz, communities.npz, segment\_features.npz, catchments.npy, rain\_climatology.npz) using your impactmap AWS profile. meta.json lists counts, bounding box, pilot region name, all versions and the speed table.

**Catchments.** Assign every segment a catchment\_id: the integer id of the small drainage sub-basin (from the flow-direction raster, basins with about 50 to 200 km2) containing its midpoint. These are used only by the correlated failure mode (P1) but the column must exist from the start.

## D6. Labels and features (P0, tomorrow, October 24)

**ml/prepare\_labels.py.** For each usable event: load its flood extent, overlay it on all segments, and compute the fraction of each segment's length inside the extent. Label rule (D3): exposed = 1 if the fraction is at least X, starting at X = 0.30 (an assumption to test at 0.15 and 0.50). **Negatives**: only segments within a buffer of the event's flooded footprint (start at 5 km, test 2 and 10 km), because rows from the whole country would make the task trivially easy. For each row also store the event\_id, the segment\_id and the catchment\_id. Write one table per event under data/processed/labels/.

**packages/impactmap\_core/src/impactmap\_core/features.py** is the single place where model inputs are computed, used by training and by the worker. This avoids the most common machine learning bug (training and serving computing a feature differently). Contract:

- Input: a daily rainfall array a (length N, mm per day) at the segment, plus antecedent\_30d\_mm, plus the segment's static features and the climatology for the event month.
- Rainfall features: peak\_1d = the largest daily value; peak\_3d = the largest sum of any 3 consecutive days (fewer days if N is smaller); peak\_7d likewise with 7; event\_total = sum of a; antecedent\_30d = the given value; clim\_ratio = event\_total divided by (monthly climatology in mm plus 1).
- Output: a NumPy matrix with columns in the fixed order stored in features.json: the static features (elev\_mean, slope\_mean, hand\_min, hand\_mean, twi\_mean, dist\_river\_min, log\_flow\_acc\_max, landcover\_class, cropland\_frac, road\_class\_idx, bridge, ford, length\_m) followed by the rainfall features above.
- **Spatial pattern** (turns one scenario array into a per-segment array): uniform: factor 1 for all segments. gradient: let p be the position of the segment midpoint along the direction\_deg axis, scaled to 0 at one edge of the region and 1 at the other; factor = 1 minus (1 minus ratio) times p. cell: with d the distance in km from the segment midpoint to the cell center, factor = exp(minus (d divided by radius\_km) squared), clipped to the range 0.05 to 1. The per-segment daily array is the scenario array times the factor.
- When training with CHIRPS, the daily array at a segment is the value of its CHIRPS pixel. At serving time it is the scenario array times the factor. The difference (a measured field versus an idealised one) is a limitation to write in the model card.

Test: a unit test that the features for a handmade array equal values you computed by hand; a property test that raising any daily value never lowers peak\_1d, peak\_3d, peak\_7d or event\_total.

## D7. Model and evaluation (P0, October 24 to 25)

All scripts in /ml, run in this order, each writing to ml/reports and to a versioned model folder.

1. **baselines.py**. B0: segment is exposed if hand\_min is below a threshold t chosen on the training events. B1: logistic regression on hand\_min, slope\_mean, dist\_river\_min, log\_flow\_acc\_max and peak\_3d. B2: look up the segment in a global flood hazard map for a chosen return period, if one is available for the pilot region \[verify\]; if not, B2 is skipped and the evidence panel says so.
2. **train.py**. LightGBM binary classifier. Settings to start: 300 trees, learning rate 0.05, 31 leaves, minimum 50 rows per leaf, class weighting for the imbalance. **Monotone constraints** equal to +1 on peak\_1d, peak\_3d, peak\_7d, event\_total, antecedent\_30d and clim\_ratio, and 0 on everything else. This guarantees that more rain never lowers the predicted exposure.
3. **calibrate.py**. Collect out-of-fold predictions from the leave-one-event-out loop, fit an isotonic calibration, and save its breakpoints to calibration.json. At serving time calibration is a NumPy interpolation, so scikit-learn is not needed in the worker.
4. **evaluate.py**. Leave-one-event-out: train on all events but one, predict the held-out event, repeat. Report per event and overall: PR-AUC, ROC-AUC, recall at 80 percent precision, Brier score, and a calibration table. Bootstrap over events for the intervals (with few events the intervals will be wide; show them). Do the same for B0, B1 and B2. Then the **end-to-end test**: for each held-out event take the observed extent as the closed set, run the engine (section D8) to get the observed facility isolation, and compare it with the model's predicted p\_isolation using the AUC and the Spearman rank correlation across facilities; compare with B0 in the same way. Write everything to data/DATA\_VERSION/evidence/evaluation.json (shape in C3.6) and docs/model-card.md.
5. **export\_model.py**. Saves private/models/MODEL\_VERSION/model.txt (Booster.save\_model), calibration.json and features.json, and uploads them. Per-segment reasons at serving time come from Booster.predict with pred\_contrib=True (LightGBM's built-in SHAP-style contributions), mapped to the plain-English labels in features.json (for example hand\_min low means Low ground next to a river).
6. **Evidence level.** Set by the rung and the numbers: Validated only for L0 when the model beats B0 on the held-out events; Limited for L1 and L2 or when the intervals overlap B0 heavily; Heuristic for L3. Never write a stronger word in the UI than the file says.
7. **If the model does not beat B0**: say so in the model card and the evidence panel and keep both in the product. An honest negative result is acceptable; a hidden one is not (see section 10 of the functional document).

Deliver an **example evaluation.json** to Anon by the end of October 24, then replace it with the real one on October 25 to 26 with no change of shape.

## D8. The core package and the graph engine (P0, October 24 to 25)

This is the heart of the analysis and must be correct before it is fast or pretty. Everything lives in packages/impactmap\_core (no cloud imports, rule C4.1). Build it test first, on toy graphs, on your laptop. Give an AI assistant one module at a time with the spec below.

### D8.1 hashing.py (exact code; nobody else computes cache keys)

```python
import hashlib
import json


def _normalise(value):
    if isinstance(value, float):
        return round(value, 4)
    if isinstance(value, dict):
        return {k: _normalise(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_normalise(v) for v in value]
    return value


def canonical_json(scenario: dict) -> str:
    cleaned = _normalise(scenario)
    cleaned['forced_closed'] = sorted(cleaned.get('forced_closed', []))
    cleaned['forced_open'] = sorted(cleaned.get('forced_open', []))
    return json.dumps(cleaned, sort_keys=True, separators=(',', ':'))


def make_cache_key(scenario: dict, model_version: str, data_version: str, engine_version: str) -> str:
    text = '|'.join([canonical_json(scenario), model_version, data_version, engine_version])
    return hashlib.sha256(text.encode('utf-8')).hexdigest()[:32]
```

Tests: the same scenario with keys in a different order gives the same key; changing the seed, any version, or the order-insensitive forced lists as a set gives the expected same or different key; a float such as 40 and 40.00001 gives the same key (rounded to 4 decimals), 40 and 40.001 does not.

### D8.2 Module specs

- **schemas.py**: Pydantic models mirroring C3.6 exactly (Scenario with the ranges and the overlap check between forced\_closed and forced\_open; Job; ResultSummary; FacilityImpact; CommunityImpact). Field names and enums exactly as in C3.1 and C3.2.
- **scenario.py**: build the per-segment daily rainfall arrays from the Scenario using the spatial pattern rules in D6, and convert the manual controls into the daily array when called from the library builder (storm total, duration and storm\_shape: even gives equal days; front\_loaded gives day k (counting from 0) the weight N minus k; mid\_peak gives the smaller of k plus 1 and N minus k; back\_loaded gives k plus 1; all are normalised to sum 1, exactly as in the web app (section A4.4); wet, normal, dry map to antecedent\_30d\_mm of 220, 120, 40 as documented assumptions).
- **closure.py**: closure\_prob c\_i = min(1, exposure\_prob\_i times closure\_factor). In P0 every segment uses the scenario's closure\_factor; a per class table is a P1 refinement. forced\_closed sets c\_i to 1; forced\_open sets c\_i to 0 (forced\_open wins is not needed because overlap is rejected).
- **graph\_io.py**: loads graph.npz and builds a SciPy sparse matrix with travel time in minutes as weights: minutes = length\_m divided by (speed\_kmh times 1000 divided by 60). Roads are two-way. Keep the arrays of edges so that closed edges can be dropped by a boolean mask.
- **montecarlo.py**: the engine. Steps:
  1. **Baseline** with nothing closed: multi-source Dijkstra from all hospital nodes (SciPy csgraph dijkstra with min\_only set) gives baseline\_minutes for every node; community baseline = value at its node. For each facility, baseline\_minutes = the shortest time to any other hospital (run Dijkstra from each hospital node, there are few, and take the minimum over the others). A community or facility with an infinite baseline gets poor\_baseline\_access true. A baseline above 120 minutes also sets it.
  2. **Random numbers**: u = a matrix of uniform random numbers with shape (n\_samples, n\_segments) from numpy default\_rng(seed). closed\[s, i\] = u\[s, i\] is less than c\_i. Using one fixed matrix per seed means a what-if with forced overrides changes only the forced segments (common random numbers); this makes before and after comparisons clean.
  3. **For each sample**: keep the edges that are not closed; run connected components and the multi-source Dijkstra from all hospital nodes. A community is **cut off** when its minutes are infinite; **degraded** when its minutes are finite and greater than degraded\_ratio (2.0) times its baseline and it is not poor\_baseline\_access. A facility is **isolated** when no hospital other than itself lies in its connected component (so for a hospital this means it cannot refer onward).
  4. **Aggregate over samples**: per community p\_cut\_off, p\_degraded, expected\_minutes (mean over samples where finite); per facility p\_isolation with p10 and p90 across bootstrap halves of the samples (split the samples into 10 blocks, take the 10th and 90th percentile of the per block value); region totals people\_cut\_off and people\_degraded as mean, p10, p90 over samples; facilities\_isolated\_expected as the mean count.
  5. **people\_affected\_est for a facility** = the sum of people\_est of the communities whose nearest facility at baseline (any level, multi-source Dijkstra returning the source label) is that facility.
  6. **Alternative route** for a facility: in the sample whose cut-off total is the median, the shortest path from the facility to the nearest surviving hospital (null if none), returned as minutes and segment\_ids; the geometry is assembled from segment geometries by the API.
  7. Return the closed matrix too (a boolean array of 200 by n\_segments is about 6 MB) so that explain.py can use it.
  8. Performance target: 200 samples on a 30,000 segment graph in under 10 seconds in the container; if slower, reduce the graph by merging more nodes or lower the default to 150 samples.
- **ranking.py**: raw\_f = p\_isolation times people\_affected\_est times weight (hospital 1.0, health\_center 0.7, clinic 0.4); score = 100 times raw\_f divided by the largest raw\_f in the region (zero if all zero); rank by score descending, ties by people\_affected\_est; rank\_delta compares with the same calculation on the baseline ordering (rank by people\_affected\_est times weight). The three raw components are included in FacilityImpact so the UI can show them.
- **explain.py**: for facility f and segment i with at least 5 samples closed and 5 open, lift = P(f isolated given i closed) minus P(f isolated given i open), from the sample matrix. Return the top 3 by lift (lift must be above 0.05). Template sentences, in plain English, for the UI: Clinic X is likely to be cut off mainly because the road segment NAME or ROAD\_CLASS near PLACE may flood (lift N percent). Segment reasons come from the model contributions (D7 step 5).
- **whatif.py**: build the new scenario (base scenario plus the forced lists, merged with the base's own), recompute the cache key, and call the same engine with the same seed.
- **metrics.py**: percentile helpers and the confusion and rank metrics used by evaluate.py.

**Tests (all must pass before you wire the worker)**: a 6-node toy graph with hand-computed times and one obvious cut; a chain where closing the middle edge isolates the far node with probability equal to c; two hospitals joined by two parallel roads; a facility already isolated at baseline gets poor\_baseline\_access; properties with hypothesis: closing more edges never lowers any travel time and never lowers p\_cut\_off; forced\_open on a segment never raises people\_cut\_off; the same seed gives byte-identical results; changing n\_samples from 100 to 400 changes p\_isolation by less than 0.1 on the toy graph.

## D9. API and worker (P0, October 25)

### D9.1 Behaviour of the API (replaces the fake handlers one by one)

- **POST /scenarios**: validate with Scenario; compute cache\_key with the active versions; read impactmap-cache. Hit: create a job row with status done, return 200 with the Job (result\_url set). Miss: create a job row with status queued and expires\_at 24 hours ahead; invoke impactmap-worker with InvocationType Event and the payload job\_id, cache\_key, scenario; return 202.
- **GET /jobs/{job\_id}**: return the row. If the status is queued or running and more than 120 seconds have passed since submitted\_at, update it to failed with code JOB\_TIMEOUT and return that (this handles a worker that crashed).
- **Results endpoints** read the files the worker wrote under data/results/CACHE\_KEY/ in the data bucket: summary.json, segments.json, segment\_reasons.json (a map from segment\_id to its SegmentExplain), and facilities/FACILITY\_ID.json (FacilityExplain). The API returns their contents unchanged. 404 NOT\_FOUND if missing.
- **POST /whatif**: read the base summary.json, call whatif.py to get the new scenario and cache key, then behave exactly like POST /scenarios.
- **GET /compare**: read both summaries and compute the deltas.
- **GET /scenarios/library, /backtests, /model-card, /meta, /regions, /hazards**: read the small static files published with the data (scenario\_library.json, backtests.json, model\_card.md, meta.json) and return them.
- Every error uses the Error shape; unexpected exceptions become INTERNAL\_ERROR with a request\_id and are logged with the traceback.

### D9.2 The worker (services/worker)

**handler.py**: on a cold start load the private artifacts (graph, facilities, communities, segment features, catchments, climatology, model, calibration, feature list) from S3 into module-level variables, so warm invocations reuse them. On each invocation: mark the job running; build features (D6); predict exposure with LightGBM; apply the calibration by interpolation; compute closure; run the engine; rank; explain; write the result files; put the item in the cache table (cache\_key, result\_prefix, versions, created\_at); mark the job done with result\_url. Wrap everything in try and except: on any error mark the job failed with a code and a safe message and re-raise nothing. Log the duration of each step as structured JSON.

**Dockerfile** (build context is the repository root, so the image can include the shared package; add a .dockerignore that excludes data, web, node\_modules, .git and cdk.out):

```
FROM public.ecr.aws/lambda/python:3.12
COPY packages/impactmap_core /tmp/impactmap_core
COPY services/worker/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt /tmp/impactmap_core
COPY services/worker/handler.py ${LAMBDA_TASK_ROOT}/handler.py
CMD ['handler.handler']
```

requirements.txt for the worker: numpy, scipy, lightgbm, pydantic, boto3 (pinned versions). In CDK use DockerImageFunction with DockerImageCode.from\_image\_asset on the repository root and file services/worker/Dockerfile, platform linux/amd64, memory 2048 MB, timeout 120 seconds, and an asynchronous invoke configuration with retry attempts 0 and maximum event age 60 seconds (so a failed run does not repeat and cost twice). The image is stored in CDK's own asset repository.

### D9.3 Least-privilege permissions (write these in CDK; no wildcard resources)

| Function | Allowed | On |
| --- | --- | --- |
| impactmap-api | dynamodb GetItem, PutItem, UpdateItem | the jobs table |
| impactmap-api | dynamodb GetItem | the cache table |
| impactmap-api | lambda InvokeFunction | the worker function only |
| impactmap-api | s3 GetObject | data bucket, keys data/\* only |
| impactmap-worker | s3 GetObject | data bucket, keys private/\* and data/\* |
| impactmap-worker | s3 PutObject | data bucket, keys data/results/\* only |
| impactmap-worker | dynamodb UpdateItem | the jobs table |
| impactmap-worker | dynamodb PutItem | the cache table |
| Both | CloudWatch Logs write | their own log groups |

This table is also the IAM evidence for the README.

### D9.4 Demo files (scripts/make\_demo.py, October 26)

The stage demo must not depend on a live computation. make\_demo.py runs the engine locally for each library scenario and each cascade step, then uploads the files. **Demo cascade files:** data/demo/index.json lists demos with slug, title, description, n\_steps and the scenario. Each data/demo/SLUG/step\_N.json (N from 1) has: step, day\_label, rain\_cumulative\_mm, cache\_key, summary\_url, segments\_url, narration (a one-sentence template text such as Day 3: two clinics now have more than a 50 percent chance of isolation), and changes (a list of up to 5 objects with facility\_id, rank\_before, rank\_after). Step N is the result of the same scenario truncated to its first N days. Add this shape to CONTRACTS.md and tell Anon.

## D10. Observability and hardening (P0, October 26)

- **Structured logs**: every line is JSON with request\_id, route or step, duration\_ms, status. No personal data and no secrets.
- **Custom metrics** (CloudWatch embedded metric format, namespace ImpactMap, four metrics only, to stay inside the free allowance of about ten \[verify\]): ScenarioCacheHit, ScenarioCacheMiss, WorkerDurationMs, JobsFailed.
- **Dashboard** (in ObsStack): API requests, API 4xx and 5xx, API p95 latency, worker invocations, worker errors, worker p95 duration, cache hits versus misses, jobs failed, DynamoDB consumed capacity.
- **Alarms**: API 5xx above 5 in 5 minutes; any worker error; throttled requests above 20 in 5 minutes. Notification goes to an SNS topic with your email (SNS email is free at this volume \[verify\]; confirm the subscription email).
- **Budget in code**: CfnBudget in ObsStack (monthly 5 USD, notify at 85 percent and forecasted 100 percent to your email). Then delete the manual budgets from D2.3 so there is one source of truth, and replace the screenshot.
- **Security evidence**: run cdk-nag, fix or justify every finding, and save the summary to docs/security.md with the IAM table from D9.3, the secret scan result, and pip-audit output.
- **Edge cases**: bad JSON, empty arrays, 11 days of rain, negative rain, overlapping forced lists, unknown region, a cache key that does not exist, a huge request body. Each returns 400 or 404 with the Error shape and no crash.

## D11. Load test, teardown, README, diagram, video (P0, October 27)

1. **Load test** (tests/load, k6, run from your laptop against the live URL): (a) cached GET results at 20 requests per second for 2 minutes; (b) unique new scenarios at 1 per second for 2 minutes; (c) a burst of 10 simultaneous unique scenarios; (d) invalid inputs to confirm 400 and 429 behaviour. Record p50 and p95, error rate, worker cold start and memory used. Convert measured duration and memory into GB-seconds and write the cost per 1,000 scenarios in docs/cost.md. Keep API throttling on during the test. Afterwards open the billing page and confirm nothing unexpected.
2. **Teardown test** (afternoon, never at night): make destroy removes the five application stacks (buckets empty themselves by the auto-delete setting). Then redeploy from CI to prove a fresh deploy works. Then the manual cleanup of what CDK bootstrap left behind, only at the very end of the event: delete ImpactMapCiStack, then delete the CDKToolkit stack, after manually emptying the bootstrap staging bucket (name starts with cdk-hnb659fds-assets) and deleting the images in the bootstrap image repository (name starts with cdk-hnb659fds-container-assets). Write these steps in README as the teardown section.
3. **Architecture diagram** (docs/architecture.png): draw it in diagrams.net (free, has AWS icons). It must show: data sources and the offline pipeline; the two buckets with public and private prefixes; CloudFront serving the site, tiles and results; API Gateway to the API function; the worker as a container image; DynamoDB jobs and cache; CloudWatch, SNS and the budget; GitHub Actions to AWS through OIDC to the deploy role to the CDK roles; IAM roles per function; and a note: no VPC by decision (ADR) with the boundaries listed. Export as PNG and embed it in README.
4. **README** (Yagi creates the skeleton, you fill the technical parts): problem and persona; where and why AI is used; architecture diagram; local setup; deploy steps; model validation with the numbers and limitations; the three-quantities explanation; cost and load results; security summary; teardown; declared third-party libraries and data with licences.
5. **Video** (2 to 3 minutes, with Anon): record with OBS Studio (free): the demo path, a live model inference, then the AWS console and CloudWatch logs. Save to the repository releases or a link in README.

## D12. P1 items, only after P0 is finished and tested

Order: correlated mode (about twenty lines in montecarlo.py: one shared random factor per catchment mixed with each segment's own number using correlation 0.5), landslide heuristic, mitigation list, forecast plus Telegram alerts, PDF report, accounts. Turn each on by setting its feature flag in config.json, so unfinished things never show.

### D12.1 MANUAL: Telegram bot for alerts (P1)

The alert channel is Telegram because it is free and has no sender restrictions like the email service we had trouble with in the CRM project.

1. Open Telegram. Search for @BotFather and open the chat with the verified account (it has a blue check mark). Send /newbot.
2. It asks for a display name: send ImpactMap Alerts. It asks for a username that must end in bot and be unique, for example impactmap\_alerts\_ethiopia\_bot. If it is taken, add numbers.
3. BotFather replies with a token that looks like 123456789:AAH followed by many letters. **This token is a password.** Do not screenshot it, do not paste it into any AI chat, do not commit it.
4. Create a Telegram group named ImpactMap Alerts (team). Add the bot to the group as a member, then send any message in the group so the bot can see the chat.
5. In the terminal, store the token in an environment variable for this session only (the leading space keeps it out of shell history in many setups): TOKEN=paste\_here. Then run: curl -s https://api.telegram.org/bot${TOKEN}/getUpdates. Find chat followed by id in the result. A group id is a negative number, for example -1001234567890. If the result is empty, send another message in the group and run it again.
6. Send a test: curl -s -X POST https://api.telegram.org/bot${TOKEN}/sendMessage -d chat\_id=CHATID -d text=test. The response must contain ok true and the group must show the message.
7. Store both values in AWS Parameter Store (standard parameters are free): aws ssm put-parameter --name /impactmap/telegram/bot\_token --type SecureString --value $TOKEN --profile impactmap --region eu-central-1, then the same for /impactmap/telegram/chat\_id with type String. Grant the alert function ssm GetParameter on these two names only. If decryption is refused, also allow decryption through the AWS managed key for Systems Manager \[verify the exact error and fix\].
8. If the token ever leaks, open BotFather, send /revoke, choose the bot, and update the parameter.
9. Message limits are generous for a team group (about 20 messages a minute to one group), which is far above our use.

### D12.2 Forecast and schedule (P1)

Open-Meteo needs no key: GET https://api.open-meteo.com/v1/forecast with latitude, longitude, daily=precipitation\_sum, forecast\_days=5 and timezone=Africa/Addis\_Ababa. Free for non-commercial use up to 10,000 calls a day, CC BY 4.0 attribution required \[checked\]. Call it for the centre of the pilot region only. EventBridge Scheduler runs the function once a day with the expression cron(0 3 \* \* ? \*), which is 06:00 in Addis Ababa. The function builds a Scenario from the five daily values with a spatial type of uniform, runs it through the same worker path, compares with yesterday's snapshot, and sends a Telegram message only when a facility's p\_isolation passes the configured threshold (start at 0.5).

## D13. Dagim final checklist

| # | Item | Status |
| --- | --- | --- |
| 1 | Tools installed and versions recorded in MODULE\_SETUP.md | \[ \] |
| 2 | AWS account owner, plan, credits, region recorded; root MFA on; admin user and CLI profile work | \[ \] |
| 3 | Zero spend and 5 USD monthly budgets created; screenshot in docs/cost.md | \[ \] |
| 4 | Lambda concurrency quota checked and ADR written | \[ \] |
| 5 | Public repo, ruleset, Dependabot, secret scanning, collaborators set | \[ \] |
| 6 | CDK bootstrapped; ImpactMapCiStack deployed; AWS\_DEPLOY\_ROLE\_ARN set | \[ \] |
| 7 | CONTRACTS.md, openapi.yaml and examples pushed; Anon confirmed he can build from them | \[ \] |
| 8 | Walking skeleton deployed from CI; CORS works from the CloudFront page | \[ \] |
| 9 | Event audit table done; gate decided and written in ADR 0002; region renamed | \[ \] |
| 10 | Graph, facilities, communities, features built; published with a data\_version | \[ \] |
| 11 | Labels built; baselines B0 and B1 run | \[ \] |
| 12 | Core package tests pass (toy graphs and properties) | \[ \] |
| 13 | Model trained with monotone constraints; calibrated; leave-one-event-out report | \[ \] |
| 14 | evaluation.json real (replaces the example) and model card written | \[ \] |
| 15 | Real worker image runs; scenario works end to end on the live URL | \[ \] |
| 16 | Ranking, explanations, what-if, compare return correct data | \[ \] |
| 17 | Demo scenarios and cascade steps precomputed and uploaded | \[ \] |
| 18 | Dashboard and alarms in code; budget in code; manual budgets removed | \[ \] |
| 19 | cdk-nag, gitleaks, pip-audit clean or justified; docs/security.md written | \[ \] |
| 20 | Load test done; cost per 1,000 scenarios documented | \[ \] |
| 21 | Teardown and redeploy tested | \[ \] |
| 22 | Architecture diagram, README, demo video done | \[ \] |
| 23 | Final deploy from CI; live URL works on another network and on a phone | \[ \] |
| 24 | Submission package assembled before midday on October 28 | \[ \] |

# PART A. ANON (frontend lead)

You own the web application: everything the judge and the user see. You also own the map data hosting check for the basemap, the mock server, the web tests, phone performance and the demo flow. You never need AWS access: Dagim deploys, you push to GitHub and CI does the rest. Until the real API exists (October 25) you work against a mock server built from the contract examples, so you are never waiting.

## A1. Your folders and what you do not touch

You own /web and /tests/e2e. You do not touch /services, /packages, /pipeline, /ml, /infra or /contracts. If you need a contract change, write it in the team chat to Dagim; he changes the contract and tells you.

```
web/
  package.json  vite.config.ts  tsconfig.json  eslint.config.js  index.html
  public/config.json                 local development defaults (see A3)
  public/dev-data/                   local copies of map data (gitignored)
  src/
    main.tsx  App.tsx  index.css     index.css contains: @import 'tailwindcss';
    config.ts                        loads /config.json before the app renders
    api/       client.ts  schema.d.ts (generated, committed)  hooks.ts
    state/     useAppStore.ts
    lib/       manualScenario.ts  format.ts  colors.ts  mapStyle.ts
    map/       MapView.tsx  layers.ts  paintResults.ts  useMapSelection.ts
    components/ TopBar.tsx  EvidenceBadge.tsx  Legend.tsx  ProbabilityBar.tsx
               RankDelta.tsx  QualityFlag.tsx  Disclaimer.tsx
    panels/    ScenarioTab.tsx  ResultsTab.tsx  CompareTab.tsx  EvidenceTab.tsx
               FacilityDrawer.tsx  SegmentDrawer.tsx  CascadeBar.tsx  WhatIfBasket.tsx
    pages/     ExplorerPage.tsx  AboutPage.tsx
    i18n/      index.ts  en.json  (am.json later)
    mocks/     browser.ts  handlers.ts
  tests/unit/                        Vitest
tests/e2e/                           Playwright (repo root)
```

## A2. TODAY: one-time manual setup

### A2.1 MANUAL: install and check

1. **Node.js 22** (use nvm, then nvm install 22; node --version must print v22.x). Vite needs Node 20.19 or 22.12 or newer \[verify at vite.dev if you use a newer Vite\].
2. **Git**, a code editor, and Chrome or Edge plus Firefox for testing.
3. Clone the repository after the mob session. Create a branch: git checkout -b feat/anon-web-scaffold.
4. Install Playwright browsers later with npx playwright install (about a few hundred MB).

### A2.2 MANUAL: create the app (run in the repository root; the web folder exists but is empty)

```
npm create vite@latest web -- --template react-ts
cd web
npm install
npm install react-router @tanstack/react-query zustand maplibre-gl pmtiles @protomaps/basemaps recharts react-i18next i18next openapi-fetch
npm install -D tailwindcss @tailwindcss/vite openapi-typescript msw vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test prettier
npx msw init public/ --save
```

Then:

1. **Tailwind CSS v4**: in vite.config.ts import tailwindcss from '@tailwindcss/vite' and add tailwindcss() to the plugins list next to the React plugin. In src/index.css the first line is @import 'tailwindcss'; (there is no tailwind.config file in v4 unless you need one).
2. **package.json scripts** (names are fixed because CI calls them): dev (vite), build (tsc -b && vite build), lint (eslint .), test (vitest run), gen:api (openapi-typescript ../contracts/openapi.yaml -o src/api/schema.d.ts), e2e (playwright test).
3. **.gitignore** in web: node\_modules, dist, public/dev-data.
4. Commit the scaffold, open a pull request, and re-enable the web job in CI (Dagim commented it out).

### A2.3 The two lines that make the map work with PMTiles (exact code; keep once, in src/map/MapView.tsx)

```ts
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
```

### A2.4 MANUAL: the basemap file (Day-1 check 10, your job today)

The background map is a single file, a PMTiles archive cut out of the free Protomaps basemap. It is hosted by us, so there is no tile server and no key.

1. Install the pmtiles command-line tool: open the go-pmtiles releases page on GitHub (github.com/protomaps/go-pmtiles/releases), download the archive for your operating system, unpack it, and put the pmtiles program somewhere on your PATH. Check: pmtiles --help.
2. Find a recent daily build: open maps.protomaps.com/builds in a browser and copy the address of a build from the last seven days (older ones are deleted \[checked: the bucket keeps the past week\]). It looks like https://build.protomaps.com/YYYYMMDD.pmtiles.
3. Do a dry run first to see the size (Ethiopia's rough bounding box: west 32.9, south 3.3, east 48.1, north 15.0):

```
pmtiles extract https://build.protomaps.com/YYYYMMDD.pmtiles ethiopia.pmtiles --bbox=32.9,3.3,48.1,15.0 --maxzoom=10 --dry-run
```

4. If the estimated size is under about 150 MB, run the same command without --dry-run. If it is larger, lower --maxzoom to 9. Each extra zoom level roughly doubles the size \[checked\]. Our own road layer provides the detail at high zoom, so the basemap does not need to go deeper.
5. Verify: pmtiles show ethiopia.pmtiles, and drag the file onto the viewer at maps.protomaps.com to see it.
6. Give the file to Dagim through a shared drive link (do not commit it). He uploads it to the data bucket as data/basemap/ethiopia.pmtiles. For local work, copy it to web/public/dev-data/basemap/ethiopia.pmtiles.
7. Labels and icons: the basemap style needs font files and sprites. For now use the Protomaps hosted assets (they are static files and free): glyphs https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf and sprite https://protomaps.github.io/basemaps-assets/sprites/v4/light \[verify these addresses on the Protomaps basemaps documentation\]. If they fail, remove the symbol layers from the style so the map still draws without text.
8. Attribution text for the map: © OpenStreetMap contributors, Protomaps. Always visible.

## A3. Contracts you consume (read C3 again, especially these)

- **/config.json** is fetched once at startup, before anything renders. Local development uses web/public/config.json with api\_base\_url pointing to the live API (or the mock) and data\_base\_url pointing to /dev-data. **data\_base\_url ends with /data and has no trailing slash; api\_base\_url has no trailing slash.**
- **Map data addresses** (all built from config): basemap at data\_base\_url plus /basemap/ethiopia.pmtiles; roads at data\_base\_url plus / plus data\_version plus /tiles/roads.pmtiles; facilities and communities at the same folder as .geojson files.
- **Road tiles contract**: the vector layer is named roads. Every road feature has the numeric feature id equal to its segment\_id. This lets you color roads with feature state and no extra join.
- **Facilities and communities** are GeoJSON sources with promoteId set to facility\_id and community\_id, so feature state works with their string ids.
- **Results**: GET /results/{cache\_key} for the summary; GET /results/{cache\_key}/segments for the columnar arrays (only segments with probability at least 0.005 are listed; every other segment is 0).
- **All field names are snake\_case** as delivered. Do not convert them.
- **Feature flags** come from config.features. If correlated\_mode, landslide, forecast or accounts is false, the matching control is hidden or disabled with a short explanation.

**Road paint code (exact names; this is the contract between the tiles, the API and your layer):**

```ts
map.addLayer({
  id: 'roads-risk',
  type: 'line',
  source: 'roads',
  'source-layer': 'roads',
  paint: {
    'line-color': ['step', ['coalesce', ['feature-state', layerMode === 'closure' ? 'closure_prob' : 'exposure_prob'], 0],
      '#cbd5e1', 0.05, '#fde68a', 0.2, '#f59e0b', 0.4, '#dc2626', 0.7, '#7f1d1d'],
    'line-width': ['step', ['coalesce', ['feature-state', layerMode === 'closure' ? 'closure_prob' : 'exposure_prob'], 0],
      1, 0.05, 2, 0.2, 3, 0.4, 4, 0.7, 5],
  },
});
// painting one segment from the segments response:
map.setFeatureState({ source: 'roads', sourceLayer: 'roads', id: segmentId }, { exposure_prob: e, closure_prob: c });
```

Color and width both increase with risk, so the map still reads for people who cannot tell the colors apart. The five classes (below 5, 5 to 20, 20 to 40, 40 to 70, above 70 percent) are the same for roads, facilities and communities, and the legend must show them. When a new result arrives, first clear the feature state of all previously painted segment ids, then paint the new ones in chunks of about 2,000 per animation frame so the page does not freeze.

## A4. The application: BUILD SPEC (screens, tabs, behavior)

Give each component below to an AI assistant separately, with the context packet (C8) and the contract tables it uses. Build in the order of the task list in A9.

### A4.1 Routes

- **/** the Explorer (the main screen, everything below).
- **/s/:cache\_key** the Explorer opened on the Results tab for that result (shareable link, E7).
- **/about** the About page (A4.11).

### A4.2 Explorer layout

**Laptop (width 1024 pixels or more):** a top bar 56 px high; a left panel 380 px wide with four tabs: **Scenario, Results, Compare, Evidence**; the map fills the rest; a right drawer 400 px wide slides over the map for facility or segment details; a cascade bar appears at the bottom of the map when a demo is chosen.

**Phone (under 768 px):** the map fills the screen; the tabs live in a bottom sheet with three positions (peek, half, full); drawers open as full-height sheets with a clear close button; the top bar shows only the name, the evidence badge and a menu.

### A4.3 Top bar

Product name ImpactMap AI; the region display name from /regions; a hazard badge (Flood); the **evidence badge** from evidence\_level with exact words Validated, Limited or Heuristic (text, plus a distinct shape so color is never the only signal); a small chip with the model and data versions that links to /about; a language switch (English only until am.json exists, then hidden if the file is missing); the About link.

### A4.4 Scenario tab

1. **Library**: cards from GET /scenarios/library. Each card shows title, short description, a badge Replay or Manual, and a Run button. A card whose item has demo set to true also shows Play cascade (A4.9). The library includes one item with the slug baseline-dry (no rain) for use as the comparison baseline.
2. **Build your own** (a form whose fields match the Scenario table in C3.6 one to one):
   - Storm total in mm (slider 10 to 400) and Duration in days (1 to 10).
   - Storm shape: four choices (Even, Front-loaded, Mid-peak, Back-loaded), each with a tiny bar picture.
   - Previous month: Dry, Normal, Wet.
   - Spatial pattern: Uniform, Gradient (direction dial 0 to 359, ratio slider 0.2 to 1.0), or Storm cell (click the map to place the center; radius slider 5 to 200 km).
   - Start date (default today).
   - Assumed closure (slider 0 to 1, step 0.05, helper text: how often a flooded road is treated as closed; default 1).
   - Failure mode: Independent. The Correlated option is shown disabled when the flag is off.
   - Advanced fold: number of samples (100, 200, 400) and seed.
3. **Daily rainfall preview**: a bar chart of the daily\_rain\_mm array that will be sent, so the user sees exactly what the model receives. A text line under it states the total.
4. **Run** button: sends POST /scenarios. While waiting show the three states Queued, Running, Done. Poll GET /jobs/{job\_id} every second for the first 10 seconds, then every 3 seconds, until done or failed or 120 seconds have passed. On failed or timeout show the message from the error shape and a Try again button. On a validation error highlight the field named in the error.

**Manual controls to daily array (exact rule; the backend uses the same rule for library items):** for a duration N and a total T, give day k (counting from 0) a weight w\_k, then daily\_rain\_mm\[k\] = T times w\_k divided by the sum of all weights. Weights: even: 1. front\_loaded: N minus k. back\_loaded: k plus 1. mid\_peak: the smaller of (k plus 1) and (N minus k). The previous-month choice sets antecedent\_30d\_mm to 40 (dry), 120 (normal) or 220 (wet). Round daily values to 1 decimal. Golden tests for your unit tests: T 120, N 4, front\_loaded gives 48, 36, 24, 12; T 60, N 4, mid\_peak gives 10, 20, 20, 10; T 60, N 3, back\_loaded gives 10, 20, 30; T 120, N 5, even gives 24 five times.

### A4.5 Results tab

- **Summary cards** (from region\_totals): estimated people cut off (mean, with the range p10 to p90 written as a range), estimated people with degraded access, and expected number of isolated facilities. A line under the cards: Estimated access loss under the assumed closures. Not a forecast.
- **Ranking table** (from ranking): columns Rank, Facility (name, level icon), Isolation probability (a bar with the p10 to p90 range), Estimated people affected, Score, Rank change (arrow and number, or a dash), Flags (poor baseline access, data-quality flags). Sort by any column; filter by level; search by name. Clicking a row selects the facility: the map flies to it and the facility drawer opens. Show the three raw components next to the score (a small expandable row) because the score is relative to this region.
- **Top communities** (from top\_communities) in a collapsed section with the same style.
- Empty state: Run a scenario to see results.

### A4.6 Compare tab

Two dropdowns, A and B, listing results from this session plus the library items (including Baseline). A **table view** shows the region totals side by side with deltas, and the list of rank changes from GET /compare. A **swipe view** (two synced maps and a slider) is in the cut-line: build the table first, the swipe only if time remains.

### A4.7 Evidence tab

Reads the static evaluation file (evidence/evaluation.json, shape in C3.6). Shows: the evidence badge and the label rung in plain words (L0 Validated on several observed floods; L1 and L2 Limited validation; L3 Heuristic); a table of model versus baselines for each metric with the interval drawn as a small bar with whiskers; the end-to-end sentence (how well predicted facility isolation matched what the observed flood extent implied); the list of events with their split; the limitations list; the versions. Observed-versus-predicted map overlay is P1. Until the real file exists, build it against the example file Dagim commits on October 24.

### A4.8 Map behavior

- Layers: basemap; roads colored by risk (A3); facilities (circle size by level: hospital largest, then health\_center, then clinic; fill color by the same five classes using p\_isolation from the result; a thicker outline when the flags field is set); communities (circle size by the square root of people\_est, translucent, color by p\_cut\_off). A layer panel has toggles for each, a switch between Flood exposure probability and Assumed closure for roads, and the legend.
- Hover a road: highlight it and show a tooltip with name and road class. Click a road: open the segment drawer (A4.10). Click a facility: open the facility drawer. Click a community: a small card with people\_est, p\_cut\_off, p\_degraded, baseline minutes and flags. Selection is synchronized with the ranking table in both directions.
- The alternative route (facility drawer button) draws alt\_route.geometry as a dashed line layer named alt-route.
- Data-quality hatching on low-road-density areas is P1; in P0 the flags appear in rows, drawers and cards.

### A4.9 Cascade bar (the signature demo feature)

Shown at the bottom of the map when a library item with demo set to true is chosen (Play cascade). Data: GET data\_base\_url/demo/index.json lists the demos; each step is data\_base\_url/demo/SLUG/step\_N.json (shape in D9.4: step, day\_label, rain\_cumulative\_mm, cache\_key, summary\_url, segments\_url, narration, changes).

- Controls: Play and Pause, a step slider from 1 to n\_steps, and a speed choice (1 second or 2 seconds per step).
- On opening, **preload all steps** (their summary and segments files) so playback is instant and does not depend on the network on stage.
- At each step: repaint roads from that step's segments file; update facility and community colors from that step's summary; show the day label, the cumulative rainfall and the narration sentence in a card above the bar; show the changes list as small lines such as Clinic X: rank 14 to rank 3.
- The ranking table (Results tab) follows the current step while the cascade is active, and returns to the normal result when the cascade is closed.
- A Close button leaves the cascade and restores the previously selected result.

### A4.10 Facility drawer, segment drawer and what-if

**Facility drawer** (opens on a facility click or a ranking row click; data from the ranking row plus GET /facilities/{facility\_id}/explain?cache\_key=...):

- Header: name, level, quality flags.
- Key numbers: isolation probability with its p10 to p90 range, estimated people affected, score with the three raw components, baseline minutes and, if poor\_baseline\_access is true, a plain note: This place already has long travel times to a hospital without any flood, so it is shown separately from flood damage.
- Why: the sentences list from the explain response, then up to three segment chips; clicking a chip zooms to the segment and highlights it.
- Alternative route: if alt\_route is not null, a button that draws it and shows its minutes; if null, the text No surviving route to another hospital in the typical sample.
- Data quality: source, snap distance in metres, flag text.
- Loading skeleton and an error line with Retry.

**Segment drawer** (opens on a road click; data from GET /segments/{segment\_id}/explain?cache\_key=...): name, road class, length, exposure probability and assumed closure probability, the top reasons as plain English with a small bar each (the label field is already in plain English), and two buttons: **Assume closed** and **Assume open (protect this road)**.

**What-if basket** (WhatIfBasket.tsx): a small floating panel listing the segments the user forced closed or open, each with a remove button, a count, and an **Apply** button. Apply sends POST /whatif with base\_cache\_key set to the current result and the two lists. The returned job is polled like any scenario. When it finishes, the new result becomes current and a banner says What-if: N changes versus the original, with a **Before and after** card (people cut off, difference) and a Back to original button. The what-if result keeps its own cache\_key, so it can be compared in the Compare tab.

### A4.11 About page (/about)

Sections: **What this is and is not** (text from Yagi, section Y2); **The three numbers** (a table: Flood exposure probability, Assumed closure, Estimated access loss; what each means and where it comes from; text from Yagi); **Assumptions** (rendered from the assumptions object of the current result and from /meta: speeds by road class, closure factor, degraded ratio 2.0, poor-baseline threshold 120 minutes); **Limitations** (list, text from Yagi, taken from the model card); **Data and licences** (a table rendered from /meta or a static file built from docs/data-catalog.csv); **API for developers** (a short paragraph and a link to the interactive docs at api\_base\_url plus /docs, and a copyable curl example for POST /scenarios).

**Footer on every page**: Prioritization aid for human assessment. Not a forecast. Map data © OpenStreetMap contributors. Basemap by Protomaps. Population: WorldPop. Rainfall: CHIRPS. Elevation: Copernicus DEM. Each is a link to its licence.

### A4.12 UI strings (exact wording for the terms that carry meaning)

All text lives in src/i18n/en.json under stable keys so that Yagi can translate later; no hard-coded strings in components. These terms are fixed and must not be paraphrased in the UI:

| Key | English text |
| --- | --- |
| disclaimer | Prioritization aid for human assessment. Not a forecast. |
| exposure\_label | Flood exposure probability |
| closure\_label | Assumed closure |
| access\_loss\_label | Estimated access loss under the assumed closures |
| people\_label | estimated people |
| poor\_baseline | Long travel time even without a flood |
| evidence\_validated, evidence\_limited, evidence\_heuristic | Validated, Limited, Heuristic |

### A4.13 States every screen must handle

Loading (skeleton, not a blank screen); empty (no result yet); error (message from the Error shape, the request\_id in small text, a Retry button); offline or API down (a banner: Live computation is unavailable. Demo scenarios still work.; the cascade and library demos keep working because they are static files); slow job (after 20 seconds show: Still working. New scenarios can take up to a minute.); rate limited (429: Too many requests, wait a moment).

### A4.14 Accessibility and performance requirements

- Keyboard: every control reachable; visible focus; the ranking table is the keyboard alternative to clicking the map. Touch targets at least 44 px. Text contrast at least 4.5 to 1. Color is never the only signal (we also use width, shape, text). Honour reduced-motion for the cascade.
- Every chart has a text summary. The map has an accessible label.
- Performance: the first load under 3 seconds on a 4G connection; load the Compare, Evidence and About code lazily (React lazy and Suspense); never re-create the map when state changes; throttle hover handlers; paint in chunks (A3). Check a mid-range Android phone on mobile data once on October 25 and once on October 27 and write the timings in MODULE\_WEB.md.

## A5. State and data layer (BUILD SPEC)

- **config.ts**: fetch /config.json first; render the app only after it is loaded; on failure show a clear error page. Export typed values.
- **api/client.ts**: an openapi-fetch client created with api\_base\_url, typed by src/api/schema.d.ts (generated by npm run gen:api from contracts/openapi.yaml; the generated file is committed; regenerate whenever the contract changes).
- **Server data only in TanStack Query**, with these keys: meta; library; job with the job\_id; result with the cache\_key; segments with the cache\_key; facility-explain with the facility\_id and cache\_key; segment-explain with the segment\_id and cache\_key; compare with a and b; evidence with the data\_version; demo-index; demo-step with the slug and step. Results are immutable for a given cache\_key, so give them an infinite stale time.
- **UI state only in Zustand** (state/useAppStore.ts): currentCacheKey, baseCacheKey (for what-if banners), layerMode (exposure or closure), selectedFacilityId, selectedSegmentId, whatIf (closed set and open set), comparePair, cascade (slug, step, playing), activeTab, drawerOpen.
- No component calls fetch directly; all calls go through api/hooks.ts.

## A6. Mock server (BUILD SPEC, today)

Mock Service Worker in src/mocks, turned on when VITE\_USE\_MOCKS is true. Handlers return the files in contracts/examples for every endpoint in C3.5. Make these behaviours switchable from a small developer menu or query parameters: POST /scenarios returns 200 at once (cached); returns 202 and then the job goes queued, running, done over about 6 seconds (to test the progress UI); returns 400 with a field error; returns 429; returns 500; the network is offline. This is how the screens are built and tested before the real API exists.

## A7. Tests

- **Vitest (unit)**: the manual-controls conversion with the golden values in A4.4; the paint helper (it clears old ids and paints new ones); the formatters (probability to percent, people to rounded text with the word estimated); the ranking sort and filter.
- **Component tests** (Testing Library): the Scenario form validation messages; the ranking table sorting; the facility drawer renders the three states.
- **Playwright (tests/e2e)**, run against the mock server in CI and against the live URL before the demo: (1) open the app, run a library scenario, see the ranking, open the top facility, see the why text; (2) play the cascade and see the narration change; (3) assume a road closed, apply what-if, see the before and after card; (4) the API-down banner appears when the API is offline and the demo cascade still plays.

## A8. CI for the web

The web job in ci.yml runs npm ci, npm run lint, npm test and npm run build inside /web. The build must work with no environment variables, because the app reads /config.json at run time. Keep public/config.json for development only; the deployed one is written by Dagim's ConfigStack.

## A9. Your task order (do them in this order; each is one pull request)

| # | Task | Done when | Target time |
| --- | --- | --- | --- |
| T1 | Scaffold and tooling (A2), CI web job on | CI green, empty page loads | Oct 23 morning |
| T2 | Basemap extract and local hosting check (A2.4) | File produced, shared with Dagim, map shows locally | Oct 23 noon |
| T3 | Config loader, API client, Zustand store, TanStack Query setup | The app prints the /health result | Oct 23 afternoon |
| T4 | Mock server (A6) | All endpoints served from examples; switchable cases work | Oct 23 evening |
| T5 | Map base: basemap, roads, facilities and communities from dev data, legend, layer panel | Roads draw from a local test PMTiles file; legend correct | Oct 24 morning |
| T6 | Scenario tab: library, builder, rainfall preview, conversion function with tests | Golden tests pass | Oct 24 afternoon |
| T7 | Run and poll flow with all states (A4.4 step 4) | Mock 202 sequence reaches Done; errors shown | Oct 24 evening |
| T8 | Paint results on the map (A3) and Results tab with ranking table | Example result colors the map; sorting works | Oct 25 morning |
| T9 | Facility drawer, segment drawer, what-if basket | The three drawers and the before and after card work on mock data | Oct 25 afternoon |
| T10 | Switch to the live API (change config only); fix contract mismatches with Dagim | Scenario runs end to end on the live URL | Oct 25 evening |
| T11 | Cascade bar (A4.9) | Demo plays with preloaded steps | Oct 26 morning |
| T12 | Evidence tab and Compare table | Real evaluation.json renders | Oct 26 midday |
| T13 | About page, i18n wiring, static pages with Yagi's text | No hard-coded strings; texts shown | Oct 26 afternoon |
| T14 | Performance, accessibility, phone checks | Targets in A4.14 recorded | Oct 26 evening |
| T15 | Playwright flows, bug fixes from tester round 2 | All four flows pass | Oct 27 |
| T16 | Swipe compare (cut-line item) | Only if everything above is done | Oct 27, optional |
| T17 | Data-quality hatching (cut-line item) | Only if everything above is done | Oct 27, optional |

## A10. Demo and video ownership

You own the demo flow from section 14 of the functional document. Rehearse the two-minute script until it runs with no thinking, on the laptop used on stage and on the stage network if possible. Prepare a local copy of the front end with cached demo files as the fallback. With Dagim record the video on October 27 with OBS Studio (free).

## A11. Anon final checklist

| # | Item | Status |
| --- | --- | --- |
| 1 | App scaffold, Tailwind v4, tooling, CI web job green | \[ \] |
| 2 | Basemap file made, verified, handed to Dagim, loads from our bucket through CloudFront | \[ \] |
| 3 | Config loader works; no environment variables needed to build | \[ \] |
| 4 | Mock server covers every endpoint and the failure cases | \[ \] |
| 5 | Roads, facilities, communities draw with the shared five-class legend | \[ \] |
| 6 | Manual controls conversion passes the golden tests | \[ \] |
| 7 | Run and poll flow shows Queued, Running, Done and all error states | \[ \] |
| 8 | Results tab, ranking table (sort, filter, search), summary cards | \[ \] |
| 9 | Facility drawer, segment drawer, what-if basket, before and after card | \[ \] |
| 10 | Cascade bar plays with preloaded steps | \[ \] |
| 11 | Evidence tab shows the real evaluation file and the evidence badge | \[ \] |
| 12 | Compare table works | \[ \] |
| 13 | About page and footer with disclaimer and attributions | \[ \] |
| 14 | All UI text in en.json; fixed terms exact | \[ \] |
| 15 | Phone check done twice; timings recorded | \[ \] |
| 16 | Four Playwright flows pass | \[ \] |
| 17 | Demo script rehearsed; local fallback copy ready | \[ \] |
| 18 | MODULE\_WEB.md up to date | \[ \] |

# PART Y. YAGI (support developer)

Yagi, you have four tasks. Each one is small, independent, and explained step by step below. None of them is on the critical path, and none needs an AI assistant or any complex code. They matter: the data catalog and the explanations are graded under documentation, and the facility sheet and the tester forms improve the quality of the data and of the product. Do them in the order below. Take your time and ask early when something is unclear. Asking after 30 minutes of being stuck is expected, not a problem.

## Y0. Before you start (about 20 minutes)

**How you change files without any command line.** You will use GitHub's web editor.

1. Check your email for the invitation to the repository impactmap and accept it. Open the repository in the browser.
2. To edit an existing file: open the file in the repository, click the pencil icon (Edit this file), make your changes, then click the green Commit changes button. In the window that opens choose **Create a new branch for this commit and start a pull request**. Name the branch exactly as the task says (for example docs/yagi-data-catalog). Click Propose changes, then Create pull request. Fill in the short form, click Create pull request again, and then tell Dagim in the team chat: PR ready, task Y1.
3. To create a new file: in the folder, click Add file, then Create new file, type the full name including the folder (typing a slash creates the folder), paste the content, and commit the same way.
4. To upload a file from your computer: Add file, then Upload files, drag the file, commit the same way.
5. Dagim or Anon will review your pull request and may write comments. Fix what they ask in the same branch (open the pull request, the Files changed tab, the three dots on a file, Edit file) and tell them when it is done.

**Rules for you**

- Only edit the files named in your tasks. If you think another file needs a change, write it in the chat.
- Never paste passwords, keys or tokens anywhere. If you ever see one in a file, tell Dagim at once and do not copy it.
- Do not change a number or a name you do not understand. Ask.
- Keep the status line in the team chat every morning and evening, one or two sentences.
- If you are stuck for 30 minutes, message Dagim with: which task, which step number, what you did, what you saw. A screenshot helps.

## Y1. The data catalog (about 2 hours; due tonight for the first eight rows, October 24 for the rest)

**Why.** The handbook requires us to document where every dataset comes from. Judges read this file. It also tells us whether each dataset may be used in our project.

**File to create:** docs/data-catalog.csv, branch docs/yagi-data-catalog.

**What a CSV file is.** A plain text file where each line is a row and values are separated by commas. That is why you must never type a comma inside a value: use a semicolon instead.

**The first line must be exactly this (the column names):**

```
dataset,purpose,source_name,source_url,licence,attribution_text,native_resolution,date_or_version,known_gaps,checked_by,checked_on
```

**Rules for every row**

- Eleven values, in this order, separated by commas, no comma inside any value.
- No empty value. If you do not know, write unknown. If you could not find something after 10 minutes of looking, write NOT FOUND and tell Dagim.
- Dates as year-month-day, for example 2026-10-23. checked\_by is your name; checked\_on is the day you looked.
- Copy the licence name exactly as the website writes it (for example CC BY 4.0).

**One finished example row (copy this style):**

```
OpenStreetMap roads,Road network for the graph,Geofabrik Ethiopia extract,https://download.geofabrik.de/africa/ethiopia.html,ODbL 1.0,OpenStreetMap contributors,vector,2026-10-23,rural roads incomplete; surface and bridge tags sparse,Yagi,2026-10-23
```

**Datasets to add, with the page to open for each** (open the page, then look for words such as licence, license, terms, citation, attribution, or data use; copy what they say):

| Dataset | Page to open | What to find |
| --- | --- | --- |
| OpenStreetMap facilities | https://www.openstreetmap.org/copyright | Licence name and the required attribution sentence |
| WorldPop population | https://www.worldpop.org | Licence, how they ask to be cited, the resolution of the 1 km product, the latest year available |
| Copernicus DEM elevation | https://registry.opendata.aws/copernicus-dem/ | Licence text link, resolution (30 m and 90 m versions), the attribution line |
| ESA WorldCover land cover | https://esa-worldcover.org | Licence, attribution, resolution |
| CHIRPS rainfall | https://www.chc.ucsb.edu/data/chirps | Licence or data-use statement, resolution, how to cite |
| Open-Meteo forecast | https://open-meteo.com/en/terms | Already known: free for non-commercial use; CC BY 4.0; up to 10,000 calls a day. Find the attribution wording. |
| Protomaps basemap | https://docs.protomaps.com/basemaps/downloads | Licence (distributed as an ODbL produced work; OpenStreetMap attribution required) and the attribution wording |

The OpenStreetMap roads row is the example above (you may check it and fix it). Dagim adds the flood-event datasets after tomorrow's audit; he will give you the links and you do the same steps for them (the Global Flood Database is known to be CC BY-NC 4.0, non-commercial; write that in known\_gaps as: not for commercial use).

**Done when:** every row has eleven values with no empty cell, Dagim and Anon have looked at it, and the pull request is merged. Open the file in the GitHub viewer afterwards: it shows as a table, so you can see mistakes (a shifted column means a stray comma).

## Y2. Plain-language texts: glossary, About page text, README outline (about 3 hours; due October 26 midday)

**Why.** Our users are planners, not engineers. Words like exposure and closure must mean the same thing everywhere. Anon shows these texts in the app.

**Files (three), branch docs/yagi-texts:**

1. docs/glossary.md
2. web/src/content/about.md (a special exception: this file is inside Anon's folder but it is yours; Dagim adds the line /web/src/content/ followed by your GitHub name to the CODEOWNERS file today)
3. docs/README-skeleton.md (headings only; Dagim copies them into the real README)

**1) Glossary.** Write a heading ## Glossary and then one line per term in the form **Term**: definition. Start from the text below, which is accurate. You may make the wording simpler, but you must keep the meaning. If you change the meaning of any term, ask Dagim first. Keep each definition under 40 words.

- **Road segment**: one stretch of road between two junctions or road ends. Each has a number.
- **Scenario**: a rain situation we test: how many millimetres fall on each day, where, and how wet the month before was.
- **Flood exposure probability**: the chance, from 0 to 100 percent, that a road segment lies inside flooded ground in this scenario. The model estimates it from rainfall and terrain. It is the only number checked against real past floods.
- **Assumed closure**: the chance that we treat a segment as closed in the simulation. By default it equals the exposure (the worst case). It is an assumption, not a measurement.
- **Estimated access loss**: how many estimated people lose road access to a hospital, or get a much longer trip, if the closed roads are removed. It is a calculation, not a forecast.
- **Cut off**: no road route to any hospital remains. **Degraded**: a route remains but takes more than twice as long as normal.
- **Isolated facility**: a clinic or hospital that cannot reach any other hospital by road, so patients cannot be referred onward.
- **Estimated people**: people counted from a modelled population grid (WorldPop), not from a census. A group of people can sit on the wrong road in the data.
- **Evidence level**: Validated means tested on real past floods that were held out from training; Limited means few events, so results are uncertain; Heuristic means rule-based and not validated.
- **Priority score**: a number from 0 to 100 that orders places within the chosen region. It shows order, not absolute danger, and cannot be compared between regions.
- **Baseline**: the situation with no rain.
- **Sample**: one random draw of which roads close. We draw 200 and report how often each place was affected.
- **Long travel time even without a flood**: a place that already needs more than 120 minutes to reach a hospital on a normal day. We show it separately from flood damage.

**2) About text.** Create web/src/content/about.md with exactly these three headings (Anon's page looks for them): ## What this is and is not, ## The three numbers, ## Limitations. Under each, write short paragraphs or bullets in plain English using the glossary. Use this content as the starting point:

- **What this is and is not**: ImpactMap AI helps planners see which hospitals and communities could lose road access during a flood, and which roads matter most. It does not forecast the weather or tell anyone that a road will close. It is a tool to decide where people should look first.
- **The three numbers**: a short explanation of Flood exposure probability, Assumed closure and Estimated access loss, in that order, each in two sentences, and a sentence explaining why we keep them separate: only the first is checked against real floods.
- **Limitations** (one bullet each, in plain English): a flooded road is not always a closed road; we trained on a small number of past floods; flood maps from satellites are coarser than a road is wide; rainfall data is about 5 kilometres wide; OpenStreetMap is incomplete in some rural areas; the terrain data cannot see small culverts or drains; we do not know about road repairs or closures; clinics are assumed to be open and correctly placed; population is a modelled estimate; in the first version road closures are drawn independently of each other, which understates the risk when nearby roads flood together.

**3) README outline.** Create docs/README-skeleton.md with these headings, each followed by one line in italics saying what goes there: Problem and who it is for; How it works; Where and why AI is used; Architecture; Run it locally; Deploy it; Model validation and limits; Cost and load test; Security; Tear it down; Data and licences; Team.

**Done when:** Dagim has checked the glossary for accuracy, Anon has checked that the headings match what his page expects, and the pull request is merged.

## Y3. The facility classification sheet (about 2 hours of your time, plus testers; export due October 24 evening, results due October 26)

**Why.** The map shows hospitals, health centres and clinics with different symbols and the ranking weights them differently. Some places in the data have an uncertain type. People who know the area can fix this; the computer cannot.

**Steps**

1. Dagim sends you facilities.csv on October 24 (columns: facility\_id, name, level\_guess, source, quality\_flag, lon, lat).
2. Go to sheets.google.com, create a blank spreadsheet named ImpactMap facility review. Choose File, Import, Upload, select facilities.csv, and for Import location choose Replace spreadsheet. Import data.
3. Add four columns to the right: level\_confirmed, checked\_by, checked\_on, note.
4. For level\_confirmed select the whole column below the header, then Data, Data validation, Add rule, Dropdown, with these options exactly: hospital, health\_center, clinic, unknown, not\_a\_facility. Save.
5. Freeze the first row (View, Freeze, 1 row) and add a filter (Data, Create a filter).
6. Share: the Share button, add the tester email addresses as Editors, and make sure General access stays Restricted (no public link).
7. Split the work: add a column batch and number the rows in blocks of 30 (batch 1, batch 2, and so on). Tell each tester their batch number in the chat.
8. **Rules for the type** (write these at the top of the sheet in a separate tab called Rules): hospital: the name contains Hospital (including Referral, General, Primary, Teaching). health\_center: the name contains Health Center or Health Centre. clinic: the name contains Clinic, Health Post, Dispensary or Medical. If you do not know, choose unknown. Do not guess. If the place is not a health facility, choose not\_a\_facility.
9. When the testers have finished (target October 26 morning), export: File, Download, Comma-separated values (.csv), and save as facility\_review.csv. Upload it to the repository folder docs/testing/ using Add file, Upload files. Tell Dagim.

**Done when:** every row has a value in level\_confirmed, and facility\_review.csv is in docs/testing/.

## Y4. Tester operations (about 3 hours; set up tonight, run on October 25 and 27)

**Why.** The testers do not code. They find the problems the developers cannot see. You make it easy for them and collect what they say in one place.

**Steps**

1. **Feedback form.** Go to forms.google.com and create a blank form named ImpactMap tester feedback. Add these five questions, each as the type Paragraph, exactly: What did you think the colours meant? Which number did you trust least, and why? What was missing? Would you use this, and for what? What was confusing? Add a first question of the type Short answer: Your name and the device you used. In the Responses tab click Link to Sheets so answers collect in a spreadsheet. Copy the form link (Send button, link icon) into the team chat.
2. **Labels for problems.** In the repository open Issues, then Labels, then New label. Create bug (color red; description: something is broken), confusing (yellow; a screen or word people did not understand), data-error (blue; a wrong place, name or number in the data).
3. **Issue forms.** Create three files in the folder .github/ISSUE\_TEMPLATE using Add file, Create new file, on branch docs/yagi-issue-templates. First file, name .github/ISSUE\_TEMPLATE/bug.yml, content:

```
name: Bug
description: Something is broken
labels: [bug]
body:
  - type: textarea
    id: what
    attributes:
      label: What happened?
      description: What did you click, what did you expect, and what did you see?
    validations:
      required: true
  - type: input
    id: device
    attributes:
      label: Device and browser
      placeholder: Phone model or laptop; Chrome or Firefox
```

The second file, .github/ISSUE\_TEMPLATE/confusing.yml, is the same with name Confusing, description Something was hard to understand, labels \[confusing\], and the first question label Which screen, and what was unclear? The third file, .github/ISSUE\_TEMPLATE/data-error.yml, has name Data error, description A place, name or number looks wrong, labels \[data-error\], and the first question label Which place or facility, and what is wrong?

4. **Schedule sheet.** In Google Sheets create ImpactMap test schedule with columns date, round, tester, task, done. Rounds: October 25 (round 1), October 27 (round 2), October 30 and 31 (demo rehearsal audience). Ask each tester in the chat for the hours they can give, and fill the sheet. Dagim gives you the exact tester tasks from Part T.
5. **The tester script.** Create docs/testing/tester-script.md and paste the instructions from Part T (Dagim reviews it first).
6. **Collect the results.** After each round, create docs/testing/feedback-round-1.md (and round-2) with a table whose columns are: id, screen, what happened, severity, who fixes, status. Severity: high means the demo breaks or a number is wrong; medium means confusing or slow; low means cosmetic. Add every problem from the form and from GitHub Issues. Sort high first. Send the list to Dagim and Anon the same evening.

**Done when:** the form works (send yourself a test answer), the three labels and three issue forms exist, the schedule is filled for October 25 and 27, and the round-1 list is in the repository by the evening of October 25.

## Y5. Yagi final checklist

| # | Item | Status |
| --- | --- | --- |
| 1 | Accepted the invitation; made one test pull request with a small change | \[ \] |
| 2 | Y1 data catalog: every row complete, merged | \[ \] |
| 3 | Y2 glossary, about.md, README skeleton merged | \[ \] |
| 4 | Y3 sheet created, shared with testers, results exported to docs/testing | \[ \] |
| 5 | Y4 form, labels, issue forms, schedule, tester script, round-1 list | \[ \] |
| 6 | Status line posted every morning and evening | \[ \] |

# PART T. TESTERS (no coding)

The testers are part of the product. Their feedback is evidence for the Problem Relevance score and a safety net against mistakes that the developers cannot see. Yagi organizes them; Dagim and Anon read every result.

## T1. What to tell the testers (Yagi pastes this into the chat)

ImpactMap AI is a tool that shows which hospitals and communities could lose road access during a flood in a region of Ethiopia. It is a test version. You do not need to know anything technical. If something confuses you, that is useful for us: please say so rather than guessing. Do not try to be nice. Tell us what you did not understand. Never enter personal information.

## T2. Test tasks

1. **Snapping spot-check** (October 24 evening and 25): open the live link, zoom to the facilities and communities, and for 30 facilities and 30 communities mark in the sheet whether the dot is where you would expect (for example a hospital sitting in a field or a village in the wrong district). Columns: id, name, looks right (yes, no, not sure), note.
2. **Thirty-second test** (rounds on October 25 and 27): the tester gets one question and 30 seconds with the right screen. Record yes or no and where they got stuck. Questions: As a regional planner, which facilities should I look at first for this storm? (Results tab); As a health coordinator, which clinic has lost its route to a hospital and is there another way? (facility drawer); Is my area likely to be cut off, and how sure is the tool? (map and range); What does the colour on the roads mean? (legend); What will happen if this road is protected? (what-if); Can I trust this? (evidence badge and About).
3. **Break it session** (October 27): try bad inputs (very big numbers, empty fields), the browser back button, a phone, a slow connection, rotating the phone, refreshing in the middle of a run. Report each problem in the form or as a GitHub issue with the right label.
4. **Feedback form**: after each session, answer the five questions in the form.
5. **Demo audience** (October 30 and 31): watch the two-minute demo and the pitch, then say what they remember and what they did not understand.

Severity guide: high means the demo breaks or a number looks wrong; medium means confusing or slow; low means cosmetic.

# PART S. SCHEDULE, HANDOFFS, RISKS AND FINAL CHECKS

## S1. Day-by-day plan

Dates follow the handbook. Today is Friday October 23. The 28th is a buffer for final checks and submission before midday. Ethiopian weekend days are used as working days because the window is short; plan rest hours yourselves so that nobody is exhausted on the 27th.

| Day | Dagim | Anon | Yagi | Testers | Exit check |
| --- | --- | --- | --- | --- | --- |
| **Fri Oct 23** | Setup D2 (tools, AWS, budgets, repo). 60-minute mob session. Contracts and examples pushed by 12:00. **Flood-event audit and the gate at 20:00 (priority over everything except contracts).** CDK bootstrap and walking skeleton as far as time allows; finishing it on the morning of the 24th is acceptable. | T1 to T4: scaffold, basemap file (to Dagim by noon), config and client, mock server. | Y0, Y1 first eight rows. | Told what is coming; no work yet. | Contracts published. Gate decided and written down. Repo, CI and branch rules exist. |
| **Sat Oct 24** Checkpoint 2 (Oct 23 to 24) | Finish skeleton (live fake API, CORS proven). Graph, facilities, communities, terrain features, labels. Baselines B0 and B1. Core package and engine with tests. Send facilities.csv to Yagi and example evaluation.json to Anon in the evening. | T5 to T7: map base, Scenario tab, run and poll flow. | Y1 event rows, Y2 draft, Y3 sheet created. | Snapping spot-check starts after the data is published. | Live fake API works from the CloudFront page. Engine tests pass. IaC deploys from CI. |
| **Sun Oct 25** Checkpoint 3 starts (Oct 25 to 26) | Train, calibrate, leave-one-event-out evaluation. Real worker image. Real API replaces the fake handlers. Scenario runs end to end on the live URL (even if the model is rough). | T8 to T10: paint results, Results tab, drawers, what-if, switch to the live API. | Y4 complete. Round-1 list written. | **Round 1** of testing. | A scenario runs end to end on the live URL. |
| **Mon Oct 26** | Ranking, explanations, what-if, compare. Demo scenarios and cascade steps precomputed. Dashboard, alarms, budget in code (delete the manual budgets). Security tools, docs/security.md. Real evaluation.json. **Feature list frozen at the end of the day.** | T11 to T14: cascade, Evidence, Compare, About, strings, performance, phone checks. | Y2 finished and merged. Y3 export to docs/testing. | Facility sheet completion. | Everything in P0 works. Freeze. |
| **Tue Oct 27** Checkpoint 4 (Oct 27 to 28) | Load test, teardown and redeploy test, model card, README technical parts, architecture diagram, video draft. Code freeze in the evening. | T15: Playwright flows, fixes from tester round 2, polish. Video recording with Dagim. | README skeleton check. Round-2 list. | **Round 2** and break-it session. | Code freeze. Video recorded. Secret scan clean. |
| **Wed Oct 28** | Final deploy from CI. Check the live URL from another network and a phone. Assemble the submission package. | Smoke test on phone and laptop. | Checklist review (S5). | Final look at the live link. | **Submit by midday.** The handbook gives no time of day; do not risk it. |
| **Thu Oct 29 to Sat Oct 31** | P1 picks in this order: correlated mode, mitigation list. Finalist announcement is October 30; rehearsal October 31. | Pitch demo flow. | Rehearsal audience. | Rehearsal audience. | Finalist stage ready. |

**Honest warning.** October 25 is the hardest day: Dagim has to train the model, build the worker and connect the API on the same day. If by 14:00 on the 25th the model is not trained and evaluated, do not keep pushing: take the next rung of the fallback ladder (section 15 of the functional document), ship the baselines plus whatever model exists with an honest evidence badge, and finish the pipeline. A working end-to-end system with a modest model scores higher than a perfect model with no deployment.

## S2. Handoffs (who gives what to whom)

| # | From to | What | When | Confirmed by |
| --- | --- | --- | --- | --- |
| 1 | Dagim to Anon | CONTRACTS.md, contracts/openapi.yaml, contracts/examples | Oct 23, 12:00 | Anon builds the typed client from the file |
| 2 | Anon to Dagim | The basemap file ethiopia.pmtiles (shared drive link) | Oct 23, noon | Dagim uploads it; Anon sees it load from CloudFront |
| 3 | Dagim to Anon | Live fake API address and /config.json in place | Oct 23 evening or Oct 24 morning | Anon's page prints a response |
| 4 | Dagim to Yagi | Dataset source links (the table in Y1) now; flood-event dataset links; facilities.csv | Oct 23; Oct 24 | Yagi confirms the rows and the sheet |
| 5 | Dagim to Anon | Example evaluation.json; real evaluation.json; demo files in the data bucket | Oct 24 evening; Oct 26; Oct 26 | Evidence tab and cascade render |
| 6 | Yagi to Anon | web/src/content/about.md | Oct 26 midday | About page renders three sections |
| 7 | Yagi to Dagim | docs/data-catalog.csv complete; facility\_review.csv | Oct 24 and Oct 26 | Dagim applies facility corrections and reruns the pipeline if needed |
| 8 | Anon to Dagim | A web app that builds in CI with no environment variables | Oct 24 | Deploy workflow is green |
| 9 | Yagi to Dagim and Anon | Tester findings lists | Oct 25 evening and Oct 27 evening | Everyone reads it the same night |

## S3. Cut-line (what to drop first if behind)

Drop in this order, from the top. Say so in the team chat when you drop something.

1. Correlated failure mode (keep the statement that independent mode understates joint risk).
2. Swipe view in Compare (keep the table).
3. Data-quality hatching on the map (keep the flags in drawers and rows).
4. More than one cascade demo (keep one).
5. Baseline B2, the hazard-map lookup.
6. More than two historical replays (keep two as a minimum).
7. Observed-versus-predicted map in the Evidence tab (keep the metrics).

**Never drop** (these are the rubric): the deployed pipeline from CI, baselines B0 and B1, leave-one-event-out evaluation, the evidence panel, the budget alarm in code, infrastructure as code, least-privilege roles, teardown, the README, the architecture diagram and the demo video.

## S4. Risks and what we do about them

| Risk | Owner | What we do |
| --- | --- | --- |
| Too few usable flood events | Dagim | Gate tonight; fallback ladder L1 to L3; honest evidence badge; tell the mentor at Checkpoint 2. |
| Dagim is on the critical path for almost everything | Dagim | Walking skeleton first; cut-line; Anon builds on mocks so he never waits; ask Anon to take a defined small backend or CI helper job if Dagim falls behind by 14:00 on the 25th. |
| Contract mismatch between backend and web | Dagim and Anon | One contract file; examples validated against the OpenAPI file; contract changes announced; the switch from mock to live is only a config change. |
| AWS Free plan blocks a service | Dagim | Day-1 deploy test; nearest allowed service; ADR; mention at checkpoint. |
| The model does not beat the baseline | Dagim | Report it honestly; keep both in the product; evidence badge Limited. |
| Account ownership or age terms are unresolved | Dagim | Settle with the organizers today; document in docs/aws-account.md. |
| Basemap file too large | Anon | Dry run first; lower the maximum zoom; our road layer gives the detail. |
| Last-minute deploy failure | Dagim | Final deploy on the morning of the 27th as a rehearsal; submit by midday on the 28th; keep the recorded video as a fallback. |
| Tester availability | Yagi | Schedule sheet; fall back to the team testing each other's screens. |
| Stage network fails | Anon | Static cascade files, local fallback copy, recorded video. |
| Free-tier surprise | Dagim | API throttling, no paid services, budget alarms, billing page check after the load test. |

## S5. Submission checklist (assembled by Dagim; reviewed by everyone on October 28)

| # | Deliverable | Owner | Status |
| --- | --- | --- | --- |
| 1 | Public GitHub repository with commits from all members | Dagim | \[ \] |
| 2 | /infra with one-command teardown, tested | Dagim | \[ \] |
| 3 | Architecture diagram in the README | Dagim | \[ \] |
| 4 | Live URL works from another network and a phone | Dagim and Anon | \[ \] |
| 5 | README: problem, persona, where and why AI is used, setup, deploy, metrics, limits, cost, security, teardown, declared third-party items | Dagim, Yagi | \[ \] |
| 6 | Model documentation: sources, preprocessing, training scripts, evaluation, model card, data catalog | Dagim, Yagi | \[ \] |
| 7 | CI/CD workflows that test, build and deploy | Dagim | \[ \] |
| 8 | Security evidence: no secrets in history, gitleaks, cdk-nag, IAM table | Dagim | \[ \] |
| 9 | Budget alarm documented (screenshot and the code) | Dagim | \[ \] |
| 10 | CloudWatch dashboard visible with logs and metrics | Dagim | \[ \] |
| 11 | Video demo 2 to 3 minutes: interaction, live inference, AWS console and CloudWatch logs | Anon and Dagim | \[ \] |
| 12 | All libraries, datasets and models declared with licences | Dagim, Yagi | \[ \] |

**Final check before submitting**: open the live URL in a private window on a phone, run the demo path, open the README and click every link, and confirm the repository contains no keys.

## S6. After the deadline (the resume project continues)

P1 in order: correlated mode, landslide as a labelled heuristic, mitigation list, forecast and Telegram alerts, PDF report, accounts and the review loop, Amharic and Afaan Oromo. P2: field verification loop, offline use, retraining and drift monitoring, onboarding of new regions. After the event: rewrite the open questions from section 16 of the functional document as issues, keep the load-test and evaluation scripts in the repository, and write two or three resume bullets with real numbers (events used, metrics with intervals, cost per 1,000 scenarios, cloud services used).

## S7. When you get stuck (how to ask for help, and who to ask)

- **Inside the team**: post in the chat with the task ID and step number, what you did, and what you saw. Ask within 30 minutes of being stuck.
- **For the manual setup steps**: use this document first. If a screen or option looks different from what is written (cloud consoles change often), ask your assistant with this document available as context. Send: the step ID (for example D2.2 step 5), a screenshot or the exact error text with secrets removed, your operating system, and what you expected. Ask for the next single step, not the whole procedure again.
- **For code**: follow C8. Paste the context packet and the exact contract tables first.
- **For mentors**: prepare one line for each checkpoint: what is done, what is blocked, what you need.
- **Never** paste an access key, bot token or password into a chat. If you did by mistake, tell Dagim immediately: the key is revoked and replaced.

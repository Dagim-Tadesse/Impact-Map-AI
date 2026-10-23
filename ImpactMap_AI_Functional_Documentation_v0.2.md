# ImpactMap AI: Functional Documentation

Version 0.2 (revised after technical review) · Project lead and backend: Dagim · Frontend lead: Anon · Support: Yagi · AWS Community Day 2026 Hackathon, AASTU

# 0. How to read this document

This is version 0.2. Version 0.1 was reviewed twice: once by a second analysis (ChatGPT) and once by me against the hackathon handbook, the datasets, and the AWS free-tier documentation. This version keeps the full vision of v0.1 and fixes the places where what we claim and what the data can support did not agree.

Every function has an ID (F1, F2, ... for the main system, E1, E2, ... for extensions) so it can become a ticket. Priority tags:

- **P0**: must be in the October 28 submission.

- **P1**: finalist-stage upgrade (October 29 to 31) or first thing after the deadline. Some P1 items are marked "early" and are pulled into the build if P0 is ahead of schedule.

- **P2**: post-hackathon depth that turns this into a long-term resume project.

Anything marked **\[verify\]** is a claim about an external dataset, price, or free-tier rule that has not been confirmed. Each one has an owner and a Day-1 check in section 16. Do not build on a \[verify\] item until it is checked. Items I did check while writing v0.2 are marked **\[checked\]** with the source.

## 0.1 What changed from v0.1, and my verdict on each review point

The review made 20 points. Most are correct. A few are partly right, and one rests on something I cannot see in our conversation. Verdicts below.

| **\#** | **Point raised**                                                                                                                                       | **Verdict**                         | **What changed**                                                                                                                                                                                                                                                                                                        |
|--------|--------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1      | The label (road inside a flood extent) shows flood exposure, not that the road became impassable, but the model was called a road-failure probability. | **Accept** (most important fix)     | Three separate quantities are now defined: exposure probability (the ML output), assumed closure (a documented, adjustable conversion), and access loss (the engine output). See D3 to D6.                                                                                                                              |
| 2      | Flood-only P0 conflicts with the idea submitted to the hackathon, which mentions two hazards.                                                          | **Partly accept**                   | A shared hazard contract is added so the engine is hazard-agnostic. Flood stays the only ML-validated hazard. Landslide becomes a clearly labelled heuristic mode (P1, gate on Oct 26) because there are no labels to validate an ML model in six days. See section 5.1.                                                |
| 3      | Model rainfall features cannot be derived from the manual controls (storm total, duration, wetness class).                                             | **Accept**                          | One canonical scenario format with a daily rainfall array. Manual controls generate that array from documented storm shapes. See D2 and F2.                                                                                                                                                                             |
| 4      | The 8 to 15 events plan is not backed by an audit of actual Ethiopian events.                                                                          | **Accept, plus two extra findings** | The Global Flood Database ends in 2018 and is licensed CC BY-NC 4.0 \[checked\]. So "events from 2015 onward" gives only 2015 to 2018 from that source. Gate and fallback ladder rewritten (sections 9 and 15).                                                                                                         |
| 5      | Sections 13 to 16 are referenced but missing.                                                                                                          | **Accept, confirmed**               | v0.1 ends at 10.9. Sections 13 to 16 are now written, plus new sections 11, 12 and 17.                                                                                                                                                                                                                                  |
| 6      | Rainfall (about 5.5 km) and terrain (30 m) and labels (250 m) have different resolutions.                                                              | **Accept**                          | Resolution table added in section 9 and wording rules for the UI.                                                                                                                                                                                                                                                       |
| 7      | Independent failure draws underestimate correlated isolation.                                                                                          | **Accept**                          | Correlated mode moved to "P1 early" with a cheap method (section F4). Deterministic what-if stays.                                                                                                                                                                                                                      |
| 8      | Population snapped to roads is an estimate that can land on the wrong node.                                                                            | **Accept**                          | Always labelled "estimated"; snap distance and coverage flags stored (D10).                                                                                                                                                                                                                                             |
| 9      | A location with long baseline travel would be called "degraded" even without the disaster.                                                             | **Accept**                          | Degraded is now relative to baseline; poor baseline access is a separate flag (D8).                                                                                                                                                                                                                                     |
| 10     | Priority score is relative to the chosen region.                                                                                                       | **Accept**                          | UI shows raw components next to the score and says the ranking is relative (D11).                                                                                                                                                                                                                                       |
| 11     | Cache key ignores model, data and engine versions.                                                                                                     | **Accept**                          | Key = scenario hash + model + data + engine version (section 8).                                                                                                                                                                                                                                                        |
| 12     | Facilities are assumed open and correctly placed.                                                                                                      | **Accept**                          | Facility source and snap distance tracked; assumption stated in the UI (D9, F1).                                                                                                                                                                                                                                        |
| 13     | Containers are not clearly covered.                                                                                                                    | **Partly accept**                   | The handbook lists containers as one possible scope item; the mandatory items are IaC, CI/CD, a public endpoint, least-privilege IAM, free-tier discipline and observability. Still, packaging the worker as a Lambda container image (ECR) is cheap, removes the 250 MB package-size risk, and ticks the box. Adopted. |
| 14     | API Gateway may be usable, and Lambda URL behind CloudFront OAC needs a payload-hash header for POST.                                                  | **Accept**                          | API Gateway is on the new Free plan service list \[checked\]. We switch to an API Gateway HTTP API in front of Lambda. I could not re-open the CloudFront page in this session to confirm the POST detail, but the switch makes it irrelevant.                                                                          |
| 15     | AWS account ownership and age terms.                                                                                                                   | **Handled generically**             | I have no information from you about this. The document only requires that the AWS account owner is confirmed as eligible under AWS terms or provided by the organizers (Day-1 check). If this applies to your team, sort it out with the organizers today.                                                             |
| 16     | OpenFreeMap hosted tiles have terms that need an adult integrator.                                                                                     | **Accept in effect**                | We self-host PMTiles. OpenFreeMap is removed as a fallback. The fallback is a plain background with our own road vectors.                                                                                                                                                                                               |
| 17     | The P0 list is too big for the window.                                                                                                                 | **Accept**                          | Walking skeleton first, explicit P0 scope, an ordered cut-line, and a day-by-day plan (sections 12 and 15).                                                                                                                                                                                                             |
| 18     | Promote data quality, mitigation what-if, model evidence panel, and a strict API contract.                                                             | **Accept**                          | F12 (evidence panel, P0), F13 (data quality flags, P0-lite), F6 what-if (P0-lite), API schemas (section 8.2).                                                                                                                                                                                                           |
| 19     | Keep preprocessing outside Lambda.                                                                                                                     | **Agree, already the design**       | Made explicit in section 8.                                                                                                                                                                                                                                                                                             |
| 20     | Do not add a hosted LLM.                                                                                                                               | **Agree**                           | Unchanged. Explanations stay template-based.                                                                                                                                                                                                                                                                            |

> **Two issues the review did not raise.** (1) With only a handful of events, the model sees very little variation in rainfall across events, so how failure depends on rainfall is weakly learned; most of the signal is terrain. Section 10.10 says how we frame this honestly. (2) The Global Flood Database licence is non-commercial, which matters if this ever becomes a product.

# 1. Purpose and scope

## 1.1 What ImpactMap AI is

ImpactMap AI is a decision-support system for flood-driven road disruption in Ethiopia. Given a rainfall scenario (a hypothetical storm, a replay of a past event, or later a live forecast), it answers five questions in order:

- Which road segments are likely to be flooded, and with what probability?

- If those segments are closed, which hospitals, clinics and communities lose road access, and how much worse does travel become for everyone else?

- How many people are affected (estimated), and how confident is the estimate?

- Which locations should humans assess first, and why did their priority change?

- Which few road segments, if protected or monitored, would help the most people?

The system does not forecast weather or model river hydrology. It takes rainfall as an input and estimates consequences for the road network.

## 1.2 Three quantities that must never be mixed

This is the main correction in v0.2. Each number shown to a user must mean exactly what the evidence supports.

| **Quantity**                 | **Meaning**                                                                                                                                                                                          | **Source**                                                    | **How it is labelled**                                              |
|------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------------------------------|
| **Exposure probability** e_i | Probability that segment i lies inside the flooded area for this rainfall.                                                                                                                           | ML model, trained and calibrated on observed flood extents.   | "Flood exposure probability". This is the only ML-validated number. |
| **Assumed closure** c_i      | Probability that we treat the segment as closed in the simulation. c_i = e_i x k, where k is a passability factor by road class and bridge flag (default 1.0, the worst case: flooded means closed). | A documented assumption, adjustable in the sensitivity panel. | "Assumed closure". Not validated against real closures.             |
| **Access loss**              | Change in who can reach a hospital, and how long it takes, when the closed segments are removed.                                                                                                     | Deterministic graph engine run over many samples.             | "Estimated access loss under the assumed closures".                 |
| **Observed closure**         | A road a person on the ground reported as impassable.                                                                                                                                                | Field reports (E4, P2 only).                                  | Never mixed with the three above.                                   |

## 1.3 What it is not

- Not a flood forecaster or early-warning authority.

- Not a navigation or live rescue-dispatch app.

- Not a replacement for field assessment. Every output is labelled a prioritization aid for human assessment, with uncertainty shown.

## 1.4 Time reality

The handbook gives a build period of October 20 to 28, with a hard submission deadline on October 28. Today is October 22, so there are 7 calendar days including today and the last one should be buffer. The scope is therefore built in tiers:

- **Walking skeleton first (Day 1 to 2)**: a deployed, CI-tested system with fake data end to end (map, API Gateway, Lambda, job table, result file, CloudWatch). Everything after that replaces fake parts with real ones. This avoids the integration surprise at the end.

- **P0** is one pilot region, one validated hazard (flood), and a complete workflow.

- **P1 and P2** are specified now so the architecture does not need to change later.

## 1.5 Why machine learning belongs here (rubric: 25 points)

- The graph engine is deterministic. It can say who is cut off if these segments close. It cannot say which segments will flood, or how likely that is.

- Without ML the user must guess the flooded roads by hand. With ML the system produces a calibrated flood-exposure probability for every segment from rainfall and terrain.

- We prove the benefit with numbers: the model must beat simple baselines (a height-above-drainage rule, logistic regression, a flood hazard map lookup), and the end-to-end facility-isolation estimate must beat the baseline too (section 10). If it does not, we say so.

## 1.6 How the system maps to the hackathon rubric

| **Rubric category (points)**        | **Where we earn it**                                                                                                        | **Evidence the judge can open**                                                           |
|-------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| Problem relevance and impact (15)   | Road access to health facilities during floods; named users in section 2.                                                   | Pitch hook, README problem statement, tester feedback summary.                            |
| AI/ML rigor (25)                    | Flood-exposure model, baselines, leave-one-event-out evaluation, calibration, end-to-end isolation test, documented limits. | Model card, in-app Model evidence panel (F12), evaluation scripts in /ml, README metrics. |
| Cloud architecture and DevOps (25)  | CDK stacks, GitHub Actions with OIDC, least-privilege roles, CloudWatch dashboard and alarms, budget alarm, teardown.       | /infra folder, Actions run history, CloudWatch dashboard screenshots, IAM policy list.    |
| End-to-end integration (20)         | One live URL: map, API, worker, results; graceful errors; cached fallback; cost per 1,000 scenarios.                        | Live URL, load-test results, demo video.                                                  |
| Documentation and code quality (15) | Monorepo, tests, ADRs, architecture diagram, setup and teardown instructions, clean commit history.                         | README, /docs, diagram, commit log.                                                       |

# 2. Users and the questions they ask

- **Regional disaster-risk planner** (for example a regional disaster-management office): Which facilities and communities should I prepare for before next week's rains?

- **Road and logistics coordinator** (road authority, humanitarian logistics): Which segments should be inspected or pre-positioned for first?

- **Health coordinator**: Which clinics lose their referral route to a hospital, and which alternative route exists?

- **Community or NGO viewer** (read-only): Is my area likely to be cut off, and when?

- **Data steward and admin** (our team): Manage datasets, model versions, scenario library, and alerts.

- **Judge**: Open the link, run a scenario, query the API, and see evidence that the model works.

Every screen should answer one of these questions in under thirty seconds. Testers (section 11) check this directly.

# 3. Core definitions (freeze on Day 1)

Write these into the repository as docs/definitions.md. Do not change them without telling the team.

- **D1. Segment**: one edge of the simplified road graph, with a stable ID, geometry, length, road class, surface (if known), bridge or culvert flag, and terrain features. Degree-2 nodes are merged so the graph has thousands of edges, not millions.

- **D2. Scenario (canonical form)**: hazard type, region ID, start date, number of days N (at most 10), a **daily rainfall array** of N values in mm, a spatial pattern (uniform, gradient, or storm cell with centre and radius), a 30-day antecedent rainfall value, the closure factor k, the failure mode (independent or correlated), number of samples, and a seed. Every model rainfall feature is derived from this one structure. Types: manual, historical replay (the array comes from CHIRPS), forecast (the array comes from the forecast, P1).

- **D3. Exposure label (training)**: a segment is labelled exposed in a past event if at least X percent of its length lies inside the observed flood extent. X is set after the label audit and documented. This is flood exposure, not proof the road was impassable. This sentence goes in the model card.

- **D4. Exposure probability e_i**: the model's calibrated probability that segment i is exposed under the scenario. Calibration is evaluated against D3 labels only.

- **D5. Assumed closure c_i**: c_i = min(1, e_i x k), with k by road class and bridge flag. Default k = 1.0 (worst case). The UI says "assumed closure".

- **D6. Sample**: one random realisation of which segments are closed, drawn from the c_i values. The engine draws several hundred samples per scenario. In correlated mode, draws share a catchment-level random factor (section F4).

- **D7. Travel time**: shortest-path time over the surviving graph using speeds by road class and surface. Speeds are configurable and documented as assumptions.

- **D8. Cut off, degraded, and poor baseline access**: a community is **cut off** in a sample if it cannot reach any hospital. It is **degraded** if its travel time to the nearest hospital is more than twice its baseline (configurable). Separately, a community has **poor baseline access** if its baseline time is above 120 minutes with no disaster. Poor baseline access is shown as its own flag and is never counted as scenario damage.

- **D9. Facility isolation**: a facility is isolated in a sample if it cannot reach the referral hub set (the regional hospital or main road network). Facilities are assumed open and correctly located unless a source says otherwise; the UI states this and shows the facility source and snap distance.

- **D10. Estimated exposed population**: population per community node from gridded population data snapped to the nearest road node. The snap distance and a coverage flag are stored. The UI always says "estimated people" and flags nodes with a long snap distance or thin road coverage.

- **D11. Priority score (0 to 100)**: probability of isolation or cut-off, times estimated exposed population, times a facility weight (hospital above health centre above clinic), normalised **within the selected region**. The UI shows the three raw components next to the score, shows the 10th to 90th percentile range from the samples, and states that the ranking is relative to the chosen region and is not comparable across regions.

- **D12. Evidence level**: every hazard module carries one of three tags shown on the map: **Validated** (evaluated on held-out observed events), **Limited** (fewer than six events, wide intervals), or **Heuristic** (rule-based, not validated).

# 4. Core functional requirements (the main system)

## F1. Data foundation (P0)

**What**: a reproducible pipeline that builds, for the pilot region, the road graph, facilities, community nodes with population, terrain and land-cover features per segment, and rainfall archives. It runs offline (locally or in GitHub Actions), never inside a request.

- Road graph from OpenStreetMap (Geofabrik Ethiopia extract), simplified and stored as compact arrays plus a segment attribute table.

- Facilities from OpenStreetMap plus a health-facility dataset \[verify which is most complete for Ethiopia\]. Each facility gets a level (hospital, health centre, clinic), a source field, and a snap distance. Weak records are flagged.

- Community nodes from gridded population (for example 1 km cells) snapped to the nearest road node, with snap distance.

- Per-segment terrain features: elevation, slope, height above nearest drainage, flow accumulation, wetness index, distance to river, land cover, road class, bridge flag.

- Every dataset has a row in a data catalog: source URL, licence, date, native resolution, known gaps.

**Done when**: one command rebuilds all artifacts from raw downloads; the catalog is complete; a map of the pilot region shows roads, facilities and communities with sensible snapping, spot-checked by testers.

## F2. Scenario engine (P0 core, P1 extras)

**What**: creates and stores rainfall scenarios in the canonical form (D2).

- **Manual scenarios (P0)**: storm total in mm, duration in days, and a storm shape that decides how the total is spread over days (even, front-loaded, peak in the middle, back-loaded). A spatial pattern (uniform, gradient, or storm cell) and the preceding month (dry, normal, wet) map to documented antecedent values. The UI shows the resulting daily bars so the user sees exactly what the model receives.

- **Historical replay (P0)**: at least three past events with real rainfall (CHIRPS), used both as demos and as backtests. The number of events depends on the Day-2 gate (section 9).

- **Scenario library (P0)**: named, saved scenarios with plain descriptions.

- **Forecast scenario (P1)**: a free forecast converted into the same daily array (see F10).

- Every scenario gets a deterministic hash of its canonical form. The cache key is that hash plus model, data and engine versions.

**Done when**: a scenario is created through the API and the UI, validated (range checks, N at most 10, mm within the training range or clipped with a warning), stored, and replayable.

## F3. Flood exposure model, the ML core (P0)

**What**: estimates e_i for every segment given a scenario.

- Gradient-boosted trees (LightGBM) trained on past events. Features: static terrain and road features plus rainfall features derived from the daily array (peak 1-day, peak 3-day and peak 7-day totals, event total, antecedent 30-day rainfall, ratio to local climatology). Target: the D3 label.

- Monotonic constraints on rainfall features: more rain must never lower exposure probability. This is a correctness guarantee and a test.

- Probability calibration so e_i can be used in simulation, evaluated per event.

- Per-segment explanation: the model's native feature contributions (top three reasons).

- Model card: data, label definition, splits, metrics, evidence level, known failure modes.

- Versioned model artifact in storage; every API result reports the model version.

**Done when**: results against the baselines are reported (the model should win, and if it does not we report which baseline wins), the calibration plot is shown with its limits, and inference for the whole pilot region takes about one second.

## F4. Accessibility engine with uncertainty (P0)

**What**: converts closure probabilities into consequences for facilities and communities.

- Baseline run: travel time from every community to its nearest hospital and every facility's connection to the referral hub, with nothing closed.

- Monte Carlo run: draw N samples (default 200) of closed segments from c_i, remove them, recompute reachability and travel times.

- Per community: probability of being cut off, expected travel time, probability of degradation, and the baseline flag.

- Per facility: probability of isolation, estimated people affected, best surviving alternative route in the median sample.

- Per region: expected number of estimated people cut off, with a 10th to 90th percentile range.

- **Independent mode (P0)**: segments are drawn independently. The UI states that this understates joint failures.

- **Correlated mode (P1 early)**: a Gaussian-copula style draw. Each sub-catchment gets one shared random factor, each segment gets its own, and a correlation setting (default 0.5) mixes them. It is about twenty lines of code and gives a much more realistic picture of clustered closures.

- **Deterministic what-if (P0)**: the user can force segments closed or open by clicking them. This skips the model and uses the same engine. "Force open" is also the P0-lite mitigation test: protect this road and see how the numbers change.

**Done when**: unit tests pass on toy graphs with known answers, results are reproducible with a fixed seed, and one scenario runs within the time budget in section 6.

## F5. Impact ranking and explanation (P0)

- Priority score per D11, with range and the three raw components.

- Rank change versus baseline or versus another scenario (for example "Clinic X moved from rank 14 to rank 3").

- Why-explanation from computed facts only: the segments that contribute most to a location's isolation, found by comparing its isolation rate in samples where that segment closed against samples where it did not. Each segment's own reasons come from F3.

- Plain-language sentences by templates, not by a language model, so the text is free, fast, and cannot invent facts.

**Done when**: for any ranked location the UI shows score, range, raw components, top three contributing segments with reasons, and the alternative route if one exists.

## F6. Mitigation advisor (P0-lite, P1 full)

- **P0-lite**: the force-open what-if from F4, shown as a "Protect this road" button on a segment with before and after numbers.

- **P1**: reuse the samples. For each candidate segment set its closure to zero and measure the drop in expected people cut off. Greedy selection of the best k segments. Output: ranked list with estimated people protected and the caveat that it is model-based.

**Done when**: the list is stable across seeds, and a test confirms that protecting a segment never increases expected people cut off.

## F7. Interactive map and scenario comparison (P0)

- Map layers: roads coloured by exposure or closure probability, facilities coloured by isolation probability, community nodes sized by estimated population, optional terrain and rainfall layers, data-quality overlay (F13).

- Scenario panel: pick or build a scenario, run, and watch results appear. Shows the daily rainfall bars.

- Compare mode: baseline versus scenario, or scenario A versus B, with a swipe slider and a side-by-side metrics table.

- Facility drawer: isolation probability, catchment, alternative route, and the why-explanation.

- Ranking table synchronised with the map.

- Always-visible labels: model version, evidence level (D12), scenario hash, OpenStreetMap attribution, and the text "prioritization aid, not a forecast".

**Done when**: a tester can run the whole demo story (section 14) without developer help, on a mid-range phone and on a laptop.

## F8. Cascade replay timeline (P0-lite, P1 full)

- A time slider across the storm days. Each step shows four stages: rainfall accumulated, exposure probabilities, facility reachability, ranking.

- P0-lite: five precomputed steps per demo scenario, served as static files, so playback is instant and reliable on stage.

- P1: any user scenario can be replayed, computed asynchronously.

- A time-to-isolation estimate: on which day each facility's isolation probability passes 50 percent.

**Done when**: pressing play on a demo scenario shows a hospital turning from reachable to at-risk to isolated while the ranking reorders and the narration updates.

## F9. Exports and reports (P1; GeoJSON and CSV are P0-lite)

GeoJSON and CSV exports of results, plus a one-page situation report in PDF with the map, top ten locations, assumptions and the disclaimer.

## F10. Scheduled daily outlook and alerts (P1)

This is the equivalent of the daily Hangfire job in the CRM project.

- A scheduled job (EventBridge Scheduler) fetches a five-day rainfall forecast for the pilot region from Open-Meteo. Free limits are 10,000 calls per day and non-commercial use only \[checked at open-meteo.com/en/terms\]; attribution under CC BY 4.0 is required.

- It converts the forecast into a canonical scenario, runs the pipeline, stores the snapshot, and compares it with yesterday's: which facilities rose or fell in priority.

- If a facility crosses a configurable threshold, it sends an alert through Telegram and an in-app banner. Email is not used (section 7).

- A history chart shows how risk evolved over the past days.

- The forecast is optional. If it fails or its terms do not suit us, replay and manual scenarios still carry the product.

**Done when**: the job runs unattended for three consecutive days with logs and a metric in the dashboard.

## F11. Accounts, saved assessments and human review (P1)

- Public read-only mode for the demo and community viewers.

- Login for planners (Cognito): save scenarios, add notes, mark a location as assessed or needs inspection.

- Review status feeds the ranking view so assessed locations drop out of the to-do list.

## F12. Model evidence panel (P0, new)

A compact panel inside the product, fed by a static JSON file produced by the evaluation scripts. It shows: the selected historical event, observed versus predicted exposure on the map, comparison with the baselines, the headline metrics with intervals, the data versions, the evidence level, and the known limitations. This puts the ML rigor score in front of the judge in ten seconds.

## F13. Data quality flags (P0-lite, full layer P1, promoted)

- P0-lite: per-facility flags (source, snap distance), per-community flags (snap distance), and a per-area OSM road density index. Low-confidence areas are hatched on the map and the displayed confidence is lowered there.

- P1: richer layer, including areas with missing terrain features and weak historical coverage.

- Rule: the system must not claim a community is isolated with high confidence where the road data itself is probably incomplete.

# 5. Extended, optional, and improvable functions

Each is independent, so they can be added one at a time without touching the core.

## 5.1 Hazard framework (flood and landslide)

The impact engine never knows which hazard produced the numbers. It receives, for every segment, a closure probability plus metadata, through a fixed contract:

> HazardResult {
>
> hazard: "flood" \| "landslide"
>
> segment_closure_prob: float\[n_segments\] // c_i
>
> model_version, data_version
>
> evidence_level: "validated" \| "limited" \| "heuristic"
>
> label_type: "observed_flood_extent" \| "rule_based" \| ...
>
> }

Rules: each hazard has its own inputs, model and labels. A flood result is never fed into a landslide scenario or relabelled. The UI shows the hazard and evidence-level badge on every map.

**Landslide (P1, gate on October 26)**: a rule-based susceptibility mode using slope, land cover and a rainfall threshold, labelled **Heuristic, not validated**. It uses the same engine and costs about half a day once the contract exists. If a usable landslide inventory is found (for example the NASA Global Landslide Catalog \[verify Ethiopian coverage\]), it may later become a Limited or Validated module. If the gate is missed, the contract still exists and the pitch says landslide is the next module.

## 5.2 Extension list

- **E1. Landslide module (P1 heuristic, P2 validated)**: see 5.1.

- **E2. Catchment-correlated uncertainty (P1 early)**: the correlated mode in F4.

- **E3. Compound scenarios (P2)**: flood plus landslide, or two storms in sequence.

- **E4. Field verification loop (P2)**: inspectors report a segment as passable or impassable; reports become observed-closure labels, which is the first step toward validating the closure assumption. A retraining job compares the new model to the old one.

- **E5. Offline-first mobile app (P2)**: installable web app that caches the latest snapshot for poor connectivity.

- **E6. Amharic and Afaan Oromo interface (P1)**: translation files from day one so adding a language is data, not code.

- **E7. Shareable links (P1)**: a link that opens a specific scenario and view.

- **E8. Alternative facility finder (P1)**: for a cut-off community, the nearest functioning facility and surviving route.

- **E9. Open data API (P0-lite)**: documented endpoints, interactive API docs, example requests.

- **E10. Bridge and culvert criticality (P1)**: rank structures by how many people depend on them regardless of scenario.

- **E11. Seasonal risk calendar (P2)**: months when each corridor is most at risk.

- **E12. Retraining and drift monitoring (P2)**: scheduled evaluation on new events, model registry, drift report. The MLOps story for the Cloud and DevOps rubric.

- **E13. Facility capability data (P2)**: services offered (maternity, emergency) so a capable hospital weighs more than a small post.

- **E14. Pre-positioning planner (P2)**: where to stage supplies so most communities stay reachable.

- **E15. Sensitivity panel (P1, speeds, thresholds, closure factor k, label threshold X)**: shows how the ranking changes. Shows analytical honesty.

- **E16. Data-quality and coverage layer**: see F13.

- **E17. Natural-language scenario input**: excluded because a hosted language model is not free.

- **E18. Backtest gallery (P1)**: replays past events and shows predicted versus observed exposure side by side. The P0 version is the evidence panel (F12).

- **E19. Hazard plug-in contract (P0 design)**: section 5.1.

- **E20. New-region onboarding (P2)**: one command that builds all artifacts for another region, which is how the Ethiopia-wide ambition is reached without claiming it on day one.

# 6. Non-functional requirements

These are measurable on purpose. Targets are goals until the load test in section 13 confirms them.

- **Performance**: a cached scenario returns in under 1 second; a new scenario on the pilot region completes in under 20 seconds at the 95th percentile (goal about 8 seconds including 200 samples); the map stays smooth with about 30,000 visible segments; first page load under 3 seconds on a 4G connection.

- **Correctness and reproducibility**: results are seeded and reproducible from scenario hash, model version, data version and engine version. Property tests: removing roads never makes a trip faster; more rain never lowers exposure probability (monotonic constraints); protecting a segment never increases expected people cut off.

- **Reliability**: the scenario flow is asynchronous and idempotent (the same cache key never computes twice). Failed jobs retry with backoff, then show a clear error. If the worker fails, the UI falls back to the last cached result with a visible banner. Precomputed demo scenarios are static files and always load, even if the compute path is down.

- **Security**: least-privilege IAM role per function; private buckets served only through CloudFront; no secrets in the repository (Parameter Store and encrypted CI secrets); GitHub Actions deploys through an OIDC role, never stored keys; secret scanning (gitleaks) and dependency scanning in CI; cdk-nag on the infrastructure; strict input validation; locked-down CORS; API Gateway stage throttling and a reserved-concurrency cap on every function so abuse cannot become a bill.

- **Cost discipline**: stay inside free allowances; no NAT gateway, no VPC unless unavoidable, no managed relational database, no always-on server. Log retention 7 to 14 days. A budget alarm with a small threshold is created by the infrastructure code and tested by temporarily lowering the threshold. DynamoDB uses a small provisioned capacity inside the always-free allowance \[verify\]. Remember that a budget alert notifies; it does not stop spending, so the throttles above are the real control.

- **Observability**: structured JSON logs with a request ID; a CloudWatch dashboard with request count, error rate, p95 duration, cache-hit ratio, job age and model version; alarms on error rate and budget. Keep custom metrics within the free allowance of about ten \[verify\].

- **Maintainability**: one monorepo with modules (data pipeline, ml, engine, api, infra, web), type hints, linting, tests, short decision records (ADRs) for non-obvious choices, and conventional commit messages. Commit history is part of the judging, so commit small and often from Day 1.

- **Usability and accessibility**: works on a phone; colour-blind-safe palette; plain labels; every chart has a text summary; all user-facing strings live in translation files.

- **Honesty and explainability**: uncertainty is always visible; an assumptions panel lists speeds, thresholds, k and the label definition; a model card is one click away; every number carries the right name from section 1.2; no claim of validated accuracy beyond what held-out tests show.

- **Data governance**: licence and attribution tracked in the data catalog; OpenStreetMap, WorldPop, WorldCover and Open-Meteo attributions visible; no personal data collected (population is aggregated to grid cells).

- **Teardown**: one documented command removes all cloud resources, including buckets with contents and ECR images, so nothing is orphaned (rubric item). Tested at least once before submission.

# 7. Technology stack, with a free check

Rule from the CRM project: a tool is acceptable only if it is free for the way we use it, not just free to sign up. For each tool we check limits, card requirements, and what happens when the free period ends. Anything that fails is out.

| **Layer**                          | **Choice**                                                                                                                           | **Free check**                                                                                                                                                                                                                                                                                                |
|------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Backend language                   | Python 3.12 on AWS Lambda (arm64). API function: FastAPI with the Mangum adapter, zip package.                                       | Lambda has an always-free allowance (1 million requests and 400,000 GB-seconds per month) \[verify current\]. Lambda is on the new Free plan list \[checked\].                                                                                                                                                |
| Worker                             | **Lambda container image from ECR** with Python, NumPy, SciPy and LightGBM. Loads prepared artifacts, runs inference and the engine. | Container images up to 10 GB are supported. ECR is on the Free plan list \[checked\]; keep one small image and a lifecycle rule that deletes old images.                                                                                                                                                      |
| ML                                 | LightGBM, NumPy, scikit-learn for calibration and metrics                                                                            | Open source. Training runs locally.                                                                                                                                                                                                                                                                           |
| Graph analysis                     | SciPy sparse-graph routines                                                                                                          | Open source.                                                                                                                                                                                                                                                                                                  |
| Data pipeline                      | Python with pyrosm or osmium, rasterio, geopandas, pysheds or WhiteboxTools                                                          | Open source. Runs locally and in GitHub Actions, never in Lambda.                                                                                                                                                                                                                                             |
| Object storage                     | Amazon S3 for artifacts, tiles, results, static site                                                                                 | On the Free plan list \[checked\]. Not always-free on all accounts; target under 2 GB \[verify\].                                                                                                                                                                                                             |
| Database                           | DynamoDB for jobs, scenarios, notes, history                                                                                         | On the Free plan list \[checked\]. Always-free storage allowance \[verify\].                                                                                                                                                                                                                                  |
| API entry                          | **API Gateway HTTP API** in front of the API Lambda                                                                                  | On the new Free plan list \[checked\]. Note that AWS says the new sign-up experience is still rolling out to a limited number of customers, so confirm on our actual account (Day-1 check). Replaces v0.1's Lambda URL plus CloudFront OAC design, which needs extra payload-hash handling for POST requests. |
| Static site, tiles, cached results | S3 plus CloudFront (private bucket, origin access control, GET only)                                                                 | CloudFront is on the Free plan list \[checked\].                                                                                                                                                                                                                                                              |
| Async work                         | API Lambda invokes the worker asynchronously and writes a job row                                                                    | No extra service.                                                                                                                                                                                                                                                                                             |
| Scheduling (P1)                    | EventBridge Scheduler                                                                                                                | EventBridge is on the Free plan list \[checked\].                                                                                                                                                                                                                                                             |
| Auth (P1)                          | Amazon Cognito user pool                                                                                                             | On the Free plan list \[checked\]; monthly-active-user allowance \[verify\].                                                                                                                                                                                                                                  |
| Secrets                            | Systems Manager Parameter Store (standard)                                                                                           | Systems Manager is on the Free plan list \[checked\].                                                                                                                                                                                                                                                         |
| Infrastructure as code             | AWS CDK in Python                                                                                                                    | Open source. Bootstrap creates a small bucket and roles. CloudFormation is on the list \[checked\].                                                                                                                                                                                                           |
| CI/CD                              | GitHub Actions with an OIDC role (no stored AWS keys)                                                                                | Free standard runners for public repositories \[verify\]. The handbook requires a public repo anyway.                                                                                                                                                                                                         |
| Pipeline security                  | gitleaks, cdk-nag, pip-audit, Dependabot                                                                                             | Open source.                                                                                                                                                                                                                                                                                                  |
| Monitoring and budget              | CloudWatch logs, dashboard, alarms; AWS Budgets with email notification                                                              | Both on the Free plan list \[checked\]. The handbook requires a budget alarm.                                                                                                                                                                                                                                 |
| Frontend                           | React, TypeScript, Vite, Tailwind, TanStack Query; typed client generated from the OpenAPI file                                      | Open source.                                                                                                                                                                                                                                                                                                  |
| Map                                | MapLibre GL JS with PMTiles files in our own bucket; basemap from a Protomaps extract of Ethiopia                                    | Open source and free. Do not use the public OpenStreetMap tile server for the app (usage policy), and do not use Mapbox or Google Maps (card and quota requirements). Fallback if the basemap fails: plain background with our own road vectors.                                                              |
| Alerts                             | Telegram Bot API plus in-app banner                                                                                                  | Free, no per-message fee.                                                                                                                                                                                                                                                                                     |
| Rainfall archive                   | CHIRPS daily (about 5.5 km)                                                                                                          | Public domain \[verify wording on the CHIRPS page\].                                                                                                                                                                                                                                                          |
| Rainfall forecast (P1, optional)   | Open-Meteo                                                                                                                           | Free for non-commercial use, up to 10,000 calls per day, CC BY 4.0 \[checked\].                                                                                                                                                                                                                               |
| Elevation                          | Copernicus DEM 30 m, with SRTM or the 90 m DEM as a tested fallback                                                                  | Free; access to the 30 m product has restrictions in some services \[verify\]. Do not depend on one source.                                                                                                                                                                                                   |
| Land cover                         | ESA WorldCover                                                                                                                       | CC BY 4.0 \[verify\]. Attribution required.                                                                                                                                                                                                                                                                   |
| Population                         | WorldPop                                                                                                                             | CC BY 4.0 \[verify\]. Modelled estimates, not a census.                                                                                                                                                                                                                                                       |
| Tester feedback                    | Google Forms and GitHub Issues                                                                                                       | Free.                                                                                                                                                                                                                                                                                                         |
| Testing                            | pytest, hypothesis, vitest, Playwright, k6                                                                                           | Open source.                                                                                                                                                                                                                                                                                                  |

**Deliberately avoided, and why**

- **Email sending and receiving**: the CRM lesson. The AWS email service starts in a sandbox that only sends to verified addresses, the same trap as the free Resend plan, even though it appears on the Free plan service list. Alerts use Telegram and the in-app banner. If email is ever added, it goes through a path tested end to end with a non-owner recipient.

- **Hosted language models, SageMaker endpoints, RDS or Aurora, OpenSearch, managed web firewall, NAT gateways**: not free at our scale (some appear on the Free plan list, but they bill against credits). We train locally and ship the model file inside the worker image.

- **Anything that needs a credit card to unlock the free tier**, unless the team has agreed in writing to accept it.

> **AWS account rule**: sources from 2026 describe a Free plan and a Paid plan for new accounts, with credits and a six-month limit \[verify exact numbers on our account\]. Use the Free plan for the hackathon. The account must be owned by someone eligible to accept the AWS terms, or provided by the organizers; the team gets IAM access. On Day 1, deploy a hello-world stack and confirm every service we plan to use works on that plan, including one browser POST through API Gateway.

# 8. Architecture

A drawn diagram is a required deliverable. It is produced once the stack is deployed and must show data ingestion, the inference boundary, request routing, IAM roles and storage. This section is the specification it follows.

## 8.1 Flow

**Build time (offline, reproducible)**

- The data pipeline downloads raw data, builds the road graph, facility and community tables, segment features and map tiles, and trains the model. Outputs are versioned folders in the artifact bucket (graph arrays, segment features, model file, calibration table, model card, evaluation JSON, tiles, data catalog).

**Run time**

- The browser loads the static app from CloudFront and map tiles from our bucket with HTTP range requests.

- The user creates a scenario. API Gateway passes it to the API function, which validates it, builds the cache key (scenario hash plus model, data and engine versions), and checks the cache.

- Cache hit: it returns the result location immediately. Cache miss: it writes a job row (queued), invokes the worker asynchronously, and returns a job ID.

- The worker (container image) loads artifacts (kept warm in memory between invocations), derives rainfall features from the daily array, runs model inference, closure assumption, Monte Carlo engine, ranking and explanations, writes the result to S3, and marks the job done.

- The browser polls the job, fetches the result, and colours vector tiles by segment ID without re-downloading geometry.

- (P1) A daily scheduled function fetches the forecast, runs the same pipeline, compares with yesterday, stores the snapshot, and sends alerts.

- Every function writes structured logs to CloudWatch; a dashboard and alarms watch errors, latency and cost; the budget alarm notifies the team.

- On every push, GitHub Actions lints, tests, synthesises the infrastructure, runs security checks, builds and pushes the worker image, deploys through the OIDC role, and runs a smoke test against the live URL.

**Infrastructure stacks (CDK)**: Data (buckets, tables, ECR repository), Api (API Gateway, functions, roles), Web (static hosting and CDN), Observability (dashboard, alarms, budget), Scheduler (P1), Auth (P1). Each deploys alone and one command destroys everything.

**Decision record (no VPC)**: the handbook diagram asks for network routing and security boundaries. We deliberately run without a VPC to avoid NAT cost. The boundaries are IAM roles per function, private buckets with CloudFront origin access control, API throttling, and no public write paths. This goes in an ADR and on the diagram.

## 8.2 API contract (write the OpenAPI file first)

Anon generates a typed client and mocks the server from this file on Day 1. All responses carry hazard, versions and evidence level. Fields below are the minimum; add fields, never rename them after Day 2.

**Endpoints**

- GET /health, GET /meta (versions, region, data catalog), GET /regions, GET /hazards

- GET /scenarios/library, POST /scenarios (create and run), GET /jobs/{id}

- GET /results/{cache_key} (summary and ranking), GET /results/{cache_key}/segments

- GET /facilities/{id}/explain, POST /whatif (forced open or closed), GET /compare?a=&b=

- GET /backtests, GET /model-card

- P1: GET /outlook/latest, POST /mitigation, export endpoints

**Scenario (request body of POST /scenarios)**

> {
>
> "hazard": "flood",
>
> "region_id": "pilot_01",
>
> "start_date": "2026-10-25",
>
> "daily_rain_mm": \[5, 40, 60, 20, 0\],
>
> "antecedent_30d_mm": 120,
>
> "spatial": { "type": "uniform" \| "gradient" \| "cell", "params": {} },
>
> "closure_factor": 1.0,
>
> "failure_mode": "independent" \| "correlated",
>
> "n_samples": 200,
>
> "seed": 42,
>
> "forced_closed": \[\], "forced_open": \[\]
>
> }

**Job**

> { "job_id": "...", "status": "queued\|running\|done\|failed", "cache_key": "...",
>
> "submitted_at": "...", "error": null \| { "code": "...", "message": "..." } }

**Result summary**

> { "cache_key": "...",
>
> "versions": { "model": "...", "data": "...", "engine": "..." },
>
> "hazard": "flood", "evidence_level": "validated\|limited\|heuristic",
>
> "scenario": { ...echo of the canonical scenario... },
>
> "region_totals": { "people_cut_off": { "mean": 0, "p10": 0, "p90": 0 } },
>
> "ranking": \[ FacilityImpact, ... \] }

**SegmentRisk and FacilityImpact**

> SegmentRisk { "segment_id", "exposure_prob", "closure_prob",
>
> "top_reasons": \[ { "feature", "contribution" } \], "quality_flag" }
>
> FacilityImpact { "facility_id", "name", "level", "p_isolation", "p10", "p90",
>
> "people_affected_est", "baseline_minutes", "poor_baseline_access",
>
> "alt_route": { "minutes", "segment_ids" } \| null,
>
> "rank", "rank_delta", "snap_distance_m", "source", "quality_flag" }

**Error (all endpoints)**

> { "error": { "code": "VALIDATION_ERROR", "message": "...", "field": "daily_rain_mm", "request_id": "..." } }

# 9. Data plan

Every row is a candidate until the Day-1 audit confirms coverage, licence and usable resolution.

| **Need**               | **Candidate source**                                                                                                                                                                                                                    | **Native resolution**                                                                                                            | **Licence**                                                                                                 | **Main risk**                                                                                           |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Roads                  | OpenStreetMap, Geofabrik Ethiopia extract                                                                                                                                                                                               | Vector                                                                                                                           | ODbL: attribution; share-alike for derived databases                                                        | Rural completeness uneven; surface and bridge tags sparse                                               |
| Facilities             | OpenStreetMap plus a health-facility dataset from a humanitarian data portal                                                                                                                                                            | Points                                                                                                                           | Check each \[verify\]                                                                                       | Incomplete; level may need manual classification by testers                                             |
| Population             | WorldPop gridded estimates                                                                                                                                                                                                              | About 100 m to 1 km \[verify\]                                                                                                   | CC BY 4.0 \[verify\]                                                                                        | Modelled, not counted; snapping error                                                                   |
| Elevation              | Copernicus DEM 30 m, SRTM or 90 m fallback                                                                                                                                                                                              | 30 to 90 m                                                                                                                       | Free with attribution \[verify\]                                                                            | Too coarse to see culverts; 30 m access limits                                                          |
| Terrain features       | Computed from the DEM                                                                                                                                                                                                                   | DEM resolution                                                                                                                   | Derived                                                                                                     | Compute time; limit to the pilot basin                                                                  |
| Rainfall archive       | CHIRPS daily                                                                                                                                                                                                                            | About 5.5 km                                                                                                                     | Public domain \[verify\]                                                                                    | Many segments share one rainfall value                                                                  |
| Rainfall forecast (P1) | Open-Meteo                                                                                                                                                                                                                              | Model grid                                                                                                                       | CC BY 4.0, non-commercial \[checked\]                                                                       | Forecast, not gauge data                                                                                |
| Land cover             | ESA WorldCover                                                                                                                                                                                                                          | 10 m                                                                                                                             | CC BY 4.0 \[verify\]                                                                                        | Classes are coarse                                                                                      |
| Flood event labels     | Global Flood Database (events 2000 to 2018, MODIS), Dartmouth Flood Observatory archive for the event list, emergency-mapping extents for later events, humanitarian data portal extents, or our own extents from free Sentinel-1 radar | About 250 m for the Global Flood Database \[checked; the catalog page also lists 30 m for the bands, so read the actual raster\] | **Global Flood Database is CC BY-NC 4.0 \[checked\]**: fine for the hackathon, not for a commercial product | **Make-or-break**: few events, coarse resolution (wider than a road), nothing after 2018 in that source |
| Flood hazard maps      | Global river flood hazard maps by return period                                                                                                                                                                                         | Varies                                                                                                                           | Check \[verify\]                                                                                            | Coverage and licence                                                                                    |

## 9.1 Resolution rules for wording

- Rainfall is about 5.5 km. Do not show road-level rainfall precision; the UI says "rainfall at about 5 km".

- Flood labels at about 250 m are wider than a road. They give exposure evidence, so the model output is called exposure (section 1.2).

- Terrain at 30 to 90 m cannot see culverts or small drainage. Say so in the model card.

## 9.2 Label strategy

- List all candidate events for Ethiopia and neighbouring countries from the Dartmouth archive and the Global Flood Database (2000 to 2018), then add newer events from emergency-mapping and humanitarian extents. Keep a table: event ID, dates, country, source, extent resolution, licence, usable yes or no.

- Overlay each extent on road segments and apply the D3 rule with a documented X. Run a sensitivity check on X.

- Draw negative examples from a buffer around the event footprint (nearby segments that stayed dry), not from the whole country, so the task is realistic. The buffer size is documented and tested for sensitivity, because it shapes what the model learns.

- Train on the wider region for volume. Keep Ethiopian events as the test set where possible.

- Rainfall varies across space within one event (many CHIRPS cells), so a handful of events still gives more than a handful of rainfall values. Do not over-claim from this.

> **Decision gate, evening of October 23**: count usable events. Six or more usable, with at least three in Ethiopia: continue with the full plan. Fewer: switch to the matching rung of the fallback ladder in section 15 and say so in the README.

**Pilot region criteria**: at least three documented floods with extents; a road network large enough to be interesting (hundreds of segments after simplification) with at least ten facilities; recurrent floods with real access consequences. Candidates to audit: the Awash basin, the Baro-Akobo area in Gambella, and the Shabelle or Genale areas in the Somali region \[verify\]. The choice is made by data availability, not preference.

# 10. Machine learning plan and evaluation

## 10.1 Formulation

Tabular binary classification per segment per event, predicting flood exposure (D3). Static features: elevation, slope, height above drainage, flow accumulation, wetness index, distance to river, land cover, road class, surface, bridge or culvert flag, length. Dynamic features, all derived from the canonical daily rainfall array: peak 1-day, 3-day and 7-day totals, event total, antecedent 30-day rainfall, and the ratio to local climatology.

## 10.2 Model and baselines

- **Model**: LightGBM with monotonic constraints on rainfall features, followed by probability calibration.

- **Baseline B0**: a height-above-drainage threshold rule.

- **Baseline B1**: logistic regression on five features.

- **Baseline B2**: look up the segment in a global flood hazard map.

- The model should beat all three. If it does not, we say so and report which baseline wins.

## 10.3 Splits

Primary: **leave-one-event-out**. Secondary: spatial block cross-validation (hold out whole sub-catchments), and leave-one-region-out when several regions exist. Random splits are not allowed because neighbouring segments share labels and inflate scores. Keep one event completely out of every tuning decision where the count allows; if there are too few events, say that the evaluation is exploratory.

## 10.4 Metrics

Precision-recall AUC (classes are imbalanced), recall at a fixed precision, ROC AUC, Brier score, and a calibration curve. Calibration matters most because the probabilities drive the simulation. Report per-event results and bootstrap intervals over events. With few events the intervals will be wide, and the report shows them anyway.

## 10.5 End-to-end evaluation

For held-out events, take the observed flood extent as the failure set and compute the observed facility isolation and community cut-off (this is an observed-exposure proxy, not observed closure). Compare with the system's predicted isolation probabilities: AUC and rank correlation across facilities, for the ML model and for baseline B0. This is the number that justifies the product, because segment accuracy alone does not show that the consequences were right.

## 10.6 What we can claim

| **We may say**                                                      | **Only if**                                                 | **We never say**                                             |
|---------------------------------------------------------------------|-------------------------------------------------------------|--------------------------------------------------------------|
| "Estimated flood exposure probability per road segment."            | Held-out event metrics exist.                               | "Probability the road will fail" or "will be impassable".    |
| "If these segments close, X estimated people lose hospital access." | The engine passes its tests; closure assumption k is shown. | "X people will be cut off."                                  |
| "Better than a terrain-only rule."                                  | The comparison with B0 is reported with intervals.          | "Accurate to N percent" beyond what the held-out tests show. |
| "Validated"                                                         | Evidence level is Validated (D12).                          | "Validated" for the landslide heuristic.                     |

## 10.7 Ablations and sensitivity

ML versus baselines; independent versus correlated failures; number of samples (a convergence plot should show results settle by about 200); the label threshold X; the negative-sample buffer; the closure factor k; speed assumptions; OpenStreetMap completeness. Results appear in the sensitivity panel (E15).

## 10.8 Edge cases to document and test

Disconnected graph components; a facility too far from any road to snap; zero rainfall; rainfall beyond the training range (clip and warn); missing road class; a facility that is cut off at baseline; a tiny region with few segments; a scenario longer than 10 days; forced-open and forced-closed lists that overlap.

## 10.9 Benchmarks to publish in the README

Inference time, engine time per 200 samples, cold-start time of the container worker, memory used, cache-hit latency, and the cost per 1,000 scenarios.

## 10.10 Honest framing of what the model learns

With a handful of events, the model mostly learns where floods happen (terrain and drainage) and only weakly learns how exposure grows with rainfall. We say this in the model card. We keep the monotonic constraint so behaviour is sensible, show the sensitivity of the result to rainfall in the evidence panel, and describe the output as susceptibility scaled by rainfall rather than a full rainfall-response model. This is stronger in front of judges than pretending the rainfall response is well identified.

## 10.11 Data hygiene and documentation (handbook requirement)

The repository documents data sources, preprocessing routines and training scripts: /data/README.md and the data catalog (sources, licences, dates), /ml/prepare_labels.py, /ml/features.py, /ml/train.py, /ml/evaluate.py, and a model card. All pre-existing libraries and data are listed with licences. All core code and infrastructure definitions are written during the hackathon period.

## 10.12 Known limitations (stated in the model card)

Flooded is a proxy for impassable. Few labelled events and none after 2018 in the main source. Label resolution wider than a road. Rainfall at about 5.5 km. OpenStreetMap gaps in rural areas. Static terrain with no hydrodynamic modelling. No knowledge of road repair or closure status. Facilities assumed open. Population is a modelled estimate. Independent failure draws in v1. Rainfall response weakly identified (10.10). Stating these openly is a strength with judges, not a weakness.

# 11. Team, ownership and interfaces

| **Person**           | **Role**                                      | **Owns**                                                                                                                       | **Keep away from**                                    |
|----------------------|-----------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------|
| Dagim                | Project lead, backend and ML                  | Data pipeline, model and evaluation, engine, API, worker, infrastructure code, CI/CD, AWS account setup                        | Pixel-level UI work                                   |
| Anon                 | Frontend lead                                 | Map, scenario panel, compare mode, drawers, ranking table, model-evidence panel, typed client, mock API, performance on phones | Model and engine internals                            |
| Yagi                 | Support developer (small, well-bounded tasks) | Items listed below, each with a clear done condition and a reviewer                                                            | Anything on the critical path (model, engine, deploy) |
| Testers (non-coders) | Product testing and feedback                  | Scripted test rounds, data spot checks, demo rehearsal audience                                                                | n/a                                                   |

## 11.1 Tasks for Yagi (each is small and independent)

- **Data catalog**: fill one row per dataset (source URL, licence, attribution text, resolution, known gaps) from the links Dagim provides. Done when every dataset in section 9 has a complete row.

- **Translation files**: create the English string file from the UI text list Anon provides, then Amharic after review by a native speaker. Done when the UI has no hard-coded strings.

- **README skeleton and glossary**: headings from section 17, plus plain definitions of exposure, assumed closure, access loss, evidence level.

- **Assumptions and limitations pages**: static pages in the app, text taken from sections 10.10 and 10.12, built with Anon's components.

- **Facility classification sheet**: a spreadsheet of facilities with a level column to confirm or correct, shared with testers.

- **Tester operations**: build the Google Form, create GitHub Issue labels (bug, confusing, data-error), and collect results into one list.

- **Simple k6 script** for the cached GET path, copied from a template Dagim provides.

## 11.2 Tasks for testers

- **Snapping spot-check** (after F1): look at 30 facilities and 30 communities on the map and mark any that sit in the wrong place.

- **Thirty-second test** (rounds on October 25 and 27): for each screen, can a new person answer the matching question from section 2 in thirty seconds? Record yes or no and where they got stuck.

- **Break it session**: try bad inputs, back button, phone, slow network. Report in the form.

- **Feedback form (five questions)**: What did you think the colours meant? What number did you trust least? What was missing? Would you use this and for what? What was confusing?

- **Demo rehearsal audience** on October 30 and 31.

## 11.3 Working agreements

- Contract first: the OpenAPI file in section 8.2 is the shared agreement; changes are announced and versioned.

- Short branches, pull requests with one reviewer, conventional commit messages, commits from every person (history is judged).

- Fifteen-minute sync every day at a fixed time; a written status line per person in the team chat.

- No one works on the same file as someone else without saying so first.

# 12. Delivery plan

Dates follow the handbook. Mentor checkpoints are included so each one has something to show. Today is the 23rd in your time zone, so the Day-1 work from the 22nd is finished first thing this morning.

| **Day** | **Dagim** | **Anon** | **Yagi and testers** | **Exit check** |
|---|---|---|---|---|
| **Oct 22 to 23 (Day 1)**<br>Checkpoint 1 (Oct 21 to 22) | Freeze definitions (section 3). Write the OpenAPI file. Create repo, CI skeleton. Confirm AWS account owner and plan. Create budget alarm. Run the Day-1 checks in section 16. Start the event audit. | Scaffold app with the generated typed client and a mock server. Load a placeholder map from PMTiles. | Data catalog rows. README skeleton. Tester form. | Budget alarm exists. Hello-world deployed by CI. One browser POST works through API Gateway. |
| **Oct 23 (Day 2)** | Finish event audit and **decision gate** (evening). Choose pilot region. Build road graph, facilities, communities. CDK stacks for data and API. Worker container builds and runs. | Map with real roads and facilities. Scenario panel on mock data. | Facility classification sheet. Translation strings. | Gate decided and written down. Real graph on the map. |
| **Oct 24 (Day 3)**<br>Checkpoint 2 (Oct 23 to 24) | Terrain features and labels. B0 and B1 baselines. Engine on toy graphs with tests. Deterministic what-if. | Ranking table, facility drawer on mock results. Daily rainfall bars. | Snapping spot-check. | Labels built. Engine tests pass. IaC deploys from CI. |
| **Oct 25 (Day 4)**<br>Checkpoint 3 (Oct 25 to 26) | Train LightGBM, calibration, leave-one-event-out evaluation. Wire model into the worker. Monte Carlo on real graph. Security audit tools in CI. | Connect to the real API. Compare mode. Evidence panel layout. | Tester round 1 on whatever is live. | Scenario runs end to end on the live URL (even if the model is rough). |
| **Oct 26 (Day 5)** | Ranking and explanations. Precompute demo scenarios and five-step cascade. CloudWatch dashboard and alarms. Evidence JSON. Landslide heuristic **gate**. Correlated mode if on schedule. | Cascade playback. Data-quality overlay. Phone performance. | Fix list from round 1. Assumption and limitation pages. | Everything in P0 works. Feature list is frozen at the end of the day, except the cut-line below. |
| **Oct 27 (Day 6)**<br>Checkpoint 4 (Oct 27 to 28) | Load test. Teardown test (destroy and redeploy). Model card. README metrics. Architecture diagram. Secret scan clean. Fallback checks. | Bug fixes only. Final polish. Accessibility pass. | Tester round 2. Screen-record the demo video draft. | Code freeze in the evening. Demo video recorded. |
| **Oct 28 (Day 7)** | Final deploy from CI. Verify live URL from another network. Submission package assembled. | Smoke test on phone and laptop. | Checklist review (section 17). | **Submit by midday**, leaving the rest of the day as buffer. The handbook gives no time of day, so do not run it close. |
| **Oct 29 to 31** | P1 upgrades chosen by the order in section 12.2. Pitch rehearsal. | Pitch demo flow. | Rehearsal audience. | Finalist stage ready. |

## 12.1 P0 scope (final)

One pilot region. Flood only. F1; F2 (manual scenarios, replays, library); F3 with B0 and B1 baselines and B2 if the hazard map is available; F4 independent mode and deterministic what-if; F5; F6 what-if; F7; F8 with five precomputed steps; F12 evidence panel; F13 flags; E9 API docs; GeoJSON and CSV export; and all cloud deliverables in section 17.

## 12.2 Cut-line (what to drop first if behind)

Drop in this order, from the top:

- Correlated failure mode (keep the label that independent mode understates joint risk).

- Compare mode swipe slider (keep the side-by-side table).

- Data-quality overlay (keep the flags in the facility drawer).

- Cascade replay beyond one demo scenario.

- Baseline B2 (hazard-map lookup).

- Multiple replays (keep two, minimum).

Never drop: the deployed pipeline, the baselines B0 and B1, leave-one-event-out evaluation, the evidence panel, the budget alarm, IaC, CI/CD, teardown, the README, the diagram and the demo video. Those are the rubric.

**P1 order after submission**: correlated mode, landslide heuristic, mitigation list, forecast and Telegram alert, PDF report, accounts.

# 13. Load and performance test plan

The point is evidence for the "end-to-end integration" and "cost discipline" scores, and a protection against a surprise on stage.

- **Tool**: k6, run from a laptop against the live URL, with the scripts committed in /tests/load.

- **Scenarios**: (1) cached GET /results at 20 requests per second for 2 minutes; (2) new unique scenarios, 1 per second for 2 minutes, to exercise cold starts and the worker; (3) mixed, with a burst of 10 simultaneous new scenarios to test queueing and the concurrency cap; (4) invalid input flood, to confirm throttling and clean errors.

- **Measure**: p50 and p95 latency per endpoint, error rate, worker cold-start time, memory used, job queue age, cache-hit ratio.

- **Targets** (from section 6): cached under 1 second; new scenario p95 under 20 seconds; error rate under 1 percent under normal load; throttled requests return a clear 429, not a crash.

- **Cost estimate**: convert measured worker duration and memory into GB-seconds and publish the cost per 1,000 scenarios in the README. Confirm it is inside the free allowance.

- **Protection**: stage throttling in API Gateway and reserved concurrency stay on during tests. After the tests, confirm in the billing view that nothing unexpected appeared.

- **Output**: a results table and a short paragraph in the README, with a screenshot of the CloudWatch dashboard during the test.

# 14. Demo story and pitch

## 14.1 Mapping to the finalist structure (5 to 7 minutes, plus 3 for questions)

| **Handbook block** | **Time** | **What we show and say**                                                                                                                                                                                                                                                                                                        |
|--------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Hook and problem   | 1 min    | A flood does not only damage roads. It cuts clinics off from hospitals. Planners today have a flood map but not an access map. Name the persona (regional planner or health coordinator) and the question they cannot answer.                                                                                                   |
| Intelligent core   | 2 min    | Why ML: the graph engine cannot say which roads flood. The model estimates flood exposure from rainfall and terrain, was tested on held-out events, and beats a terrain-only rule. Show the evidence panel: observed versus predicted on a past event. State plainly what it predicts (exposure) and what is assumed (closure). |
| Cloud backbone     | 1.5 min  | Architecture diagram: API Gateway, Lambda worker in a container, S3, DynamoDB, CloudFront, CDK, GitHub Actions with OIDC, least-privilege roles, CloudWatch, budget alarm, one-command teardown.                                                                                                                                |
| Live demonstration | 2 min    | Script below.                                                                                                                                                                                                                                                                                                                   |
| Impact and roadmap | 0.5 min  | Next: landslide module, correlated failures, field verification, Amharic and offline use, more regions. Cost forecast from the load test.                                                                                                                                                                                       |

## 14.2 Live demo script (about 2 minutes, rehearsed)

- Open the live URL. Say the evidence badge and the disclaimer once.

- Pick the replay event \[Event A\]. Press run; roads colour by exposure probability.

- Click the highest-ranked hospital or clinic. Show isolation probability, range, estimated people, the top three contributing segments, and the alternative route.

- Press play on the cascade: the facility goes from reachable to at-risk to isolated, and the ranking reorders.

- Use "Protect this road" on the top segment. Show the before and after numbers.

- Switch to compare: baseline versus scenario.

- Open the Model evidence panel for one sentence on the held-out result.

- End on the CloudWatch dashboard or the GitHub Actions run (ten seconds).

## 14.3 Fallbacks for the stage

- The demo scenarios are precomputed static files and load even if the compute path is down.

- The recorded 2 to 3 minute video covers the same path, plus the AWS Console and CloudWatch logs (a handbook requirement).

- A local copy of the front end with cached results, ready on the laptop.

- Test screen sharing and the network on October 31 (technical rehearsal).

## 14.4 Questions to prepare for

| **Likely question**                  | **Short answer**                                                                                                                                                        |
|--------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Is a flooded road really closed?     | No. We predict exposure, and the closure step is an explicit, adjustable assumption (default worst case). Field verification is the roadmap item that would test it.    |
| Why ML rather than a flood map?      | A hazard map is one baseline and we compare against it. Our model uses rainfall for a given scenario and is tested on held-out events. \[Fill in the measured result.\] |
| How many events did you train on?    | State the real number and the intervals. Say the evidence level.                                                                                                        |
| What if OpenStreetMap is incomplete? | We flag low-density areas and lower displayed confidence there.                                                                                                         |
| What does it cost to run?            | Cost per 1,000 scenarios from the load test, inside the free allowance, with a budget alarm and throttles.                                                              |
| How do you stop surprise bills?      | Throttling, reserved concurrency, no always-on services, budget alarm, one-command teardown.                                                                            |
| What about landslides?               | The engine is hazard-agnostic. The landslide mode is a labelled heuristic today and becomes validated when labels exist.                                                |

# 15. Fallback ladder

## 15.1 Data and model fallbacks

Choose the rung at the October 23 gate, and again on the 25th if training disappoints. Say which rung we are on in the README and in the evidence badge.

| **Rung** | **Condition**                                                                                                                      | **What we do**                                                                                                                                                                                                                                      | **Evidence level**        |
|----------|------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------|
| **L0**   | Six or more usable events, at least three in Ethiopia.                                                                             | Full plan: leave-one-event-out, calibration, end-to-end test.                                                                                                                                                                                       | Validated, with intervals |
| **L1**   | Three to five usable events.                                                                                                       | Train on events from neighbouring countries too. Report per-event results without pretending to precision. Say "limited validation".                                                                                                                | Limited                   |
| **L2**   | Fewer than three events, but a flood extent union or frequency layer exists (for example a maximum extent or surface-water layer). | Train a static flood-susceptibility classifier with spatial block cross-validation. Scale by rainfall using a documented rule and sensitivity analysis. State plainly that the rainfall response is not learned.                                    | Limited                   |
| **L3**   | No usable observed extents in time.                                                                                                | Train on flood hazard map classes as soft labels, labelled "learned from hazard maps, not observed floods", and show B0 beside it. The ML score is at risk here, which is why the gate exists and why mentors should hear about it at Checkpoint 2. | Heuristic                 |

## 15.2 Infrastructure and product fallbacks

| **If this breaks**                      | **Do this**                                                                                                                                |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| API Gateway unavailable on our plan     | Lambda function URL for the API with a CloudFront distribution as before, after a POST test with the payload-hash header. Decide on Day 1. |
| Container worker too slow on cold start | Raise memory, use provisioned warm-up through a scheduled ping within the free allowance, and precompute demo scenarios.                   |
| Container build trouble                 | Fall back to a zip package with a Lambda layer, after checking the 250 MB limit.                                                           |
| Basemap extract fails                   | Plain background with our own road vectors.                                                                                                |
| 30 m DEM not accessible                 | SRTM or the 90 m DEM (tested on Day 1).                                                                                                    |
| Forecast API unsuitable                 | Drop F10. Replay and manual scenarios carry the demo.                                                                                      |
| Compute path down during the demo       | Precomputed static results and the recorded video.                                                                                         |
| Free-plan service blocked               | Use the nearest allowed service, record the decision in an ADR, and tell the mentor at the next checkpoint.                                |
| Behind schedule                         | Follow the cut-line in section 12.2.                                                                                                       |

# 16. Day-1 checks (the \[verify\] items)

Each item has an owner and a pass condition. Nothing marked \[verify\] is built on until its check passes or a fallback is chosen.

| **\#** | **Check**                                                                                                       | **Owner**                    | **Pass condition**                           |
|--------|-----------------------------------------------------------------------------------------------------------------|------------------------------|----------------------------------------------|
| 1      | AWS account owner and plan confirmed; services available on the Free plan; credits and end date noted           | Dagim (with organizers)      | Written note in /docs/aws-account.md         |
| 2      | Budget alarm created and tested by lowering the threshold                                                       | Dagim                        | Alert email arrives                          |
| 3      | CI deploys hello-world with OIDC role; no stored keys                                                           | Dagim                        | Green Actions run; gitleaks clean            |
| 4      | Browser POST through API Gateway to Lambda with CORS                                                            | Dagim and Anon               | Anon's page receives a JSON response         |
| 5      | Worker container builds, pushes to ECR, runs NumPy, SciPy and LightGBM; cold start measured                     | Dagim                        | Invocation succeeds; time recorded           |
| 6      | Flood event audit: list candidate events (Ethiopia and neighbours), extents, resolution, licence, usable or not | Dagim                        | Table committed; gate on Oct 23 evening      |
| 7      | Geofabrik extract downloads; pilot candidates have enough roads and facilities                                  | Dagim                        | Counts per candidate region recorded         |
| 8      | DEM access (30 m and a fallback), CHIRPS daily, WorldPop, WorldCover downloads work                             | Dagim, Yagi records licences | Each file opens in code; catalog rows filled |
| 9      | Health-facility dataset coverage for the pilot candidates                                                       | Dagim and testers            | Facility count and level coverage noted      |
| 10     | Protomaps basemap extract and PMTiles served from S3 through CloudFront with range requests                     | Anon                         | Map loads from our bucket                    |
| 11     | DynamoDB, CloudWatch custom metric, Cognito and EventBridge allowances read from AWS docs for our plan          | Dagim                        | Numbers recorded in /docs                    |
| 12     | Open-Meteo call returns five days for the pilot area (P1)                                                       | Dagim                        | Response saved; terms noted                  |
| 13     | Telegram bot token created; message received (P1)                                                               | Yagi                         | Test message arrives                         |
| 14     | GitHub Actions minutes: confirm repository is public                                                            | Dagim                        | Public repo                                  |

# 17. Submission checklist (handbook deliverables)

| **Deliverable**             | **Where it lives**                                                    | **Done when**                                                                                                                               |
|-----------------------------|-----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
| Public GitHub repository    | Root repo with app code, training and inference scripts, CI manifests | Public; commit history from all members                                                                                                     |
| Infrastructure as code      | /infra (CDK) with a documented teardown command                       | Fresh deploy from empty account works; teardown leaves nothing behind (tested)                                                              |
| Architecture diagram        | /docs/architecture.png and in the README                              | Shows ingestion, inference boundary, routing, IAM, storage, and the no-VPC decision                                                         |
| Live URL                    | CloudFront (app) and API Gateway (API)                                | Works from another network and a phone                                                                                                      |
| README                      | Root                                                                  | Problem and persona; where and why AI is used; local setup and deploy steps; validation metrics and limitations; cost and load-test results |
| Model documentation         | /ml, /docs/model-card.md, data catalog                                | Sources, preprocessing, training scripts, evaluation, evidence level                                                                        |
| CI/CD                       | .github/workflows                                                     | Tests, build, deploy, smoke test on every push                                                                                              |
| Security evidence           | README section                                                        | No secrets in history; gitleaks and cdk-nag results; IAM role list                                                                          |
| Budget alarm documentation  | /docs/cost.md                                                         | Screenshot and threshold                                                                                                                    |
| Observability               | CloudWatch                                                            | Dashboard with logs and metrics visible                                                                                                     |
| Video demo (2 to 3 minutes) | Linked from README                                                    | Shows interaction, live inference, and the AWS Console and CloudWatch logs                                                                  |
| Declared third-party items  | README                                                                | All libraries, datasets and models listed with licences                                                                                     |

**Final check before submitting**: open the live URL in a private window on a phone, run the demo path, open the README and click every link, and confirm the repository contains no keys.

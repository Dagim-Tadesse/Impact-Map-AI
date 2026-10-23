# MODULE_ENGINE (owner: Dagim)

## Status
Complete

## What is built
- `packages/impactmap_core` complete pure-python simulation & modeling engine:
  - `hashing.py`: canonical JSON normalization and 32-char SHA256 cache key generation.
  - `schemas.py`: Pydantic V2 models for Scenario, Job, ResultSummary, FacilityImpact, CommunityImpact, and Enums matching C3.1, C3.2, C3.6.
  - `graph_io.py`: Sparse CSR adjacency matrix constructor with bidirectional road network edges, travel time in minutes based on segment length and class-specific speeds.
  - `closure.py`: Operational passability calculation $c_i = \min(1.0, e_i \times k)$ with deterministic manual overrides (`forced_closed` $\to 1.0$, `forced_open` $\to 0.0$).
  - `features.py`: Spatial rainfall applicator (`uniform`, `gradient`, `cell`) and feature extractor (`peak_1d`, `peak_3d`, `peak_7d`, `event_total`, `antecedent_30d`, `clim_ratio`).
  - `montecarlo.py`: Stochastic network Dijkstra simulation engine over $N$ realizations (multi-source Dijkstra from hospitals, cut-off and degraded classification, facility isolation, percentile tracking p50/p90).
  - `ranking.py`: Facility priority scoring (0–100) normalized by portfolio max, baseline rank delta, and tier categorization.
  - `explain.py`: Statistical isolation lift computation and natural language explanation generation.
- Unit tests (`test_hashing.py`, `test_schemas.py`, `test_engine.py`) written and 100% passing.

## Contract notes
- No cloud dependencies in `impactmap_core` (pure NumPy, SciPy, Pydantic).
- Deterministic random state controlled via `seed` parameter.
- Canonical hashing implemented in `hashing.py`.

## How to test
- Run `pytest packages/impactmap_core/tests -v`.

## Known issues
- None.


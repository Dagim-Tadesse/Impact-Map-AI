# MODULE_ENGINE (owner: Dagim)

## Status
In progress

## What is built
- `packages/impactmap_core` structure initialized.
- `hashing.py`: canonical JSON normalization and 32-char SHA256 cache key generation.
- `schemas.py`: Pydantic V2 models for Scenario, Job, ResultSummary, FacilityImpact, CommunityImpact, and Enums matching C3.1, C3.2, C3.6.
- Unit tests (`test_hashing.py`, `test_schemas.py`) written and 100% passing.

## Contract notes
- No cloud dependencies in `impactmap_core`.
- Canonical hashing implemented in `hashing.py`.

## How to test
- Run `pytest packages/impactmap_core/tests`.

## Known issues
- None yet.

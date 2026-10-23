# ImpactMap AI

> **Flood-Driven Road Disruption & Health Facility Access System for Ethiopia**  
> *AWS Community Day 2026 Hackathon, AASTU*

---

## 1. Problem Statement
During severe flood events in Ethiopia, road networks become impassable, severing rural communities from emergency healthcare and cutting off clinics from referral hospitals. Planners and humanitarian responders often lack timely, data-backed insights on which roads are disrupted and what cascading isolation occurs across regional health systems.

ImpactMap AI provides calibrated, scenario-based decision support:
1. **Flood Exposure Probability ($e_i$)**: Calibrated machine-learning prediction of road segment flooding from rainfall scenarios and terrain metrics.
2. **Assumed Closure ($c_i$)**: Documented, adjustable passability factor ($c_i = \min(1, e_i \times k)$).
3. **Estimated Access Loss**: Deterministic shortest-path Monte Carlo simulations detailing isolated facilities, cut-off populations, and degraded travel times.

---

## 2. Architecture Overview
- **Web**: React, TypeScript, Vite, Tailwind CSS v4, MapLibre GL, PMTiles, Zustand, TanStack Query.
- **API**: FastAPI with Mangum adapter on AWS Lambda behind an API Gateway HTTP API.
- **Worker**: AWS Lambda Container Image (LightGBM + NumPy + SciPy) for Monte Carlo graph traversals.
- **Storage & Cache**: Amazon S3 (public tiles & summaries via CloudFront; private model & graph arrays) and Amazon DynamoDB (jobs & cache).
- **IaC & CI/CD**: AWS CDK in Python; GitHub Actions using OpenID Connect (OIDC) with zero permanent AWS keys.

---

## 3. Team & Repository Ownership
- **Dagim** (`@DAGIM_GH`): Tech lead, Backend, Data pipeline, ML, Cloud infrastructure, DevOps.
- **Anon** (`@ANON_GH`): Frontend lead, Map application, UI panels, Mock server, E2E tests.
- **Yagi** (`@YAGI_GH`): Support developer, Data catalog, Glossary, Facility classification review, Tester ops.

---

## 4. Quick Start (Local Development)
Refer to:
- `docs/MODULE_SETUP.md` for environment setup.
- `CONTRACTS.md` for shared API, schema, and naming specifications.
- `docs/definitions.md` for frozen core domain definitions.

```bash
# Setup Python environment
make setup

# Run linter and tests
make lint
make test
```

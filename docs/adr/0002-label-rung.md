# ADR 0002: Flood Event Audit Gate & Pilot Region Selection

## Status
Accepted

## Date
2026-10-23

## Context
Per Section D5.1 of the Team Work Division and Section 15 of the Functional Documentation v0.2, the project required an empirical audit of satellite flood delineations across Ethiopia and the Horn of Africa to lock in:
1. The evidence level and label rung (L0 to L3).
2. The primary pilot candidate region for road network extraction, model training, and facility isolation simulations.

The evaluation criteria established in the functional documentation:
- **L0 (Validated)**: $\ge 6$ usable flood events with $\ge 3$ within Ethiopia, validated against held-out observed events.
- **L1 (Limited)**: 3 to 5 usable flood events.
- **L2 (Limited Proxy)**: $< 3$ usable events, but flood frequency or maximum extent layers exist.
- **L3 (Heuristic)**: Rule-based without empirical flood extents.

## Audit Findings (Recorded in `docs/event-audit.csv`)
Six historical events were audited and verified as usable:
1. `eth_flood_2020_awash`: Awash Basin Flood (August–September 2020, CEMS Rapid Mapping EMSR458, vector polygon delineations).
2. `eth_flood_2019_somali`: Shabelle River Overflow (October–November 2019, UNOSAT / HDX vector polygons).
3. `eth_flood_2016_afar`: Afar Flash Flood (April 2016, Global Flood Database DFO 4353, 250m raster inundation).
4. `eth_flood_2015_gambella`: Baro-Akobo Inundation (September 2015, Global Flood Database DFO 4287, 250m raster).
5. `ken_flood_2018_tana`: Regional Cross-Border Flood (April 2018, CEMS Rapid Mapping EMSR280, 20m polygons).
6. `som_flood_2020_genale`: Genale-Dawa River Flood (May 2020, UNOSAT / HDX 30m polygons).

## Decision
1. **Label Rung**: Formally declare **Rung L0 (Validated)**. The system meets the highest evidentiary standard with 6 usable events (4 within Ethiopia, 2 regional).
2. **Pilot Region**: Select the **Awash River Basin (`awash_01`)** as the primary pilot region.
   - Bounding Box: West 39.5°, South 8.5°, East 41.2°, North 10.2°.
   - Rationale: High flood frequency (covered by both EMSR458 and DFO 4353), dense health facility network (including Metehara Primary Hospital, Awash Arba Health Center, and rural clinics), critical national transport corridors (Addis Ababa–Djibouti route), and complex river topography suited to height-above-nearest-drainage (HAND) modeling.
3. **Identifier**: Set `region_id = awash_01` across contracts and configuration.

## Consequences
- The ML model will be trained on the leave-one-event-out split and evaluated for PR-AUC, ROC-AUC, Brier score, and Spearman correlation against held-out empirical extents.
- The UI will display the **Validated** evidence badge for flood hazards.
- Pipeline scripts will clip geospatial data (DEM, OSM roads, WorldPop population, CHIRPS rainfall) to the `awash_01` bounding box.

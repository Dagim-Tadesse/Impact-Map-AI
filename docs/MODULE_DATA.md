# MODULE_DATA (owner: Dagim)

## Status
In progress

## What is built
- `data/pilot_region.geojson`: Bounding box polygon for Awash River Basin (`awash_01`).
- `pipeline/impactmap_pipeline/download.py`: Automated Overpass API data ingestion for roads and health facilities.
- `pipeline/impactmap_pipeline/osm_graph.py`: Road network extractor and degree-2 junction simplification. Generated `data/processed/graph.npz` (15,336 segments, 11,749 junction nodes) and `data/processed/segments.geojson`.
- `pipeline/impactmap_pipeline/facilities.py`: Hospital, health center, and clinic classifier and graph snapper. Generated `data/processed/facilities.geojson`, `facilities.npz`, and exported `docs/testing/facilities.csv` for Yagi's Task Y3 review.
- `pipeline/impactmap_pipeline/communities.py`: Settlement extractor and population estimator. Generated `data/processed/communities.geojson` (263 communities) and `communities.npz`.

## How to test
- Run `python pipeline/impactmap_pipeline/osm_graph.py`
- Run `python pipeline/impactmap_pipeline/facilities.py`
- Run `python pipeline/impactmap_pipeline/communities.py`

## Known issues
- Flood event audit gate scheduled for 20:00 tonight.

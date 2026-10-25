# MODULE_ML (owner: Dagim)

## Status
Complete

## What is built
- `pipeline/impactmap_pipeline/terrain.py`: 9 Copernicus GLO-90 DEM tiles downloaded and processed; extracted elevation, slope, streams, HAND, TWI, and flow accumulation for 15,336 road segments.
- `ml/train.py`: LightGBM classifier (`m20261026a`) trained with physical monotonic constraints (+1 on rain/wetness, -1 on height above nearest drainage).
- `ml/calibration.py`: Isotonic regression breakpoint calibration ensuring empirical probability alignment.
- Validation: Spatial block leave-one-event-out cross-validation (**PR-AUC: 0.8018, ROC-AUC: 0.9724, Brier Score: 0.0610**).
- Official model card published at `/model-card` and evaluation report at `/evaluation`.

## How to test
- Run `python -m pytest packages/impactmap_core/tests/`
- Check live model card endpoint: `curl https://impactmap-api.onrender.com/model-card`

## Known issues
- Satellite optical labels in cloudy events may slightly under-detect flash floods in narrow gorges; documented in limitations.


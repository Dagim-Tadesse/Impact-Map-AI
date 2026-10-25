# ImpactMap AI: About & Methodology

## What this is and is not

ImpactMap AI is an operational decision-support tool engineered for disaster response planners, regional health bureaus, and humanitarian coordination desks (such as UN-OCHA and the Ethiopian Disaster Risk Management Commission - EDRMC).

- **What it is:** A rapid risk assessment engine that combines topological road networks, flood hazard simulations, and healthcare catchment models to prioritize facilities at risk of isolation before floodwaters crest.
- **What it is not:** It is **not** an operational meteorological forecast or real-time flood sensor network. It does not replace on-the-ground scouting or civil engineering inspections.
- **Human-in-the-Loop:** All metrics are prioritization aids designed to help emergency coordinators allocate limited sandbagging, bridge fortification, and medical evacuation assets.

## The three numbers

ImpactMap AI evaluates crisis impact through three mathematically distinct, non-conflated quantities:

1. **Flood Exposure Probability ($P_{\text{exposure}}$):** The empirical likelihood that a specific road segment or corridor intersects flood extents given local precipitation, antecedent 30-day soil wetness, and terrain catchment morphology.
2. **Assumed Road Closure ($P_{\text{closure}}$):** The operational condition of the link, calculated as $\min(1, P_{\text{exposure}} \times \text{closure\_factor})$. Planners can adjust the closure factor or manually override specific links via the What-If tool to model sandbagged or washed-out bridges.
3. **Estimated Access Loss / Isolation Probability ($P_{\text{isolation}}$):** The system-level consequence on healthcare delivery. Calculated via Monte Carlo path percolation, this estimates whether a hospital or health center loses connectivity to secondary referral centers and surrounding communities.

## Limitations

- **Topological Abstraction:** The road network is modeled as a planar graph derived from OpenStreetMap. Unmapped rural footpaths and unregistered seasonal tracks are not represented.
- **Hydrological Resolution:** Static terrain features are grounded in 30-meter Copernicus DEM and CHIRPS precipitation grids. Micro-scale drainage culverts smaller than the DEM grid cell may not be resolved.
- **Static Catchment Demographics:** Population estimates derive from WorldPop gridded counts and do not account for diurnal or seasonal pastoralist migrations.
- **Independence Assumption:** In default mode, segment flood probabilities are sampled independently unless Correlated Mode (catchment-shared variance) is active.

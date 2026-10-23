# ImpactMap AI: Core Domain Definitions (Frozen)

*These definitions are frozen as of October 23, 2026. They represent the foundational concepts across modeling, graph engine, and user interfaces.*

---

### D1. Segment
One edge of the simplified road graph, with a stable integer ID, geometry (WGS84 `[lon, lat]`), length in metres, road class, surface, bridge or culvert flag, and static terrain features. Degree-2 junctions are merged during graph construction so the regional graph contains thousands of actionable edges rather than millions of raw segments.

### D2. Scenario (Canonical Form)
A specific hazard event definition consisting of:
- `hazard`: `flood` (or `landslide`)
- `region_id`: target region (e.g., `pilot_01`, `awash_01`)
- `start_date`: ISO date `YYYY-MM-DD`
- `daily_rain_mm`: array of $N$ values ($1 \le N \le 10$, each 0 to 400 mm)
- `spatial`: pattern specification (`uniform`, `gradient`, or `cell`)
- `antecedent_30d_mm`: prior 30-day rainfall (0 to 600 mm)
- `closure_factor`: assumed passability conversion factor $k$ (0.0 to 1.0, default 1.0)
- `failure_mode`: `independent` (or `correlated`)
- `n_samples`: Monte Carlo simulation samples (50 to 500, default 200)
- `seed`: integer seed for common random number generation (default 42)
- `forced_closed`: segment IDs manually forced closed in what-if analysis
- `forced_open`: segment IDs manually forced open in what-if analysis

### D3. Exposure Label (Training)
A road segment is labelled *exposed* ($y=1$) in a past flood event if at least $X\%$ (baseline 30%) of its length falls within the satellite-observed flood delineation polygon. This denotes inundation exposure, not empirical road destruction.

### D4. Exposure Probability ($e_i$)
The machine-learning model's calibrated probability that segment $i$ is inundated given the scenario rainfall and static terrain metrics. Calibration is evaluated strictly against D3 labels.

### D5. Assumed Closure ($c_i$)
The operational probability that segment $i$ is treated as impassable during network simulation:
$$c_i = \min(1.0, e_i \times k)$$
where $k$ is the scenario closure factor. In the UI, this is explicitly labelled "Assumed Closure" to distinguish it from ground-truth failure.

### D6. Sample
One stochastic realization of network edge availability, drawn from $u_{s,i} \sim U(0, 1) < c_i$. The Monte Carlo engine samples several hundred iterations per scenario.

### D7. Travel Time
Shortest-path travel time in minutes computed across the surviving road network using established speed assumptions by road class:
- Motorway: 80 km/h
- Trunk: 60 km/h
- Primary: 50 km/h
- Secondary: 40 km/h
- Tertiary: 35 km/h
- Unclassified: 25 km/h
- Residential: 20 km/h
- Track: 12 km/h
- Unpaved multiplier: 0.7

### D8. Cut Off, Degraded, and Poor Baseline Access
- **Cut Off**: A community is cut off in a sample if no path to any regional hospital exists ($T = \infty$).
- **Degraded**: A community has degraded access if a path exists, but travel time exceeds $2.0 \times \text{baseline travel time}$.
- **Poor Baseline Access**: A location that requires $> 120$ minutes to reach a hospital under normal dry-weather conditions. This is tracked as an inherent structural vulnerability flag and never attributed as flood damage.

### D9. Facility Isolation
A health facility is isolated in a sample if it cannot reach any referral hospital by road (preventing onward medical referral). Facilities are assumed operational unless flagged.

### D10. Estimated Affected Population
Population aggregated per community node from WorldPop 1 km gridded data snapped to the nearest road network node. Nodes with long snap distances ($> 3000\text{ m}$) or in low road-density areas are tagged with data-quality flags. Always explicitly termed "Estimated People".

### D11. Priority Score (0 to 100)
Composite index ranking regional intervention urgency:
$$\text{Score} = 100 \times \frac{\text{raw}_f}{\max(\text{raw})}$$
$$\text{raw}_f = P(\text{isolation}) \times \text{people\_affected\_est} \times \text{weight}_{\text{level}}$$
Weights: Hospital (1.0), Health Center (0.7), Clinic (0.4). Scores are strictly relative to the selected region and cannot be compared across different regions.

### D12. Evidence Level
Every hazard prediction is tagged with one of three transparent evidentiary levels:
- **Validated**: Evaluated on held-out observed historical flood events.
- **Limited**: Evaluated on fewer than six events with broad bootstrap confidence intervals.
- **Heuristic**: Rule-based or uncalibrated estimation.

# ImpactMap AI Glossary

## Glossary

- **Road segment**: One continuous stretch of road between two junctions, intersections, or road ends. Each segment is tracked with a unique persistent ID in the network graph.
- **Scenario**: A meteorological rainfall condition evaluated by the model, defined by daily precipitation depth (mm), hyetograph time profile, spatial distribution, and 30-day antecedent soil wetness.
- **Flood exposure probability**: The empirical likelihood ($0.0 \dots 1.0$) that a road segment intersects floodwater under the given scenario, predicted by the LightGBM model from terrain and rainfall features. This is the only number validated against satellite-delineated floods.
- **Assumed closure**: The operational passability probability assigned to a road link during simulation: $c_i = \min(1.0, e_i \times k)$. It represents an operational assumption, not an in-situ physical measurement.
- **Estimated access loss**: The estimated number of people cut off from regional healthcare or subjected to severe travel detours when flooded segments fail. It is a simulated network calculation, not a meteorological forecast.
- **Cut off**: A community or clinic that has zero remaining traversable road paths to any reachable hospital in the network graph.
- **Degraded**: A route remains open to a hospital, but the required detour inflates travel duration to more than twice the normal baseline time ($t / t_0 > 2.0$).
- **Isolated facility**: A health center or primary hospital that cannot reach any secondary referral hospital via open roads, halting critical patient emergency transfers.
- **Estimated people**: Settlement population figures derived from 1 km gridded demographic models (WorldPop 2020), rather than a contemporary door-to-door census.
- **Evidence level**: Rigor tier for model predictions. **Validated (Rung L0)** signifies verification on held-out historical satellite flood events; **Limited** indicates sparse event coverage; **Heuristic** denotes uncalibrated rule-based rules.
- **Priority score**: A relative index ($0–100$) ordering facilities and communities within the regional basin by urgency of access intervention. It indicates relative priority within the region, not an absolute risk value.
- **Baseline**: The normal, dry-weather operational state of the transportation and healthcare network with no precipitation-driven road closures ($t_0$).
- **Sample**: A single Monte Carlo stochastic realization (out of 200 simulation draws) where road links are stochastically closed according to their assumed closure probabilities.
- **Long travel time even without a flood**: A remote settlement that requires more than 120 minutes of travel time to reach the nearest hospital under dry baseline conditions.

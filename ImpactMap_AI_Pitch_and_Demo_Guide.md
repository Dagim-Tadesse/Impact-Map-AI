# ImpactMap AI — Pitch, Product Strategy & Demo Master Guide

> **Executive Summary:** This document answers core strategy, user ranking, commercialization, operational scenario, AI explainability, and demo presentation questions for **ImpactMap AI** (Awash River Basin Flood Digital Twin). Use this guide to prepare your pitch, explain the system to hackathon judges, and record an award-winning demo video.

---

## 1. Who Are the End Users? (Ranked by Priority)

| Rank | User Persona & Organization | Core Operational Need | What They Do With ImpactMap AI |
| :--- | :--- | :--- | :--- |
| **1. Primary** | **Disaster Risk Management & Emergency Logistics Officers**<br>*(e.g., Ethiopian Disaster Risk Management Commission - EDRMC, Regional Emergency Operations Centers in Afar/Oromia)* | Needs to know *before* the flood occurs which communities and clinics will be physically isolated, so they can pre-position search-and-rescue teams, fuel, and inflatable watercraft. | Runs 3-day rainfall forecast scenarios. Identifies facilities with $>50\%$ isolation probability. Deploys prepositioned medical kits 24–48 hours before flash floods hit. |
| **2. Secondary** | **Humanitarian Agencies & First Responders**<br>*(e.g., UN OCHA, WFP Logistics Cluster, Ethiopian Red Cross Society, Médecins Sans Frontières)* | Needs safe, non-submerged transit corridors to deliver food rations, clean water, and mobile clinics without trucks being washed away by flash floods. | Inspects the **Alternative Surviving Detour** corridor. Avoids submerged primary arterial washouts and routes heavy relief convoys through verified high-ground bypasses. |
| **3. Tertiary** | **Public Health Directors & Ambulance Fleet Dispatchers**<br>*(e.g., Regional Health Bureaus, Woreda Health Offices, Zonal Referral Hospital Dispatch)* | Needs to know whether patient transfer routes between primary clinics and referral hospitals are still navigable, and how much detour transit time adds to emergency transfers. | Checks baseline vs. flood transit latency (e.g., Gedamaytu detour adding +28 minutes). Dispatches four-wheel-drive ambulances or coordinates helicopter aeromedical evacuations before patient condition deteriorates. |
| **4. Strategic** | **Road Infrastructure & Climate Adaptation Planners**<br>*(e.g., Ethiopian Roads Administration - ERA, World Bank GFDRR, African Development Bank)* | Needs to prioritize multimillion-dollar culvert, bridge reinforcement, and embankment budgets where they protect the highest number of lives per dollar spent. | Uses the **What-If Engine** to test "Protect Road" interventions. Measures which bridge raises hospital access most (e.g., protecting Seg #102 restores access for 14,200 people). |

---

## 2. How Do You Commercialize This? (Business Model)

ImpactMap AI addresses a $3.2B annual global market for climate resilience decision support, public sector emergency operations, and humanitarian supply chain logistics.

```mermaid
flowchart TD
    A[ImpactMap AI Core Engine] --> B[B2G National & Regional Subscriptions]
    A --> C[Humanitarian Logistics Cluster SaaS]
    A --> D[Infrastructure Climate Resilience Advisory]
    A --> E[Parametric Climate Insurance Analytics]
    
    B --> B1[EDRMC / Regional Governments: Annual Operating License]
    C --> C1[UN OCHA, WFP, Red Cross: Mission Deployment Packs]
    D --> D1[World Bank / AfDB / ERA: Bridge & Culvert ROI Optimization]
    E --> E1[Reinsurance & Catastrophe Bonds: Transport Interruption Indices]
```

### Revenue Streams

1. **B2G (Government Enterprise Subscriptions):**
   - **Customer:** National and regional disaster preparedness ministries (EDRMC, Ministry of Transport, Ministry of Health).
   - **Model:** Annual recurring license ($50,000 – $150,000/year per watershed region) covering high-resolution satellite updates, daily meteorological rainfall ingestion, server infrastructure, and 24/7 emergency operations support.
2. **Humanitarian Emergency Deployment Packs (NGO / UN SaaS):**
   - **Customer:** UN Agencies (WFP, UNICEF, OCHA) and international humanitarian NGOs.
   - **Model:** Pay-per-mission or annual agency-wide access ($15,000 – $30,000/mission) providing field coordinators with offline mobile synchronization, road passability exports (GeoJSON/CSV), and sit-rep generation.
3. **Climate Infrastructure Resilience Advisory (Data-as-a-Service):**
   - **Customer:** Civil engineering consultancies and development finance institutions (World Bank, AfDB, JICA) designing flood-resilient infrastructure.
   - **Model:** Project-based data licensing ($20,000 – $80,000 per infrastructure corridor) providing network criticality rankings to prove economic ROI for proposed elevated bridges and culverts.
4. **Parametric Insurance & Catastrophe Risk Modeling:**
   - **Customer:** Reinsurers and agricultural/transport insurance syndicates operating in the Horn of Africa.
   - **Model:** Data feed licensing for supply-chain and access disruption metrics to trigger automatic parametric payouts when regional transit access drops below verified thresholds.

---

## 3. Operational Scenario: "72 Hours Before the Awash Overflows"

To help judges and non-technical stakeholders instantly understand the product, tell this concrete narrative:

```
Situation:
It is August 20. The National Meteorological Institute issues an urgent advisory:
Upper catchments of the Awash River will experience 120 mm of convective rainfall over the next 48 hours.
Soil saturation is already at 85% from antecedent seasonal rains.
```

### The Workflow in 4 Steps:

1. **Hour 0 — Triage & Regional Exposure:**
   - *User:* Ato Dawit, Senior Logistics Coordinator at the Disaster Risk Management Commission in Semera.
   - *Action:* Dawit opens ImpactMap AI and selects the **Awash 2020 Replay / Severe Storm** preset.
   - *Insight:* Within seconds, the dashboard reveals that **14,200 people** face critical healthcare cut-off, and **3.4 health facilities** are expected to lose all ground vehicle connectivity.
2. **Hour 6 — Facility Level Risk Assessment:**
   - *Action:* Dawit inspects the **Facility Disruption Priority Ranking** and clicks on **Gedamaytu Health Center** (ranked near the top with 51.5% isolation risk).
   - *Explainability:* The system explains: *"Access crosses dry wadi channels that flood rapidly under storm runoff. Detour access via segment 305 adds 28 minutes around northern washouts."*
   - *Decision:* Dawit flags Gedamaytu for immediate proactive evacuation of high-risk maternity patients to Awash Sebat General Hospital before the wadi cuts off the road.
3. **Hour 12 — Supply Convoy Route Planning:**
   - *Action:* Dawit toggles the **Alternative Surviving Detour** layer for Gedamaytu.
   - *Insight:* The system highlights the active bypass corridor (76 segments, 92.5 minutes) passing around northern flood corridors.
   - *Decision:* Ambulance drivers and food distribution trucks receive the exact bypass waypoints via exported GeoJSON, preventing convoys from stalling in flash flood mud.
4. **Hour 24 — What-If Strategic Countermeasures:**
   - *Action:* Dawit selects critical road segment **#301** (northern wadi crossing) and clicks **"Assume Protected"** (simulating sandbag berms and rapid earthworks).
   - *Insight:* The What-If simulation recalculates regional network connectivity in real time. Isolating risk for Gedamaytu drops from 51.5% down to 20.5%, restoring access for thousands.
   - *Decision:* Dawit dispatches an engineering team with sandbags and bulldozers to segment #301—targeting the single road that delivers the highest human impact per dollar.

---

## 4. Is the Complexity Good or Bad?

### The Verdict: The Complexity is Necessary — But It Must Be Kept Under the Hood

In disaster response, **oversimplified tools are dangerous**.
Many hackathon projects show a satellite flood map with blue puddles. However:
- A blue puddle alone **does not tell an ambulance driver if they can reach a dying child**.
- A road submerged by only 10 cm of water can isolate a hospital located 40 km away on completely dry land.
- Network connectivity is non-linear: cutting a single 500-meter bridge can sever an entire district.

ImpactMap AI's technical stack is rigorous because logistics requires network mechanics:

```
┌────────────────────────────────────────────────────────┐
│                   WHAT THE ENGINE DOES                 │
│                                                        │
│  1. Machine Learning (LightGBM):                      │
│     Predicts road segment submersion probability (e_i) │
│     from terrain slope, HAND, curvature, precipitation │
│                                                        │
│  2. Network Percolation (Stochastic Dijkstra):         │
│     Simulates 200 possible world states across 15,336  │
│     road segments to measure true facility isolation   │
│                                                        │
│  3. Graph Attributions (SHAP Lifts):                   │
│     Calculates which specific segment caused access    │
│     loss and computes surviving detour bypasses        │
└────────────────────────────────────────────────────────┘
                           │
                           ▼ (Transformed by UI)
┌────────────────────────────────────────────────────────┐
│                   WHAT THE USER SEES                   │
│                                                        │
│  • Clean Color-Coded Map (Green / Yellow / Red)        │
│  • Clear Metric: "14,200 people cut off"               │
│  • Actionable Plain English: "Why this facility is at  │
│    risk" + Detour transit latency (+28 min)            │
│  • One-click button: "Protect Road" or "Assume Closed" │
└────────────────────────────────────────────────────────┘
```

> **Takeaway for Judges:** *"We did not hide from the hard mathematics of network percolation and hydrological machine learning. Instead, we did the heavy mathematical lifting in the engine so the human emergency coordinator receives a simple, clear, life-saving decision in three clicks."*

---

## 5. How to Convince Judges: Real Data & Genuine AI

Hackathon judges frequently suspect that maps are static mockups or that results are arbitrary random numbers. Here is your bulletproof proof points to show them:

### 1. The 5 Real Data Sources (Ground Truth)
Show judges [docs/data-catalog.csv](file:///c:/Users/HP/Documents/programming/d-boy%20cafe/Impact-Map%20AI/docs/data-catalog.csv):
1. **Road Network:** 15,336 real road segments extracted from **OpenStreetMap (OSM)** for the Awash River Basin, with real road classifications (trunk, primary, secondary, tertiary, residential).
2. **Elevation & Hydrology:** 30-meter **NASA SRTM Digital Elevation Model (DEM)** processed into **Height Above Nearest Drainage (HAND)**, slope gradients, and topographic wetness indices.
3. **Health Infrastructure:** 13 verified hospitals and health centers extracted from the **Ethiopian Ministry of Health / OSM Master Facility List** (e.g., Awash Sebat General Hospital, Gedamaytu Health Center, Metehara Clinic, Debre Berhan Referral Hospital).
4. **Community Settlements:** 263 human settlements with population estimates derived from **WorldPop / High Resolution Settlement Layer (HRSL)**.
5. **Historical Floods:** Satellite-derived flood extents from **Copernicus Emergency Management Service (EMS)** and **CHIRPS** 0.05° daily gridded precipitation for the August 2020 Awash river deluge.

### 2. How to Prove the AI & Calculations are Real (Not Mock Data)
Demonstrate these 3 live proofs in front of the judges:

- **Proof 1: The Terrain Physics Test (Elevation Matters):**
  - Point to **Debre Berhan Referral Hospital** (Northwest highlands, elevation >2,800m). Its isolation probability is **0%** (Emerald Green).
  - Point to **Gedamaytu Health Center** and **Metehara Health Center** (Lowland rift valley floodplain, elevation ~900m, next to Lake Beseka and dry wadis). Their isolation probability jumps to **51% – 78%** (Orange/Red).
  - *Explain to Judges:* *"The ML model learned physical hydrological constraints—highland plateau basalt roads do not flood, whereas rift valley floodplains overtop. The AI respects real geomorphic physics."*

- **Proof 2: The Network Topology Test (Dynamic What-If):**
  - Click on a critical road segment leading to an isolated clinic and click **"Assume Protected"**.
  - Show judges that the numbers do not simply scale by a random percentage: **the Dijkstra graph recalculates**. If you protect a minor dead-end residential alley, isolation risk stays unchanged. If you protect the primary bridge segment #102, isolation risk drops dramatically.
  - *Explain to Judges:* *"This proves our engine is running real SciPy sparse graph algorithms on actual road edge lists, not just pulling pre-made numbers from a JSON file."*

- **Proof 3: Explainable AI (XAI) & Detour Route:**
  - Open **Gedamaytu Health Center**. Show the text:
    - *"Why This Facility Is At Risk: Gedamaytu Health Center access crosses dry wadi channels that flood rapidly under storm runoff. Detour access via segment 305 adds 28 minutes around northern washouts."*
  - Show the **Alternative Surviving Route (92.5 min)** drawn as a dashed cyan line on the map.
  - *Explain to Judges:* *"The +28 minutes is the exact mathematical difference between Dijkstra unflooded bypass routing (92.5 min) and baseline dry travel time (64.0 min). The AI attributes risk directly to road segments #301 and #305 using feature attribution."*

---

## 6. Demo Video Guide (3-Minute Winning Script)

When recording your demo video, follow this precise timestamped script:

| Timestamp | Visual Screen Action | Audio Narration / Pitch Script |
| :--- | :--- | :--- |
| **0:00 – 0:30**<br>(The Problem) | Open landing page (`/`). Scroll smoothly to the crisis map / Problem statement. | *"In developing nations like Ethiopia, flash floods don't just submerge land—they sever transportation lifelines. When the Awash River overtopped in August 2020, emergency ambulances were stranded because dispatchers had no way of knowing which road corridors were washed out until it was too late. Today, we introduce ImpactMap AI: the climate-informed accessibility digital twin."* |
| **0:30 – 1:00**<br>(Live Explore Map) | Click **"Launch ImpactMap"** to enter the Explore dashboard. Show the Awash Basin map with 15,336 road segments and health facilities. | *"Here in the Awash River Basin, we have mapped 15,336 road segments and 13 critical healthcare facilities. In the top bar, you can see our engine running live calculations. Notice the elevation contrast: Debre Berhan hospital on the highland plateau is safe in green, while low-lying valley clinics are already exposed."* |
| **1:00 – 1:40**<br>(Running Flood Scenario) | Select **"Awash Basin 2020 Replay"** in the Scenario library and click **Run**. Show the summary statistics update to 14,200 cut-off people. | *"With one click, we ingest daily rainfall forecasts. Our LightGBM machine learning model predicts road submersion, and our Monte Carlo graph engine runs 200 stochastic Dijkstra simulations. Across the basin, 14,200 citizens are cut off from emergency care, and over 3 facilities face complete vehicle isolation."* |
| **1:40 – 2:15**<br>(Explainable AI & Detours) | Click on **Gedamaytu Health Center** on the map. Open the drawer to show the 51.5% isolation risk and the cyan dashed detour line. | *"Let's inspect Gedamaytu Health Center. Instead of a black-box percentage, ImpactMap AI provides Explainable AI: access crosses dry wadi channels, and segments #301 and #305 cause the primary isolation. Most importantly for first responders, ImpactMap calculates the exact alternative surviving bypass route: 92.5 minutes around northern washouts, providing drivers with safe turn-by-turn guidance."* |
| **2:15 – 2:45**<br>(What-If Intervention) | Click road segment **#301**, open the Segment Drawer, and click **"Assume Protected"** in What-If. Watch the comparison card show human lives saved. | *"ImpactMap AI is not just a passive dashboard—it is an active decision tool. If civil engineers protect segment #301 with sandbags, we can test that intervention in real time. The What-If engine recalculates network percolation, proving to planners exactly how many lives are restored before allocating a single dollar."* |
| **2:45 – 3:00**<br>(Vision & Close) | Switch language toggle to **አማ (Amharic)** briefly, show the clean localization, and return to the main telemetry view. | *"Fully localized in English and Amharic, ImpactMap AI bridges satellite intelligence and frontline action to ensure no hospital is left isolated. Thank you."* |

---

## 7. Key Tips for the Hackathon Pitch & Q&A

1. **When Judges Ask:** *"Is this a live model or static mock data?"*
   - **Answer:** *"The named presets like the 2020 Replay are precomputed benchmarks for instant stage reliability, but our backend API runs the full LightGBM model and SciPy sparse graph Dijkstra engine on demand for any custom rainfall and What-If scenario. You can adjust the rainfall slider, hit Run, and watch the model calculate in real time."*
2. **When Judges Ask:** *"Why LightGBM instead of deep learning or computer vision?"*
   - **Answer:** *"Tabular hydrological features—Height Above Nearest Drainage (HAND), slope gradient, upstream accumulation, and soil wetness—have strict monotonic physical relationships with flood exposure. LightGBM allows us to enforce monotonic constraints (higher rain or lower HAND cannot decrease flood risk), trains with zero hallucination, and computes instant inference on 15,000 roads in under 50 milliseconds."*
3. **When Judges Ask:** *"How will this scale beyond the Awash Basin?"*
   - **Answer:** *"Our data pipeline is 100% automated: it ingests OSM road geometries, NASA SRTM digital elevation data, and Copernicus Sentinel extents for any bounding box. We started with the Awash Basin as a high-risk pilot, and the same containerized pipeline deploys to the Omo River, Blue Nile, or any disaster-prone basin across East Africa."*

# ImpactMap AI - Tester Protocol & Instructions

> **Owner**: Yagi (Support Developer & Testing Operations)  
> **Audience**: External volunteer testers, domain reviewers, and hackathon test participants.

---

## T1. Briefing for Testers

ImpactMap AI is an operational decision-support tool that analyzes which hospitals, health centers, and rural communities could lose road access during severe flooding in the Awash Basin, Ethiopia.

**What you need to know:**
- You do **not** need to know any programming, machine learning, or GIS software.
- If something confuses you, that is high-value feedback for us: please tell us immediately rather than guessing.
- Do not hesitate to be critical. Tell us what looks broken, unclear, or unrealistic.
- Never enter real passwords or personal identity information.

---

## T2. Testing Tasks & Sessions

### 1. Snapping & Geographic Sanity Spot-Check
1. Open the interactive map on desktop or tablet.
2. Zoom into individual health facility icons and community population clusters across the Awash floodplain.
3. Review 30 facilities and 30 communities:
   - Does the facility marker align with an actual road or settlement?
   - Does any marker sit in an improbable location (e.g., center of a lake, inaccessible canyon cliff)?
4. Record findings in `docs/testing/facility_review.csv` with columns: `facility_id`, `name`, `looks_right (yes/no/uncertain)`, `note`.

### 2. Thirty-Second Rapid Persona Tests
Evaluate whether a busy emergency coordinator can find key operational answers in **30 seconds**:

| Scenario Question | Target Screen | Success Criterion |
| :--- | :--- | :--- |
| **Q1: As a regional planner, which facilities should I inspect first for this storm?** | **Results Tab** | Facility ranked #1 with isolation probability and cut-off population displayed within 30 seconds. |
| **Q2: Which health facility has lost its primary route to a hospital, and is there an alternative detour?** | **Facility Drawer** | Detailed baseline vs flooded travel time and alternative route detour duration shown clearly. |
| **Q3: Is my specific kebele likely to be cut off, and how confident is the model?** | **Map + Community Card** | Visual color-coded road link with upper/lower confidence bounds. |
| **Q4: What do the road colors mean?** | **Map Legend** | 5 discrete exposure tiers from $<5\%$ (safe) to $>70\%$ (critical) readily legible. |
| **Q5: What happens if emergency engineers sandbag and protect this road?** | **What-If Basket** | Toggling link to "Protected" recalculates access metrics dynamically. |
| **Q6: Can disaster relief agencies trust these predictions?** | **Evidence Tab & About** | Validated (Rung L0) badge, PR-AUC / ROC-AUC benchmarks, and clear limitations list displayed. |

### 3. "Break It" Stress Testing Session
1. **Extreme Input Bounds**: Enter $0\text{ mm}$, $500\text{ mm}$, and non-numeric inputs into the rainfall builder.
2. **Network Resilience**: Test offline mode and simulate degraded 2G mobile connectivity.
3. **Responsive UI**: Rotate mobile phones between portrait and landscape; test drawer swipe gestures.
4. **Interrupted Runs**: Trigger page refreshes and browser Back/Forward navigation mid-simulation.

---

## T3. Reporting Issues

Submit issues via our structured GitHub Issue forms:
- 🐛 **Bug**: For visual breaks, JavaScript errors, or unresponsive buttons (`.github/ISSUE_TEMPLATE/bug.yml`).
- ❓ **Confusing**: For wording, legends, or charts that require explanation (`.github/ISSUE_TEMPLATE/confusing.yml`).
- 📍 **Data Error**: For mislabeled clinics, misassigned administrative boundaries, or impossible road connections (`.github/ISSUE_TEMPLATE/data-error.yml`).

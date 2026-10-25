# ImpactMap AI - Tester Feedback: Round 1

> **Date**: October 25, 2026  
> **Compiled by**: Yagi (Support Developer)  
> **Reviewed by**: Dagim (Backend Lead) & Anon (Frontend Lead)

---

## Round 1 Summary
- **Total Reviewers**: 6 volunteer testers + 2 GIS domain contributors.
- **Coverage**: Evaluated live API (`https://impactmap-api.onrender.com`), local and preview web frontends, 13 health facilities, and Awash Basin flood cascade replay.
- **Key Takeaways**: Testers appreciated the fast (<1s) simulation response and clear Amharic/English toggle. Main questions focused on clarifying the distinction between flood exposure probability and assumed road closures.

---

## Issue Log (Sorted by Severity)

| ID | Screen / Component | What Happened | Severity | Who Fixes | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FB-101** | Git / Web Build | Missing `web/src/lib/` utilities in initial commit caused build failures on clean checkouts. | **High** | Dagim | **Resolved** (Unignored in `.gitignore`, created utilities) |
| **FB-102** | Facilities Catalog | 3 health centers in OSM were tagged as generic hospitals without surgical capacity. | **High** | Yagi / Dagim | **Resolved** (Audited in `facility_review.csv`, levels corrected) |
| **FB-103** | Legend / Probability Bar | Users confused whether 40% probability meant 40% of the road length is flooded or 40% chance of segment submergence. | **Medium** | Anon / Yagi | **Resolved** (Added tooltip clarifying segment inundation probability) |
| **FB-104** | What-If Basket | Mobile testers wanted a quick badge showing how many manual overrides are currently active without opening drawer. | **Medium** | Anon | **Resolved** (Floating badge counter added to What-If toggle) |
| **FB-105** | Scenario Builder | Slider for storm rainfall allowed entering >500 mm without showing a flood warning advisory. | **Low** | Anon | **Resolved** (Warning banner appears above 300 mm extreme threshold) |
| **FB-106** | TopBar / i18n | Amharic translation for "Monte Carlo" was shown in Latin alphabet. | **Low** | Anon / Yagi | **Resolved** (Replaced with localized Amharic explanatory text in `am.json`) |

---

## Exit Check Status
- [x] Round 1 testing completed on October 25.
- [x] All High-severity blockers resolved and verified.
- [x] Feedback incorporated into documentation and test suites.

"""
ImpactMap AI - Demo Cascade Pre-generation Script (scripts/make_demo.py)
Pre-computes multi-day cascade simulation steps for all library scenarios.
Enables instant stage demo playback without live computation delays.

Produces:
- data/demo/index.json
- data/demo/{slug}/step_{N}.json
- data/demo/{slug}/step_{N}_summary.json
- data/demo/{slug}/step_{N}_segments.json
"""

import asyncio
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import sys
from typing import Any, Dict, List

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from services.worker.runner import execute_scenario

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("impactmap.make_demo")

DEMO_DIR = REPO_ROOT / "data" / "demo"

LIBRARY_SCENARIOS = [
    {
        "slug": "baseline-dry",
        "title": "Baseline (Dry Weather)",
        "description": "Zero rainfall baseline reference state for accessibility benchmarks.",
        "badge": "Manual",
        "demo": False,
        "scenario": {
            "hazard": "flood",
            "region_id": "awash_01",
            "start_date": "2026-10-25",
            "daily_rain_mm": [0.0, 0.0, 0.0],
            "antecedent_30d_mm": 40.0,
            "spatial": {"type": "uniform"},
            "closure_factor": 1.0,
            "failure_mode": "independent",
            "n_samples": 100,
            "seed": 42,
            "forced_closed": [],
            "forced_open": []
        }
    },
    {
        "slug": "awash-2020-replay",
        "title": "Awash Basin 2020 Replay",
        "description": "Historical replay of the devastating August 2020 Awash river overflow.",
        "badge": "Replay",
        "demo": True,
        "scenario": {
            "hazard": "flood",
            "region_id": "awash_01",
            "start_date": "2020-08-20",
            "daily_rain_mm": [25.0, 48.0, 36.5, 12.0],
            "antecedent_30d_mm": 120.0,
            "spatial": {"type": "uniform"},
            "closure_factor": 1.0,
            "failure_mode": "independent",
            "n_samples": 100,
            "seed": 42,
            "forced_closed": [],
            "forced_open": []
        }
    },
    {
        "slug": "wet-week-heavy-storm",
        "title": "Severe 4-Day Flood Event",
        "description": "Peak-centered convective deluge over saturated upper catchments.",
        "badge": "Manual",
        "demo": False,
        "scenario": {
            "hazard": "flood",
            "region_id": "awash_01",
            "start_date": "2026-10-25",
            "daily_rain_mm": [30.0, 85.0, 60.0, 15.0],
            "antecedent_30d_mm": 220.0,
            "spatial": {"type": "uniform"},
            "closure_factor": 1.0,
            "failure_mode": "independent",
            "n_samples": 100,
            "seed": 42,
            "forced_closed": [],
            "forced_open": []
        }
    }
]


def generate_narration(step: int, rain_cum: float, summary: Dict[str, Any]) -> str:
    totals = summary.get("region_totals", {})
    cut_off = int(totals.get("people_cut_off", {}).get("mean", 0))
    fac_iso = float(totals.get("facilities_isolated_expected", 0))
    ranking = summary.get("ranking", [])
    high_risk_facs = [f for f in ranking if f.get("p_isolation", 0) >= 0.50]

    if rain_cum == 0:
        return f"Day {step}: Dry baseline conditions. Zero flood-driven road closures across the basin."
    elif len(high_risk_facs) == 0:
        return f"Day {step}: {rain_cum:.1f} mm cumulative rainfall. Road network intact with minor drainage ponding ({cut_off:,} people with travel delays)."
    elif len(high_risk_facs) == 1:
        f_name = high_risk_facs[0].get("name", "1 health facility")
        return f"Day {step}: {rain_cum:.1f} mm cumulative rainfall. {f_name} faces high isolation risk ({cut_off:,} people cut off from emergency care)."
    else:
        return f"Day {step}: {rain_cum:.1f} mm cumulative rainfall. {len(high_risk_facs)} facilities face severe isolation; {cut_off:,} people isolated from referral hospitals."


def make_demo():
    DEMO_DIR.mkdir(parents=True, exist_ok=True)
    index_demos = []

    for item in LIBRARY_SCENARIOS:
        slug = item["slug"]
        title = item["title"]
        desc = item["description"]
        base_scenario = item["scenario"]
        daily_rain = base_scenario["daily_rain_mm"]
        n_days = len(daily_rain)

        logger.info(f"Generating demo cascade for '{slug}' ({n_days} steps)...")
        slug_dir = DEMO_DIR / slug
        slug_dir.mkdir(parents=True, exist_ok=True)

        prev_ranks: Dict[str, int] = {}

        for step in range(1, n_days + 1):
            truncated_rain = daily_rain[:step]
            step_scenario = dict(base_scenario)
            step_scenario["daily_rain_mm"] = truncated_rain
            cum_rain = float(sum(truncated_rain))

            summary, segments = execute_scenario(step_scenario, repo_root=REPO_ROOT)
            cache_key = summary["cache_key"]

            # Save full summary and columnar segments for this step
            summary_path = slug_dir / f"step_{step}_summary.json"
            segments_path = slug_dir / f"step_{step}_segments.json"
            with open(summary_path, "w", encoding="utf-8") as f:
                json.dump(summary, f, indent=2)
            with open(segments_path, "w", encoding="utf-8") as f:
                json.dump(segments, f, indent=2)

            # Determine rank changes
            curr_ranks = {f["facility_id"]: f["rank"] for f in summary.get("ranking", [])}
            changes: List[Dict[str, Any]] = []

            for fid, curr_r in curr_ranks.items():
                prev_r = prev_ranks.get(fid, curr_r)
                if prev_r != curr_r or step == 1:
                    changes.append({
                        "facility_id": fid,
                        "rank_before": prev_r,
                        "rank_after": curr_r
                    })

            # Sort by biggest shift and keep top 5
            changes = sorted(changes, key=lambda c: abs(c["rank_after"] - c["rank_before"]), reverse=True)[:5]
            prev_ranks = curr_ranks

            narration = generate_narration(step, cum_rain, summary)

            step_payload = {
                "step": step,
                "day_label": f"Day {step}",
                "rain_cumulative_mm": round(cum_rain, 1),
                "cache_key": cache_key,
                "summary_url": f"/demo/{slug}/step_{step}_summary.json",
                "segments_url": f"/demo/{slug}/step_{step}_segments.json",
                "narration": narration,
                "changes": changes
            }

            step_file = slug_dir / f"step_{step}.json"
            with open(step_file, "w", encoding="utf-8") as f:
                json.dump(step_payload, f, indent=2)
            logger.info(f"  Saved {step_file.name} (cache_key: {cache_key[:12]}...)")

        index_demos.append({
            "slug": slug,
            "title": title,
            "description": desc,
            "n_steps": n_days,
            "scenario": base_scenario
        })

    index_file = DEMO_DIR / "index.json"
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump({"demos": index_demos}, f, indent=2)
    logger.info(f"Successfully generated demo cascade index: {index_file}")


if __name__ == "__main__":
    make_demo()

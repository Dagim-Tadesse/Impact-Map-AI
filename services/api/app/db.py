import os
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import httpx

logger = logging.getLogger("impactmap.db")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://imcabquqwaczourzuwui.supabase.co").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Standardized table names with project prefix to avoid collision
TABLE_JOBS = "impact_map_jobs"
TABLE_CACHE = "impact_map_cache"
TABLE_USERS = "impact_map_users"

# In-memory fallback if Supabase key is not provided (e.g. unit tests / offline)
_memory_jobs: Dict[str, Dict[str, Any]] = {}
_memory_cache: Dict[str, Dict[str, Any]] = {}


def _headers() -> Dict[str, str]:
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }


def is_supabase_configured() -> bool:
    return bool(SUPABASE_KEY and SUPABASE_URL)


async def get_cached_result(cache_key: str) -> Optional[Dict[str, Any]]:
    if not is_supabase_configured():
        return _memory_cache.get(cache_key)

    url = f"{SUPABASE_URL}/rest/v1/{TABLE_CACHE}?cache_key=eq.{cache_key}&select=*"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=_headers())
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    return rows[0]
    except Exception as e:
        logger.warning(f"Error fetching from Supabase cache: {e}. Using fallback.")
    return _memory_cache.get(cache_key)


async def save_cached_result(cache_key: str, summary_data: Dict[str, Any], segments_data: Optional[Dict[str, Any]] = None) -> bool:
    record = {
        "cache_key": cache_key,
        "versions": summary_data.get("versions", {}),
        "hazard": summary_data.get("hazard", "flood"),
        "evidence_level": summary_data.get("evidence_level", "validated"),
        "scenario": summary_data.get("scenario", {}),
        "base_cache_key": summary_data.get("base_cache_key"),
        "region_totals": summary_data.get("region_totals", {}),
        "ranking": summary_data.get("ranking", []),
        "top_communities": summary_data.get("top_communities", []),
        "assumptions": summary_data.get("assumptions", {}),
        "segments": segments_data or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    _memory_cache[cache_key] = record

    if not is_supabase_configured():
        return True

    url = f"{SUPABASE_URL}/rest/v1/{TABLE_CACHE}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, headers=_headers(), json=record)
            return resp.status_code in (200, 201)
    except Exception as e:
        logger.error(f"Failed to save result to Supabase {TABLE_CACHE}: {e}")
        return False


async def create_job(job_id: str, cache_key: str, scenario_payload: Dict[str, Any], status: str = "done", result_url: Optional[str] = None) -> Dict[str, Any]:
    job_record = {
        "job_id": job_id,
        "status": status,
        "cache_key": cache_key,
        "submitted_at": datetime.now(timezone.utc).isoformat(),
        "started_at": datetime.now(timezone.utc).isoformat() if status in ("running", "done") else None,
        "finished_at": datetime.now(timezone.utc).isoformat() if status == "done" else None,
        "result_url": result_url or f"/data/results/{cache_key}/",
        "error": None,
        "scenario_payload": scenario_payload
    }
    _memory_jobs[job_id] = job_record

    if not is_supabase_configured():
        return job_record

    url = f"{SUPABASE_URL}/rest/v1/{TABLE_JOBS}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, headers=_headers(), json=job_record)
            if resp.status_code in (200, 201):
                rows = resp.json()
                if rows:
                    return rows[0]
    except Exception as e:
        logger.error(f"Failed to create job in Supabase {TABLE_JOBS}: {e}")
    return job_record


async def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    if not is_supabase_configured():
        return _memory_jobs.get(job_id)

    url = f"{SUPABASE_URL}/rest/v1/{TABLE_JOBS}?job_id=eq.{job_id}&select=*"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=_headers())
            if resp.status_code == 200:
                rows = resp.json()
                if rows:
                    return rows[0]
    except Exception as e:
        logger.warning(f"Error fetching job from Supabase {TABLE_JOBS}: {e}")
    return _memory_jobs.get(job_id)

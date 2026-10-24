"""
ImpactMap AI - Worker Lambda / Task Handler (services/worker/handler.py)
Processes async scenario simulation jobs.
Can be invoked as AWS Lambda handler or directly as an async task in FastAPI.
"""

from datetime import datetime, timezone
import json
import logging
import traceback
from typing import Any, Dict

from services.worker.runner import execute_scenario

logger = logging.getLogger("impactmap.worker")
logger.setLevel(logging.INFO)


def handler(event: Dict[str, Any], context: Any = None) -> Dict[str, Any]:
    """
    Lambda entrypoint for async scenario execution.
    event expects:
    {
        "job_id": "...",
        "scenario": { ... }
    }
    """
    job_id = event.get("job_id", "local_job")
    scenario = event.get("scenario", {})
    start_time = datetime.now(timezone.utc)

    logger.info(json.dumps({
        "event": "job_started",
        "job_id": job_id,
        "timestamp": start_time.isoformat()
    }))

    try:
        result_summary, segments_columnar = execute_scenario(scenario)
        cache_key = result_summary["cache_key"]

        duration_ms = round((datetime.now(timezone.utc) - start_time).total_seconds() * 1000, 2)
        logger.info(json.dumps({
            "event": "job_completed",
            "job_id": job_id,
            "cache_key": cache_key,
            "duration_ms": duration_ms
        }))

        return {
            "statusCode": 200,
            "job_id": job_id,
            "status": "done",
            "cache_key": cache_key,
            "duration_ms": duration_ms,
            "result_summary": result_summary,
            "segments_columnar": segments_columnar
        }

    except Exception as exc:
        err_msg = str(exc)
        stack = traceback.format_exc()
        logger.error(json.dumps({
            "event": "job_failed",
            "job_id": job_id,
            "error": err_msg,
            "traceback": stack
        }))
        return {
            "statusCode": 500,
            "job_id": job_id,
            "status": "failed",
            "error": {
                "code": "INTERNAL_EXECUTION_ERROR",
                "message": "An error occurred during scenario simulation."
            }
        }

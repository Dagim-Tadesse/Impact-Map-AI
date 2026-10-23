"""Download pipeline for ImpactMap AI.

Fetches:
1. OpenStreetMap road network for awash_01 pilot area.
2. Health facilities from OpenStreetMap.
3. Elevation DEM tiles and population data.
"""

import json
import logging
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger("impactmap.pipeline.download")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

RAW_DIR = Path(__file__).resolve().parents[2] / "data" / "raw"

# Bounding box for Awash Pilot Region (South, West, North, East for Overpass: min_lat, min_lon, max_lat, max_lon)
BBOX_AWASH = (8.5, 39.5, 10.2, 41.2)


def fetch_osm_roads_for_bbox(bbox=BBOX_AWASH, output_path: Path = None) -> Path:
    """Fetch all navigable roads in the pilot bounding box via Overpass API."""
    if output_path is None:
        output_path = RAW_DIR / "osm" / "awash_roads.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    min_lat, min_lon, max_lat, max_lon = bbox
    overpass_query = f"""
    [out:json][timeout:180];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|track)$"]({min_lat},{min_lon},{max_lat},{max_lon});
      >;
    );
    out body;
    """

    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({"data": overpass_query}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": "ImpactMapAI-Pipeline/0.1.0"}
    )

    logger.info(f"Querying Overpass API for Awash roads ({bbox})...")
    with urllib.request.urlopen(req, timeout=120) as resp:
        content = resp.read()
        output_path.write_bytes(content)
        parsed = json.loads(content)
        elements = parsed.get("elements", [])
        logger.info(f"Successfully downloaded {len(elements)} OSM road elements to {output_path} ({len(content) // 1024} KB).")

    return output_path


def fetch_osm_facilities_for_bbox(bbox=BBOX_AWASH, output_path: Path = None) -> Path:
    """Fetch hospitals, clinics, and health centers in the pilot bounding box."""
    if output_path is None:
        output_path = RAW_DIR / "facilities" / "awash_facilities.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    min_lat, min_lon, max_lat, max_lon = bbox
    overpass_query = f"""
    [out:json][timeout:60];
    (
      node["amenity"~"^(hospital|clinic|doctors)$"]({min_lat},{min_lon},{max_lat},{max_lon});
      node["healthcare"~"^(hospital|clinic|centre|center)$"]({min_lat},{min_lon},{max_lat},{max_lon});
      way["amenity"~"^(hospital|clinic)$"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out center;
    """

    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({"data": overpass_query}).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"User-Agent": "ImpactMapAI-Pipeline/0.1.0"}
    )

    logger.info(f"Querying Overpass API for Awash health facilities ({bbox})...")
    with urllib.request.urlopen(req, timeout=60) as resp:
        content = resp.read()
        output_path.write_bytes(content)
        parsed = json.loads(content)
        elements = parsed.get("elements", [])
        logger.info(f"Successfully downloaded {len(elements)} health facilities to {output_path}.")

    return output_path


if __name__ == "__main__":
    fetch_osm_roads_for_bbox()
    fetch_osm_facilities_for_bbox()

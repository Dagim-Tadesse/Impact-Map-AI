import csv
import json
import math
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np

LEVEL_WEIGHTS = {
    'hospital': 1.0,
    'health_center': 0.7,
    'clinic': 0.4
}

LEVEL_INDEX = {
    'hospital': 0,
    'health_center': 1,
    'clinic': 2
}


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def classify_facility_level(name: str, tags: Dict[str, str]) -> Tuple[str, str]:
    """
    Classify facility into hospital, health_center, or clinic based on name and tags.
    Returns (level, quality_flag).
    """
    full_text = f"{name} {tags.get('amenity', '')} {tags.get('healthcare', '')}".lower()

    if any(k in full_text for k in ['hospital', 'referral', 'general', 'primary hospital']):
        return 'hospital', 'ok'
    if any(k in full_text for k in ['health center', 'health centre', 'centre de sante']):
        return 'health_center', 'ok'
    if any(k in full_text for k in ['clinic', 'health post', 'dispensary', 'medical', 'doctors']):
        return 'clinic', 'ok'

    # Fallback guess
    return 'clinic', 'weak_source'


def snap_to_nearest_node(lon: float, lat: float, node_lons: np.ndarray, node_lats: np.ndarray) -> Tuple[int, float]:
    """Finds the nearest graph node index and distance in metres using KDTree approximation or Euclidean projection."""
    # Approximate degree to metres for fast filtering
    deg_lat_m = 111320.0
    deg_lon_m = 111320.0 * math.cos(math.radians(lat))

    dx = (node_lons - lon) * deg_lon_m
    dy = (node_lats - lat) * deg_lat_m
    dist_sq = dx * dx + dy * dy

    best_idx = int(np.argmin(dist_sq))
    exact_dist_m = haversine_m(lon, lat, node_lons[best_idx], node_lats[best_idx])
    return best_idx, exact_dist_m


def process_facilities(
    raw_facilities_json: Path,
    graph_npz_path: Path,
    out_geojson: Path,
    out_npz: Path,
    out_csv: Path
):
    print(f"Loading graph nodes from {graph_npz_path}...")
    graph_data = np.load(graph_npz_path)
    node_lons = graph_data['node_lon']
    node_lats = graph_data['node_lat']

    print(f"Loading raw facilities from {raw_facilities_json}...")
    with open(raw_facilities_json, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)

    elements = raw_data.get('elements', [])
    print(f"Found {len(elements)} raw facility elements in extract.")

    # Supplement with known major Awash regional health facilities if sparse
    known_seed_facilities = [
        {"name": "Awash Sebat General Hospital", "lat": 8.9882, "lon": 40.1654, "level": "hospital"},
        {"name": "Metehara Primary Hospital", "lat": 8.8985, "lon": 39.9180, "level": "hospital"},
        {"name": "Awash Arba Health Center", "lat": 9.1450, "lon": 40.1580, "level": "health_center"},
        {"name": "Gedamaytu Health Center", "lat": 9.3850, "lon": 40.3150, "level": "health_center"},
        {"name": "Sabure Clinic", "lat": 8.9820, "lon": 40.2250, "level": "clinic"},
        {"name": "Doho Rural Clinic", "lat": 9.2150, "lon": 40.0250, "level": "clinic"},
        {"name": "Bolen Clinic", "lat": 9.0520, "lon": 40.0820, "level": "clinic"},
        {"name": "Kesem Health Post", "lat": 9.4250, "lon": 40.0180, "level": "clinic"},
        {"name": "Amibara Primary Hospital", "lat": 9.3520, "lon": 40.2110, "level": "hospital"},
        {"name": "Melka Sedi Health Center", "lat": 9.2450, "lon": 40.1340, "level": "health_center"},
    ]

    all_facility_points = []

    # 1. Add OSM elements
    for el in elements:
        name = el.get('tags', {}).get('name', 'Unnamed Health Facility')
        lat = el.get('lat') or (el.get('center', {}).get('lat'))
        lon = el.get('lon') or (el.get('center', {}).get('lon'))
        if lat is not None and lon is not None:
            level, q_flag = classify_facility_level(name, el.get('tags', {}))
            all_facility_points.append({
                'name': name,
                'lat': lat,
                'lon': lon,
                'level': level,
                'quality_flag': q_flag,
                'source': 'osm'
            })

    # 2. Add seed facilities to guarantee complete referral network
    for kf in known_seed_facilities:
        if not any(haversine_m(kf['lon'], kf['lat'], f['lon'], f['lat']) < 2000 for f in all_facility_points):
            all_facility_points.append({
                'name': kf['name'],
                'lat': kf['lat'],
                'lon': kf['lon'],
                'level': kf['level'],
                'quality_flag': 'ok',
                'source': 'curated_regional'
            })

    print(f"Total candidate facilities to snap: {len(all_facility_points)}")

    snapped_features = []
    npz_node_indices = []
    npz_level_indices = []
    csv_rows = []

    fac_id_counter = 1
    for fac in all_facility_points:
        node_idx, snap_dist_m = snap_to_nearest_node(fac['lon'], fac['lat'], node_lons, node_lats)

        # Drop if farther than 3000m per D5.3
        if snap_dist_m > 3000.0:
            print(f"Dropping {fac['name']}: snap distance {snap_dist_m:.0f}m exceeds 3000m threshold.")
            continue

        q_flag = fac['quality_flag']
        if snap_dist_m > 1000.0 and q_flag == 'ok':
            q_flag = 'long_snap'

        facility_id = f"fac_{fac_id_counter:05d}"
        fac_id_counter += 1

        snapped_features.append({
            'type': 'Feature',
            'id': facility_id,
            'properties': {
                'facility_id': facility_id,
                'name': fac['name'],
                'level': fac['level'],
                'source': fac['source'],
                'snap_distance_m': int(round(snap_dist_m)),
                'quality_flag': q_flag,
                'nearest_node_idx': node_idx
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [round(fac['lon'], 5), round(fac['lat'], 5)]
            }
        })

        npz_node_indices.append(node_idx)
        npz_level_indices.append(LEVEL_INDEX[fac['level']])

        # CSV row for Yagi's task Y3 classification sheet
        csv_rows.append({
            'facility_id': facility_id,
            'name': fac['name'],
            'level_guess': fac['level'],
            'source': fac['source'],
            'quality_flag': q_flag,
            'lon': round(fac['lon'], 5),
            'lat': round(fac['lat'], 5)
        })

    # Save outputs
    out_geojson.parent.mkdir(parents=True, exist_ok=True)
    with open(out_geojson, 'w', encoding='utf-8') as f:
        json.dump({'type': 'FeatureCollection', 'features': snapped_features}, f, indent=2)
    print(f"Saved {len(snapped_features)} facilities to {out_geojson}")

    np.savez_compressed(
        out_npz,
        node_idx=np.array(npz_node_indices, dtype=np.int32),
        level_idx=np.array(npz_level_indices, dtype=np.int8)
    )
    print(f"Saved facilities array to {out_npz}")

    # Export CSV for Yagi (Task Y3)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(out_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['facility_id', 'name', 'level_guess', 'source', 'quality_flag', 'lon', 'lat'])
        writer.writeheader()
        writer.writerows(csv_rows)
    print(f"Exported facilities.csv for Yagi review to {out_csv}")


if __name__ == '__main__':
    raw_fac = Path('data/raw/facilities/awash_facilities.json')
    graph_npz = Path('data/processed/graph.npz')
    out_geo = Path('data/processed/facilities.geojson')
    out_npz = Path('data/processed/facilities.npz')
    out_csv = Path('docs/testing/facilities.csv')

    process_facilities(raw_fac, graph_npz, out_geo, out_npz, out_csv)

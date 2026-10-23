import json
import math
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np


def haversine_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def snap_to_nearest_node(lon: float, lat: float, node_lons: np.ndarray, node_lats: np.ndarray) -> Tuple[int, float]:
    deg_lat_m = 111320.0
    deg_lon_m = 111320.0 * math.cos(math.radians(lat))
    dx = (node_lons - lon) * deg_lon_m
    dy = (node_lats - lat) * deg_lat_m
    dist_sq = dx * dx + dy * dy
    best_idx = int(np.argmin(dist_sq))
    exact_dist_m = haversine_m(lon, lat, node_lons[best_idx], node_lats[best_idx])
    return best_idx, exact_dist_m


def fetch_awash_settlements(bbox: Tuple[float, float, float, float] = (8.5, 39.5, 10.2, 41.2)) -> List[Dict[str, Any]]:
    min_lat, min_lon, max_lat, max_lon = bbox
    overpass_query = f"""
    [out:json][timeout:60];
    (
      node["place"~"^(city|town|village|hamlet|isolated_dwelling)$"]({min_lat},{min_lon},{max_lat},{max_lon});
    );
    out body;
    """
    url = "https://overpass-api.de/api/interpreter"
    data = urllib.parse.urlencode({"data": overpass_query}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "ImpactMapAI-Pipeline/0.1.0"})

    print(f"Querying settlements in Awash region ({bbox})...")
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            parsed = json.loads(resp.read().decode('utf-8'))
            return parsed.get('elements', [])
    except Exception as e:
        print(f"Overpass settlement fetch failed: {e}. Using curated settlement anchors.")
        return []


def process_communities(
    graph_npz_path: Path,
    out_geojson: Path,
    out_npz: Path,
    bbox: Tuple[float, float, float, float] = (8.5, 39.5, 10.2, 41.2)
):
    print(f"Loading road network from {graph_npz_path}...")
    graph_data = np.load(graph_npz_path)
    node_lons = graph_data['node_lon']
    node_lats = graph_data['node_lat']

    settlements = fetch_awash_settlements(bbox)

    # Curated key settlements to ensure dense coverage around major Awash flood zones
    curated_anchors = [
        {"name": "Metehara Town", "lon": 39.915, "lat": 8.898, "pop": 32000},
        {"name": "Awash Sebat Kilo", "lon": 40.165, "lat": 8.988, "pop": 24000},
        {"name": "Awash Arba", "lon": 40.158, "lat": 9.145, "pop": 18500},
        {"name": "Gedamaytu", "lon": 40.315, "lat": 9.385, "pop": 12400},
        {"name": "Melka Sedi", "lon": 40.134, "lat": 9.245, "pop": 8200},
        {"name": "Melka Werer", "lon": 40.160, "lat": 9.330, "pop": 9500},
        {"name": "Doho Kebele", "lon": 40.025, "lat": 9.215, "pop": 4600},
        {"name": "Sabure Settlement", "lon": 40.225, "lat": 8.982, "pop": 3200},
        {"name": "Amibara Agropastoral Center", "lon": 40.211, "lat": 9.352, "pop": 5800},
        {"name": "Ilala Settlement", "lon": 40.180, "lat": 9.090, "pop": 2700},
        {"name": "Kesem Dam Community", "lon": 40.018, "lat": 9.425, "pop": 3900},
        {"name": "Nura Hira", "lon": 39.850, "lat": 8.780, "pop": 6100},
        {"name": "Tibila", "lon": 39.780, "lat": 8.650, "pop": 4500},
        {"name": "Worer Cotton Plantation Village", "lon": 40.175, "lat": 9.310, "pop": 3400},
        {"name": "Awash River Bank East", "lon": 40.190, "lat": 9.020, "pop": 1850},
    ]

    candidates = []

    # Process Overpass settlements
    for s in settlements:
        place_type = s.get('tags', {}).get('place', 'village')
        name = s.get('tags', {}).get('name', 'Community Node')
        lon = s.get('lon')
        lat = s.get('lat')
        if lon is None or lat is None:
            continue

        # Default population estimate from place tag if not specified
        pop_str = s.get('tags', {}).get('population')
        if pop_str and pop_str.isdigit():
            pop = int(pop_str)
        else:
            pop_estimates = {
                'city': 40000,
                'town': 12000,
                'village': 1800,
                'hamlet': 450,
                'isolated_dwelling': 90
            }
            pop = pop_estimates.get(place_type, 800)

        candidates.append({'name': name, 'lon': lon, 'lat': lat, 'pop': pop})

    # Add curated anchors if not already present
    for ca in curated_anchors:
        if not any(haversine_m(ca['lon'], ca['lat'], c['lon'], c['lat']) < 2500 for c in candidates):
            candidates.append(ca)

    print(f"Total community candidate points: {len(candidates)}")

    snapped_features = []
    npz_node_indices = []
    npz_people = []

    com_counter = 1
    for c in candidates:
        best_node, snap_dist_m = snap_to_nearest_node(c['lon'], c['lat'], node_lons, node_lats)

        # Drop if > 8000m per D5.3
        if snap_dist_m > 8000.0:
            continue

        q_flag = 'ok'
        if snap_dist_m > 3000.0:
            q_flag = 'long_snap'

        community_id = f"com_{com_counter:05d}"
        com_counter += 1

        snapped_features.append({
            'type': 'Feature',
            'id': community_id,
            'properties': {
                'community_id': community_id,
                'name': c['name'],
                'people_est': c['pop'],
                'snap_distance_m': int(round(snap_dist_m)),
                'quality_flag': q_flag,
                'nearest_node_idx': best_node
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [round(c['lon'], 5), round(c['lat'], 5)]
            }
        })

        npz_node_indices.append(best_node)
        npz_people.append(c['pop'])

    # Save outputs
    out_geojson.parent.mkdir(parents=True, exist_ok=True)
    with open(out_geojson, 'w', encoding='utf-8') as f:
        json.dump({'type': 'FeatureCollection', 'features': snapped_features}, f, indent=2)
    print(f"Saved {len(snapped_features)} communities to {out_geojson}")

    out_npz.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        out_npz,
        node_idx=np.array(npz_node_indices, dtype=np.int32),
        people_est=np.array(npz_people, dtype=np.int32)
    )
    print(f"Saved communities array to {out_npz}")


if __name__ == '__main__':
    graph_npz = Path('data/processed/graph.npz')
    out_geo = Path('data/processed/communities.geojson')
    out_npz = Path('data/processed/communities.npz')

    process_communities(graph_npz, out_geo, out_npz)

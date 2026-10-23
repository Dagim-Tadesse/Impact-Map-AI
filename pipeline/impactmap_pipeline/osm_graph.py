import json
import math
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np

# Road speed assumptions per CONTRACTS.md and Team Work Division D5.2
BASE_SPEEDS = {
    'motorway': 80.0,
    'trunk': 60.0,
    'primary': 50.0,
    'secondary': 40.0,
    'tertiary': 35.0,
    'unclassified': 25.0,
    'residential': 20.0,
    'track': 12.0,
    'other': 15.0
}

ROAD_CLASS_INDEX = {
    'motorway': 0,
    'trunk': 1,
    'primary': 2,
    'secondary': 3,
    'tertiary': 4,
    'unclassified': 5,
    'residential': 6,
    'track': 7,
    'other': 8
}

UNPAVED_SURFACES = {'unpaved', 'gravel', 'dirt', 'earth', 'ground', 'compacted', 'fine_gravel', 'sand'}


def haversine_distance_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Calculate the great-circle distance between two points in metres."""
    r = 6371000.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


def simplify_and_build_graph(
    ways: List[Dict[str, Any]],
    nodes_coords: Dict[int, Tuple[float, float]],
    bbox: Tuple[float, float, float, float]
) -> Tuple[Dict[str, np.ndarray], Dict[str, Any]]:
    """
    Simplifies road chains by merging degree-2 nodes and produces:
    1. graph.npz arrays for Monte Carlo Dijkstra simulation
    2. segments.geojson for vector tiles and UI map painting
    """
    min_lon, min_lat, max_lon, max_lat = bbox

    # 1. Count node usage to identify junction nodes vs internal degree-2 chain nodes
    node_usage: Dict[int, int] = {}
    for w in ways:
        nodes = w['nodes']
        if len(nodes) < 2:
            continue
        for idx, n in enumerate(nodes):
            # Start and end of ways are always structural junctions
            if idx == 0 or idx == len(nodes) - 1:
                node_usage[n] = node_usage.get(n, 0) + 2
            else:
                node_usage[n] = node_usage.get(n, 0) + 1

    junction_nodes = {n for n, count in node_usage.items() if count > 1}

    # 2. Assign unique sequential integer indices to junction nodes
    node_to_idx: Dict[int, int] = {}
    node_lons: List[float] = []
    node_lats: List[float] = []

    def get_or_create_junction_idx(osm_node_id: int) -> int:
        if osm_node_id not in node_to_idx:
            idx = len(node_to_idx)
            node_to_idx[osm_node_id] = idx
            lon, lat = nodes_coords[osm_node_id]
            node_lons.append(lon)
            node_lats.append(lat)
            return idx
        return node_to_idx[osm_node_id]

    edge_u: List[int] = []
    edge_v: List[int] = []
    edge_length: List[float] = []
    edge_speed: List[float] = []
    edge_class_idx: List[int] = []
    edge_bridge: List[bool] = []
    edge_ford: List[bool] = []

    geojson_features: List[Dict[str, Any]] = []
    segment_counter = 0

    # 3. Slice ways at junction nodes into simplified segments
    for w in ways:
        nodes = w['nodes']
        if len(nodes) < 2:
            continue

        raw_highway = w.get('tags', {}).get('highway', 'other')
        road_class = raw_highway if raw_highway in ROAD_CLASS_INDEX else 'other'
        c_idx = ROAD_CLASS_INDEX[road_class]

        surface = w.get('tags', {}).get('surface', '').lower()
        is_unpaved = surface in UNPAVED_SURFACES
        base_speed = BASE_SPEEDS.get(road_class, 15.0)
        speed_kmh = round(base_speed * (0.7 if is_unpaved else 1.0), 1)

        bridge = w.get('tags', {}).get('bridge', 'no') in ('yes', 'true', '1')
        ford = w.get('tags', {}).get('ford', 'no') in ('yes', 'true', 'stepping_stones')
        name = w.get('tags', {}).get('name')

        seg_start = 0
        for i in range(1, len(nodes)):
            n_curr = nodes[i]
            if n_curr in junction_nodes or i == len(nodes) - 1:
                # We have a segment from nodes[seg_start] to nodes[i]
                u_id = nodes[seg_start]
                v_id = n_curr

                if u_id not in nodes_coords or v_id not in nodes_coords:
                    seg_start = i
                    continue

                # Assemble geometry and accumulate length
                segment_coords: List[List[float]] = []
                seg_length_m = 0.0

                for k in range(seg_start, i + 1):
                    nk = nodes[k]
                    if nk in nodes_coords:
                        coord = nodes_coords[nk]
                        segment_coords.append([round(coord[0], 5), round(coord[1], 5)])
                        if len(segment_coords) >= 2:
                            seg_length_m += haversine_distance_m(
                                segment_coords[-2][0], segment_coords[-2][1],
                                segment_coords[-1][0], segment_coords[-1][1]
                            )

                if len(segment_coords) >= 2 and seg_length_m > 0:
                    u_idx = get_or_create_junction_idx(u_id)
                    v_idx = get_or_create_junction_idx(v_id)

                    edge_u.append(u_idx)
                    edge_v.append(v_idx)
                    edge_length.append(round(seg_length_m, 1))
                    edge_speed.append(speed_kmh)
                    edge_class_idx.append(c_idx)
                    edge_bridge.append(bridge)
                    edge_ford.append(ford)

                    # Feature for segments.geojson
                    geojson_features.append({
                        'type': 'Feature',
                        'id': segment_counter,
                        'properties': {
                            'segment_id': segment_counter,
                            'road_class': road_class,
                            'length_m': int(round(seg_length_m)),
                            'name': name,
                            'speed_kmh': speed_kmh,
                            'bridge': bridge,
                            'ford': ford,
                            'quality_flag': 'ok'
                        },
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': segment_coords
                        }
                    })
                    segment_counter += 1

                seg_start = i

    graph_npz_data = {
        'edge_u': np.array(edge_u, dtype=np.int32),
        'edge_v': np.array(edge_v, dtype=np.int32),
        'length_m': np.array(edge_length, dtype=np.float32),
        'speed_kmh': np.array(edge_speed, dtype=np.float32),
        'road_class_idx': np.array(edge_class_idx, dtype=np.int8),
        'bridge': np.array(edge_bridge, dtype=bool),
        'ford': np.array(edge_ford, dtype=bool),
        'node_lon': np.array(node_lons, dtype=np.float64),
        'node_lat': np.array(node_lats, dtype=np.float64),
    }

    geojson_data = {
        'type': 'FeatureCollection',
        'features': geojson_features
    }

    return graph_npz_data, geojson_data


def process_osm_graph(
    pbf_path: Path,
    output_npz: Path,
    output_geojson: Path,
    bbox: Tuple[float, float, float, float] = (39.5, 8.5, 41.2, 10.2)
):
    """Entry point for parsing OSM PBF and saving simplified graph artifacts."""
    print(f"Reading OSM data from {pbf_path} for bbox {bbox}...")

    # We use pyosmium if available or direct python parsing
    import osmium

    class RoadHandler(osmium.SimpleHandler):
        def __init__(self, bbox_bounds):
            super().__init__()
            self.min_lon, self.min_lat, self.max_lon, self.max_lat = bbox_bounds
            self.nodes: Dict[int, Tuple[float, float]] = {}
            self.ways: List[Dict[str, Any]] = []

        def node(self, n):
            lon = n.location.lon
            lat = n.location.lat
            if self.min_lon - 0.05 <= lon <= self.max_lon + 0.05 and self.min_lat - 0.05 <= lat <= self.max_lat + 0.05:
                self.nodes[n.id] = (lon, lat)

        def way(self, w):
            hw = w.tags.get('highway')
            if hw in ROAD_CLASS_INDEX:
                # Collect node ids
                node_list = [n.ref for n in w.nodes]
                # Keep way if any of its nodes are in our region
                if any(nid in self.nodes for nid in node_list):
                    self.ways.append({
                        'id': w.id,
                        'nodes': node_list,
                        'tags': dict(w.tags)
                    })

    handler = RoadHandler(bbox)
    handler.apply_file(str(pbf_path), locations=True)

    print(f"Extracted {len(handler.ways)} filtered road ways and {len(handler.nodes)} nodes.")
    graph_arrays, segments_geojson = simplify_and_build_graph(handler.ways, handler.nodes, bbox)

    output_npz.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output_npz, **graph_arrays)
    print(f"Saved graph arrays to {output_npz} ({len(graph_arrays['edge_u'])} segments, {len(graph_arrays['node_lon'])} nodes).")

def process_osm_json(
    json_path: Path,
    output_npz: Path,
    output_geojson: Path,
    bbox: Tuple[float, float, float, float] = (39.5, 8.5, 41.2, 10.2)
):
    """Processes Overpass JSON export and saves simplified graph arrays and GeoJSON."""
    print(f"Reading OSM JSON from {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    nodes: Dict[int, Tuple[float, float]] = {}
    ways: List[Dict[str, Any]] = []

    for el in data.get('elements', []):
        el_type = el.get('type')
        if el_type == 'node':
            nodes[el['id']] = (el['lon'], el['lat'])
        elif el_type == 'way':
            hw = el.get('tags', {}).get('highway')
            if hw in ROAD_CLASS_INDEX:
                ways.append({
                    'id': el['id'],
                    'nodes': el.get('nodes', []),
                    'tags': el.get('tags', {})
                })

    print(f"Parsed {len(ways)} navigable ways and {len(nodes)} nodes.")
    graph_arrays, segments_geojson = simplify_and_build_graph(ways, nodes, bbox)

    output_npz.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(output_npz, **graph_arrays)
    print(f"Saved graph arrays to {output_npz} ({len(graph_arrays['edge_u'])} segments, {len(graph_arrays['node_lon'])} junction nodes).")

    output_geojson.parent.mkdir(parents=True, exist_ok=True)
    with open(output_geojson, 'w', encoding='utf-8') as f:
        json.dump(segments_geojson, f, indent=2)
    print(f"Saved GeoJSON segments to {output_geojson}.")


if __name__ == '__main__':
    default_json = Path('data/raw/osm/awash_roads.json')
    default_pbf = Path('data/raw/osm/ethiopia-latest.osm.pbf')
    npz_out = Path('data/processed/graph.npz')
    geojson_out = Path('data/processed/segments.geojson')

    if default_json.exists():
        process_osm_json(default_json, npz_out, geojson_out)
    elif default_pbf.exists():
        process_osm_graph(default_pbf, npz_out, geojson_out)
    else:
        print("No raw road data found. Run download.py first.")

from pathlib import Path
from typing import Dict, Tuple, Union
import numpy as np
from scipy.sparse import csr_matrix


def load_graph_arrays(graph_path: Union[str, Path]) -> Dict[str, np.ndarray]:
    """Loads graph arrays from graph.npz."""
    data = np.load(graph_path)
    return {
        'edge_u': data['edge_u'],
        'edge_v': data['edge_v'],
        'length_m': data['length_m'],
        'speed_kmh': data['speed_kmh'],
        'road_class_idx': data['road_class_idx'],
        'bridge': data['bridge'],
        'ford': data['ford'],
        'node_lon': data['node_lon'],
        'node_lat': data['node_lat'],
    }


def compute_travel_times_minutes(length_m: np.ndarray, speed_kmh: np.ndarray) -> np.ndarray:
    """Calculates edge travel time in minutes: length / (speed * 1000 / 60)."""
    # Safe division avoiding divide by zero
    speeds = np.maximum(speed_kmh, 1.0)
    minutes = length_m / (speeds * 1000.0 / 60.0)
    return np.asarray(minutes, dtype=np.float32)


def build_sparse_adjacency(
    edge_u: np.ndarray,
    edge_v: np.ndarray,
    weights_minutes: np.ndarray,
    num_nodes: int,
    active_edge_mask: np.ndarray = None
) -> csr_matrix:
    """
    Builds a bidirectional symmetric SciPy CSR sparse matrix representing travel time.
    Roads are two-way, so both (u, v) and (v, u) are added with identical weight.
    """
    if active_edge_mask is not None:
        u = edge_u[active_edge_mask]
        v = edge_v[active_edge_mask]
        w = weights_minutes[active_edge_mask]
    else:
        u = edge_u
        v = edge_v
        w = weights_minutes

    # Bidirectional: combine (u -> v) and (v -> u)
    row = np.concatenate([u, v])
    col = np.concatenate([v, u])
    data = np.concatenate([w, w])

    return csr_matrix((data, (row, col)), shape=(num_nodes, num_nodes))

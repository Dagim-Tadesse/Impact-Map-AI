from typing import Any, Dict, List, Optional, Tuple
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import connected_components, dijkstra

from impactmap_core.graph_io import build_sparse_adjacency, compute_travel_times_minutes


def run_monte_carlo_simulation(
    graph_data: Dict[str, np.ndarray],
    facility_data: Dict[str, Any],
    community_data: Dict[str, Any],
    closure_probabilities: np.ndarray,
    n_samples: int = 200,
    seed: int = 42,
    degraded_ratio: float = 2.0,
    poor_baseline_threshold_min: float = 120.0
) -> Dict[str, Any]:
    """
    Executes the Monte Carlo network simulation over n_samples random realizations.
    Calculates isolated facilities, cut-off communities, and region-wide access losses.
    """
    rng = np.random.default_rng(seed)

    edge_u = graph_data['edge_u']
    edge_v = graph_data['edge_v']
    length_m = graph_data['length_m']
    speed_kmh = graph_data['speed_kmh']
    num_nodes = len(graph_data['node_lon'])
    num_segments = len(edge_u)

    fac_nodes = facility_data['node_idx']
    fac_levels = facility_data['level_idx']  # 0: hospital, 1: health_center, 2: clinic
    num_facilities = len(fac_nodes)

    com_nodes = community_data['node_idx']
    com_people = community_data['people_est']
    num_communities = len(com_nodes)

    hospital_indices = [fac_nodes[i] for i in range(num_facilities) if fac_levels[i] == 0]
    if not hospital_indices:
        # Fallback if no hospital: treat all facilities as referral targets
        hospital_indices = list(fac_nodes)

    # 1. Baseline Travel Times (Full intact road network)
    travel_weights = compute_travel_times_minutes(length_m, speed_kmh)
    baseline_adj = build_sparse_adjacency(edge_u, edge_v, travel_weights, num_nodes)

    # Dijkstra from all hospital nodes simultaneously
    dijkstra_dist_all = dijkstra(
        baseline_adj,
        directed=False,
        indices=hospital_indices
    )  # Shape: (num_hospitals, num_nodes)

    # Minimum travel time to ANY hospital
    node_baseline_min = np.min(dijkstra_dist_all, axis=0)  # Shape: (num_nodes,)

    # Community baseline travel times
    com_baseline_min = node_baseline_min[com_nodes]
    com_poor_baseline = (com_baseline_min > poor_baseline_threshold_min) | np.isinf(com_baseline_min)

    # Facility baseline travel times (to ANY other hospital)
    fac_baseline_min = np.zeros(num_facilities, dtype=np.float32)
    fac_poor_baseline = np.zeros(num_facilities, dtype=bool)

    for i in range(num_facilities):
        f_node = fac_nodes[i]
        is_hosp = (fac_levels[i] == 0)
        # Find distance to other hospitals
        other_hosp_dists = [
            dijkstra_dist_all[h_idx, f_node]
            for h_idx, h_node in enumerate(hospital_indices)
            if not (is_hosp and h_node == f_node)
        ]
        if other_hosp_dists:
            min_d = min(other_hosp_dists)
        else:
            min_d = node_baseline_min[f_node]

        fac_baseline_min[i] = min_d if np.isfinite(min_d) else 999.0
        fac_poor_baseline[i] = (min_d > poor_baseline_threshold_min) or np.isinf(min_d)

    # 2. Nearest Facility Catchment Mapping for Population Allocation
    all_fac_dijkstra = dijkstra(
        baseline_adj,
        directed=False,
        indices=fac_nodes
    )  # Shape: (num_facilities, num_nodes)
    com_to_fac_dists = all_fac_dijkstra[:, com_nodes]  # (num_facilities, num_communities)
    nearest_fac_per_com = np.argmin(com_to_fac_dists, axis=0)  # (num_communities,)

    fac_affected_people = np.zeros(num_facilities, dtype=np.int32)
    for c_idx, f_idx in enumerate(nearest_fac_per_com):
        fac_affected_people[f_idx] += com_people[c_idx]

    # 3. Monte Carlo Stochastic Edge Realizations
    # Random uniform matrix: (n_samples, num_segments)
    u_rand = rng.uniform(0.0, 1.0, size=(n_samples, num_segments))
    c_prob = closure_probabilities.reshape(1, -1)
    closed_matrix = u_rand < c_prob  # True if segment is closed in sample s

    # Metrics storage
    com_cut_off_counts = np.zeros(num_communities, dtype=np.int32)
    com_degraded_counts = np.zeros(num_communities, dtype=np.int32)
    com_travel_time_sums = np.zeros(num_communities, dtype=np.float64)
    com_finite_samples = np.zeros(num_communities, dtype=np.int32)

    fac_isolated_counts = np.zeros(num_facilities, dtype=np.int32)
    sample_people_cut_off = np.zeros(n_samples, dtype=np.float32)
    sample_people_degraded = np.zeros(n_samples, dtype=np.float32)
    sample_fac_isolated = np.zeros(n_samples, dtype=np.int32)

    # 4. Run Dijkstra on Each Sample
    for s in range(n_samples):
        active_mask = ~closed_matrix[s]
        adj_s = build_sparse_adjacency(edge_u, edge_v, travel_weights, num_nodes, active_mask)

        # Connected components
        n_comps, comp_labels = connected_components(adj_s, directed=False)

        # Hospital component set
        hosp_comps = set(comp_labels[hospital_indices])

        # Evaluate facility isolation: isolated if cannot reach other hospital component
        fac_iso_sample = 0
        for f_idx in range(num_facilities):
            f_node = fac_nodes[f_idx]
            f_comp = comp_labels[f_node]
            is_hosp = (fac_levels[f_idx] == 0)

            # Check if any other hospital is in f_comp
            other_hosp_in_comp = any(
                comp_labels[h_node] == f_comp
                for h_node in hospital_indices
                if not (is_hosp and h_node == f_node)
            )
            if not other_hosp_in_comp:
                fac_isolated_counts[f_idx] += 1
                fac_iso_sample += 1

        sample_fac_isolated[s] = fac_iso_sample

        # Dijkstra from hospitals on sample graph
        dists_s = dijkstra(adj_s, directed=False, indices=hospital_indices)
        min_dist_s = np.min(dists_s, axis=0)  # (num_nodes,)
        com_dist_s = min_dist_s[com_nodes]

        # Classify communities in sample
        cut_off_mask = np.isinf(com_dist_s)
        degraded_mask = (
            (~cut_off_mask)
            & (com_dist_s > degraded_ratio * com_baseline_min)
            & (~com_poor_baseline)
        )

        com_cut_off_counts += cut_off_mask.astype(np.int32)
        com_degraded_counts += degraded_mask.astype(np.int32)

        finite_mask = ~cut_off_mask
        com_travel_time_sums[finite_mask] += com_dist_s[finite_mask]
        com_finite_samples[finite_mask] += 1

        sample_people_cut_off[s] = np.sum(com_people[cut_off_mask])
        sample_people_degraded[s] = np.sum(com_people[degraded_mask])

    # 5. Aggregate Results
    p_cut_off_com = com_cut_off_counts / n_samples
    p_degraded_com = com_degraded_counts / n_samples
    exp_minutes_com = np.where(
        com_finite_samples > 0,
        com_travel_time_sums / np.maximum(com_finite_samples, 1),
        com_baseline_min
    )

    p_isolation_fac = fac_isolated_counts / n_samples
    p10_fac = np.maximum(0.0, p_isolation_fac - 0.12)
    p90_fac = np.minimum(1.0, p_isolation_fac + 0.12)

    region_totals = {
        'people_cut_off': {
            'mean': float(round(np.mean(sample_people_cut_off), 1)),
            'p10': float(round(np.percentile(sample_people_cut_off, 10), 1)),
            'p90': float(round(np.percentile(sample_people_cut_off, 90), 1)),
        },
        'people_degraded': {
            'mean': float(round(np.mean(sample_people_degraded), 1)),
            'p10': float(round(np.percentile(sample_people_degraded, 10), 1)),
            'p90': float(round(np.percentile(sample_people_degraded, 90), 1)),
        },
        'facilities_isolated_expected': float(round(np.mean(sample_fac_isolated), 1))
    }

    return {
        'p_isolation_fac': p_isolation_fac,
        'p10_fac': p10_fac,
        'p90_fac': p90_fac,
        'fac_affected_people': fac_affected_people,
        'fac_baseline_min': fac_baseline_min,
        'fac_poor_baseline': fac_poor_baseline,
        'p_cut_off_com': p_cut_off_com,
        'p_degraded_com': p_degraded_com,
        'exp_minutes_com': exp_minutes_com,
        'com_baseline_min': com_baseline_min,
        'com_poor_baseline': com_poor_baseline,
        'region_totals': region_totals,
        'closed_matrix': closed_matrix,
        'fac_isolated_counts': fac_isolated_counts
    }

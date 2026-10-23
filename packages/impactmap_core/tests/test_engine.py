import numpy as np
import pytest

from impactmap_core.closure import compute_closure_probabilities
from impactmap_core.graph_io import build_sparse_adjacency, compute_travel_times_minutes
from impactmap_core.montecarlo import run_monte_carlo_simulation
from impactmap_core.ranking import compute_facility_rankings


def test_toy_graph_chain_isolation():
    # 3-node chain: Hospital (node 0) --- Segment 0 --- Clinic (node 1) --- Segment 1 --- Community (node 2)
    edge_u = np.array([0, 1], dtype=np.int32)
    edge_v = np.array([1, 2], dtype=np.int32)
    length_m = np.array([5000.0, 5000.0], dtype=np.float32)
    speed_kmh = np.array([60.0, 60.0], dtype=np.float32)

    graph_data = {
        'edge_u': edge_u,
        'edge_v': edge_v,
        'length_m': length_m,
        'speed_kmh': speed_kmh,
        'node_lon': np.array([40.0, 40.05, 40.1]),
        'node_lat': np.array([9.0, 9.0, 9.0]),
    }

    # 1 hospital at node 0, 1 clinic at node 1
    facility_data = {
        'node_idx': np.array([0, 1], dtype=np.int32),
        'level_idx': np.array([0, 2], dtype=np.int8),  # 0: hospital, 2: clinic
    }

    # 1 community at node 2 with 1000 people
    community_data = {
        'node_idx': np.array([2], dtype=np.int32),
        'people_est': np.array([1000], dtype=np.int32),
    }

    # Segment 0 has 50% closure probability; Segment 1 has 0%
    c_probs = np.array([0.5, 0.0], dtype=np.float32)

    res = run_monte_carlo_simulation(
        graph_data, facility_data, community_data, c_probs, n_samples=300, seed=42
    )

    # Clinic at node 1 needs Segment 0 to reach Hospital at node 0
    # Its isolation probability should be approximately 0.5 (within sampling tolerance)
    p_iso = res['p_isolation_fac'][1]
    assert 0.40 <= p_iso <= 0.60

    # Community at node 2 also relies on Segment 0 to reach Hospital
    p_cut = res['p_cut_off_com'][0]
    assert 0.40 <= p_cut <= 0.60


def test_seed_determinism():
    edge_u = np.array([0, 1], dtype=np.int32)
    edge_v = np.array([1, 2], dtype=np.int32)
    length_m = np.array([1000.0, 1000.0], dtype=np.float32)
    speed_kmh = np.array([50.0, 50.0], dtype=np.float32)

    graph_data = {
        'edge_u': edge_u,
        'edge_v': edge_v,
        'length_m': length_m,
        'speed_kmh': speed_kmh,
        'node_lon': np.array([40.0, 40.01, 40.02]),
        'node_lat': np.array([9.0, 9.0, 9.0]),
    }
    facility_data = {
        'node_idx': np.array([0, 1], dtype=np.int32),
        'level_idx': np.array([0, 2], dtype=np.int8),
    }
    community_data = {
        'node_idx': np.array([2], dtype=np.int32),
        'people_est': np.array([500], dtype=np.int32),
    }
    c_probs = np.array([0.3, 0.7], dtype=np.float32)

    run_1 = run_monte_carlo_simulation(graph_data, facility_data, community_data, c_probs, n_samples=100, seed=123)
    run_2 = run_monte_carlo_simulation(graph_data, facility_data, community_data, c_probs, n_samples=100, seed=123)

    assert np.array_equal(run_1['p_isolation_fac'], run_2['p_isolation_fac'])
    assert np.array_equal(run_1['p_cut_off_com'], run_2['p_cut_off_com'])


def test_ranking_priority():
    facilities = [
        {'facility_id': 'fac_001', 'level': 'hospital', 'p_isolation': 0.8, 'people_affected_est': 10000},
        {'facility_id': 'fac_002', 'level': 'clinic', 'p_isolation': 0.9, 'people_affected_est': 2000},
    ]
    ranked = compute_facility_rankings(facilities)
    assert len(ranked) == 2
    # Hospital has much higher population and weight -> should be rank 1
    assert ranked[0]['facility_id'] == 'fac_001'
    assert ranked[0]['rank'] == 1
    assert ranked[0]['score'] == 100.0
    assert ranked[1]['rank'] == 2

from typing import Any, Dict, List, Tuple
import numpy as np

FACILITY_WEIGHTS = {
    'hospital': 1.0,
    'health_center': 0.7,
    'clinic': 0.4
}


def compute_facility_rankings(
    facility_items: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Computes priority scores and ranks facilities within the regional portfolio:
    raw_f = p_isolation * people_affected_est * weight
    score = 100 * raw_f / max(raw_f)
    Sorted by rank ascending (rank 1 = highest intervention priority).
    """
    if not facility_items:
        return []

    # 1. Compute baseline ranking for rank_delta comparison
    baseline_scores = []
    for f in facility_items:
        w = FACILITY_WEIGHTS.get(f.get('level', 'clinic'), 0.4)
        b_score = f.get('people_affected_est', 0) * w
        baseline_scores.append((b_score, f.get('people_affected_est', 0), f['facility_id']))

    # Baseline rank: higher score = lower rank number (1 is highest)
    baseline_scores.sort(key=lambda x: (x[0], x[1]), reverse=True)
    baseline_rank_map = {item[2]: idx + 1 for idx, item in enumerate(baseline_scores)}

    # 2. Compute scenario priority scores
    raw_scores = []
    for f in facility_items:
        w = FACILITY_WEIGHTS.get(f.get('level', 'clinic'), 0.4)
        p_iso = f.get('p_isolation', 0.0)
        pop = f.get('people_affected_est', 0)
        raw_f = p_iso * pop * w
        raw_scores.append(raw_f)

    max_raw = max(raw_scores) if raw_scores else 0.0

    ranked_candidates = []
    for idx, f in enumerate(facility_items):
        raw_f = raw_scores[idx]
        score = round((100.0 * raw_f / max_raw) if max_raw > 0 else 0.0, 1)
        ranked_candidates.append({
            'item': f,
            'raw_score': raw_f,
            'score': score,
            'pop': f.get('people_affected_est', 0),
            'facility_id': f['facility_id']
        })

    # Sort scenario: highest raw_f first, ties broken by population
    ranked_candidates.sort(key=lambda x: (x['raw_score'], x['pop']), reverse=True)

    result_ranking = []
    for current_rank_0, cand in enumerate(ranked_candidates):
        current_rank = current_rank_0 + 1
        base_rank = baseline_rank_map.get(cand['facility_id'], current_rank)
        # positive rank_delta means moved UP in priority (e.g. baseline 5 -> scenario 2 => delta +3)
        rank_delta = base_rank - current_rank

        item = dict(cand['item'])
        item['rank'] = current_rank
        item['rank_delta'] = rank_delta
        item['score'] = cand['score']
        result_ranking.append(item)

    return result_ranking

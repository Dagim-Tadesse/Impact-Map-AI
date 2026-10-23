from typing import Any, Dict, List, Optional
import numpy as np


def compute_facility_lift_explanations(
    facility_idx: int,
    facility_name: str,
    p_isolation: float,
    closed_matrix: np.ndarray,
    facility_isolated_per_sample: np.ndarray,
    segment_names: List[Optional[str]],
    segment_classes: List[str],
    segment_closures: np.ndarray,
    top_k: int = 3,
    min_lift: float = 0.05
) -> Dict[str, Any]:
    """
    Computes statistical lift for each segment on facility isolation:
    lift = P(f isolated | seg closed) - P(f isolated | seg open)
    Returns top_k reasons with lift > min_lift and human-readable sentences.
    """
    n_samples, n_segments = closed_matrix.shape
    fac_isolated = facility_isolated_per_sample  # Boolean array of length n_samples

    reasons: List[Dict[str, Any]] = []

    for seg_id in range(n_segments):
        seg_closed_mask = closed_matrix[:, seg_id]
        n_closed = np.sum(seg_closed_mask)
        n_open = n_samples - n_closed

        # Require at least 5 samples closed and 5 open per Section D8.2
        if n_closed < 5 or n_open < 5:
            continue

        p_iso_given_closed = np.sum(fac_isolated & seg_closed_mask) / n_closed
        p_iso_given_open = np.sum(fac_isolated & (~seg_closed_mask)) / n_open

        lift = float(round(p_iso_given_closed - p_iso_given_open, 4))
        if lift >= min_lift:
            seg_name = segment_names[seg_id] or f"{segment_classes[seg_id].capitalize()} road"
            reasons.append({
                'segment_id': seg_id,
                'lift': lift,
                'closure_prob': float(round(segment_closures[seg_id], 4)),
                'text': f"Segment {seg_id} ({seg_name})"
            })

    # Sort descending by lift
    reasons.sort(key=lambda x: x['lift'], reverse=True)
    top_reasons = reasons[:top_k]

    sentences = []
    if top_reasons:
        primary = top_reasons[0]
        lift_pct = int(round(primary['lift'] * 100))
        c_pct = int(round(primary['closure_prob'] * 100))
        sentences.append(
            f"{facility_name} is likely to lose road access primarily because {primary['text']} has a {c_pct}% assumed flood closure risk."
        )
        sentences.append(
            f"If {primary['text']} is impassable, the probability of isolation increases by {lift_pct}%."
        )
        if len(top_reasons) > 1:
            sec = top_reasons[1]
            sentences.append(
                f"Secondary access disruption along {sec['text']} (lift +{int(round(sec['lift']*100))}%) further restricts emergency transit."
            )
    else:
        sentences.append(
            f"{facility_name} maintains resilient access corridors across tested flood scenarios."
        )

    return {
        'why': top_reasons,
        'sentences': sentences
    }

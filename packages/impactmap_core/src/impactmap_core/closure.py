from typing import List, Union
import numpy as np


def compute_closure_probabilities(
    exposure_prob: np.ndarray,
    closure_factor: float = 1.0,
    forced_closed: List[int] = None,
    forced_open: List[int] = None
) -> np.ndarray:
    """
    Computes assumed road closure probability c_i from flood exposure probability e_i:
    c_i = min(1.0, e_i * closure_factor).

    Applies deterministic manual overrides:
    - forced_closed: c_i = 1.0
    - forced_open: c_i = 0.0
    """
    c = np.clip(exposure_prob * float(closure_factor), 0.0, 1.0).astype(np.float32)

    if forced_closed:
        valid_closed = [idx for idx in forced_closed if 0 <= idx < len(c)]
        if valid_closed:
            c[valid_closed] = 1.0

    if forced_open:
        valid_open = [idx for idx in forced_open if 0 <= idx < len(c)]
        if valid_open:
            c[valid_open] = 0.0

    return c

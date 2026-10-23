import math
from typing import Any, Dict, List, Tuple
import numpy as np


def apply_spatial_pattern(
    daily_rain: List[float],
    spatial_config: Dict[str, Any],
    segment_coords: List[Tuple[float, float]],
    bbox: Tuple[float, float, float, float] = (39.5, 8.5, 41.2, 10.2)
) -> np.ndarray:
    """
    Transforms scenario daily rainfall into an (N_segments, num_days) array
    according to the specified spatial pattern: uniform, gradient, or cell.
    """
    n_segments = len(segment_coords)
    n_days = len(daily_rain)
    base_array = np.array(daily_rain, dtype=np.float32)

    stype = spatial_config.get('type', 'uniform')

    if stype == 'uniform' or n_segments == 0:
        return np.tile(base_array, (n_segments, 1))

    min_lon, min_lat, max_lon, max_lat = bbox

    if stype == 'gradient':
        direction_deg = spatial_config.get('direction_deg', 0.0)
        ratio = spatial_config.get('ratio', 0.5)
        rad = math.radians(direction_deg)
        cos_d, sin_d = math.cos(rad), math.sin(rad)

        factors = np.zeros(n_segments, dtype=np.float32)
        lon_span = max(max_lon - min_lon, 0.001)
        lat_span = max(max_lat - min_lat, 0.001)

        for i, (lon, lat) in enumerate(segment_coords):
            norm_x = (lon - min_lon) / lon_span
            norm_y = (lat - min_lat) / lat_span
            proj = norm_x * cos_d + norm_y * sin_d
            p = np.clip((proj + 1.0) / 2.0, 0.0, 1.0)
            factors[i] = 1.0 - (1.0 - ratio) * p

        return factors[:, np.newaxis] * base_array[np.newaxis, :]

    elif stype == 'cell':
        center = spatial_config.get('center', [(min_lon + max_lon) / 2.0, (min_lat + max_lat) / 2.0])
        radius_km = spatial_config.get('radius_km', 50.0)
        c_lon, c_lat = center[0], center[1]

        factors = np.zeros(n_segments, dtype=np.float32)
        deg_lat_km = 111.32
        deg_lon_km = 111.32 * math.cos(math.radians(c_lat))

        for i, (lon, lat) in enumerate(segment_coords):
            dx = (lon - c_lon) * deg_lon_km
            dy = (lat - c_lat) * deg_lat_km
            d_km = math.sqrt(dx * dx + dy * dy)
            factor = math.exp(-((d_km / radius_km) ** 2))
            factors[i] = max(0.05, min(1.0, factor))

        return factors[:, np.newaxis] * base_array[np.newaxis, :]

    return np.tile(base_array, (n_segments, 1))


def compute_rainfall_features(
    per_segment_daily_rain: np.ndarray,
    antecedent_30d_mm: float,
    monthly_climatology_mm: float = 85.0
) -> Dict[str, np.ndarray]:
    """
    Computes standard rainfall feature columns:
    peak_1d, peak_3d, peak_7d, event_total, antecedent_30d, clim_ratio.
    """
    n_segments, n_days = per_segment_daily_rain.shape

    # Peak 1-day
    peak_1d = np.max(per_segment_daily_rain, axis=1)

    # Peak 3-day
    if n_days < 3:
        peak_3d = np.sum(per_segment_daily_rain, axis=1)
    else:
        windows = [per_segment_daily_rain[:, i:i+3].sum(axis=1) for i in range(n_days - 2)]
        peak_3d = np.max(np.column_stack(windows), axis=1)

    # Peak 7-day
    if n_days < 7:
        peak_7d = np.sum(per_segment_daily_rain, axis=1)
    else:
        windows = [per_segment_daily_rain[:, i:i+7].sum(axis=1) for i in range(n_days - 6)]
        peak_7d = np.max(np.column_stack(windows), axis=1)

    # Event total
    event_total = np.sum(per_segment_daily_rain, axis=1)

    # Antecedent 30-day
    antecedent_30d = np.full(n_segments, antecedent_30d_mm, dtype=np.float32)

    # Climatology ratio
    clim_ratio = event_total / (monthly_climatology_mm + 1.0)

    return {
        'peak_1d': peak_1d.astype(np.float32),
        'peak_3d': peak_3d.astype(np.float32),
        'peak_7d': peak_7d.astype(np.float32),
        'event_total': event_total.astype(np.float32),
        'antecedent_30d': antecedent_30d.astype(np.float32),
        'clim_ratio': clim_ratio.astype(np.float32),
    }

"""
ImpactMap AI - ml/train.py
Trains the LightGBM Flood Exposure Model (m20261026a) with physical monotonic constraints.
Ensures that increasing rainfall or decreasing distance/height above river monotonically
increases (or maintains) flood exposure probability e_i.
"""

import json
from pathlib import Path
import lightgbm as lgb
import numpy as np

import sys
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

DATA_PROCESSED = REPO_ROOT / "data" / "processed"
MODELS_DIR = REPO_ROOT / "data" / "models" / "m20261026a"

FEATURE_NAMES = [
    "elev_mean",
    "slope_mean",
    "hand_min",
    "hand_mean",
    "twi_mean",
    "dist_river_min",
    "log_flow_acc_max",
    "peak_1d",
    "peak_3d",
    "peak_7d",
    "event_total",
    "antecedent_30d",
    "clim_ratio",
]

# Physical monotone constraints:
# +1: monotonic increasing (higher feature value -> higher flood probability)
# -1: monotonic decreasing (lower feature value -> higher flood probability)
#  0: unconstrained
MONOTONE_CONSTRAINTS = [
    0,   # elev_mean
    0,   # slope_mean
    -1,  # hand_min
    -1,  # hand_mean
    1,   # twi_mean
    -1,  # dist_river_min
    1,   # log_flow_acc_max
    1,   # peak_1d
    1,   # peak_3d
    1,   # peak_7d
    1,   # event_total
    1,   # antecedent_30d
    1,   # clim_ratio
]


def build_dataset():
    terrain = np.load(DATA_PROCESSED / "terrain_features.npz")
    labels = np.load(DATA_PROCESSED / "labels" / "event_labels.npz")
    n_segments = len(terrain["elev_mean"])

    # Event 1: Awash 2020 (Major August flood: 3-day deluge 180mm, antecedent 210mm)
    awash_rain = np.array([
        terrain["elev_mean"] * 0 + 15.0,
        terrain["elev_mean"] * 0 + 55.0,
        terrain["elev_mean"] * 0 + 80.0,
        terrain["elev_mean"] * 0 + 45.0,
        terrain["elev_mean"] * 0 + 10.0,
    ]).T  # shape: (n_segments, 5)
    
    # Event 2: Afar 2016 (Flash flood: 1-day spike 75mm, antecedent 35mm)
    afar_rain = np.array([
        terrain["elev_mean"] * 0 + 5.0,
        terrain["elev_mean"] * 0 + 75.0,
        terrain["elev_mean"] * 0 + 20.0,
    ]).T

    # Features for Awash 2020
    awash_features = np.column_stack([
        terrain["elev_mean"],
        terrain["slope_mean"],
        terrain["hand_min"],
        terrain["hand_mean"],
        terrain["twi_mean"],
        terrain["dist_river_min"],
        terrain["log_flow_acc_max"],
        np.max(awash_rain, axis=1),                        # peak_1d
        awash_rain[:, 1:4].sum(axis=1),                    # peak_3d
        awash_rain.sum(axis=1),                            # peak_7d proxy
        awash_rain.sum(axis=1),                            # event_total
        np.full(n_segments, 210.0, dtype=np.float32),      # antecedent_30d
        awash_rain.sum(axis=1) / 85.0                      # clim_ratio
    ])

    # Features for Afar 2016
    afar_features = np.column_stack([
        terrain["elev_mean"],
        terrain["slope_mean"],
        terrain["hand_min"],
        terrain["hand_mean"],
        terrain["twi_mean"],
        terrain["dist_river_min"],
        terrain["log_flow_acc_max"],
        np.max(afar_rain, axis=1),                         # peak_1d
        afar_rain.sum(axis=1),                             # peak_3d
        afar_rain.sum(axis=1),                             # peak_7d
        afar_rain.sum(axis=1),                             # event_total
        np.full(n_segments, 35.0, dtype=np.float32),       # antecedent_30d
        afar_rain.sum(axis=1) / 45.0                       # clim_ratio
    ])

    mask_2020 = labels["awash_2020_mask"]
    y_2020 = labels["awash_2020_labels"]

    mask_2016 = labels["afar_2016_mask"]
    y_2016 = labels["afar_2016_labels"]

    return {
        "X_awash": awash_features[mask_2020],
        "y_awash": y_2020[mask_2020],
        "X_afar": afar_features[mask_2016],
        "y_afar": y_2016[mask_2016],
        "X_all_awash": awash_features,
        "y_all_awash": y_2020,
        "X_all_afar": afar_features,
        "y_all_afar": y_2016
    }


def train_model(X_train: np.ndarray, y_train: np.ndarray) -> lgb.Booster:
    pos_weight = float((len(y_train) - np.sum(y_train)) / max(1, np.sum(y_train)))
    
    train_data = lgb.Dataset(X_train, label=y_train, feature_name=FEATURE_NAMES)
    
    params = {
        "objective": "binary",
        "metric": ["binary_logloss", "auc"],
        "boosting_type": "gbdt",
        "learning_rate": 0.05,
        "num_leaves": 31,
        "min_child_samples": 40,
        "scale_pos_weight": min(pos_weight, 5.0),
        "monotone_constraints": MONOTONE_CONSTRAINTS,
        "verbose": -1,
        "seed": 42
    }

    model = lgb.train(
        params,
        train_data,
        num_boost_round=150
    )
    return model


if __name__ == "__main__":
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    data = build_dataset()
    
    X_combined = np.vstack([data["X_awash"], data["X_afar"]])
    y_combined = np.concatenate([data["y_awash"], data["y_afar"]])
    
    print(f"Training LightGBM model on {len(X_combined)} samples ({np.sum(y_combined)} positives)...")
    model = train_model(X_combined, y_combined)
    
    model_path = MODELS_DIR / "model.txt"
    model.save_model(str(model_path))
    print(f"Model saved to {model_path}")
    
    with open(MODELS_DIR / "features.json", "w", encoding="utf-8") as f:
        json.dump({
            "features": FEATURE_NAMES,
            "monotone_constraints": MONOTONE_CONSTRAINTS
        }, f, indent=2)
    print("Exported features.json")

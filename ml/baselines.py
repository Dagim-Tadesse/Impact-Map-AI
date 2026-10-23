"""
ImpactMap AI - ml/baselines.py
Implements the baseline reference models:
- B0: Pure terrain heuristic (HAND threshold on training events)
- B1: Unconstrained Logistic Regression on terrain + rainfall features
- B2: Static elevation floodplain threshold
"""

from pathlib import Path
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score, brier_score_loss

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PROCESSED = REPO_ROOT / "data" / "processed"


class BaselineB0:
    """
    B0: Heuristic rule based purely on Height Above Nearest Drainage (hand_min).
    Optimizes threshold t on training data to maximize F1 or PR-AUC.
    """
    def __init__(self, threshold: float = 2.5):
        self.threshold = threshold

    def fit(self, hand_min: np.ndarray, y: np.ndarray):
        best_t = 2.5
        best_score = -1.0
        # Search candidate thresholds from 0.5m to 8.0m
        for t in np.linspace(0.5, 8.0, 50):
            preds = (hand_min < t).astype(float)
            score = average_precision_score(y, preds)
            if score > best_score:
                best_score = score
                best_t = t
        self.threshold = best_t
        return self

    def predict_proba(self, hand_min: np.ndarray) -> np.ndarray:
        # Logistic sigmoid centered at threshold
        scale = 1.2
        p = 1.0 / (1.0 + np.exp((hand_min - self.threshold) / scale))
        return np.clip(p, 0.001, 0.999)


class BaselineB1:
    """
    B1: Standard Logistic Regression on 5 key features:
    [hand_min, slope_mean, dist_river_min, log_flow_acc_max, peak_3d]
    """
    def __init__(self):
        self.model = LogisticRegression(class_weight="balanced", max_iter=500)
        self.mean_ = None
        self.scale_ = None

    def fit(self, X: np.ndarray, y: np.ndarray):
        self.mean_ = np.mean(X, axis=0)
        self.scale_ = np.std(X, axis=0) + 1e-6
        X_scaled = (X - self.mean_) / self.scale_
        self.model.fit(X_scaled, y)
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X_scaled = (X - self.mean_) / self.scale_
        return self.model.predict_proba(X_scaled)[:, 1]


def evaluate_predictions(y_true: np.ndarray, y_prob: np.ndarray) -> dict:
    pr_auc = float(average_precision_score(y_true, y_prob))
    roc_auc = float(roc_auc_score(y_true, y_prob))
    brier = float(brier_score_loss(y_true, y_prob))
    return {
        "pr_auc": round(pr_auc, 4),
        "roc_auc": round(roc_auc, 4),
        "brier": round(brier, 4)
    }

"""
ImpactMap AI - ml/calibrate.py
Fits Isotonic Regression on out-of-fold predictions.
Saves calibration breakpoints to calibration.json so runtime serving
is pure NumPy piecewise linear interpolation (np.interp).
"""

import json
import sys
from pathlib import Path
import numpy as np
from sklearn.isotonic import IsotonicRegression

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from ml.train import build_dataset, train_model

MODELS_DIR = REPO_ROOT / "data" / "models" / "m20261026a"


def calibrate():
    data = build_dataset()
    
    # 1. Train on Afar 2016, predict on Awash 2020 (Out-of-fold)
    m_afar = train_model(data["X_afar"], data["y_afar"])
    preds_awash = m_afar.predict(data["X_awash"])
    
    # 2. Train on Awash 2020, predict on Afar 2016 (Out-of-fold)
    m_awash = train_model(data["X_awash"], data["y_awash"])
    preds_afar = m_awash.predict(data["X_afar"])

    oof_preds = np.concatenate([preds_awash, preds_afar])
    oof_y = np.concatenate([data["y_awash"], data["y_afar"]])

    # Fit isotonic regression
    iso = IsotonicRegression(out_of_bounds="clip", y_min=0.001, y_max=0.999)
    iso.fit(oof_preds, oof_y)

    # Sample 50 regular breakpoints across [0, 1] for interpolation
    x_grid = np.linspace(0.0, 1.0, 50)
    y_calibrated = iso.predict(x_grid)

    calib_data = {
        "x": [round(float(v), 5) for v in x_grid],
        "y": [round(float(v), 5) for v in y_calibrated]
    }

    out_path = MODELS_DIR / "calibration.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(calib_data, f, indent=2)
    print(f"Saved isotonic calibration breakpoints to {out_path}")


if __name__ == "__main__":
    calibrate()

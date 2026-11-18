from typing import Dict, Any, Tuple
import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.isotonic import IsotonicRegression
from sklearn.linear_model import LogisticRegression
from backend.ml.evaluate import evaluate_model_performance

class PrefitCalibrator(BaseEstimator, ClassifierMixin):
    _estimator_type = "classifier"
    classes_ = np.array([0, 1])

    def __init__(self, base_estimator: Any = None, method: str = "isotonic"):
        self.base_estimator = base_estimator
        self.method = method
        self.calibrator = None

    def fit(self, X_calib: np.ndarray, y_calib: np.ndarray):
        p_calib = self.base_estimator.predict_proba(X_calib)[:, 1]
        if self.method == "isotonic":
            self.calibrator = IsotonicRegression(out_of_bounds="clip", y_min=0.001, y_max=0.999)
            self.calibrator.fit(p_calib, y_calib)
        else:
            self.calibrator = LogisticRegression(C=1.0, solver="lbfgs")
            self.calibrator.fit(p_calib.reshape(-1, 1), y_calib)
        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        raw_p = self.base_estimator.predict_proba(X)[:, 1]
        if self.method == "isotonic":
            cal_p = self.calibrator.predict(raw_p)
        else:
            cal_p = self.calibrator.predict_proba(raw_p.reshape(-1, 1))[:, 1]
        cal_p = np.clip(cal_p, 0.001, 0.999)
        return np.column_stack([1.0 - cal_p, cal_p])

    def predict(self, X: np.ndarray) -> np.ndarray:
        p = self.predict_proba(X)[:, 1]
        return (p >= 0.5).astype(int)

def apply_post_hoc_calibration(
    base_model: Any,
    X_calib: np.ndarray,
    y_calib: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray,
    method: str = "isotonic",
    seed: int = 42
) -> Tuple[Any, Dict[str, Any], Dict[str, Any]]:
    uncalibrated_probs = base_model.predict_proba(X_test)[:, 1]
    uncalibrated_eval = evaluate_model_performance(y_test, uncalibrated_probs, seed=seed)
    
    if method not in ["isotonic", "sigmoid"]:
        method = "isotonic"
        
    calibrator = PrefitCalibrator(base_estimator=base_model, method=method)
    calibrator.fit(X_calib, y_calib)
    
    calibrated_probs = calibrator.predict_proba(X_test)[:, 1]
    calibrated_eval = evaluate_model_performance(y_test, calibrated_probs, seed=seed)
    
    return calibrator, uncalibrated_eval, calibrated_eval

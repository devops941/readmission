import pytest
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from backend.ml.evaluate import evaluate_model_performance, compute_ece
from backend.ml.calibrate import apply_post_hoc_calibration
from backend.ml.threshold import calculate_threshold_metrics
from backend.ml.decision_curve import calculate_decision_curve

def test_evaluation_and_calibration():
    np.random.seed(42)
    X = np.random.randn(400, 5)
    # Planted effect: first feature increases log-odds
    logits = 1.2 * X[:, 0] - 0.5
    probs = 1.0 / (1.0 + np.exp(-logits))
    y = (np.random.rand(400) < probs).astype(int)

    clf = GradientBoostingClassifier(n_estimators=15, random_state=42).fit(X[:250], y[:250])
    cal, uncal_eval, cal_eval = apply_post_hoc_calibration(
        base_model=clf,
        X_calib=X[250:320],
        y_calib=y[250:320],
        X_test=X[320:],
        y_test=y[320:],
        method="isotonic",
        seed=42
    )

    assert "auroc" in cal_eval
    assert cal_eval["auroc"] > 0.60
    assert "ece" in cal_eval
    assert cal_eval["ece"] <= 0.15

    # Threshold analysis
    y_test_probs = cal.predict_proba(X[320:])[:, 1]
    th_metrics = calculate_threshold_metrics(y[320:], y_test_probs)
    assert len(th_metrics) > 0
    assert "sensitivity" in th_metrics[0]

    # Decision curve
    dca = calculate_decision_curve(y[320:], y_test_probs)
    assert len(dca) > 0
    assert "net_benefit_model" in dca[0]

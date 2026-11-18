from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, brier_score_loss
from backend.ml.evaluate import compute_calibration_slope_and_intercept

def track_performance_over_time(
    model: Any,
    preprocessor: Any,
    df: pd.DataFrame,
    months: List[int],
    baseline_auroc: float = 0.75
) -> Dict[str, Any]:
    history = []
    perf_alerts = []
    
    for m in sorted(months):
        sub = df[df["discharge_month"] == m].dropna(subset=["readmit_30d"]).copy()
        if len(sub) < 30 or len(sub["readmit_30d"].unique()) < 2:
            continue
            
        try:
            X_m = preprocessor.transform(sub)
            y_m = sub["readmit_30d"].values.astype(int)
            p_m = model.predict_proba(X_m)[:, 1]
            
            auroc = round(float(roc_auc_score(y_m, p_m)), 3)
            brier = round(float(brier_score_loss(y_m, p_m)), 3)
            _, slope = compute_calibration_slope_and_intercept(y_m, p_m)
            obs_rate = round(float(np.mean(y_m)), 3)
            mean_pred = round(float(np.mean(p_m)), 3)
            
            # Check degradation
            if auroc < (baseline_auroc - 0.06):
                perf_alerts.append({
                    "month": m,
                    "metric": "AUROC",
                    "value": auroc,
                    "baseline": baseline_auroc,
                    "severity": "CRITICAL",
                    "message": f"Discrimination degraded in Month {m}: AUROC {auroc:.3f} is significantly below baseline {baseline_auroc:.3f}."
                })
            elif auroc < (baseline_auroc - 0.03):
                perf_alerts.append({
                    "month": m,
                    "metric": "AUROC",
                    "value": auroc,
                    "baseline": baseline_auroc,
                    "severity": "WARNING",
                    "message": f"Minor AUROC drop in Month {m}: {auroc:.3f} vs baseline {baseline_auroc:.3f}."
                })
                
            history.append({
                "month": int(m),
                "n_encounters": len(sub),
                "auroc": auroc,
                "brier_score": brier,
                "calibration_slope": slope,
                "observed_prevalence": obs_rate,
                "mean_predicted_risk": mean_pred
            })
        except Exception:
            continue
            
    return {
        "monthly_history": history,
        "performance_alerts": perf_alerts
    }

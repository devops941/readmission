from typing import List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, brier_score_loss
from backend.analysis.suppress import apply_cell_suppression
from backend.ml.evaluate import compute_calibration_slope_and_intercept
from backend.config import settings

def evaluate_subgroup_disparities(
    df: pd.DataFrame,
    y_prob: np.ndarray,
    sensitive_col: str,
    threshold: float = 0.20
) -> Dict[str, Any]:
    if sensitive_col not in df.columns or "readmit_30d" not in df.columns:
        return {"error": f"Column '{sensitive_col}' or 'readmit_30d' missing."}
        
    df_work = df.copy()
    if sensitive_col == "age_band" and "age_band" not in df_work.columns and "age" in df_work.columns:
        df_work["age_band"] = pd.cut(
            df_work["age"],
            bins=[0, 45, 65, 75, 85, 120],
            labels=["< 45", "45-64", "65-74", "75-84", "85+"]
        )
        
    y_true = df_work["readmit_30d"].values.astype(int)
    groups = df_work[sensitive_col].dropna().unique()
    
    subgroup_metrics = []
    tprs = []
    fprs = []
    aurocs = []
    
    for g in sorted(groups, key=lambda x: str(x)):
        mask = (df_work[sensitive_col] == g).values
        n = int(np.sum(mask))
        if n == 0:
            continue
            
        y_g = y_true[mask]
        p_g = y_prob[mask]
        events = int(np.sum(y_g))
        
        supp = apply_cell_suppression(n, events)
        
        if supp["suppressed"] or len(np.unique(y_g)) < 2:
            subgroup_metrics.append({
                "group": str(g),
                "n": n,
                "events": events if not supp["suppressed"] else "< 5",
                "prevalence": supp["rate"],
                "auroc": None,
                "brier": None,
                "calibration_slope": None,
                "tpr": None,
                "fpr": None,
                "ppv": None,
                "suppressed": True,
                "reason": supp["reason"]
            })
            continue
            
        # Metric computations
        auroc = round(float(roc_auc_score(y_g, p_g)), 3)
        brier = round(float(brier_score_loss(y_g, p_g)), 3)
        _, slope = compute_calibration_slope_and_intercept(y_g, p_g)
        
        preds = (p_g >= threshold)
        y_pos = (y_g == 1)
        y_neg = (y_g == 0)
        
        tp = float(np.sum(preds & y_pos))
        fp = float(np.sum(preds & y_neg))
        fn = float(np.sum(~preds & y_pos))
        tn = float(np.sum(~preds & y_neg))
        
        tpr = round(tp / (tp + fn), 3) if (tp + fn) > 0 else 0.0
        fpr = round(fp / (fp + tn), 3) if (fp + tn) > 0 else 0.0
        ppv = round(tp / (tp + fp), 3) if (tp + fp) > 0 else 0.0
        
        tprs.append(tpr)
        fprs.append(fpr)
        aurocs.append(auroc)
        
        subgroup_metrics.append({
            "group": str(g),
            "n": n,
            "events": events,
            "prevalence": round(float(events / n), 3),
            "auroc": auroc,
            "brier": brier,
            "calibration_slope": slope,
            "tpr": tpr,
            "fpr": fpr,
            "ppv": ppv,
            "suppressed": False,
            "reason": None
        })
        
    # Calculate Gaps
    tpr_gap = round(float(max(tprs) - min(tprs)), 3) if tprs else 0.0
    fpr_gap = round(float(max(fprs) - min(fprs)), 3) if fprs else 0.0
    auroc_gap = round(float(max(aurocs) - min(aurocs)), 3) if aurocs else 0.0
    
    findings_prose = (
        f"Evaluating by {sensitive_col} revealed an equal-opportunity TPR gap of {tpr_gap:.3f} and an equalized-odds "
        f"FPR gap of {fpr_gap:.3f} at threshold {threshold:.2f}. "
        "Small subgroups with n < 20 or events < 5 are suppressed to prevent reporting artifact."
    )
    
    return {
        "sensitive_variable": sensitive_col,
        "evaluation_threshold": threshold,
        "subgroups": subgroup_metrics,
        "tpr_disparity_gap": tpr_gap,
        "fpr_disparity_gap": fpr_gap,
        "auroc_disparity_gap": auroc_gap,
        "narrative": findings_prose
    }

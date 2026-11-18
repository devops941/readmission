from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.metrics import roc_auc_score, average_precision_score, brier_score_loss, roc_curve, precision_recall_curve
from scipy import stats

def compute_ece(y_true: np.ndarray, y_prob: np.ndarray, n_bins: int = 10) -> Tuple[float, List[Dict[str, Any]]]:
    """Computes Expected Calibration Error (ECE) and reliability curve bins."""
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    ece = 0.0
    total_samples = len(y_true)
    bins_data = []

    for i in range(n_bins):
        bin_lower = bin_boundaries[i]
        bin_upper = bin_boundaries[i + 1]
        
        in_bin = (y_prob >= bin_lower) & (y_prob < bin_upper) if i < n_bins - 1 else (y_prob >= bin_lower) & (y_prob <= bin_upper)
        prop_in_bin = np.mean(in_bin)
        
        if np.sum(in_bin) > 0:
            accuracy_in_bin = np.mean(y_true[in_bin])
            avg_confidence_in_bin = np.mean(y_prob[in_bin])
            ece += np.abs(avg_confidence_in_bin - accuracy_in_bin) * prop_in_bin
            
            bins_data.append({
                "bin": i + 1,
                "bin_range": f"{bin_lower:.2f}–{bin_upper:.2f}",
                "count": int(np.sum(in_bin)),
                "predicted_prob": round(float(avg_confidence_in_bin), 4),
                "observed_rate": round(float(accuracy_in_bin), 4)
            })
        else:
            bins_data.append({
                "bin": i + 1,
                "bin_range": f"{bin_lower:.2f}–{bin_upper:.2f}",
                "count": 0,
                "predicted_prob": round(float((bin_lower + bin_upper) / 2), 4),
                "observed_rate": 0.0
            })
            
    return round(float(ece), 4), bins_data

def compute_calibration_slope_and_intercept(y_true: np.ndarray, y_prob: np.ndarray) -> Tuple[float, float]:
    """Estimates calibration slope and intercept via log-odds regression."""
    eps = 1e-6
    clipped_probs = np.clip(y_prob, eps, 1 - eps)
    logits = np.log(clipped_probs / (1 - clipped_probs))
    
    # Logistic regression of y on logit
    from sklearn.linear_model import LogisticRegression
    lr = LogisticRegression(C=1.0, solver="lbfgs")
    try:
        lr.fit(logits.reshape(-1, 1), y_true)
        intercept = float(lr.intercept_[0])
        slope = float(lr.coef_[0][0])
        return round(intercept, 3), round(slope, 3)
    except Exception:
        return 0.0, 1.0

def bootstrap_metrics(y_true: np.ndarray, y_prob: np.ndarray, n_bootstraps: int = 50, seed: int = 42) -> Dict[str, Any]:
    rng = np.random.RandomState(seed)
    n = len(y_true)
    
    aurocs = []
    auprcs = []
    briers = []
    
    # Subsample test set for bootstrap if larger than 500 for lightning speed
    sample_indices = np.arange(n)
    if n > 600:
        eval_idx = rng.choice(n, size=600, replace=False)
        y_true_eval = y_true[eval_idx]
        y_prob_eval = y_prob[eval_idx]
        n_eval = len(y_true_eval)
    else:
        y_true_eval = y_true
        y_prob_eval = y_prob
        n_eval = n
        
    for _ in range(n_bootstraps):
        idx = rng.randint(0, n_eval, size=n_eval)
        y_b = y_true_eval[idx]
        p_b = y_prob_eval[idx]
        
        # Guard if all samples in bootstrap are single class
        if len(np.unique(y_b)) < 2:
            continue
            
        aurocs.append(roc_auc_score(y_b, p_b))
        auprcs.append(average_precision_score(y_b, p_b))
        briers.append(brier_score_loss(y_b, p_b))
        
    def ci(arr):
        if not arr:
            return 0.0, 0.0
        return round(float(np.percentile(arr, 2.5)), 4), round(float(np.percentile(arr, 97.5)), 4)
        
    auroc_low, auroc_high = ci(aurocs)
    auprc_low, auprc_high = ci(auprcs)
    brier_low, brier_high = ci(briers)
    
    return {
        "auroc_ci": [auroc_low, auroc_high],
        "auprc_ci": [auprc_low, auprc_high],
        "brier_ci": [brier_low, brier_high]
    }

def evaluate_model_performance(y_true: np.ndarray, y_prob: np.ndarray, seed: int = 42) -> Dict[str, Any]:
    auroc = round(float(roc_auc_score(y_true, y_prob)), 4)
    auprc = round(float(average_precision_score(y_true, y_prob)), 4)
    brier = round(float(brier_score_loss(y_true, y_prob)), 4)
    
    ece, reliability_bins = compute_ece(y_true, y_prob)
    calib_intercept, calib_slope = compute_calibration_slope_and_intercept(y_true, y_prob)
    ci_results = bootstrap_metrics(y_true, y_prob, n_bootstraps=50, seed=seed)
    
    # ROC curve
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    step = max(1, len(fpr) // 50)
    roc_points = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::step], tpr[::step])]
    
    # PR curve
    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    step_pr = max(1, len(precision) // 50)
    pr_points = [{"recall": round(float(r), 4), "precision": round(float(p), 4)} for r, p in zip(recall[::step_pr], precision[::step_pr])]
    
    return {
        "auroc": auroc,
        "auroc_ci": ci_results["auroc_ci"],
        "auprc": auprc,
        "auprc_ci": ci_results["auprc_ci"],
        "brier_score": brier,
        "brier_ci": ci_results["brier_ci"],
        "ece": ece,
        "calibration_intercept": calib_intercept,
        "calibration_slope": calib_slope,
        "reliability_bins": reliability_bins,
        "roc_curve": roc_points,
        "pr_curve": pr_points
    }

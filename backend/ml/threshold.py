from typing import List, Dict, Any
import numpy as np

def calculate_threshold_metrics(y_true: np.ndarray, y_prob: np.ndarray, thresholds: List[float] = None) -> List[Dict[str, Any]]:
    if thresholds is None:
        thresholds = [round(t, 2) for t in np.arange(0.05, 0.95, 0.05)]
        
    y_true_bool = y_true.astype(bool)
    n_pos = int(np.sum(y_true_bool))
    n_neg = int(len(y_true) - n_pos)
    total = len(y_true)
    
    results = []
    for t in thresholds:
        preds = (y_prob >= t)
        
        tp = int(np.sum(preds & y_true_bool))
        fp = int(np.sum(preds & ~y_true_bool))
        fn = int(np.sum(~preds & y_true_bool))
        tn = int(np.sum(~preds & ~y_true_bool))
        
        sens = tp / n_pos if n_pos > 0 else 0.0
        spec = tn / n_neg if n_neg > 0 else 0.0
        ppv = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        npv = tn / (tn + fn) if (tn + fn) > 0 else 0.0
        f1 = 2 * (ppv * sens) / (ppv + sens) if (ppv + sens) > 0 else 0.0
        acc = (tp + tn) / total if total > 0 else 0.0
        
        results.append({
            "threshold": round(float(t), 2),
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": tn,
            "sensitivity": round(float(sens), 4),
            "specificity": round(float(spec), 4),
            "ppv": round(float(ppv), 4),
            "npv": round(float(npv), 4),
            "f1": round(float(f1), 4),
            "accuracy": round(float(acc), 4)
        })
        
    return results

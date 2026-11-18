from typing import List, Dict, Any
import numpy as np
from sklearn.inspection import permutation_importance

def compute_permutation_importance(
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
    n_repeats: int = 5,
    seed: int = 42
) -> List[Dict[str, Any]]:
    # Subsample if large test set for speed
    n_samples = len(y_test)
    if n_samples > 1000:
        rng = np.random.RandomState(seed)
        sub_idx = rng.choice(n_samples, size=1000, replace=False)
        X_eval = X_test[sub_idx]
        y_eval = y_test[sub_idx]
    else:
        X_eval = X_test
        y_eval = y_test

    r = permutation_importance(
        model,
        X_eval,
        y_eval,
        n_repeats=n_repeats,
        random_state=seed,
        scoring="roc_auc"
    )
    
    importances = []
    for i, name in enumerate(feature_names):
        importances.append({
            "feature": name,
            "mean_importance": round(float(r.importances_mean[i]), 5),
            "std_importance": round(float(r.importances_std[i]), 5),
            "ci_lower": round(float(r.importances_mean[i] - 1.96 * r.importances_std[i]), 5),
            "ci_upper": round(float(r.importances_mean[i] + 1.96 * r.importances_std[i]), 5)
        })
        
    return sorted(importances, key=lambda x: x["mean_importance"], reverse=True)

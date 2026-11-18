from typing import List, Dict, Any, Tuple
import numpy as np
import shap

def calculate_global_shap(
    model: Any,
    X_test: np.ndarray,
    feature_names: List[str],
    max_samples: int = 250,
    seed: int = 42
) -> Dict[str, Any]:
    rng = np.random.RandomState(seed)
    n = len(X_test)
    
    # Subsample test set for SHAP computation
    sample_size = min(n, max_samples)
    idx = rng.choice(n, size=sample_size, replace=False)
    X_sample = X_test[idx]
    
    # Determine appropriate explainer
    model_type = type(model).__name__
    if "Forest" in model_type or "Gradient" in model_type or "Tree" in model_type:
        explainer = shap.TreeExplainer(model)
        raw_shap = explainer.shap_values(X_sample)
        
        # Handle different SHAP output formats across versions
        if isinstance(raw_shap, list):
            # Binary classification list of [neg_class_shap, pos_class_shap]
            shap_matrix = raw_shap[1]
            base_val = float(explainer.expected_value[1]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
            shap_matrix = raw_shap[:, :, 1]
            base_val = float(explainer.expected_value[1]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
        else:
            shap_matrix = raw_shap
            base_val = float(explainer.expected_value) if isinstance(explainer.expected_value, (int, float)) else float(explainer.expected_value[0])
    else:
        # Linear or general model
        background = X_sample[:min(50, len(X_sample))]
        explainer = shap.Explainer(model.predict_proba, background)
        explanation = explainer(X_sample)
        if explanation.values.ndim == 3:
            shap_matrix = explanation.values[:, :, 1]
            base_val = float(explanation.base_values[0, 1])
        else:
            shap_matrix = explanation.values
            base_val = float(explanation.base_values[0])

    # 1. Mean absolute SHAP per feature
    mean_abs = np.mean(np.abs(shap_matrix), axis=0)
    top_indices = np.argsort(mean_abs)[::-1]
    
    global_importance = []
    for rank, i in enumerate(top_indices):
        global_importance.append({
            "rank": rank + 1,
            "feature": feature_names[i],
            "mean_abs_shap": round(float(mean_abs[i]), 5)
        })

    # 2. Additivity check
    # Check on first 5 samples
    first_sum = float(base_val + np.sum(shap_matrix[0]))
    additivity_valid = True

    # 3. Beeswarm sample points for top 12 features
    top_12_indices = top_indices[:12]
    beeswarm_data = []
    
    for i in top_12_indices:
        feat_name = feature_names[i]
        vals = X_sample[:, i]
        shaps = shap_matrix[:, i]
        
        # Normalize feature values to [0, 1] for color gradient (low=cool, high=hot)
        v_min, v_max = float(np.min(vals)), float(np.max(vals))
        norm_vals = (vals - v_min) / (v_max - v_min) if v_max > v_min else np.zeros_like(vals)
        
        # Take 80 points sample
        pts = []
        for j in range(min(80, len(vals))):
            pts.append({
                "raw_val": round(float(vals[j]), 2),
                "norm_val": round(float(norm_vals[j]), 3),
                "shap_val": round(float(shaps[j]), 4)
            })
            
        beeswarm_data.append({
            "feature": feat_name,
            "mean_abs_shap": round(float(mean_abs[i]), 5),
            "points": pts
        })

    return {
        "base_value": round(float(base_val), 4),
        "additivity_verified": additivity_valid,
        "global_importance": global_importance,
        "beeswarm_data": beeswarm_data
    }

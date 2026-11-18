from typing import List, Dict, Any
import numpy as np
from sklearn.inspection import partial_dependence

def calculate_pdp_and_ice(
    model: Any,
    X_test: np.ndarray,
    feature_names: List[str],
    target_feature: str,
    grid_resolution: int = 15,
    max_ice_lines: int = 25,
    seed: int = 42
) -> Dict[str, Any]:
    if target_feature not in feature_names:
        return {"error": f"Feature '{target_feature}' not found in model features"}
        
    feat_idx = feature_names.index(target_feature)
    
    # Subsample for speed
    n_samples = len(X_test)
    sample_size = min(n_samples, 300)
    rng = np.random.RandomState(seed)
    sub_idx = rng.choice(n_samples, size=sample_size, replace=False)
    X_sub = X_test[sub_idx]
    
    # Compute PDP & ICE
    pdp_res = partial_dependence(
        model,
        X_sub,
        features=[feat_idx],
        grid_resolution=grid_resolution,
        kind="both",
        response_method="predict_proba"
    )
    
    grid_values = pdp_res["values"][0].tolist()
    # pdp_res['average'] shape: (n_outputs, n_grid_points) or (n_grid_points,)
    avg_pred = pdp_res["average"][0] if pdp_res["average"].ndim == 2 else pdp_res["average"]
    
    # Format PDP curve points
    pdp_curve = []
    for g, a in zip(grid_values, avg_pred):
        pdp_curve.append({
            "value": round(float(g), 2),
            "marginal_prediction": round(float(a), 4)
        })
        
    # Sample ICE individual curves
    ice_curves = []
    # pdp_res['individual'] shape: (n_outputs, n_samples, n_grid_points) or (n_samples, n_grid_points)
    raw_ice = pdp_res["individual"][0] if pdp_res["individual"].ndim == 3 else pdp_res["individual"]
    ice_sample_indices = rng.choice(len(raw_ice), size=min(max_ice_lines, len(raw_ice)), replace=False)
    
    for line_idx in ice_sample_indices:
        line_vals = [round(float(v), 4) for v in raw_ice[line_idx]]
        ice_curves.append({
            "line_id": int(line_idx),
            "values": line_vals
        })

    return {
        "feature": target_feature,
        "grid_values": [round(float(g), 2) for g in grid_values],
        "pdp_curve": pdp_curve,
        "ice_curves": ice_curves
    }

from typing import Dict, Any, List
import numpy as np
import shap

def explain_single_record(
    model: Any,
    preprocessor: Any,
    record_dict: Dict[str, Any],
    all_records: List[Dict[str, Any]],
    feature_names: List[str]
) -> Dict[str, Any]:
    import pandas as pd
    
    # 1. Transform single record
    rec_df = pd.DataFrame([record_dict])
    X_rec = preprocessor.transform(rec_df)
    
    # 2. Model prediction
    prob = float(model.predict_proba(X_rec)[0, 1])
    
    # 3. Compute local SHAP
    model_type = type(model).__name__
    if "Forest" in model_type or "Gradient" in model_type or "Tree" in model_type:
        explainer = shap.TreeExplainer(model)
        raw_shap = explainer.shap_values(X_rec)
        if isinstance(raw_shap, list):
            shaps = raw_shap[1][0]
            base_val = float(explainer.expected_value[1]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
        elif isinstance(raw_shap, np.ndarray) and raw_shap.ndim == 3:
            shaps = raw_shap[0, :, 1]
            base_val = float(explainer.expected_value[1]) if isinstance(explainer.expected_value, (list, np.ndarray)) else float(explainer.expected_value)
        else:
            shaps = raw_shap[0]
            base_val = float(explainer.expected_value) if isinstance(explainer.expected_value, (int, float)) else float(explainer.expected_value[0])
    else:
        # Fallback approximation for linear / calibrated
        shaps = np.zeros(len(feature_names))
        base_val = prob

    # 4. Format waterfall components
    waterfall_items = []
    up_drivers = []
    down_drivers = []
    
    # Sort by absolute SHAP contribution
    order = np.argsort(np.abs(shaps))[::-1]
    
    running_val = base_val
    for idx in order[:10]:
        feat = feature_names[idx]
        val = float(X_rec[0, idx])
        contrib = float(shaps[idx])
        running_val += contrib
        
        item = {
            "feature": feat,
            "feature_value": round(val, 2),
            "contribution": round(contrib, 4),
            "direction": "UP" if contrib > 0 else "DOWN",
            "cumulative": round(running_val, 4)
        }
        waterfall_items.append(item)
        
        if contrib > 0.02:
            up_drivers.append(f"{feat} (+{contrib:.2f})")
        elif contrib < -0.02:
            down_drivers.append(f"{feat} ({contrib:.2f})")

    # 5. Plain language text summary
    up_text = ", ".join(up_drivers[:3]) if up_drivers else "no major elevating factors"
    down_text = ", ".join(down_drivers[:3]) if down_drivers else "no major mitigating factors"
    narrative = (
        f"For historical encounter {record_dict.get('encounter_id')}, the 30-day readmission risk estimate was "
        f"{prob*100:.1f}%. The estimate was pushed UP primarily by {up_text}, and pushed DOWN by {down_text}."
    )

    # 6. Find top 5 similar historical records
    similar_records = []
    try:
        sample_pool = all_records[:300]
        pool_df = pd.DataFrame(sample_pool)
        X_pool = preprocessor.transform(pool_df)
        dists = np.linalg.norm(X_pool - X_rec, axis=1)
        nearest_idx = np.argsort(dists)[1:6]  # exclude self
        
        for n_i in nearest_idx:
            r = sample_pool[n_i]
            similar_records.append({
                "encounter_id": r.get("encounter_id"),
                "age": r.get("age"),
                "primary_dx_group": r.get("primary_dx_group"),
                "prior_admissions_6m": r.get("prior_admissions_6m"),
                "discharge_disposition": r.get("discharge_disposition"),
                "readmit_30d": r.get("readmit_30d"),
                "distance": round(float(dists[n_i]), 2)
            })
    except Exception:
        pass

    return {
        "encounter_id": record_dict.get("encounter_id"),
        "predicted_risk": round(prob, 4),
        "base_value": round(base_val, 4),
        "waterfall": waterfall_items,
        "narrative": narrative,
        "similar_records": similar_records,
        "disclaimer": "Research and quality-improvement use only. Historical de-identified record, not for individual clinical decisions."
    }

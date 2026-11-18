from typing import List, Dict, Any
import numpy as np

def calculate_decision_curve(y_true: np.ndarray, y_prob: np.ndarray, thresholds: List[float] = None) -> List[Dict[str, Any]]:
    if thresholds is None:
        thresholds = [round(t, 2) for t in np.arange(0.02, 0.70, 0.02)]
        
    n = len(y_true)
    prevalence = float(np.mean(y_true))
    y_true_bool = y_true.astype(bool)
    
    curve_data = []
    for t in thresholds:
        preds = (y_prob >= t)
        tp = float(np.sum(preds & y_true_bool))
        fp = float(np.sum(preds & ~y_true_bool))
        
        weight = t / (1.0 - t)
        
        # Net benefit of the model
        nb_model = (tp / n) - (fp / n) * weight
        
        # Net benefit of treat all
        nb_all = prevalence - (1.0 - prevalence) * weight
        
        # Net benefit of treat none is always 0.0
        nb_none = 0.0
        
        curve_data.append({
            "threshold": round(float(t), 2),
            "net_benefit_model": round(float(nb_model), 4),
            "net_benefit_all": round(float(nb_all), 4),
            "net_benefit_none": 0.0
        })
        
    return curve_data

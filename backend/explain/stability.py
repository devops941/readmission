from typing import List, Dict, Any
import numpy as np

def calculate_explanation_stability(
    base_top_drivers: List[str],
    resample_top_drivers: List[List[str]]
) -> Dict[str, Any]:
    """Calculates Jaccard overlap of top-k features across bootstrap resamples."""
    if not resample_top_drivers:
        return {"stability_score": 1.0, "details": "Single run"}
        
    set_base = set(base_top_drivers[:5])
    jaccards = []
    
    for r_drivers in resample_top_drivers:
        set_r = set(r_drivers[:5])
        union = set_base.union(set_r)
        intersection = set_base.intersection(set_r)
        j = len(intersection) / len(union) if union else 1.0
        jaccards.append(j)
        
    avg_jaccard = float(np.mean(jaccards))
    
    return {
        "stability_score": round(avg_jaccard, 3),
        "stability_level": "Robust" if avg_jaccard >= 0.8 else ("Moderate" if avg_jaccard >= 0.6 else "Sensitive"),
        "top_5_drivers": base_top_drivers[:5],
        "interpretation": f"Explanation drivers have {avg_jaccard*100:.1f}% top-5 stability under data perturbation."
    }

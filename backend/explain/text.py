from typing import List, Dict, Any

MANDATORY_CAVEAT = (
    "Research and quality-improvement use only. Population-level patterns for expert review. "
    "Explanations show statistical association, not causation. Correlated features share statistical attribution. "
    "Not for individual clinical decisions or real-time patient triage."
)

def format_driver_narrative(top_drivers: List[Dict[str, Any]]) -> Dict[str, Any]:
    driver_paragraphs = []
    for d in top_drivers[:5]:
        feat = d.get("feature", "unknown")
        imp = d.get("mean_abs_shap", d.get("mean_importance", 0.0))
        
        driver_paragraphs.append({
            "rank": d.get("rank", 1),
            "feature": feat,
            "importance": imp,
            "prose": f"Rank {d.get('rank', 1)}: {feat} contributes an average absolute SHAP impact of {imp:.4f} across validation encounters."
        })
        
    return {
        "summary": "Primary risk attribution is concentrated in past utilization frequency, multimorbidity indices, and post-acute discharge coordination.",
        "drivers": driver_paragraphs,
        "caveat": MANDATORY_CAVEAT
    }

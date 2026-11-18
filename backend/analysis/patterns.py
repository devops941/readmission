import math
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from scipy import stats
from backend.analysis.suppress import apply_cell_suppression
from backend.config import settings

def wilson_score_interval(events: int, n: int, confidence: float = 0.95) -> Dict[str, float]:
    if n <= 0:
        return {"rate": 0.0, "ci_lower": 0.0, "ci_upper": 0.0}
    
    z = stats.norm.ppf(1 - (1 - confidence) / 2)
    p = events / n
    denominator = 1 + (z ** 2) / n
    center = (p + (z ** 2) / (2 * n)) / denominator
    margin = (z / denominator) * math.sqrt((p * (1 - p) / n) + (z ** 2) / (4 * (n ** 2)))
    
    lower = max(0.0, center - margin)
    upper = min(1.0, center + margin)
    
    return {
        "rate": round(p, 4),
        "ci_lower": round(lower, 4),
        "ci_upper": round(upper, 4)
    }

def calculate_rates_by_group(df: pd.DataFrame, group_col: str) -> List[Dict[str, Any]]:
    if group_col not in df.columns or "readmit_30d" not in df.columns:
        return []
    
    df_clean = df.dropna(subset=[group_col, "readmit_30d"]).copy()
    
    # If age, create age bands if not already present
    if group_col == "age_band" and "age_band" not in df_clean.columns and "age" in df_clean.columns:
        df_clean["age_band"] = pd.cut(
            df_clean["age"],
            bins=[0, 45, 65, 75, 85, 120],
            labels=["< 45", "45-64", "65-74", "75-84", "85+"]
        )
    
    grouped = df_clean.groupby(group_col, observed=True)
    results = []
    
    for val, group in grouped:
        n = len(group)
        events = int(group["readmit_30d"].sum())
        suppression = apply_cell_suppression(n, events)
        
        ci = wilson_score_interval(events, n)
        results.append({
            "category": str(val),
            "n": n,
            "events": events,
            "rate": ci["rate"],
            "ci_lower": ci["ci_lower"] if not suppression["suppressed"] else None,
            "ci_upper": ci["ci_upper"] if not suppression["suppressed"] else None,
            "suppressed": suppression["suppressed"]
        })
        
    return sorted(results, key=lambda x: str(x["category"]))

def calculate_monthly_trends(df: pd.DataFrame) -> List[Dict[str, Any]]:
    if "discharge_month" not in df.columns or "readmit_30d" not in df.columns:
        return []
    
    df_clean = df.dropna(subset=["discharge_month", "readmit_30d"])
    grouped = df_clean.groupby("discharge_month", observed=True)
    results = []
    
    for m, group in sorted(grouped, key=lambda x: int(x[0])):
        n = len(group)
        events = int(group["readmit_30d"].sum())
        ci = wilson_score_interval(events, n)
        results.append({
            "month": int(m),
            "n": n,
            "events": events,
            "rate": ci["rate"],
            "ci_lower": ci["ci_lower"],
            "ci_upper": ci["ci_upper"]
        })
    return results

def calculate_crosstab_heatmap(df: pd.DataFrame, row_col: str, col_col: str) -> Dict[str, Any]:
    df_work = df.copy()
    if row_col == "age_band" and "age_band" not in df_work.columns and "age" in df_work.columns:
        df_work["age_band"] = pd.cut(
            df_work["age"],
            bins=[0, 45, 65, 75, 85, 120],
            labels=["< 45", "45-64", "65-74", "75-84", "85+"]
        )
    if col_col == "age_band" and "age_band" not in df_work.columns and "age" in df_work.columns:
        df_work["age_band"] = pd.cut(
            df_work["age"],
            bins=[0, 45, 65, 75, 85, 120],
            labels=["< 45", "45-64", "65-74", "75-84", "85+"]
        )

    rows = sorted([str(x) for x in df_work[row_col].dropna().unique()])
    cols = sorted([str(x) for x in df_work[col_col].dropna().unique()])
    
    matrix = []
    for r in rows:
        row_cells = []
        for c in cols:
            sub = df_work[(df_work[row_col].astype(str) == r) & (df_work[col_col].astype(str) == c)]
            n = len(sub)
            events = int(sub["readmit_30d"].sum()) if n > 0 and "readmit_30d" in sub.columns else 0
            supp = apply_cell_suppression(n, events)
            
            rate = round(events / n, 4) if n > 0 and not supp["suppressed"] else None
            row_cells.append({
                "row": r,
                "col": c,
                "n": n,
                "events": events if not supp["suppressed"] else "< 5",
                "rate": rate,
                "suppressed": supp["suppressed"]
            })
        matrix.append(row_cells)
        
    return {
        "row_variable": row_col,
        "col_variable": col_col,
        "row_categories": rows,
        "col_categories": cols,
        "matrix": matrix
    }

def calculate_univariate_stats(df: pd.DataFrame, feature_col: str) -> Dict[str, Any]:
    if feature_col not in df.columns or "readmit_30d" not in df.columns:
        return {}
    
    sub = df[[feature_col, "readmit_30d"]].dropna()
    crosstab = pd.crosstab(sub[feature_col], sub["readmit_30d"])
    
    chi2, p_val, dof, ex = stats.chi2_contingency(crosstab)
    n = len(sub)
    k = min(crosstab.shape)
    cramers_v = math.sqrt(chi2 / (n * (k - 1))) if k > 1 and n > 0 else 0.0
    
    return {
        "feature": feature_col,
        "chi2": round(float(chi2), 3),
        "p_value": float(p_val),
        "cramers_v": round(float(cramers_v), 3)
    }

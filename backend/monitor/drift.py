from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from scipy import stats

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
    """Calculates the Population Stability Index (PSI) between reference and monitoring distributions."""
    eps = 1e-4
    # Clean NaNs
    exp_clean = expected[~np.isnan(expected)]
    act_clean = actual[~np.isnan(actual)]
    
    if len(exp_clean) == 0 or len(act_clean) == 0:
        return 0.0
        
    # Determine bucket quantiles from expected
    percentiles = np.linspace(0, 100, num_buckets + 1)
    try:
        bins = np.percentile(exp_clean, percentiles)
        bins[0] = -np.inf
        bins[-1] = np.inf
        bins = np.unique(bins)
    except Exception:
        return 0.0
        
    if len(bins) < 2:
        return 0.0
        
    exp_counts, _ = np.histogram(exp_clean, bins=bins)
    act_counts, _ = np.histogram(act_clean, bins=bins)
    
    exp_pct = np.clip(exp_counts / len(exp_clean), eps, 1.0)
    act_pct = np.clip(act_counts / len(act_clean), eps, 1.0)
    
    psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return round(float(psi_val), 4)

def calculate_feature_drift_strip(
    df: pd.DataFrame,
    features: List[str],
    reference_months: List[int],
    monitor_months: List[int],
    psi_warn: float = 0.10,
    psi_crit: float = 0.25
) -> Dict[str, Any]:
    ref_df = df[df["discharge_month"].isin(reference_months)]
    
    feature_strip = []
    alerts = []
    
    for feat in features:
        if feat not in df.columns or feat in ["encounter_id", "days_to_readmit", "readmit_30d", "discharge_month"]:
            continue
            
        ref_vals = pd.to_numeric(ref_df[feat], errors="coerce").values
        month_psis = []
        
        for m in sorted(monitor_months):
            m_df = df[df["discharge_month"] == m]
            m_vals = pd.to_numeric(m_df[feat], errors="coerce").values
            
            psi = calculate_psi(ref_vals, m_vals)
            
            # Check KS test if numeric
            clean_ref = ref_vals[~np.isnan(ref_vals)]
            clean_m = m_vals[~np.isnan(m_vals)]
            ks_p = 1.0
            if len(clean_ref) > 10 and len(clean_m) > 10:
                _, ks_p = stats.ks_2samp(clean_ref, clean_m)
                
            status = "NORMAL"
            if psi >= psi_crit:
                status = "CRITICAL"
                alerts.append({
                    "feature": feat,
                    "month": m,
                    "severity": "CRITICAL",
                    "psi": psi,
                    "message": f"Critical drift detected in '{feat}' at month {m} (PSI = {psi:.3f} >= {psi_crit})"
                })
            elif psi >= psi_warn:
                status = "WARNING"
                alerts.append({
                    "feature": feat,
                    "month": m,
                    "severity": "WARNING",
                    "psi": psi,
                    "message": f"Moderate drift warning in '{feat}' at month {m} (PSI = {psi:.3f} >= {psi_warn})"
                })
                
            month_psis.append({
                "month": m,
                "psi": psi,
                "ks_pvalue": round(float(ks_p), 4),
                "status": status
            })
            
        feature_strip.append({
            "feature": feat,
            "monthly_drift": month_psis,
            "max_psi": max([x["psi"] for x in month_psis]) if month_psis else 0.0
        })
        
    return {
        "features": sorted(feature_strip, key=lambda x: x["max_psi"], reverse=True),
        "alerts": alerts,
        "reference_period": f"Months {min(reference_months)}–{max(reference_months)}",
        "monitoring_period": f"Months {min(monitor_months)}–{max(monitor_months)}"
    }

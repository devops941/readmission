import math
from typing import Dict, Any, List
import pandas as pd
import numpy as np
import statsmodels.api as sm

def fit_multivariable_logistic_regression(df: pd.DataFrame, feature_cols: List[str] = None) -> Dict[str, Any]:
    if "readmit_30d" not in df.columns:
        return {"error": "Missing readmit_30d label column"}
    
    # Default candidate features available at discharge
    if not feature_cols:
        feature_cols = [
            "age", "comorbidity_count", "prior_admissions_6m", "prior_ed_visits_6m",
            "los_days", "num_medications", "followup_scheduled", "primary_dx_group",
            "discharge_disposition", "insurance"
        ]
    
    valid_cols = [c for c in feature_cols if c in df.columns]
    data = df[valid_cols + ["readmit_30d"]].dropna().copy()
    
    if len(data) < 50:
        return {"error": "Insufficient complete cases for multivariable logistic regression"}
    
    # Identify non-numeric columns for dummy encoding
    cat_cols = [c for c in valid_cols if not pd.api.types.is_numeric_dtype(data[c])]
    
    if cat_cols:
        X = pd.get_dummies(data[valid_cols], columns=cat_cols, drop_first=True, dtype=float)
    else:
        X = data[valid_cols].copy()
        
    X = sm.add_constant(X, has_constant="add")
    X = X.astype(float)
    y = data["readmit_30d"].astype(float)
    
    try:
        model = sm.Logit(y, X).fit(disp=False, maxiter=100)
    except Exception as e:
        return {"error": f"Model convergence failed: {str(e)}"}
    
    params = model.params
    conf = model.conf_int()
    pvalues = model.pvalues
    bse = model.bse
    
    def safe_exp(val: float, max_bound: float = 999.0) -> float:
        if np.isnan(val):
            return 1.0
        if val > 50.0:
            return max_bound
        if val < -50.0:
            return 0.001
        try:
            res = math.exp(val)
            return min(res, max_bound)
        except OverflowError:
            return max_bound

    results = []
    for var in params.index:
        coef = params[var]
        std_err = bse[var]
        or_val = safe_exp(coef)
        ci_low = safe_exp(conf.loc[var, 0])
        ci_high = safe_exp(conf.loc[var, 1])
        pval = pvalues[var]
        
        results.append({
            "term": var,
            "coefficient": round(float(coef), 4),
            "std_error": round(float(std_err), 4),
            "odds_ratio": round(float(or_val), 3),
            "ci_lower": round(float(ci_low), 3),
            "ci_upper": round(float(ci_high), 3),
            "p_value": float(pval),
            "is_significant": bool(pval < 0.05)
        })
        
    # Hosmer-Lemeshow-style decile calibration check
    preds = model.predict(X)
    deciles = pd.qcut(preds, q=10, duplicates="drop")
    calib_table = []
    for dec_label, grp in data.groupby(deciles, observed=True):
        idx = grp.index
        obs_events = int(grp["readmit_30d"].sum())
        exp_events = float(preds.loc[idx].sum())
        n = len(grp)
        calib_table.append({
            "decile": str(dec_label),
            "n": n,
            "observed_events": obs_events,
            "expected_events": round(exp_events, 1),
            "obs_rate": round(obs_events / n, 4) if n > 0 else 0.0,
            "exp_rate": round(exp_events / n, 4) if n > 0 else 0.0
        })
        
    return {
        "n_observations": int(model.nobs),
        "pseudo_r2": round(float(model.prsquared), 4),
        "aic": round(float(model.aic), 2),
        "bic": round(float(model.bic), 2),
        "terms": results,
        "calibration_deciles": calib_table
    }

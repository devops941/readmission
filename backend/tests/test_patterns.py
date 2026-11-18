import pytest
import pandas as pd
import numpy as np
from backend.analysis.patterns import wilson_score_interval, calculate_rates_by_group
from backend.analysis.regression import fit_multivariable_logistic_regression

def test_wilson_ci():
    # Known 95% Wilson CI for 20 events out of 100 trials: approx [0.133, 0.289]
    res = wilson_score_interval(events=20, n=100)
    assert res["rate"] == 0.20
    assert 0.12 <= res["ci_lower"] <= 0.14
    assert 0.27 <= res["ci_upper"] <= 0.30

def test_multivariable_logistic_regression():
    np.random.seed(42)
    n = 250
    prior_adm = np.random.poisson(1.5, size=n)
    comorb = np.random.poisson(2.0, size=n)
    age = np.random.randint(45, 85, size=n)
    los = np.random.randint(1, 10, size=n)
    num_meds = np.random.randint(2, 20, size=n)
    followup = np.random.binomial(1, 0.7, size=n)
    primary_dx = np.random.choice(["Circulatory", "Respiratory", "Digestive"], size=n)
    discharge_disp = np.random.choice(["Home", "SNF/Rehab"], size=n)
    insurance = np.random.choice(["Medicare", "Commercial", "Medicaid"], size=n)
    
    # Probability driven strongly by prior admissions (beta = 0.8)
    logit_p = -2.0 + 0.8 * prior_adm + 0.2 * comorb - 0.4 * followup
    prob = 1 / (1 + np.exp(-logit_p))
    readmit = (np.random.rand(n) < prob).astype(int)
    
    df = pd.DataFrame({
        "age": age,
        "comorbidity_count": comorb,
        "prior_admissions_6m": prior_adm,
        "los_days": los,
        "num_medications": num_meds,
        "followup_scheduled": followup,
        "primary_dx_group": primary_dx,
        "discharge_disposition": discharge_disp,
        "insurance": insurance,
        "readmit_30d": readmit
    })
    res = fit_multivariable_logistic_regression(df)
    assert "terms" in res
    assert len(res["terms"]) > 0
    terms_dict = {t["term"]: t for t in res["terms"]}
    assert "prior_admissions_6m" in terms_dict
    assert terms_dict["prior_admissions_6m"]["odds_ratio"] > 1.0

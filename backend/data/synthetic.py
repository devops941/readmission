import numpy as np
import pandas as pd
from typing import Tuple

def generate_synthetic_encounters(n_samples: int = 12000, seed: int = 42) -> pd.DataFrame:
    np.random.seed(seed)
    
    # 1. Demographics
    encounter_ids = [f"ENC-{100000 + i}" for i in range(n_samples)]
    
    # Age: skewed towards older adult inpatient population (mean 64, std 15)
    ages = np.clip(np.random.normal(loc=64, scale=14, size=n_samples).astype(int), 18, 98)
    
    sexes = np.random.choice(["Female", "Male", "Other"], size=n_samples, p=[0.51, 0.48, 0.01])
    
    races = np.random.choice(
        ["White", "Black/African American", "Hispanic/Latino", "Asian", "Other"],
        size=n_samples,
        p=[0.60, 0.20, 0.12, 0.05, 0.03]
    )
    
    # Insurance depends slightly on age
    insurances = []
    for a in ages:
        if a >= 65:
            insurances.append(np.random.choice(["Medicare", "Commercial", "Medicaid"], p=[0.82, 0.12, 0.06]))
        else:
            insurances.append(np.random.choice(["Commercial", "Medicaid", "Medicare", "Other"], p=[0.55, 0.28, 0.12, 0.05]))
    
    # 2. Stay & Diagnosis
    dx_groups = np.random.choice(
        ["Circulatory", "Respiratory", "Digestive", "Diabetes/Endocrine", "Injury/Poisoning", "Other"],
        size=n_samples,
        p=[0.32, 0.24, 0.16, 0.14, 0.08, 0.06]
    )
    
    admission_types = np.random.choice(
        ["Emergency", "Urgent", "Elective"],
        size=n_samples,
        p=[0.68, 0.20, 0.12]
    )
    
    # Comorbidity count (Poisson with mean depending on age)
    comorbidity_counts = np.clip(np.random.poisson(lam=(ages / 25.0)), 0, 14)
    
    # Prior utilization
    prior_admissions = np.clip(np.random.negative_binomial(n=1.5, p=0.6, size=n_samples), 0, 10)
    prior_ed_visits = np.clip(np.random.negative_binomial(n=1.2, p=0.5, size=n_samples), 0, 12)
    
    # Length of stay: log-normal
    los_days = np.clip(np.round(np.random.lognormal(mean=1.2, sigma=0.7, size=n_samples)).astype(int), 1, 45)
    
    # Medications & Procedures
    num_meds = np.clip(np.round(8 + 0.8 * comorbidity_counts + np.random.normal(0, 4, n_samples)).astype(int), 1, 35)
    num_procs = np.clip(np.random.poisson(lam=1.4, size=n_samples), 0, 8)
    
    # Lab markers (some with small missingness)
    glucose = np.round(np.random.normal(135 + 15 * (dx_groups == "Diabetes/Endocrine"), 35, n_samples), 1)
    glucose = np.clip(glucose, 60, 420)
    # 5% missing labs
    mask_lab = np.random.rand(n_samples) < 0.06
    glucose[mask_lab] = np.nan
    
    sodium = np.round(np.random.normal(138, 4.0, n_samples), 1)
    sodium[mask_lab] = np.nan
    
    hba1c = np.round(np.random.normal(6.5 + 2.0 * (dx_groups == "Diabetes/Endocrine"), 1.8, n_samples), 1)
    hba1c = np.clip(hba1c, 4.2, 14.5)
    mask_hba1c = np.random.rand(n_samples) < 0.25
    hba1c[mask_hba1c] = np.nan
    
    # Discharge disposition
    dispositions = []
    for i in range(n_samples):
        if ages[i] > 75 or comorbidity_counts[i] >= 4 or los_days[i] > 7:
            dispositions.append(np.random.choice(["Home", "Home Health", "SNF/Rehab", "Other", "AMA"], p=[0.40, 0.30, 0.25, 0.03, 0.02]))
        else:
            dispositions.append(np.random.choice(["Home", "Home Health", "SNF/Rehab", "Other", "AMA"], p=[0.75, 0.16, 0.05, 0.02, 0.02]))
            
    med_changes = np.clip(np.random.poisson(lam=1.8, size=n_samples), 0, 9)
    
    # Follow-up scheduled: less likely for Medicaid / AMA
    followups = []
    for i in range(n_samples):
        prob_followup = 0.72
        if insurances[i] == "Medicaid":
            prob_followup -= 0.18
        if dispositions[i] == "AMA":
            prob_followup = 0.15
        followups.append(1 if np.random.rand() < prob_followup else 0)
        
    # Discharge months: 1 to 24 (allowing 1-18 train, 19-21 calib, 22-24 test)
    # Seasonal wave (winter months slightly higher volume)
    month_weights = np.array([1.1, 1.15, 1.05, 0.95, 0.9, 0.9, 0.92, 0.95, 1.0, 1.05, 1.1, 1.18] * 2)
    month_weights = month_weights / month_weights.sum()
    discharge_months = np.random.choice(range(1, 25), size=n_samples, p=month_weights)
    
    # 3. Model planted readmission probability function (log-odds)
    # Base intercept
    log_odds = -2.2
    
    # Strong clinical drivers
    log_odds += 0.45 * prior_admissions
    log_odds += 0.20 * prior_ed_visits
    log_odds += 0.22 * comorbidity_counts
    log_odds += 0.03 * (los_days - 3)
    
    # Diagnosis risk
    log_odds += 0.35 * (dx_groups == "Circulatory")
    log_odds += 0.40 * (dx_groups == "Respiratory")
    log_odds -= 0.25 * (dx_groups == "Injury/Poisoning")
    
    # Discharge factors
    disp_arr = np.array(dispositions)
    log_odds += 0.50 * (disp_arr == "SNF/Rehab")
    log_odds += 0.85 * (disp_arr == "AMA")
    log_odds -= 0.45 * np.array(followups)
    log_odds += 0.12 * (np.array(insurances) == "Medicaid")
    
    # Planted non-linear interaction: high comorbidities + prior admissions >= 3
    interaction = ((comorbidity_counts >= 4) & (prior_admissions >= 3)).astype(float)
    log_odds += 0.55 * interaction
    
    # Planted miscalibrated subgroup for fairness & calibration pages:
    # Older patients with Medicaid have an uncalibrated jump
    miscal_subgroup = ((ages >= 70) & (np.array(insurances) == "Medicaid")).astype(float)
    log_odds += 0.40 * miscal_subgroup
    
    # Moderate drift in months 22-24 (e.g. post-pandemic policy change slightly shifts readmission rate)
    late_month_shift = (discharge_months >= 22).astype(float) * 0.25
    log_odds += late_month_shift
    
    # Compute true probabilities
    probs = 1.0 / (1.0 + np.exp(-log_odds))
    
    # Realize binary readmit_30d labels
    readmit_30d = (np.random.rand(n_samples) < probs).astype(int)
    
    # Days to readmission
    days_to_readmit = []
    for r in readmit_30d:
        if r == 1:
            # 1 to 30 days, clustered around day 7-14
            d = int(np.clip(np.round(np.random.gamma(shape=2.5, scale=4.0)), 1, 30))
            days_to_readmit.append(d)
        else:
            # If not readmitted within 30 days, either None or > 30 (e.g. 45, 90)
            if np.random.rand() < 0.20:
                days_to_readmit.append(int(np.random.randint(35, 180)))
            else:
                days_to_readmit.append(np.nan)
                
    df = pd.DataFrame({
        "encounter_id": encounter_ids,
        "age": ages,
        "sex": sexes,
        "race_ethnicity": races,
        "insurance": insurances,
        "admission_type": admission_types,
        "primary_dx_group": dx_groups,
        "comorbidity_count": comorbidity_counts,
        "prior_admissions_6m": prior_admissions,
        "prior_ed_visits_6m": prior_ed_visits,
        "los_days": los_days,
        "num_medications": num_meds,
        "num_procedures": num_procs,
        "glucose": glucose,
        "sodium": sodium,
        "hba1c": hba1c,
        "discharge_disposition": dispositions,
        "med_changes": med_changes,
        "followup_scheduled": followups,
        "discharge_month": discharge_months,
        "readmit_30d": readmit_30d,
        "days_to_readmit": days_to_readmit
    })
    
    return df

def generate_messy_test_dataset(n_samples: int = 250) -> pd.DataFrame:
    """Generates a small messy dataset with deliberate PHI strings, out-of-range values, and inconsistencies."""
    np.random.seed(999)
    base_df = generate_synthetic_encounters(n_samples=n_samples, seed=999)
    
    # 1. Add fake PHI columns
    fake_names = [f"John Patient {i}" for i in range(n_samples)]
    fake_phones = [f"555-01{i:02d}-8899" if i % 4 == 0 else "" for i in range(n_samples)]
    fake_emails = [f"patient{i}@example-hospital.org" if i % 5 == 0 else "" for i in range(n_samples)]
    fake_ssns = [f"900-{i:02d}-1234" if i % 6 == 0 else "" for i in range(n_samples)]
    
    base_df["patient_full_name"] = fake_names
    base_df["contact_phone"] = fake_phones
    base_df["patient_email"] = fake_emails
    base_df["social_security"] = fake_ssns
    
    # 2. Add impossible values
    base_df.loc[0, "age"] = 185  # impossible age
    base_df.loc[1, "los_days"] = -4  # negative LOS
    base_df.loc[2, "comorbidity_count"] = -1  # negative count
    
    # 3. Add inconsistency between readmit_30d and days_to_readmit
    base_df.loc[3, "readmit_30d"] = 0
    base_df.loc[3, "days_to_readmit"] = 12  # says not readmitted, but readmitted day 12!
    
    base_df.loc[4, "readmit_30d"] = 1
    base_df.loc[4, "days_to_readmit"] = 85  # says readmitted in 30d, but days=85!
    
    # 4. Add duplicate encounter_id
    base_df.loc[5, "encounter_id"] = base_df.loc[6, "encounter_id"]
    
    return base_df

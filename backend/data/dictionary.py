from typing import List, Dict, Any

STANDARD_DICTIONARY: List[Dict[str, Any]] = [
    {
        "variable": "encounter_id",
        "type": "id",
        "allowed_range_or_categories": "Alphanumeric string (e.g. ENC-10001)",
        "clinical_group": "administrative",
        "role": "excluded",
        "leakage_flag": False,
        "description": "De-identified pseudo encounter identifier."
    },
    {
        "variable": "age",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 120 years",
        "clinical_group": "demographics",
        "role": "sensitive",
        "leakage_flag": False,
        "description": "Patient age in years at hospital admission."
    },
    {
        "variable": "sex",
        "type": "categorical",
        "allowed_range_or_categories": "Female, Male, Other",
        "clinical_group": "demographics",
        "role": "sensitive",
        "leakage_flag": False,
        "description": "Biological sex recorded at registration."
    },
    {
        "variable": "race_ethnicity",
        "type": "categorical",
        "allowed_range_or_categories": "White, Black/African American, Hispanic/Latino, Asian, Other",
        "clinical_group": "demographics",
        "role": "sensitive",
        "leakage_flag": False,
        "description": "Reported race/ethnicity, reserved strictly for disparity & fairness checks."
    },
    {
        "variable": "insurance",
        "type": "categorical",
        "allowed_range_or_categories": "Medicare, Medicaid, Commercial, Other",
        "clinical_group": "demographics",
        "role": "feature",
        "leakage_flag": False,
        "description": "Primary insurance payer type."
    },
    {
        "variable": "admission_type",
        "type": "categorical",
        "allowed_range_or_categories": "Emergency, Urgent, Elective",
        "clinical_group": "stay",
        "role": "feature",
        "leakage_flag": False,
        "description": "Type of hospital admission."
    },
    {
        "variable": "primary_dx_group",
        "type": "categorical",
        "allowed_range_or_categories": "Circulatory, Respiratory, Digestive, Diabetes/Endocrine, Injury/Poisoning, Other",
        "clinical_group": "stay",
        "role": "feature",
        "leakage_flag": False,
        "description": "Primary diagnosis clinical classification category."
    },
    {
        "variable": "comorbidity_count",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 20 comorbidities",
        "clinical_group": "history",
        "role": "feature",
        "leakage_flag": False,
        "description": "Total count of documented secondary chronic conditions (Charlson-based)."
    },
    {
        "variable": "prior_admissions_6m",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 15 inpatient admissions",
        "clinical_group": "history",
        "role": "feature",
        "leakage_flag": False,
        "description": "Count of inpatient admissions within the prior 6 months."
    },
    {
        "variable": "prior_ed_visits_6m",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 20 ED visits",
        "clinical_group": "history",
        "role": "feature",
        "leakage_flag": False,
        "description": "Emergency department presentations within the prior 6 months."
    },
    {
        "variable": "los_days",
        "type": "numeric",
        "allowed_range_or_categories": "1 - 365 days",
        "clinical_group": "stay",
        "role": "feature",
        "leakage_flag": False,
        "description": "Length of stay in days from admission to discharge."
    },
    {
        "variable": "num_medications",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 40 medications",
        "clinical_group": "stay",
        "role": "feature",
        "leakage_flag": False,
        "description": "Count of distinct active medications prescribed during admission."
    },
    {
        "variable": "num_procedures",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 15 procedures",
        "clinical_group": "stay",
        "role": "feature",
        "leakage_flag": False,
        "description": "Count of surgical or major diagnostic procedures performed."
    },
    {
        "variable": "glucose",
        "type": "numeric",
        "allowed_range_or_categories": "40 - 500 mg/dL",
        "clinical_group": "lab",
        "role": "feature",
        "leakage_flag": False,
        "description": "Last recorded serum glucose before discharge."
    },
    {
        "variable": "sodium",
        "type": "numeric",
        "allowed_range_or_categories": "110 - 160 mEq/L",
        "clinical_group": "lab",
        "role": "feature",
        "leakage_flag": False,
        "description": "Last recorded serum sodium before discharge."
    },
    {
        "variable": "hba1c",
        "type": "numeric",
        "allowed_range_or_categories": "4.0 - 16.0 %",
        "clinical_group": "lab",
        "role": "feature",
        "leakage_flag": False,
        "description": "Most recent glycated hemoglobin level."
    },
    {
        "variable": "discharge_disposition",
        "type": "categorical",
        "allowed_range_or_categories": "Home, Home Health, SNF/Rehab, AMA, Other",
        "clinical_group": "discharge",
        "role": "feature",
        "leakage_flag": False,
        "description": "Discharge destination upon leaving the hospital."
    },
    {
        "variable": "med_changes",
        "type": "numeric",
        "allowed_range_or_categories": "0 - 10 dosage or drug changes",
        "clinical_group": "discharge",
        "role": "feature",
        "leakage_flag": False,
        "description": "Number of medication dosage alterations during inpatient stay."
    },
    {
        "variable": "followup_scheduled",
        "type": "binary",
        "allowed_range_or_categories": "0 (No), 1 (Yes)",
        "clinical_group": "discharge",
        "role": "feature",
        "leakage_flag": False,
        "description": "Indicator whether outpatient primary/specialty follow-up was booked."
    },
    {
        "variable": "discharge_month",
        "type": "numeric",
        "allowed_range_or_categories": "1 - 36 (relative month index)",
        "clinical_group": "stay",
        "role": "feature",
        "leakage_flag": False,
        "description": "Sequential monthly index of discharge to prevent exact-date re-identification."
    },
    {
        "variable": "readmit_30d",
        "type": "binary",
        "allowed_range_or_categories": "0 (No readmission), 1 (Readmitted <=30d)",
        "clinical_group": "outcome",
        "role": "label",
        "leakage_flag": False,
        "description": "Target outcome: unplanned readmission to acute care within 30 days."
    },
    {
        "variable": "days_to_readmit",
        "type": "numeric",
        "allowed_range_or_categories": "1 - 365 days or null",
        "clinical_group": "outcome",
        "role": "excluded",
        "leakage_flag": True,
        "description": "Exact days until readmission. Hard-blocked from features due to target leakage."
    }
]

def get_default_dictionary() -> List[Dict[str, Any]]:
    return [dict(item) for item in STANDARD_DICTIONARY]

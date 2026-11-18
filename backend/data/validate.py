from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

def validate_encounter_record(record: Dict[str, Any], dictionary_map: Dict[str, Any] = None) -> List[str]:
    issues = []
    
    # 1. encounter_id
    if not record.get("encounter_id"):
        issues.append("Missing encounter_id")
    
    # 2. age
    age = record.get("age")
    if age is None or pd.isna(age):
        issues.append("Age is required")
    else:
        try:
            age_int = int(age)
            if age_int < 0 or age_int > 120:
                issues.append(f"Age {age_int} out of valid clinical range (0-120)")
        except (ValueError, TypeError):
            issues.append(f"Age '{age}' is not a valid integer")

    # 3. LOS days
    los = record.get("los_days")
    if los is None or pd.isna(los):
        issues.append("Length of stay (los_days) is required")
    else:
        try:
            los_int = int(los)
            if los_int < 0 or los_int > 365:
                issues.append(f"Length of stay {los_int} out of valid range (0-365 days)")
        except (ValueError, TypeError):
            issues.append(f"LOS '{los}' is not a valid integer")

    # 4. readmit_30d & days_to_readmit consistency
    readmit = record.get("readmit_30d")
    days = record.get("days_to_readmit")
    if readmit is None or pd.isna(readmit):
        issues.append("readmit_30d label is required (0 or 1)")
    else:
        try:
            readmit_int = int(readmit)
            if readmit_int not in (0, 1):
                issues.append(f"readmit_30d must be 0 or 1, got {readmit_int}")
            
            if days is not None and not pd.isna(days) and str(days).strip() != "":
                days_int = int(days)
                if days_int < 0:
                    issues.append(f"days_to_readmit cannot be negative ({days_int})")
                elif readmit_int == 1 and days_int > 30:
                    issues.append(f"Inconsistent: readmit_30d is 1 but days_to_readmit is {days_int} (> 30 days)")
                elif readmit_int == 0 and days_int <= 30:
                    issues.append(f"Inconsistent: readmit_30d is 0 but days_to_readmit is {days_int} (<= 30 days)")
        except (ValueError, TypeError):
            issues.append("Invalid readmit_30d or days_to_readmit values")

    # 5. Non-negative counts
    for count_col in ["comorbidity_count", "prior_admissions_6m", "prior_ed_visits_6m", "num_medications", "num_procedures"]:
        val = record.get(count_col)
        if val is not None and not pd.isna(val) and str(val).strip() != "":
            try:
                c_int = int(val)
                if c_int < 0:
                    issues.append(f"{count_col} cannot be negative ({c_int})")
            except (ValueError, TypeError):
                issues.append(f"{count_col} must be numeric integer")

    return issues

def validate_dataframe(df: pd.DataFrame, dictionary_items: List[Dict[str, Any]] = None, min_cell_size: int = 20) -> Dict[str, Any]:
    n_rows = len(df)
    col_reports = {}
    row_errors = []
    
    # Column missingness & constant checks
    for col in df.columns:
        missing_count = int(df[col].isna().sum())
        missing_pct = round((missing_count / n_rows) * 100, 2) if n_rows > 0 else 0
        
        # Check constant
        top_val_freq = df[col].value_counts(normalize=True).iloc[0] if not df[col].dropna().empty else 1.0
        is_near_constant = bool(top_val_freq >= 0.98 and len(df[col].dropna().unique()) <= 2)
        
        # Categorical rare checks
        rare_levels = []
        if df[col].dtype == object or df[col].dtype.name == "category":
            vc = df[col].value_counts()
            rare_levels = [str(k) for k, v in vc.items() if v < min_cell_size]
            
        col_reports[col] = {
            "missing_count": missing_count,
            "missing_pct": missing_pct,
            "is_near_constant": is_near_constant,
            "rare_levels_count": len(rare_levels),
            "warn_missing": missing_pct > 40.0
        }

    # Duplicate encounter_ids
    duplicate_ids = []
    if "encounter_id" in df.columns:
        dups = df["encounter_id"].duplicated(keep=False)
        duplicate_ids = df.loc[dups, "encounter_id"].dropna().unique().tolist()[:50]

    # Row-by-row validation (sample up to 1000 for quick checks if huge)
    check_rows = min(n_rows, 5000)
    for idx in range(check_rows):
        rec = df.iloc[idx].to_dict()
        record_issues = validate_encounter_record(rec)
        if record_issues:
            row_errors.append({
                "row_index": idx,
                "encounter_id": str(rec.get("encounter_id", f"row_{idx}")),
                "issues": record_issues
            })

    # Readmit prevalence
    readmit_rate = 0.0
    if "readmit_30d" in df.columns:
        clean_readmit = pd.to_numeric(df["readmit_30d"], errors="coerce").dropna()
        if not clean_readmit.empty:
            readmit_rate = round(float(clean_readmit.mean() * 100), 2)

    return {
        "total_rows": n_rows,
        "total_columns": len(df.columns),
        "columns_report": col_reports,
        "duplicate_encounter_ids": duplicate_ids,
        "duplicate_count": len(duplicate_ids),
        "row_errors_sample": row_errors[:100],
        "total_row_errors": len(row_errors),
        "readmission_prevalence_pct": readmit_rate,
        "is_valid": len(row_errors) == 0 and len(duplicate_ids) == 0
    }

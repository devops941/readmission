import re
from typing import List, Dict, Any
import pandas as pd

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", re.IGNORECASE)
PHONE_REGEX = re.compile(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
SSN_REGEX = re.compile(r"\b\d{3}-\d{2}-\d{4}\b|\b\d{9}\b")
DOB_REGEX = re.compile(r"\b(19\d{2}|20\d{2})[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b")
ADDRESS_REGEX = re.compile(r"\b\d{1,5}\s+[a-zA-Z0-9\s.,]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct)\b", re.IGNORECASE)
NAME_COL_PATTERNS = re.compile(r"(first_?name|last_?name|patient_?name|full_?name|patient_id_raw|ssn|social_?security|dob|birth_?date|address|phone|email)", re.IGNORECASE)

def scan_column_for_phi(col_name: str, series: pd.Series) -> List[Dict[str, Any]]:
    findings = []
    
    # 1. Column header check
    if NAME_COL_PATTERNS.search(str(col_name)):
        findings.append({
            "type": "HEADER_PHI",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Column name '{col_name}' matches known identifying PHI header pattern.",
            "recommended_action": "DROP_OR_MASK"
        })
    
    # Sample up to 200 non-null string rows
    str_sample = series.dropna().astype(str).head(200)
    if str_sample.empty:
        return findings

    # 2. Email detection
    email_hits = str_sample.apply(lambda x: bool(EMAIL_REGEX.search(x))).sum()
    if email_hits > 0:
        findings.append({
            "type": "EMAIL_DETECTED",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Found {email_hits} email pattern(s) in sample rows.",
            "recommended_action": "DROP_OR_MASK"
        })

    # 3. Phone number detection
    phone_hits = str_sample.apply(lambda x: bool(PHONE_REGEX.search(x))).sum()
    if phone_hits > 0:
        findings.append({
            "type": "PHONE_DETECTED",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Found {phone_hits} phone number pattern(s) in sample rows.",
            "recommended_action": "DROP_OR_MASK"
        })

    # 4. SSN or National ID
    ssn_hits = str_sample.apply(lambda x: bool(SSN_REGEX.search(x))).sum()
    if ssn_hits > 0 and col_name not in ["encounter_id"]:
        findings.append({
            "type": "IDENTIFIER_DETECTED",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Found {ssn_hits} SSN/National ID pattern(s) in sample rows.",
            "recommended_action": "DROP_OR_MASK"
        })

    # 5. Full Date of Birth / Exact Date
    dob_hits = str_sample.apply(lambda x: bool(DOB_REGEX.search(x))).sum()
    if dob_hits > 0 and col_name not in ["discharge_month"]:
        findings.append({
            "type": "FULL_DATE_DETECTED",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Found {dob_hits} full calendar date(s) (YYYY-MM-DD). Re-identification risk.",
            "recommended_action": "TRANSFORM_TO_MONTH_INDEX"
        })

    # 6. Street Address
    addr_hits = str_sample.apply(lambda x: bool(ADDRESS_REGEX.search(x))).sum()
    if addr_hits > 0:
        findings.append({
            "type": "STREET_ADDRESS_DETECTED",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Found {addr_hits} street address pattern(s) in sample rows.",
            "recommended_action": "DROP_OR_MASK"
        })

    # 7. Unstructured Free-Text Notes heuristic
    avg_length = str_sample.str.len().mean()
    if avg_length > 100:
        findings.append({
            "type": "FREE_TEXT_DETECTED",
            "column": col_name,
            "severity": "CRITICAL",
            "detail": f"Column average string length is {avg_length:.1f} characters, indicative of clinical free text.",
            "recommended_action": "DROP_OR_MASK"
        })

    return findings

def scan_dataframe_for_phi(df: pd.DataFrame) -> List[Dict[str, Any]]:
    all_findings = []
    for col in df.columns:
        col_findings = scan_column_for_phi(col, df[col])
        all_findings.extend(col_findings)
    return all_findings

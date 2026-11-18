import pytest
import pandas as pd
from backend.data.phi_scan import scan_dataframe_for_phi
from backend.data.validate import validate_encounter_record, validate_dataframe
from backend.analysis.suppress import apply_cell_suppression

def test_phi_detection():
    df_with_phi = pd.DataFrame({
        "encounter_id": ["ENC-1", "ENC-2"],
        "patient_full_name": ["Alice Smith", "Bob Jones"],
        "contact_phone": ["555-123-4567", "555-987-6543"],
        "patient_email": ["alice@hospital.org", "bob@example.com"],
        "social_security": ["123-45-6789", "987-65-4321"]
    })
    findings = scan_dataframe_for_phi(df_with_phi)
    assert len(findings) >= 4
    col_names = [f["column"] for f in findings]
    assert "patient_full_name" in col_names
    assert "contact_phone" in col_names
    assert "patient_email" in col_names
    assert "social_security" in col_names

def test_validation_rules():
    # Negative age
    issues = validate_encounter_record({"encounter_id": "E1", "age": -5, "los_days": 3, "readmit_30d": 0})
    assert any("out of valid clinical range" in i for i in issues)

    # Inconsistent readmission days
    issues = validate_encounter_record({
        "encounter_id": "E2", "age": 45, "los_days": 3,
        "readmit_30d": 1, "days_to_readmit": 85
    })
    assert any("Inconsistent" in i for i in issues)

def test_cell_suppression():
    res = apply_cell_suppression(n=15, events=3, min_cell_size=20, min_events=5)
    assert res["suppressed"] is True
    assert res["rate"] is None

    res_ok = apply_cell_suppression(n=100, events=25, min_cell_size=20, min_events=5)
    assert res_ok["suppressed"] is False
    assert res_ok["rate"] == 0.25

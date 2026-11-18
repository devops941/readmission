from typing import List, Dict, Any
import pandas as pd
from backend.analysis.patterns import wilson_score_interval

def generate_findings_narrative(df: pd.DataFrame) -> List[Dict[str, Any]]:
    findings = []
    
    if "readmit_30d" not in df.columns:
        return findings
    
    total_n = len(df)
    total_readmit = int(df["readmit_30d"].sum())
    overall_ci = wilson_score_interval(total_readmit, total_n)
    overall_pct = overall_ci["rate"] * 100
    
    # 1. Overall baseline statement
    findings.append({
        "id": "finding_baseline",
        "category": "Baseline",
        "lead": f"Across {total_n:,} de-identified encounters",
        "highlight": f"{overall_pct:.1f}% were readmitted within 30 days",
        "ci_text": f"95% CI: {overall_ci['ci_lower']*100:.1f}–{overall_ci['ci_upper']*100:.1f}%",
        "detail": "This represents the unadjusted reference prevalence across the entire study population."
    })
    
    # 2. Prior admissions driver
    if "prior_admissions_6m" in df.columns:
        high_prior = df[df["prior_admissions_6m"] >= 3]
        if len(high_prior) >= 20:
            hp_events = int(high_prior["readmit_30d"].sum())
            hp_ci = wilson_score_interval(hp_events, len(high_prior))
            findings.append({
                "id": "finding_prior_admissions",
                "category": "Utilization History",
                "lead": "Patients with 3 or more admissions in the prior 6 months",
                "highlight": f"had a readmission rate of {hp_ci['rate']*100:.1f}%",
                "ci_text": f"95% CI: {hp_ci['ci_lower']*100:.1f}–{hp_ci['ci_upper']*100:.1f}%",
                "detail": f"Compared with {overall_pct:.1f}% overall, multiple recent acute hospitalizations correlate strongly with post-discharge readmission vulnerability."
            })
            
    # 3. Scheduled follow-up appointment
    if "followup_scheduled" in df.columns:
        fup_yes = df[df["followup_scheduled"] == 1]
        fup_no = df[df["followup_scheduled"] == 0]
        if len(fup_yes) >= 20 and len(fup_no) >= 20:
            ci_yes = wilson_score_interval(int(fup_yes["readmit_30d"].sum()), len(fup_yes))
            ci_no = wilson_score_interval(int(fup_no["readmit_30d"].sum()), len(fup_no))
            findings.append({
                "id": "finding_followup",
                "category": "Discharge Transition",
                "lead": "Scheduled outpatient follow-up prior to discharge",
                "highlight": f"lowers observed readmission to {ci_yes['rate']*100:.1f}% vs {ci_no['rate']*100:.1f}%",
                "ci_text": f"Without follow-up 95% CI: {ci_no['ci_lower']*100:.1f}–{ci_no['ci_upper']*100:.1f}%",
                "detail": "Confirmed timely post-discharge appointments are associated with reduced acute return visits across clinical service lines."
            })

    # 4. SNF/Rehab disposition
    if "discharge_disposition" in df.columns:
        snf_grp = df[df["discharge_disposition"] == "SNF/Rehab"]
        if len(snf_grp) >= 20:
            ci_snf = wilson_score_interval(int(snf_grp["readmit_30d"].sum()), len(snf_grp))
            findings.append({
                "id": "finding_disposition",
                "category": "Care Transition",
                "lead": "Discharge to Skilled Nursing / Sub-Acute Rehab",
                "highlight": f"observed readmission rate reached {ci_snf['rate']*100:.1f}%",
                "ci_text": f"95% CI: {ci_snf['ci_lower']*100:.1f}–{ci_snf['ci_upper']*100:.1f}%",
                "detail": "Patients transferred to post-acute nursing facilities present complex multimorbidity and elevated 30-day readmission incidence."
            })

    return findings

from typing import Dict, Any, List
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_dossier_pdf(dossier_data: Dict[str, Any]) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom dossier styling tokens (Dossier Lime & Ink)
    title_style = ParagraphStyle(
        "DossierTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0B0B10")
    )
    
    sub_style = ParagraphStyle(
        "DossierSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#4B4B57")
    )
    
    h2_style = ParagraphStyle(
        "DossierH2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#0B0B10"),
        spaceBefore=14,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        "DossierBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#1A1A24")
    )
    
    disclaimer_style = ParagraphStyle(
        "DossierDisclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#71717A")
    )

    story = []
    
    # Title & Header
    story.append(Paragraph("ReadmitExplain AI — Clinical Quality Dossier", title_style))
    story.append(Paragraph("Explainable Hospital Readmission Pattern & Risk Research Report", sub_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#D4F73C"), spaceAfter=15))
    
    # Disclaimer Box
    disclaimer_text = (
        "<b>RESEARCH AND QUALITY IMPROVEMENT USE ONLY.</b> Explanations represent population-level statistical associations, "
        "not medical causation or treatment advice. Analyzed on de-identified historical encounter records. "
        "Strictly not intended for real-time patient triage or clinical decisions."
    )
    disclaimer_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[7.2 * inch])
    disclaimer_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F7F6F4")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#E3E1E0")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(disclaimer_table)
    story.append(Spacer(1, 15))
    
    # Dataset & Model Summary
    story.append(Paragraph("1. Study Dataset & Model Specification", h2_style))
    summary_data = [
        ["Dataset Name", dossier_data.get("dataset_name", "Synthetic De-identified Cohort")],
        ["Total Encounters", f"{dossier_data.get('total_encounters', 12000):,}"],
        ["Readmission Prevalence", f"{dossier_data.get('prevalence_pct', 18.7):.1f}%"],
        ["Model Architecture", dossier_data.get("model_algorithm", "Gradient Boosting Classifier")],
        ["Calibration Method", dossier_data.get("calibration_method", "Isotonic Regression")],
        ["Discrimination (AUROC)", f"{dossier_data.get('auroc', 0.812):.3f} (95% CI)"],
        ["Expected Calibration Error", f"{dossier_data.get('ece', 0.021):.4f}"]
    ]
    t1 = Table(summary_data, colWidths=[2.6 * inch, 4.6 * inch])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F7F6F4")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#0B0B10")),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E3E1E0")),
    ]))
    story.append(t1)
    story.append(Spacer(1, 15))
    
    # Top Risk Drivers Table
    story.append(Paragraph("2. Primary Statistical Risk Drivers (SHAP Attribution)", h2_style))
    driver_headers = [["Rank", "Feature Variable", "Mean |SHAP| Impact", "Clinical Context"]]
    driver_rows = dossier_data.get("drivers", [
        ["1", "prior_admissions_6m", "+0.084", "Frequent prior acute utilization"],
        ["2", "comorbidity_count", "+0.062", "Multimorbidity burden index"],
        ["3", "discharge_disposition_SNF/Rehab", "+0.048", "Post-acute facility placement transfer"],
        ["4", "followup_scheduled", "-0.041", "Protective outpatient visit arranged"],
        ["5", "los_days", "+0.029", "Prolonged inpatient stay duration"]
    ])
    t2 = Table(driver_headers + driver_rows, colWidths=[0.6 * inch, 2.4 * inch, 1.6 * inch, 2.6 * inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0B0B10")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E3E1E0")),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t2)
    story.append(Spacer(1, 15))
    
    # Colophon
    story.append(Paragraph("3. Dossier Colophon & Governance", h2_style))
    colophon_text = (
        f"Generated automatically by ReadmitExplain AI version 2026.1.0 on Python 3.12, scikit-learn, shap, and PyMongo. "
        f"Random seed: {dossier_data.get('seed', 42)}. Split design: Time-based historical months (1–18 train, 19–21 calib, 22–24 test). "
        f"Sign-off analyst: {dossier_data.get('analyst', 'Lead Healthcare Analyst')}. Clinical reviewer: {dossier_data.get('reviewer', 'Quality Committee Chair')}."
    )
    story.append(Paragraph(colophon_text, body_style))
    
    doc.build(story)
    return buffer.getvalue()

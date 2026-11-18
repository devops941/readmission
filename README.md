# ReadmitExplain AI (2026 Edition)
**Hospital Readmission Risk & Clinical Decision-Support Dossier**

A modern 2026 clinical intelligence dossier and dashboard built with a 2-page physical book spread interface, interactive SHAP/PDP interpretability, multivariable logistic regression, fairness disparity tracking, drift monitoring, and an expert review workflow.

---

## 🏛 Architecture & Project Layout

Per project constraints, the entire codebase is strictly organized into two isolated directories:
```
d:\python_projects\readmit\
├── backend\                     # Complete FastAPI Python backend
│   ├── .env                     # MongoDB Atlas URI, JWT secrets, configuration
│   ├── analysis\                # Wilson CIs, logistic regression, plain-language narratives
│   ├── data\                    # Dictionary (22 variables), PHI scanner, validator, synthetic generator
│   ├── db\                      # PyMongo Atlas connection & typed repositories
│   ├── explain\                 # SHAP Tree/Linear explainers, permutation importance, PDP/ICE, local waterfall
│   ├── fairness\                # 8 protected attribute disparity calculations & suppression hatching
│   ├── ml\                      # Chronological time splits, leakage guard, models, calibration, decision curves
│   ├── monitor\                 # Feature PSI drift strip, KS-test, model degradation alerts
│   ├── report\                  # ReportLab PDF generator, openpyxl Excel exporter
│   ├── routers\                 # 12 REST API endpoints
│   ├── scripts\                 # Admin creation and database seeder
│   ├── tests\                   # Pytest test suite (100% pass)
│   └── outputs\                 # Trained model joblib artifacts and exported PDF/Excel files
│
├── frontend\                    # Complete React 18 + Vite + TypeScript application
│   ├── src\
│   │   ├── api\                 # Typed API client
│   │   ├── components\
│   │   │   ├── auth\            # Login & Register spreads with one-click demo logins
│   │   │   ├── book\            # 2-Page Book Spread, Bookmark Ribbon, Table of Contents, Library Card, Fold Buttons
│   │   │   ├── chapters\        # 10 Clinical Dossier Chapters
│   │   │   └── charts\          # Recharts visualizations (ROC/PR, Calibration, SHAP dots, PDP, Decision Curves)
│   │   ├── context\             # AuthContext session & dataset management
│   │   └── types\               # TypeScript data models
│   └── dist\                    # Production-optimized build (zero errors)
│
└── PROJECT_SPEC_READMIT.md      # Specification document
```

---

## 🎨 2026 Design System & Aesthetics

- **Strict Light Theme Only**: Clean linen desk background (`#F0EDE8`), high-contrast off-black charcoal ink (`#0B0B10`), and bright paper margins.
- **Strictly No Blue**: Replaced generic corporate blues with an authoritative editorial palette:
  - **Dossier Lime** (`#D4F73C`): Key callouts, active tabs, interactive sliders, ribbons.
  - **Deep Charcoal / Ink** (`#0B0B10`): High-legibility text and structural spine bindings.
  - **Coral Rose** (`#E11D48`): High risk, adverse outcomes, critical drift alerts.
  - **Emerald Green** (`#059669`): Protective factors, calibrated models, verified privacy scans.
  - **Amber Gold** (`#D97706`): Moderate risk, uncalibrated baselines, early warnings.
- **Physical Book Metaphor**:
  - 2-page open book spread with running heads, page folios, page flip keyboard shortcuts (`←` / `→`).
  - Table of Contents slide-out bookmark popover.
  - Vintage Library Card with stamp-box history of model validations and clinical sign-offs.
  - Dotted printed fields, marker highlighter stripes (`.marker-lime`, `.marker-amber`, `.marker-coral`), and diagonal hatch marks for small-cell suppression ($n < 20$).

---

## 🔑 Default Credentials & Demo Accounts

The database is connected to **MongoDB Atlas** (`readmitexplain` database) and is pre-seeded with 12,000 synthetic patient encounters, 3 prospective models, and 3 clinical cohorts.

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@readmitexplain.local` | `Admin@2026!Readmit` | Full system access, user management, audit logs |
| **Analyst** | `analyst@readmitexplain.local` | `Analyst@2026!Readmit` | Train models, upload datasets, adjust thresholds |
| **Clinical Reviewer** | `reviewer@readmitexplain.local` | `Reviewer@2026!Readmit` | Review local patient waterfalls, log triage notes |

*(One-click quick login buttons are also available directly on the login screen for instantaneous testing).*

---

## 🚀 Quick Start Guide

### 1. Run the Backend API

**Option A (From inside `backend` folder):**
```powershell
cd d:\python_projects\readmit\backend
python run.py
# OR
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Option B (From project root `readmit`):**
```powershell
cd d:\python_projects\readmit
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/health`

### 2. Run the Frontend Dashboard
```powershell
cd d:\python_projects\readmit\frontend
npm run dev
```
- Open browser at `http://localhost:5173`

### 3. Run Backend Test Suite
```powershell
cd d:\python_projects\readmit
python -m pytest backend/tests -v
```
*(All 9 unit & API integration tests pass with 100% success).*

---

## 🛡️ Epistemic Disclaimer
*Research and quality-improvement use only. Population-level patterns for expert review. Explanations show statistical association, not causation. Not for individual clinical decisions without clinician verification.*

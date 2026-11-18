# ReadmitExplain AI: Explainable Hospital Readmission Pattern & Risk Analysis (Dashboard Website)

**Type:** Final-year project | **Domain:** Healthcare Analytics | **Purpose:** healthcare quality research on **de-identified historical data** for **expert review** (NOT an automated clinical decision tool, NOT for scoring real patients)
**Product style:** Real multi-page **website with login screens, roles, and data entry inside the app**. Light theme only, with its own "Dossier Lime" colour system and a **two-page book-spread layout**. NOT Streamlit.
**Stack:** React 18 + TypeScript (Vite) + Tailwind + shadcn/ui, FastAPI, Python (pandas, NumPy, SciPy, statsmodels, scikit-learn, SHAP), **MongoDB Atlas (PyMongo)**, config in **`.env`**. No deep learning.

> **Instructions for Claude Code:** Read this whole file. Build phase by phase using the prompts in Section 18. After each phase run tests and check acceptance criteria before moving on. Ask only if truly blocked.
> **Hard rules:**
> 1. No Streamlit/Dash. UI = React + Vite + TypeScript calling a FastAPI REST API.
> 2. Database = MongoDB Atlas via PyMongo. All secrets/settings live in `.env` only. Never write a real credential into any committed file (`.env.example`, README, tests, comments). The developer pastes the real URI into the local git-ignored `.env`.
> 3. Python owns all data validation, statistics, model training, calibration, explanation (SHAP), subgroup and drift analysis, and reports. React only collects input and displays results.
> 4. Light theme only. Use the Section 12 tokens, fonts, shapes and the 12.4 layout exactly. **This UI must be completely different from every other project I have built** (colours, fonts, navigation, page structure, option placement). See the banned list in 12.1.
> 5. The app opens with **synthetic, de-identified demo encounters** already loaded (`scripts/seed.py`). Never commit or require real patient data. Every upload passes a **PHI scan** and a "this data is de-identified" confirmation.
> 6. Every screen showing model output carries: **"Research and quality-improvement use only. Population-level patterns for expert review. Explanations show statistical association, not causation. Not for individual clinical decisions."**
> 7. There is **no real-time patient-scoring endpoint**. Explanations are shown for historical de-identified records only.

---

## 1. Vision
Hospitals want to understand **who is readmitted within 30 days and why**, without treating a model as a clinician. ReadmitExplain AI lets analysts bring in de-identified encounter data (or enter records), explore **population-level readmission patterns**, train and **calibrate** transparent models, **explain the drivers** (global and per-record SHAP, partial dependence), check **subgroup performance and disparities**, **monitor drift**, and let clinical experts **review, agree with, or flag** the explanations before anything is exported.

## 2. Objectives
1. Website with landing, login/register, role-based app, in-app data entry.
2. Dataset management: import, data dictionary, validation, **PHI scan**, de-identification checks.
3. Pre-processing: cleaning, encoding, missing-value handling, leakage-safe feature set, time-based splits.
4. Analysis engine: pattern exploration with confidence intervals, logistic regression (odds ratios), tree ensembles, **probability calibration**, threshold analysis, decision-curve net benefit.
5. Interpretation: global importance (permutation + SHAP), partial dependence/ICE, local explanations, plain-language driver summaries, explanation stability.
6. Subgroup checks (performance and calibration by group, small-cell suppression) and **model monitoring** (data drift, performance drift).
7. Expert review workflow (agree / disagree / flag with comments, stored and audited).
8. Reports and exports (PDF/Excel/CSV), all data in MongoDB configured only through `.env`.

## 3. Scope
**In:** auth, roles, de-identified encounter data entry/import, validation + PHI scan, pattern analysis, model training/calibration, explanations, subgroup and drift analysis, expert review, reports, admin. **Out:** real-time patient scoring or EHR integration, causal claims, treatment recommendations, deep learning, handling identifiable data, native apps.

## 4. Roles and Login Screens
| Role | Access |
|---|---|
| **Analyst** | Datasets, validation, patterns, model runs, explanations, subgroup and drift reports, exports |
| **Clinical Reviewer (expert)** | Read analyses, review explanations and flagged records, write review notes |
| **Admin** | Everything + users, dictionary governance, audit log, jobs |

Screens: login (an open-book sign-in page, see 12.4), register (strength meter, role request), forgot/reset (admin-issued token, no email needed), profile. JWT access + refresh, route guards, bcrypt, rate limiting, lockout after 5 failures. First admin via `scripts/create_admin.py` using `.env`.

## 5. Data Entry and Sources
| Dataset | Fields |
|---|---|
| Datasets | name, description, source note, de-identification statement, version, row count, created by |
| **Encounters (de-identified)** | pseudo `encounter_id`, `age` (years or band), `sex`, optional `race_ethnicity` (used only for fairness checks), `insurance`, `admission_type`, `primary_dx_group`, `comorbidity_count`, `prior_admissions_6m`, `prior_ed_visits_6m`, `los_days`, `num_medications`, `num_procedures`, optional labs (e.g. `glucose`, `sodium`, `hba1c`), `discharge_disposition`, `med_changes`, `followup_scheduled`, `discharge_month` (month index, not exact date), **`readmit_30d` (label)**, `days_to_readmit` |
| Data dictionary | variable, type, allowed range or categories, clinical group, role (feature / label / sensitive / excluded), leakage flag, description |
| Cohorts | name, filter definition (JSON), owner |
| Expert reviews | target (model run, global driver, or record), verdict (agree/disagree/flag), comment, reviewer |

Entry methods in the app: **record entry form** (grouped fields with live validation), **inline-editable ledger**, paste-from-spreadsheet, CSV import wizard (upload → map columns to the dictionary → validation + PHI scan → commit), dictionary editor (admin/analyst).

**Seed data (`scripts/seed.py`, fixed seed):** admin + demo analyst + demo reviewer; 1 dataset of **12,000 synthetic encounters** with realistic relationships (readmission probability rising with prior admissions, comorbidity count, short follow-up gaps, certain discharge dispositions and diagnosis groups; weaker effects for age and LOS; planted interaction and a planted small subgroup with miscalibration so the fairness and calibration pages show something real); a data dictionary; 3 cohorts; 3 trained model runs (logistic, random forest, gradient boosting) with explanations; one subgroup report; one drift report; a few expert reviews; a second small **messy file** (missing values, impossible ages/LOS, duplicates, discharge before admission-month, readmit label inconsistent with days, and a few fake phone/email/name-like strings to trigger the PHI scanner). Label all **"synthetic de-identified demo data"** in the UI and README. Optionally document how to import a public de-identified dataset (for example the UCI "Diabetes 130-US hospitals" data) through the import wizard, but never bundle it.

### Validation rules (Pydantic + pandas checks; clear messages)
Required fields; types and allowed categories from the dictionary; age 0-120; LOS 0-365; counts ≥ 0; `days_to_readmit` ≥ 0 and consistent with `readmit_30d` (label = 1 only if days ≤ 30; both missing or both present); exact-duplicate and duplicate `encounter_id` handling (skip/keep first/keep last); missingness report per column (columns above 40% missing flagged); constant or near-constant columns flagged; **PHI scan** (regex and heuristics for names, phone numbers, emails, SSN/national-id-like patterns, full dates of birth, street addresses, free-text notes) blocks commit unless the offending column is dropped or masked; rare category warning (n < `MIN_CELL_SIZE`); label prevalence shown; CSV row-level error table with "import valid rows only". All writes audited.

## 6. System Flow
```
Login -> role-based app
 [1] Data entry / import -> validation + PHI scan -> MongoDB
 [2] Pre-processing: cleaning, encoding, leakage-safe features, time-based split
 [3] Pattern analysis (rates with confidence intervals, cohorts, trends, interactions)
 [4] Models: logistic regression, random forest, gradient boosting -> calibration -> threshold analysis
 [5] Explanations: permutation importance, SHAP, partial dependence, local explanations
 [6] Subgroup checks and fairness gaps; drift and performance monitoring
 [7] Expert review (agree / disagree / flag)
 [8] Reports and export
```
Training and explanation jobs run as FastAPI background tasks with progress polling, cancel and time limits; every run stores a full parameter snapshot and seed.

## 7. Methods

### 7.1 Pre-processing and leakage control
- Missing values: numeric median + missing-indicator, categorical "missing" level (documented, applied inside a scikit-learn `Pipeline` so no leakage from test data). Rare categories grouped below a threshold. One-hot encoding for categoricals (scaled numerics for logistic regression only).
- **Leakage guard:** only variables flagged `feature` and **available at discharge** may be used; the dictionary's `leakage flag` (e.g. `days_to_readmit`, post-discharge variables) hard-blocks use; the UI shows which columns were excluded and why.
- **Splits:** primary = **time-based** (train on earlier `discharge_month`, validate on later, test on the latest months); alternative = stratified random split with fixed seed. Hyper-parameters tuned only with CV inside the training set (`StratifiedKFold`; group by `encounter_id` if repeats exist).

### 7.2 Pattern analysis (descriptive, no model)
Readmission rate overall and by group (age band, diagnosis group, discharge disposition, insurance, prior admissions bucket, LOS bucket, follow-up scheduled) with **Wilson 95% confidence intervals**; monthly trend; two-way tables (e.g. age band × diagnosis group) with small-cell suppression (n < `MIN_CELL_SIZE` hidden); univariate relative risk and odds ratio with CI; chi-square or Fisher test and effect size (Cramér's V) per variable; **multivariable logistic regression** (`statsmodels`) with **odds ratios, 95% CI, p-values** and a Hosmer-Lemeshow-style calibration check. Auto-generated plain-language findings ("Patients with 3 or more admissions in the prior 6 months were readmitted at 31% (95% CI 28-34%) versus 14% overall").

### 7.3 Models
Logistic regression (L2, class-weight option), `RandomForestClassifier`, `GradientBoostingClassifier` (scikit-learn; chosen so SHAP TreeExplainer is supported). Fixed `random_state`. Small hyper-parameter grids via CV. Class imbalance handled with class weights (no resampling leakage).

### 7.4 Evaluation and calibration
- Discrimination: **AUROC, AUPRC**, with **bootstrap 95% CIs** (fixed seed).
- **Calibration:** reliability curve (quantile bins), **Brier score**, **expected calibration error (ECE)**, calibration intercept and slope; **post-hoc calibration** with Platt (sigmoid) or isotonic via `CalibratedClassifierCV`, fitted on a separate calibration split; before/after comparison shown.
- **Threshold analysis:** sensitivity, specificity, PPV, NPV, F1 and the confusion matrix across thresholds; **decision-curve net benefit** versus "treat all" and "treat none". The threshold is an editable research parameter, labelled as such, never as clinical advice.
- Model comparison table (all models, same split) and a "simplest model within one standard error" note.

### 7.5 Explanations
- **Global:** permutation importance (on the test split, repeated, with intervals), **SHAP summary** (mean |SHAP| and beeswarm data via `shap.TreeExplainer` for tree models, `shap.LinearExplainer` for logistic regression; fall back to `shap.Explainer` with a permutation masker if needed), **partial dependence and ICE** for chosen features, and grouped-feature importance (e.g. utilisation history vs demographics).
- **Local (historical de-identified records only):** SHAP waterfall for a selected record, the nearest similar records summary, and plain-language text ("The estimate for this historical record was pushed up mainly by 4 prior admissions and discharge to a skilled facility, and down by a scheduled follow-up"). Check **additivity**: base value + sum of SHAP = model output.
- **Explanation stability:** bootstrap or refit-on-resample top-k driver overlap (Jaccard), shown so experts can see whether drivers are robust.
- Mandatory caveat text: associations, not causes; correlated features share credit.

### 7.6 Subgroup checks and fairness
For each sensitive/stratifying variable (age band, sex, race_ethnicity, insurance, diagnosis group): n, prevalence, AUROC, calibration slope, Brier, TPR, FPR, PPV at the chosen threshold, with CIs; **gaps** versus the overall (max-min difference, ratio); equal-opportunity and equalised-odds style gaps; calibration-by-group curves. **Small-cell suppression** (n < `MIN_CELL_SIZE` or fewer than 5 events → hidden and labelled). Findings phrased as "performance differs" with a note on sample size; no automatic "fair/unfair" verdict.

### 7.7 Model and data monitoring
Reference window = training period; monitoring windows = later months. **Data drift:** PSI and KS statistic per feature (alert thresholds PSI 0.1 warning, 0.25 critical, editable); **label drift** (prevalence change); **performance drift** (AUROC, Brier, calibration slope by month with bootstrap bands); **prediction drift** (distribution of estimates). Alert items written to `alerts` and shown in the Monitor chapter. A model-registry list tracks versions, training windows and status (candidate / active / retired).

### 7.8 Expert review
Reviewers see each global driver and selected record explanations, then **Agree**, **Disagree** (with reason) or **Flag as clinically implausible / data issue**. Flags can mark a feature "needs investigation" in the dictionary. All reviews are stored with the model run id, are visible in the report, and are audited. Review is for governance, not for approving patient-level decisions.

## 8. Technology Stack
| Layer | Choice |
|---|---|
| Web | React 18, TypeScript, Vite |
| UI | Tailwind, shadcn/ui (Radix), lucide-react |
| Charts | Recharts + custom SVG (reliability curve, ROC/PR, SHAP beeswarm and waterfall, heatmap, drift strip) |
| Forms / tables | React Hook Form + Zod, TanStack Table (virtualised for large ledgers) |
| Data / routing | TanStack Query, React Router |
| UX extras | framer-motion, sonner, cmdk, `@fontsource/instrument-serif`, `@fontsource/albert-sans`, `@fontsource/martian-mono` |
| Backend | FastAPI, Uvicorn, Pydantic v2, pydantic-settings, python-multipart |
| Auth | PyJWT, bcrypt, slowapi |
| DB | MongoDB Atlas via PyMongo |
| Analytics / ML | pandas, NumPy, SciPy, statsmodels, scikit-learn, **shap**, joblib |
| Reports | Jinja2, matplotlib, weasyprint, openpyxl |
| Tests | pytest + httpx, Vitest + RTL, optional Playwright |
| Quality | ruff, black, ESLint, Prettier, Git |
| Deploy | Docker + docker-compose (optional) |

## 9. MongoDB Collections
`users`, `datasets`, `encounters` (indexes: unique (dataset_id, encounter_id); (dataset_id, discharge_month); bulk inserts in batches), `data_dictionary`, `validation_issues`, `phi_findings`, `import_jobs`, `cohorts`, `analysis_cache` (keyed by dataset version + cohort), `model_runs` (algorithm, params, feature list, excluded features, split definition, metrics with CIs, calibration, artifact path, status, seed), `explanations` (global tables, selected local explanations, stability), `subgroup_reports`, `drift_reports`, `alerts`, `expert_reviews`, `reports`, `notifications`, `audit_log`, `job_runs`.
Rules: repositories layer only; `jsonSchema` validators on users, datasets, encounters; idempotent seeding by upserts; models saved with joblib to `MODEL_DIR` (path in Mongo); never store free-text clinical notes; every analytics query runs through the small-cell suppression layer; tests use `MONGODB_TEST_DB_NAME`, never the main DB.

## 10. Environment (`.env`)
`.env` and `frontend/.env` are git-ignored; only `.env.example` files with placeholders are committed.
```env
APP_ENV=development
APP_HOST=127.0.0.1
APP_PORT=8000
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173

# Paste the real Atlas URI ONLY in your local .env. URL-encode special characters in the password.
MONGODB_URI=mongodb+srv://<db_user>:<url_encoded_password>@<cluster-host>/?retryWrites=true&w=majority
MONGODB_DB_NAME=readmitexplain
MONGODB_TEST_DB_NAME=readmitexplain_test
MONGODB_TIMEOUT_MS=8000

JWT_SECRET=change-me-to-a-long-random-string
JWT_ACCESS_MINUTES=30
JWT_REFRESH_DAYS=7
MAX_FAILED_LOGINS=5
LOCKOUT_MINUTES=15
ADMIN_EMAIL=admin@readmitexplain.local
ADMIN_PASSWORD=change-me-strong

READMIT_WINDOW_DAYS=30
MIN_CELL_SIZE=20
MIN_EVENTS_SUBGROUP=5
MISSING_COLUMN_WARN_PCT=40
PHI_SCAN_ENABLED=true
RANDOM_SEED=42
BOOTSTRAP_ITERATIONS=1000
SHAP_MAX_SAMPLES=500
PSI_WARN=0.1
PSI_CRITICAL=0.25
JOB_TIMEOUT_SEC=600

MODEL_DIR=outputs/models
REPORT_DIR=outputs/reports
UPLOAD_DIR=data/uploads
MAX_UPLOAD_MB=50
```
`frontend/.env.example`: `VITE_API_BASE_URL=http://localhost:8000/api`, `VITE_APP_NAME=ReadmitExplain AI`.
Rules: pydantic-settings, fail fast on missing/placeholder `MONGODB_URI` or `JWT_SECRET`; `/api/health` pings DB; least-privilege Atlas user (readWrite on this DB only); never log the URI or any row content.

## 11. API (under `/api`, Pydantic validated, errors as `{detail, code, fields}`)
Health; Auth (register, login, refresh, logout, me, change-password, forgot, reset); datasets CRUD; encounters (`GET` paginated with filters, `POST`, `PUT`, `DELETE`, bulk); dictionary CRUD; `POST /import` (multipart) + `GET /import/{id}/issues` (validation + PHI findings) + `POST /import/{id}/commit`; cohorts CRUD; `GET /patterns/rates?by=`, `/patterns/trend`, `/patterns/crosstab`, `/patterns/regression`, `/patterns/findings`; `POST /models/train` (background) + status, `GET /models`, `GET /models/{id}` (metrics, calibration, thresholds, decision curve), `POST /models/{id}/calibrate`, `POST /models/{id}/activate|retire`, `GET /models/compare`; `GET /explain/{id}/global`, `/explain/{id}/pdp?feature=`, `/explain/{id}/record/{encounter_id}`, `/explain/{id}/stability`; `GET /subgroups/{id}`; `POST /monitor/run` + `GET /monitor/{id}`; alerts; expert reviews (create, list); reports (create, list, download) and exports; admin (users, audit log, jobs, system). No endpoint accepts raw new patient features for live scoring.

## 12. UI / UX Design System: "Dossier Lime" (light)

### 12.1 Must be different from all earlier projects
**Banned layouts (already used elsewhere):** left sidebar or any vertical nav rail; top navigation tabs; dark top command bar with stage switcher; floating bottom dock; full-screen index overlay with a round INDEX button; single scrolling story of "acts" with a progress rail; mode carousel with HUD overlays and a status bar; KPI-card row at the top of a page; split-screen login; notebook-cover login; conversational one-question login; coral sticker-card login; HUD sign-in over an image; node-graph canvas; monitor wall of tiles; swimlane timelines; email-inbox triage; spreadsheet workspace with bottom sheet tabs; side-sheet editors; bottom-drawer inspectors; masonry or uniform card galleries; lineage boards; "plates"; figure-story pages; leaderboard + Pareto; radial sensitivity; dataset column boards; block-editor reports; outline + preview or filmstrip report builders; accordion pantry data pages; tabs-over-a-table pages; drag-to-resize plot maps; podium and swipe decks; ROI corner brackets and rule-only editorial pages; hard offset shadows and sticker badges; pill-shaped everything. **Banned palettes:** green/gold farm, ice-blue, transit blue, parchment + terracotta, concrete + graphite + safety yellow, lavender + violet, coral + pastel blocks, ruby on white. **Banned fonts:** Inter, Fraunces, Manrope, JetBrains Mono, IBM Plex, Sora, DM Sans, DM Mono, Bricolage Grotesque, Figtree, Red Hat Mono, Space Grotesk, Hanken Grotesk, Spline Sans Mono.

### 12.2 Tokens
| Token | Value | Use |
|---|---|---|
| desk | `#EEE9E6` (linen grey) | The surface the book sits on (app background) |
| page | `#FFFFFF` | The two pages |
| page-shade | `#F7F6F4` | Gutter gradient, alternate ledger rows |
| ink | `#0B0B10` | Text and primary buttons |
| ink-2 | `#4B4B57` | Secondary text |
| ink-3 | `#8A8A96` | Hints, disabled, page numbers |
| rule | `#E3E1E0` | Hairlines, ledger lines |
| highlight (lime) | `#CFF53A`, strong `#B7DB1C`, soft `#F2FBC4`, text on highlight = ink | Marker highlights on key phrases, the bookmark ribbon, active chapter, button hover fill |
| UI states | success `#2F8F5B`, warning `#B7791F`, danger `#C0392B`, info `#2C6FBB` with soft backgrounds | Toasts, validation |

**Data and explanation colours:** pushes risk UP `#E03E52`, pushes risk DOWN `#3A86A8`; observed rate (points) `#0B0B10`; model estimate / calibrated curve `#6B8E00` (olive) with an ideal diagonal in `#8A8A96` dashed; before calibration `#B5651D` dashed; reference window `#8A8A96`, monitoring window `#E03E52`; suppressed cells = hatch pattern on `#F7F6F4`. Subgroup palette: `#E03E52`, `#3A86A8`, `#F2A541`, `#8E6BBF`, `#2E9E7A`, `#C27BA0`, `#6B7280`, `#B5651D`. Never colour alone: lines also vary in dash style; risk direction also uses ▲/▼ glyphs.
Focus ring: 2px ink outline with a 3px lime offset ring.

### 12.3 Type, shape, motion
Fonts: **Instrument Serif** (headings 40-72px, italic for emphasis, and for large inline numerals), **Albert Sans** (body 15px), **Martian Mono** (all numbers in tables, IDs, metrics). The signature elements: (1) **marker highlight** — key phrases and drivers in prose are highlighted with a thick lime underline-highlight band (`background: linear-gradient(transparent 55%, #CFF53A 55%)`); (2) **printed-form fields** — inputs are plain text on a **dotted underline** (1.5px dotted ink), labels above in small caps; (3) **folded-corner buttons** — rectangular ink buttons with a small folded-corner triangle at the bottom-right, inverting to lime fill with ink text on hover; (4) **page furniture** — running head (chapter name in small caps at the page top), folio numbers (mono, bottom outer corners), a soft gutter shadow in the centre, thin stacked page-edge lines at the left and right of the book. Radius 0 on pages, 3px on controls. Page turn motion: the right page content slides 24px and fades in over 200ms with a soft shadow sweep along the gutter; instant under reduced-motion.

### 12.4 Navigation and layout: "The Dossier" (a two-page book spread)
**Shell:** the app is a **book open on the desk**: two white pages side by side in the middle of the `desk` background (max width ~1360px; centred), each page a vertical column of content with a running head and a folio number. There is **no sidebar, no top nav, no dock, no tab bar**.
- **Bookmark ribbon:** a lime ribbon hangs from the top centre of the gutter showing the current chapter ("3 · Models"). Clicking it opens the **Contents popover** (chapter list with page ranges, completion marks, and the Appendix).
- **Page turner:** large ◂ ▸ folio arrows at the bottom corners of the book with the page numbers ("p. 12"); keyboard `←` `→` turn spreads, `Shift+←/→` jump chapters, `Ctrl+K` command palette. **Expand page** (`E`) maximises either page to full width for wide tables and charts.
- Top-left (on the desk, outside the book): a small **library card** chip (current dataset and version, click to switch). Top-right (on the desk): initials circle (menu: profile, appendix, sign out).
- **Chapter pattern:** the **left page = reading and controls** (prose, the question being asked, forms phrased as sentences, parameters as printed fields); the **right page = evidence** (charts, tables, ledgers). Every spread ends with a one-line "Next: …" folded-corner button in the lower right.

**Frontispiece (home):** left page = title in Instrument Serif and an auto-written paragraph about the active dataset with **giant inline serif numerals** ("**12,000** de-identified encounters; **18.7%** were readmitted within 30 days") and a "Continue where you left off" line; right page = **Contents** as a classic dot-leader table of chapters with page numbers and status marks (✓ done, ○ not started, ! needs attention). No KPI cards.

**Ch. 1 Intake (data entry):**
- Spread 1.1 *Bring in data*: left = instructions plus a dotted **drop area** and the de-identification confirmation; right = the **column-mapping ledger** (file column → dictionary variable, inline dropdowns with match confidence).
- Spread 1.2 *Checks*: left = issue summary in prose (counts by type) with **PHI findings highlighted in lime** and "Mask / Drop column" actions; right = row-level issue list with inline fixes and "Import valid rows only".
- Spread 1.3 *Add or edit a record*: left = the **record form** as printed-form fields grouped under small-caps headings (Patient profile, Stay, History, Discharge, Outcome); right = the **ledger** of recent records (virtualised, inline editable, delete with undo, paste-from-spreadsheet row at the top).
- Spread 1.4 *Dictionary*: left = how roles and leakage flags work; right = editable dictionary ledger (type, range, role, leakage flag).

**Ch. 2 Patterns:** left = a **filter sentence** ("Show patients aged **[all]** admitted for **[all diagnoses]** discharged to **[anywhere]** between **[month]** and **[month]**") with dotted-underline selectors, saved cohorts as a short list, and the auto-written findings paragraph with highlighted phrases; right = the evidence page with a **small-caps view switcher written as words** (RATES · TREND · CROSS-TAB · ODDS RATIOS) over `RateBars` with CIs, `TrendLine`, `AgeDxHeatmap` (small cells hatched) or the odds-ratio forest list. A second spread, *Compare two cohorts*, shows cohort A and B as left and right pages.

**Ch. 3 Models:** left = the **training form in prose** ("Train a **[gradient boosting]** model on months **[1-18]**, calibrate with **[isotonic]** on months **[19-21]**, and test on months **[22-24]**" plus excluded-feature list with reasons); right = results: `RocPrPair`, `ReliabilityCurve` (before vs after calibration), a metrics table with CIs, a model comparison list, `ThresholdSlider` with confusion matrix and the decision-curve plot on the following spread.

**Ch. 4 Explain:** left = **driver narrative** (ordered list of the top drivers in prose with highlighted phrases and the caveat paragraph) and a stability note; right = `ShapSummaryDots` (beeswarm), permutation importance bars, `DependencePlot` picker (words). Spread 4.2 *A historical record*: left = record picker (by id) and the plain-language explanation; right = `WaterfallExplain` and the "similar records" mini table, all labelled "historical record, not a prediction for care".

**Ch. 5 Subgroups:** left = prose findings and sample-size cautions; right = `SubgroupTable` (rows = groups, columns = n, events, AUROC, slope, TPR, FPR with CIs; suppressed rows hatched), calibration-by-group curves on the next spread, gap summary as a typographic list.

**Ch. 6 Monitor:** left = drift summary in prose and the alert thresholds as printed fields; right = `DriftStrip` (month-by-month heat strip of PSI per feature), performance-over-time lines with bands, registry list (candidate / active / retired).

**Ch. 7 Review:** left = the item under review (a driver or a record explanation) with its evidence summary; right = the **review form** (Agree / Disagree / Flag as three printed checkboxes, comment field, "needs investigation" tick) and the history of reviews as **margin notes** drawn in the page margin with small connector ticks to the text they refer to.

**Ch. 8 Export:** left = **"Print this book"**: tick the chapters/spreads to include (check-list with page counts), title, reviewer sign-off lines; right = a **table-of-contents preview** and options PDF / Excel / CSV; below, a **Colophon** (dataset version, model versions, seeds, split definition, library versions, disclaimer) auto-filled.

**Appendix:** Users, Audit log, Jobs, System status, Profile, About/Methodology as plain ruled ledgers on the right page with explanatory text on the left; reached from the Contents popover.

**Login/Register/Forgot:** the closed **desk with the book open to a title spread**: left page = Instrument Serif title "ReadmitExplain AI", a one-line description and the disclaimer; right page = a printed **sign-in form** (dotted-underline fields, folded-corner "Sign in" button, show/hide, errors in a red margin note). Register = "Request a reading card", Forgot = "Lost your place?". Mobile: a single page with the form first.

**Landing (public):** the same open book: left page = a short statement and the disclaimer, right page = an **animated SHAP waterfall demo** (bars drawing in, with highlighted phrases) and an "Open the book" folded-corner button. No feature grid.

Responsive: below 1024px the spread becomes **one page at a time** (left page then right page as consecutive pages with swipe); the ribbon becomes a sticky top ribbon; tables get "Expand page"; forms stack.

### 12.5 Component names
`BookShell`, `Spread`, `Page` (+ `RunningHead`, `Folio`), `Gutter`, `BookmarkRibbon`, `ContentsPopover`, `PageTurner`, `ExpandPage`, `LibraryCard`, `FoldButton`, `PrintedField`, `FilterSentence`, `TrainingSentence`, `HighlightMark`, `ProseStat`, `DropArea`, `MappingLedger`, `IssueList`, `PhiFinding`, `RecordForm`, `LedgerTable`, `DictionaryLedger`, `ViewWords`, `RateBars`, `TrendLine`, `AgeDxHeatmap`, `OddsForest`, `RocPrPair`, `ReliabilityCurve`, `ThresholdSlider`, `DecisionCurve`, `ModelCompareList`, `ShapSummaryDots`, `ImportanceBars`, `DependencePlot`, `WaterfallExplain`, `SubgroupTable`, `DriftStrip`, `ReviewForm`, `MarginNotes`, `PrintBookPicker`, `Colophon`, toasts with undo, confirm dialogs.

## 13. Pages (routes)
`/` Landing; `/login` `/register` `/forgot`; `/book` Frontispiece; `/book/intake/:spread?`; `/book/patterns/:spread?`; `/book/models/:spread?`; `/book/explain/:spread?`; `/book/subgroups/:spread?`; `/book/monitor/:spread?`; `/book/review/:spread?`; `/book/export`; `/book/appendix/:section?`; `/about` (methods, limitations, disclaimer, synthetic-data notice). Deep-linkable spreads (`/book/models/2`).

## 14. Project Structure
```
readmit-explain/
|-- PROJECT_SPEC_READMIT.md  README.md  requirements.txt  .env.example  .gitignore  docker-compose.yml
|-- scripts/ (seed.py, create_admin.py)
|-- src/ (config.py, db/{mongo.py,repositories/}, data/{synthetic.py,validate.py,phi_scan.py,ingest.py,dictionary.py},
|        analysis/{patterns.py,regression.py,suppress.py,findings.py},
|        ml/{features.py,splits.py,models.py,evaluate.py,calibrate.py,threshold.py,decision_curve.py,registry.py},
|        explain/{shap_explain.py,permutation.py,pdp.py,local.py,stability.py,text.py},
|        fairness/subgroups.py, monitor/{drift.py,performance.py}, report/)
|-- backend/ (main.py, deps.py, schemas.py, security.py, jobs.py, routers/)
|-- frontend/ (.env.example, src/{api,components/{book,charts,forms,ui},pages,context,styles})
|-- tests/  docs/  outputs/{models,reports}
```

## 15. Testing Plan
Config fail-fast; URI never logged; test DB isolation; auth lockout/JWT expiry; role guards; no live-scoring endpoint exists. **Validation:** one test per rule; label/`days_to_readmit` consistency; seeded messy file yields the expected issues; **PHI scanner** flags the fake phones/emails/names/ID-like strings and blocks commit. **Leakage:** columns flagged as leakage never reach the model; imputers/encoders fit on training data only; time-based split never trains on later months. **Patterns:** Wilson CI against hand-calculated values; odds ratio/CI vs a hand 2×2 table; regression ORs match `statsmodels` directly; small-cell suppression hides n < `MIN_CELL_SIZE` everywhere (API and exports). **Models/evaluation:** AUROC and AUPRC on a tiny hand example; Brier of the true probabilities on synthetic data is lower than of a constant predictor; ECE and calibration slope on constructed data; calibration (Platt/isotonic) improves ECE on the miscalibrated seed model; threshold metrics vs a hand confusion matrix; decision-curve net benefit formula check; bootstrap CIs reproducible with a seed. **Explanations:** SHAP additivity (base + sum = model output) within tolerance; the planted strongest driver ranks top in permutation importance and SHAP; PDP monotone for a planted monotone effect; explanation text mentions the correct top features; stability Jaccard = 1 for identical runs. **Subgroups:** hand-calculated group TPR/FPR; suppressed groups labelled; planted miscalibrated subgroup is surfaced. **Monitoring:** PSI of identical distributions ≈ 0, of a shifted distribution above the threshold; KS test sanity; alert created on drift. **Review:** reviews audited and attached to the run; flags update the dictionary only when confirmed. **API:** every endpoint status/schema; background job lifecycle (queued → running → done/cancelled/failed); field-level errors. **Frontend:** component tests for `FilterSentence`, `PrintedField` validation, `LedgerTable` inline edit and paste, `ContentsPopover`, `PageTurner` keyboard and `ExpandPage`, `SubgroupTable` hatching, `ReviewForm`; zero TypeScript errors; optional Playwright journey (sign in → import messy file → fix PHI → train → calibrate → explain a record → subgroup check → review → print book).

## 16. Risks and Mitigations
| Risk | Mitigation |
|---|---|
| Model output used for clinical decisions | Disclaimers on every screen/report, no scoring endpoint, historical-records-only explanations, thresholds labelled research parameters |
| Re-identification / PHI in uploads | De-identification confirmation, PHI scan blocking commit, small-cell suppression, no free text, synthetic seed only, no real data in the repo |
| Data leakage inflates performance | Dictionary leakage flags, pipeline fit on train only, time-based splits, leakage tests |
| Misread explanations (causation) | Caveat text beside every explanation, stability view, expert review step |
| Unreliable subgroup statistics | CIs, suppression of small n, "performance differs" wording, sample size shown |
| Probability miscalibration | Calibration step, reliability curves, before/after comparison |
| Slow SHAP on large data | Sampling cap `SHAP_MAX_SAMPLES`, background jobs, caching |
| Secrets exposed | `.env` git-ignored, placeholders only, least-privilege Atlas user, rotate any credential ever shared |
| UI drifting to earlier projects' look | 12.1 banned list enforced in review and the final uniqueness check |

## 17. Deliverables Checklist
- [ ] Website: landing, open-book sign-in, role-based Dossier with contents ribbon and page turning
- [ ] Data entry (form, ledger, paste, CSV import wizard), dictionary, validation, PHI scan, audit trail
- [ ] Pattern analysis with CIs and plain-language findings
- [ ] Logistic / random forest / gradient boosting models, calibration, threshold analysis, decision curves
- [ ] SHAP, permutation importance, PDP/ICE, historical-record explanations, stability
- [ ] Subgroup and fairness checks with small-cell suppression; drift and performance monitoring
- [ ] Expert review workflow; printable "book" report (PDF/Excel/CSV) with colophon
- [ ] Dossier Lime theme and the two-page book layout (unique among my projects)
- [ ] FastAPI with Swagger docs, MongoDB via `.env` only
- [ ] README, demo script, tests, final report and slides
- [ ] Future work: EHR-standard (FHIR) import, causal-inference methods, time-to-event readmission models, fairness mitigation, federated multi-site validation, counterfactual explanations

## 18. Phases and Claude Code Prompts (use in order)

**Phase 1 (Week 1): Setup, design, study.**
> `Read PROJECT_SPEC_READMIT.md. Do Phase 1 only: repo structure from Section 14, requirements.txt (pandas, NumPy, SciPy, statsmodels, scikit-learn, shap, joblib, FastAPI stack, PyMongo; no PyTorch/TensorFlow), .gitignore including .env, frontend/.env, data/uploads, outputs/models, both .env.example files from Section 10 with placeholders only, src/config.py with pydantic-settings failing fast on missing or placeholder MONGODB_URI and JWT_SECRET, a README with the "research use only, synthetic de-identified data" warning, docs/theme.md recording the Dossier Lime tokens and the banned-pattern list from 12.1, and docs/ wireframes for the open-book sign-in, Frontispiece, Intake spreads, Patterns, Models, Explain, Subgroups, Monitor, Review and Export spreads. No Streamlit. Never write a real credential anywhere. Acceptance: app refuses to start with a clear message when env is missing.`

**Phase 2 (Week 2): MongoDB and auth.**
> `Implement Phase 2: src/db/mongo.py (MongoClient from env, ping, ensure_indexes, jsonSchema validators), repositories, users collection, JWT register/login/refresh/logout with bcrypt, rate limiting and lockout, audit log, /api/health, scripts/create_admin.py, role guards for Analyst, Clinical Reviewer and Admin. Tests use MONGODB_TEST_DB_NAME and clean up.`

**Phase 3 (Week 3): Synthetic data, dictionary, validation, PHI scan.**
> `Implement Phase 3: src/data/synthetic.py (12,000 de-identified encounters with the planted effects, interaction, miscalibrated subgroup and a messy secondary file with fake PHI strings, fixed seed), dictionary.py, validate.py (all rules in Section 5), phi_scan.py (regex/heuristic detection of names, phones, emails, ID-like numbers, dates of birth, addresses, free text), scripts/seed.py (idempotent, labelled synthetic), and the datasets/encounters/dictionary CRUD plus POST /import with issues and commit endpoints, audit logging and the small-cell suppression layer in src/analysis/suppress.py. Acceptance: seeded messy file produces the expected issues and PHI findings; commit is blocked until PHI is masked or dropped.`

**Phase 4 (Week 4): Pattern analysis.**
> `Implement Phase 4: src/analysis/patterns.py (rates with Wilson CIs, trends, crosstabs with suppression, chi-square/Fisher, Cramér's V), regression.py (statsmodels logistic regression with odds ratios, CIs, p-values, calibration check), findings.py (plain-language sentences) and the /patterns endpoints with cohort filters. Tests against hand-calculated values and direct statsmodels results.`

**Phase 5 (Week 5): Features, splits, models.**
> `Implement Phase 5: src/ml/features.py (leakage guard from dictionary flags, scikit-learn Pipelines with imputers and encoders fit on train only), splits.py (time-based and stratified, fixed seed), models.py (logistic regression, RandomForest, GradientBoosting with small CV grids) and POST /models/train as a background job with progress, cancel and a time limit, storing a full parameter snapshot and seed. Tests: leakage columns never used, no future data in training.`

**Phase 6 (Week 6): Evaluation and calibration.**
> `Implement Phase 6: evaluate.py (AUROC, AUPRC with bootstrap CIs, Brier, ECE, calibration intercept and slope, reliability bins), calibrate.py (Platt and isotonic via CalibratedClassifierCV on a separate calibration split, before/after comparison), threshold.py (confusion-matrix metrics across thresholds) and decision_curve.py (net benefit vs treat-all/none), plus model comparison and registry endpoints. Tests per Section 15.`

**Phase 7 (Week 7): Explanations.**
> `Implement Phase 7: src/explain/* per 7.5: permutation importance with intervals, SHAP (TreeExplainer for tree models, LinearExplainer for logistic, permutation fallback, sample cap), additivity check, PDP/ICE, local explanations for historical de-identified records, nearest-similar-records summary, stability via resampling, and plain-language text generation. Add the /explain endpoints (no live scoring endpoint). Tests: additivity, planted driver ranks first, text mentions the correct features.`

**Phase 8 (Week 8): Subgroups and monitoring.**
> `Implement Phase 8: fairness/subgroups.py (per-group n, prevalence, AUROC, calibration slope, Brier, TPR, FPR, PPV with CIs, gaps, small-cell suppression) and monitor/drift.py + performance.py (PSI, KS, label drift, performance by month with bands, alerts) with background jobs, APIs and tests (planted miscalibrated subgroup surfaced, PSI thresholds).`

**Phase 9 (Week 9): Reviews, reports, API completion.**
> `Implement Phase 9: expert review APIs (agree/disagree/flag with comments, audit, dictionary flags on confirmation), notifications, remaining routers from Section 11, PDF "book" report (Jinja2, matplotlib, weasyprint) with chapter selection, colophon (versions, seeds, splits) and the disclaimers, Excel and CSV exports, and API tests for every router including role guards, suppression in exports and field-level errors.`

**Phase 10 (Week 10): Frontend foundation and theme.**
> `Implement Phase 10 in frontend/: React 18, TypeScript, Vite, Tailwind, shadcn/ui, lucide-react, TanStack Query/Table, React Hook Form + Zod, framer-motion, sonner, cmdk, @fontsource/instrument-serif, @fontsource/albert-sans, @fontsource/martian-mono. Apply the Dossier Lime tokens from 12.2 and the type/shape rules from 12.3 exactly (linen desk, white pages, marker highlights, dotted-underline printed fields, folded-corner buttons, running heads and folios). Build ONLY the shell from 12.4: BookShell with Spread/Page/Gutter, BookmarkRibbon with ContentsPopover, PageTurner with keyboard control and ExpandPage, LibraryCard dataset switcher, initials menu, command palette on Ctrl+K. Do NOT build a sidebar, nav rail, top tabs, dock, index overlay, mode carousel, KPI-card row or any card layout. Build the open-book sign-in/register/forgot spreads, the Landing spread, the Frontispiece with ProseStat, route guards (deep-linkable spreads), and a typed API client using VITE_API_BASE_URL. Acceptance: login works against the real API; keyboard navigable; zero TypeScript errors.`

**Phase 11 (Week 10-11): Intake and Patterns chapters.**
> `Implement Phase 11: Chapter 1 Intake spreads (DropArea with de-identification confirmation, MappingLedger, IssueList with PhiFinding actions, RecordForm with PrintedFields and live validation, LedgerTable with inline edit, paste and undo, DictionaryLedger) and Chapter 2 Patterns spreads (FilterSentence with saved cohorts, ViewWords switcher, RateBars, TrendLine, AgeDxHeatmap with hatched suppressed cells, OddsForest, two-cohort comparison spread). Loading, empty and error states everywhere.`

**Phase 12 (Weeks 11-12): Models, Explain, Subgroups, Monitor.**
> `Implement Phase 12: Chapter 3 Models (TrainingSentence form, RocPrPair, ReliabilityCurve before/after, metrics table with CIs, ModelCompareList, ThresholdSlider, DecisionCurve), Chapter 4 Explain (driver narrative with HighlightMarks, ShapSummaryDots, ImportanceBars, DependencePlot, record explanation spread with WaterfallExplain labelled as historical), Chapter 5 Subgroups (SubgroupTable with suppression hatching, calibration-by-group), Chapter 6 Monitor (DriftStrip, performance lines with bands, registry list). Use the colours and dash patterns from 12.2.`

**Phase 13 (Week 12): Review, Export, Appendix, polish.**
> `Implement Phase 13: Chapter 7 Review (ReviewForm with printed checkboxes, MarginNotes), Chapter 8 Export (PrintBookPicker, TOC preview, formats, auto-filled Colophon), Appendix ledgers (users, audit log, jobs, system, profile, about/methodology). Then finish: backend coverage 70%+, Vitest component tests, optional Playwright journey, accessibility and responsive polish (single-page mode below 1024px, swipe, sticky ribbon), a docs/ui-uniqueness-check.md confirming none of the 12.1 banned patterns, fonts or palettes are used, README with Atlas + .env setup and troubleshooting, optional docker-compose, and a demo script.`

## 19. References
Steyerberg: Clinical Prediction Models; Van Calster et al. (2019): calibration, the Achilles heel of predictive analytics; Vickers & Elkin (2006): decision curve analysis; Lundberg & Lee (2017): SHAP; Molnar: Interpretable Machine Learning; Niculescu-Mizil & Caruana (2005): predicting good probabilities; Collins et al. (2015): TRIPOD reporting guideline; Mitchell et al. (2019): Model Cards; Hardt, Price & Srebro (2016): equality of opportunity; Rabanser et al. (2019): failing loudly (dataset shift detection); Kansagara et al. (2011): risk prediction models for hospital readmission; HIPAA de-identification (Safe Harbor) guidance; scikit-learn, statsmodels, SHAP, SciPy, MongoDB Atlas/PyMongo, FastAPI, React, Vite, Tailwind, shadcn/ui, Recharts documentation.

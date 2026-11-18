export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'Analyst' | 'Clinical Reviewer' | 'Admin';
  institution?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  source_note?: string;
  de_identification_confirmed: boolean;
  row_count: number;
  readmit_rate?: number;
  created_at?: string;
}

export interface Encounter {
  id?: string;
  encounter_id: string;
  age: number;
  sex: string;
  race_ethnicity?: string;
  insurance: string;
  admission_type: string;
  primary_dx_group: string;
  comorbidity_count: number;
  prior_admissions_6m: number;
  prior_ed_visits_6m: number;
  los_days: number;
  num_medications: number;
  num_procedures: number;
  glucose?: number;
  sodium?: number;
  hba1c?: number;
  discharge_disposition: string;
  med_changes: number;
  followup_scheduled: number;
  discharge_month: number;
  readmit_30d: number;
  days_to_readmit?: number;
}

export interface DictionaryItem {
  id?: string;
  variable: string;
  type: string;
  allowed_range_or_categories?: string;
  clinical_group: string;
  role: string;
  leakage_flag: boolean;
  description: string;
  flagged_for_investigation?: boolean;
  investigation_note?: string;
}

export interface RateItem {
  category: string;
  n: number;
  events: number | string;
  rate: number | null;
  ci_lower?: number | null;
  ci_upper?: number | null;
  suppressed: boolean;
}

export interface TrendItem {
  month: number;
  n: number;
  events: number;
  rate: number;
  ci_lower: number;
  ci_upper: number;
}

export interface CrosstabCell {
  row: string;
  col: string;
  n: number;
  events: number | string;
  rate: number | null;
  suppressed: boolean;
}

export interface CrosstabResult {
  row_variable: string;
  col_variable: string;
  row_categories: string[];
  col_categories: string[];
  matrix: CrosstabCell[][];
}

export interface RegressionTerm {
  term: string;
  coefficient: number;
  std_error: number;
  odds_ratio: number;
  ci_lower: number;
  ci_upper: number;
  p_value: number;
  is_significant: boolean;
}

export interface RegressionResult {
  n_observations: number;
  pseudo_r2: number;
  aic: number;
  bic: number;
  terms: RegressionTerm[];
  calibration_deciles: any[];
}

export interface ModelMetrics {
  auroc: number;
  auroc_ci: [number, number];
  auprc: number;
  auprc_ci: [number, number];
  brier_score: number;
  brier_ci: [number, number];
  ece: number;
  calibration_intercept: number;
  calibration_slope: number;
  reliability_bins: Array<{
    bin: number;
    bin_range: string;
    count: number;
    predicted_prob: number;
    observed_rate: number;
  }>;
  roc_curve: Array<{ fpr: number; tpr: number }>;
  pr_curve: Array<{ recall: number; precision: number }>;
}

export interface ModelRun {
  id: string;
  dataset_id: string;
  algorithm: string;
  calibration_method: string;
  status: 'training' | 'completed' | 'candidate' | 'active' | 'retired' | 'failed';
  metrics?: ModelMetrics;
  uncalibrated_metrics?: ModelMetrics;
  calibrated_metrics?: ModelMetrics;
  threshold_metrics?: Array<{
    threshold: number;
    tp: number;
    fp: number;
    fn: number;
    tn: number;
    sensitivity: number;
    specificity: number;
    ppv: number;
    npv: number;
    f1: number;
    accuracy: number;
  }>;
  decision_curves?: Array<{
    threshold: number;
    net_benefit_model: number;
    net_benefit_all: number;
    net_benefit_none: number;
  }>;
  feature_names?: string[];
  created_at?: string;
}

export interface GlobalShapItem {
  rank: number;
  feature: string;
  mean_abs_shap: number;
}

export interface BeeswarmPoint {
  raw_val: number;
  norm_val: number;
  shap_val: number;
}

export interface BeeswarmFeature {
  feature: string;
  mean_abs_shap: number;
  points: BeeswarmPoint[];
}

export interface LocalWaterfallItem {
  feature: string;
  feature_value: number;
  contribution: number;
  direction: 'UP' | 'DOWN';
  cumulative: number;
}

export interface ExpertReview {
  id?: string;
  model_id: string;
  target_type: 'model_run' | 'global_driver' | 'record';
  target_id?: string;
  verdict: 'agree' | 'disagree' | 'flag';
  comment: string;
  reviewer_name: string;
  reviewer_role: string;
  created_at?: string;
}

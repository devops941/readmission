from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

# Auth
class UserRegister(BaseModel):
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=8)
    full_name: str
    role: str = Field("Analyst", description="Analyst, Clinical Reviewer, or Admin")
    institution: Optional[str] = "General Hospital Quality Dept"

class UserLogin(BaseModel):
    email: str = Field(..., description="Email address")
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    institution: Optional[str] = None
    created_at: Optional[str] = None

# Dataset
class DatasetCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    source_note: Optional[str] = "Synthetic de-identified research records"
    de_identification_confirmed: bool = True

class DatasetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    source_note: Optional[str]
    de_identification_confirmed: bool
    row_count: int = 0
    readmit_rate: Optional[float] = 0.0
    created_at: Optional[str] = None

# Encounter
class EncounterRecord(BaseModel):
    encounter_id: str
    age: int = Field(..., ge=0, le=120)
    sex: str
    race_ethnicity: Optional[str] = "Unspecified"
    insurance: str
    admission_type: str
    primary_dx_group: str
    comorbidity_count: int = Field(0, ge=0)
    prior_admissions_6m: int = Field(0, ge=0)
    prior_ed_visits_6m: int = Field(0, ge=0)
    los_days: int = Field(..., ge=0, le=365)
    num_medications: int = Field(0, ge=0)
    num_procedures: int = Field(0, ge=0)
    glucose: Optional[float] = None
    sodium: Optional[float] = None
    hba1c: Optional[float] = None
    discharge_disposition: str
    med_changes: int = 0
    followup_scheduled: int = Field(..., ge=0, le=1)
    discharge_month: int = Field(..., ge=1)
    readmit_30d: int = Field(..., ge=0, le=1)
    days_to_readmit: Optional[int] = None

class EncounterQuery(BaseModel):
    skip: int = 0
    limit: int = 50
    primary_dx_group: Optional[str] = None
    discharge_disposition: Optional[str] = None
    readmit_30d: Optional[int] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None

# Data Dictionary
class DictionaryItem(BaseModel):
    variable: str
    type: str  # numeric, categorical, binary, id
    allowed_range_or_categories: Optional[str] = None
    clinical_group: str  # demographics, history, stay, lab, discharge, outcome
    role: str  # feature, label, sensitive, excluded
    leakage_flag: bool = False
    description: str

class DictionaryUpdate(BaseModel):
    role: Optional[str] = None
    leakage_flag: Optional[bool] = None
    description: Optional[str] = None

# Import
class ColumnMapping(BaseModel):
    file_column: str
    dict_variable: str

class ImportCommitRequest(BaseModel):
    mappings: List[ColumnMapping]
    dataset_name: Optional[str] = None
    drop_phi_columns: bool = True
    import_valid_rows_only: bool = True

# Patterns
class RateRequest(BaseModel):
    group_by: str = "primary_dx_group"
    cohort_filter: Optional[Dict[str, Any]] = None

class CrosstabRequest(BaseModel):
    row_var: str = "age_band"
    col_var: str = "primary_dx_group"
    cohort_filter: Optional[Dict[str, Any]] = None

# ML
class ModelTrainRequest(BaseModel):
    algorithm: str = Field("gradient_boosting", description="logistic_regression, random_forest, or gradient_boosting")
    train_months: List[int] = Field(default_factory=lambda: list(range(1, 19)))
    calib_months: List[int] = Field(default_factory=lambda: [19, 20, 21])
    test_months: List[int] = Field(default_factory=lambda: [22, 23, 24])
    calibration_method: str = Field("isotonic", description="none, platt, or isotonic")
    use_class_weight: bool = True
    random_seed: int = 42

class CalibrateRequest(BaseModel):
    method: str = Field("isotonic", description="platt or isotonic")

# Reviews
class ExpertReviewCreate(BaseModel):
    model_id: str
    target_type: str = Field("model_run", description="model_run, global_driver, or record")
    target_id: Optional[str] = None
    verdict: str = Field("agree", description="agree, disagree, or flag")
    comment: str
    needs_investigation: bool = False

# Export
class ExportOptions(BaseModel):
    include_chapters: List[str] = Field(default_factory=lambda: ["frontispiece", "patterns", "models", "explain", "subgroups", "monitor", "reviews"])
    format: str = "pdf"  # pdf, excel, csv
    title: Optional[str] = "ReadmitExplain AI Dossier"
    sign_off_analyst: Optional[str] = None
    sign_off_reviewer: Optional[str] = None

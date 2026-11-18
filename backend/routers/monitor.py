from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
import pandas as pd
from backend.db.repositories import ModelRunRepository, EncounterRepository, AlertRepository
from backend.ml.models import load_model_artifact
from backend.monitor.drift import calculate_feature_drift_strip
from backend.monitor.performance import track_performance_over_time
from backend.security import get_current_user
from backend.config import settings

router = APIRouter(prefix="/monitor", tags=["Monitoring & Drift"])
model_repo = ModelRunRepository()
encounter_repo = EncounterRepository()
alert_repo = AlertRepository()

@router.get("/{model_id}/drift")
def get_drift(
    model_id: str,
    psi_warn: float = Query(0.10),
    psi_crit: float = Query(0.25),
    current_user: dict = Depends(get_current_user)
):
    try:
        artifact = load_model_artifact(model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model artifact not found")
        
    m = model_repo.get_by_id(model_id)
    dataset_id = m.get("dataset_id")
    records = encounter_repo.get_all_records(dataset_id)
    df = pd.DataFrame(records)
    
    ref_months = artifact.get("train_months", list(range(1, 19)))
    mon_months = artifact.get("test_months", [19, 20, 21, 22, 23, 24])
    
    # Candidate features to monitor
    features = [
        "age", "comorbidity_count", "prior_admissions_6m", "prior_ed_visits_6m",
        "los_days", "num_medications", "num_procedures", "glucose", "sodium", "hba1c"
    ]
    
    res = calculate_feature_drift_strip(
        df=df,
        features=features,
        reference_months=ref_months,
        monitor_months=mon_months,
        psi_warn=psi_warn,
        psi_crit=psi_crit
    )
    
    # Save alerts to repo
    for alert in res["alerts"]:
        alert["model_id"] = model_id
        alert["dataset_id"] = dataset_id
        alert_repo.create(alert)
        
    return res

@router.get("/{model_id}/performance")
def get_performance_drift(model_id: str, current_user: dict = Depends(get_current_user)):
    try:
        artifact = load_model_artifact(model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model artifact not found")
        
    m = model_repo.get_by_id(model_id)
    dataset_id = m.get("dataset_id")
    records = encounter_repo.get_all_records(dataset_id)
    df = pd.DataFrame(records)
    
    active_model = artifact.get("calibrated_model") or artifact["base_model"]
    preprocessor = artifact["preprocessor"]
    months = list(range(1, 25))
    
    baseline_auroc = m.get("metrics", {}).get("auroc", 0.80)
    
    res = track_performance_over_time(
        model=active_model,
        preprocessor=preprocessor,
        df=df,
        months=months,
        baseline_auroc=baseline_auroc
    )
    return res

@router.get("/alerts")
def get_alerts(dataset_id: str = Query(...), current_user: dict = Depends(get_current_user)):
    return alert_repo.list_for_dataset(dataset_id)

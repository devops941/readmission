from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
import pandas as pd
from backend.db.repositories import ModelRunRepository, EncounterRepository
from backend.ml.models import load_model_artifact
from backend.fairness.subgroups import evaluate_subgroup_disparities
from backend.security import get_current_user

router = APIRouter(prefix="/subgroups", tags=["Subgroups & Fairness"])
model_repo = ModelRunRepository()
encounter_repo = EncounterRepository()

@router.get("/{model_id}")
def get_subgroups(
    model_id: str,
    by: str = Query("insurance", description="age_band, sex, race_ethnicity, insurance, primary_dx_group"),
    threshold: float = Query(0.20, ge=0.01, le=0.99),
    current_user: dict = Depends(get_current_user)
):
    try:
        artifact = load_model_artifact(model_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Model artifact not found")
        
    m = model_repo.get_by_id(model_id)
    dataset_id = m.get("dataset_id")
    records = encounter_repo.get_all_records(dataset_id)
    if not records:
        raise HTTPException(status_code=404, detail="No records found in dataset")
        
    df = pd.DataFrame(records)
    test_months = artifact.get("test_months", [22, 23, 24])
    eval_df = df[df["discharge_month"].isin(test_months)].copy() if "discharge_month" in df.columns else df.copy()
    
    preprocessor = artifact["preprocessor"]
    X_eval = preprocessor.transform(eval_df)
    active_model = artifact.get("calibrated_model") or artifact["base_model"]
    y_prob = active_model.predict_proba(X_eval)[:, 1]
    
    res = evaluate_subgroup_disparities(
        df=eval_df,
        y_prob=y_prob,
        sensitive_col=by,
        threshold=threshold
    )
    if "error" in res:
        raise HTTPException(status_code=400, detail=res["error"])
    return res

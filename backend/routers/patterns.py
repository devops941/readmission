from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
import pandas as pd
from backend.db.repositories import EncounterRepository, DatasetRepository
from backend.analysis.patterns import calculate_rates_by_group, calculate_monthly_trends, calculate_crosstab_heatmap
from backend.analysis.regression import fit_multivariable_logistic_regression
from backend.analysis.findings import generate_findings_narrative
from backend.security import get_current_user

router = APIRouter(prefix="/patterns", tags=["Patterns"])
encounter_repo = EncounterRepository()

def get_dataset_df(dataset_id: str) -> pd.DataFrame:
    records = encounter_repo.get_all_records(dataset_id)
    if not records:
        raise HTTPException(status_code=404, detail="Dataset has no encounter records to analyze")
    return pd.DataFrame(records)

@router.get("/rates")
def get_rates(
    dataset_id: str = Query(...),
    by: str = Query("primary_dx_group"),
    current_user: dict = Depends(get_current_user)
):
    df = get_dataset_df(dataset_id)
    return calculate_rates_by_group(df, group_col=by)

@router.get("/trend")
def get_trends(
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    df = get_dataset_df(dataset_id)
    return calculate_monthly_trends(df)

@router.get("/crosstab")
def get_crosstab(
    dataset_id: str = Query(...),
    row: str = Query("age_band"),
    col: str = Query("primary_dx_group"),
    current_user: dict = Depends(get_current_user)
):
    df = get_dataset_df(dataset_id)
    return calculate_crosstab_heatmap(df, row_col=row, col_col=col)

@router.get("/regression")
def get_regression(
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    df = get_dataset_df(dataset_id)
    return fit_multivariable_logistic_regression(df)

@router.get("/findings")
def get_findings(
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    df = get_dataset_df(dataset_id)
    return generate_findings_narrative(df)

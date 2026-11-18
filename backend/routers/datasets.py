import io
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
import numpy as np
import pandas as pd
from backend.schemas import DatasetCreate, DatasetResponse, ImportCommitRequest
from backend.db.repositories import DatasetRepository, EncounterRepository, DataDictionaryRepository, AuditLogRepository
from backend.data.dictionary import get_default_dictionary
from backend.data.phi_scan import scan_dataframe_for_phi
from backend.data.validate import validate_dataframe
from backend.security import get_current_user
from backend.config import settings

router = APIRouter(prefix="/datasets", tags=["Datasets"])
dataset_repo = DatasetRepository()
encounter_repo = EncounterRepository()
dict_repo = DataDictionaryRepository()
audit_repo = AuditLogRepository()

# Temp storage for import staging
_staging_cache = {}

@router.get("", response_model=List[DatasetResponse])
def list_datasets(current_user: dict = Depends(get_current_user)):
    return dataset_repo.list_all()

@router.post("", response_model=DatasetResponse)
def create_dataset(req: DatasetCreate, current_user: dict = Depends(get_current_user)):
    data = req.model_dump()
    data["created_by"] = current_user["email"]
    created = dataset_repo.create(data)
    
    # Initialize default dictionary for this dataset
    dict_repo.set_dictionary(created["id"], get_default_dictionary())
    audit_repo.log(current_user["email"], "DATASET_CREATED", {"dataset_id": created["id"], "name": req.name})
    
    return created

@router.get("/{dataset_id}", response_model=DatasetResponse)
def get_dataset(dataset_id: str, current_user: dict = Depends(get_current_user)):
    ds = dataset_repo.get_by_id(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds

@router.post("/{dataset_id}/upload")
async def upload_dataset_file(
    dataset_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    ds = dataset_repo.get_by_id(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size ({settings.MAX_UPLOAD_MB}MB)")
        
    filename = file.filename.lower()
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV or Excel (.xlsx) files are supported")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse uploaded table: {str(e)}")
        
    # 1. Run PHI Scanner
    phi_findings = scan_dataframe_for_phi(df)
    
    # 2. Run Data Validation
    val_report = validate_dataframe(df, min_cell_size=settings.MIN_CELL_SIZE)
    
    # 3. Suggest Column Mappings
    dict_items = dict_repo.get_for_dataset(dataset_id)
    dict_vars = {item["variable"].lower(): item["variable"] for item in dict_items}
    
    suggested_mappings = []
    for col in df.columns:
        col_clean = str(col).strip().lower()
        matched = dict_vars.get(col_clean)
        suggested_mappings.append({
            "file_column": str(col),
            "suggested_variable": matched or ("" if not matched else matched),
            "confidence": 1.0 if matched else 0.0
        })

    # Cache staging dataframe for commit
    staging_id = f"{dataset_id}_{len(_staging_cache)+1}"
    _staging_cache[staging_id] = {
        "df": df,
        "phi_findings": phi_findings,
        "dataset_id": dataset_id,
        "filename": file.filename
    }

    audit_repo.log(current_user["email"], "FILE_UPLOADED_FOR_SCAN", {
        "dataset_id": dataset_id,
        "filename": file.filename,
        "rows": len(df),
        "phi_count": len(phi_findings)
    })

    return {
        "staging_id": staging_id,
        "filename": file.filename,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": [str(c) for c in df.columns],
        "suggested_mappings": suggested_mappings,
        "phi_findings": phi_findings,
        "has_critical_phi": len(phi_findings) > 0,
        "validation_report": val_report,
        "preview_rows": df.head(5).fillna("").to_dict(orient="records")
    }

@router.post("/{dataset_id}/import/commit")
def commit_imported_data(
    dataset_id: str,
    staging_id: str = Form(...),
    drop_phi_columns: bool = Form(True),
    current_user: dict = Depends(get_current_user)
):
    staged = _staging_cache.get(staging_id)
    if not staged or staged["dataset_id"] != dataset_id:
        raise HTTPException(status_code=400, detail="Invalid or expired staging session. Please re-upload.")
        
    df = staged["df"].copy()
    phi_findings = staged["phi_findings"]
    
    # Enforce PHI safety: if PHI exists and user didn't drop them, block commit!
    if phi_findings and not drop_phi_columns:
        raise HTTPException(
            status_code=400,
            detail="Cannot commit dataset containing Protected Health Information (PHI). Offending columns must be dropped."
        )
        
    if phi_findings and drop_phi_columns:
        phi_cols = list(set([f["column"] for f in phi_findings if f["column"] in df.columns]))
        df.drop(columns=phi_cols, inplace=True)

    # Standardize dictionary fields
    records = df.fillna(value=np.nan).replace({np.nan: None}).to_dict(orient="records")
    
    # Bulk insert
    inserted = encounter_repo.insert_batch(dataset_id, records)
    
    # Calculate stats
    total_count = encounter_repo.count(dataset_id)
    all_readmits = encounter_repo.get_all_records(dataset_id, {"readmit_30d": 1})
    readmit_sum = sum([r.get("readmit_30d", 0) for r in all_readmits if r.get("readmit_30d") is not None])
    rate = round(float(readmit_sum / total_count * 100), 2) if total_count > 0 else 0.0
    
    dataset_repo.update_stats(dataset_id, total_count, rate)
    
    audit_repo.log(current_user["email"], "DATASET_IMPORT_COMMITTED", {
        "dataset_id": dataset_id,
        "inserted_records": inserted,
        "total_records": total_count
    })
    
    # Clear staging cache
    del _staging_cache[staging_id]
    
    return {
        "status": "success",
        "inserted_records": inserted,
        "total_records": total_count,
        "readmit_rate": rate
    }

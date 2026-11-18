from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.schemas import EncounterRecord
from backend.db.repositories import EncounterRepository, DatasetRepository, AuditLogRepository
from backend.data.validate import validate_encounter_record
from backend.security import get_current_user

router = APIRouter(prefix="/encounters", tags=["Encounters"])
encounter_repo = EncounterRepository()
dataset_repo = DatasetRepository()
audit_repo = AuditLogRepository()

@router.get("")
def list_encounters(
    dataset_id: str = Query(...),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    primary_dx_group: Optional[str] = None,
    discharge_disposition: Optional[str] = None,
    readmit_30d: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if primary_dx_group and primary_dx_group != "all":
        query["primary_dx_group"] = primary_dx_group
    if discharge_disposition and discharge_disposition != "all":
        query["discharge_disposition"] = discharge_disposition
    if readmit_30d is not None and readmit_30d in (0, 1):
        query["readmit_30d"] = readmit_30d
        
    records = encounter_repo.get_records(dataset_id, query=query, skip=skip, limit=limit)
    total_matching = encounter_repo.count(dataset_id, query=query)
    
    return {
        "dataset_id": dataset_id,
        "total": total_matching,
        "skip": skip,
        "limit": limit,
        "records": records
    }

@router.get("/{encounter_id}")
def get_encounter(
    encounter_id: str,
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    rec = encounter_repo.get_by_encounter_id(dataset_id, encounter_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Encounter record not found")
    return rec

@router.post("")
def add_encounter(
    record: EncounterRecord,
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    rec_data = record.model_dump()
    issues = validate_encounter_record(rec_data)
    if issues:
        raise HTTPException(status_code=400, detail={"message": "Validation failed", "issues": issues})
        
    existing = encounter_repo.get_by_encounter_id(dataset_id, record.encounter_id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Encounter ID '{record.encounter_id}' already exists in dataset")
        
    encounter_repo.upsert_one(dataset_id, rec_data)
    
    # Update dataset count & rate
    total_count = encounter_repo.count(dataset_id)
    all_readmits = encounter_repo.get_all_records(dataset_id, {"readmit_30d": 1})
    readmit_sum = sum([r.get("readmit_30d", 0) for r in all_readmits if r.get("readmit_30d") is not None])
    rate = round(float(readmit_sum / total_count * 100), 2) if total_count > 0 else 0.0
    dataset_repo.update_stats(dataset_id, total_count, rate)
    
    audit_repo.log(current_user["email"], "ENCOUNTER_CREATED", {"dataset_id": dataset_id, "encounter_id": record.encounter_id})
    return {"status": "created", "encounter_id": record.encounter_id}

@router.put("/{encounter_id}")
def update_encounter(
    encounter_id: str,
    record: EncounterRecord,
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    rec_data = record.model_dump()
    rec_data["encounter_id"] = encounter_id
    issues = validate_encounter_record(rec_data)
    if issues:
        raise HTTPException(status_code=400, detail={"message": "Validation failed", "issues": issues})
        
    encounter_repo.upsert_one(dataset_id, rec_data)
    audit_repo.log(current_user["email"], "ENCOUNTER_UPDATED", {"dataset_id": dataset_id, "encounter_id": encounter_id})
    return {"status": "updated", "encounter_id": encounter_id}

@router.delete("/{encounter_id}")
def delete_encounter(
    encounter_id: str,
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    deleted = encounter_repo.delete_one(dataset_id, encounter_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Encounter record not found")
        
    audit_repo.log(current_user["email"], "ENCOUNTER_DELETED", {"dataset_id": dataset_id, "encounter_id": encounter_id})
    return {"status": "deleted", "encounter_id": encounter_id}

@router.post("/batch")
def add_batch_encounters(
    records: List[Dict[str, Any]],
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    valid_records = []
    error_summary = []
    
    for idx, r in enumerate(records):
        issues = validate_encounter_record(r)
        if issues:
            error_summary.append({"index": idx, "encounter_id": r.get("encounter_id"), "issues": issues})
        else:
            valid_records.append(r)
            
    if valid_records:
        encounter_repo.insert_batch(dataset_id, valid_records)
        total_count = encounter_repo.count(dataset_id)
        all_readmits = encounter_repo.get_all_records(dataset_id, {"readmit_30d": 1})
        readmit_sum = sum([rec.get("readmit_30d", 0) for rec in all_readmits if rec.get("readmit_30d") is not None])
        rate = round(float(readmit_sum / total_count * 100), 2) if total_count > 0 else 0.0
        dataset_repo.update_stats(dataset_id, total_count, rate)
        
    audit_repo.log(current_user["email"], "ENCOUNTER_BATCH_INSERTED", {
        "dataset_id": dataset_id,
        "inserted": len(valid_records),
        "errors": len(error_summary)
    })
    
    return {
        "inserted_count": len(valid_records),
        "failed_count": len(error_summary),
        "errors": error_summary[:20]
    }

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.schemas import DictionaryItem, DictionaryUpdate
from backend.db.repositories import DataDictionaryRepository, AuditLogRepository
from backend.security import get_current_user

router = APIRouter(prefix="/dictionary", tags=["Data Dictionary"])
dict_repo = DataDictionaryRepository()
audit_repo = AuditLogRepository()

@router.get("", response_model=List[Dict[str, Any]])
def get_dictionary(dataset_id: str = Query(...), current_user: dict = Depends(get_current_user)):
    items = dict_repo.get_for_dataset(dataset_id)
    return items

@router.put("/{variable}")
def update_dictionary_variable(
    variable: str,
    patch: DictionaryUpdate,
    dataset_id: str = Query(...),
    current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in patch.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")
        
    dict_repo.update_variable(dataset_id, variable, update_data)
    audit_repo.log(current_user["email"], "DICTIONARY_UPDATED", {
        "dataset_id": dataset_id,
        "variable": variable,
        "patch": update_data
    })
    return {"status": "updated", "variable": variable}

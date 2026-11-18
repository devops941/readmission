from typing import List
from fastapi import APIRouter, HTTPException, Depends
from backend.schemas import ExpertReviewCreate
from backend.db.repositories import ExpertReviewRepository, DataDictionaryRepository, AuditLogRepository, ModelRunRepository
from backend.security import get_current_user

router = APIRouter(prefix="/reviews", tags=["Expert Reviews"])
review_repo = ExpertReviewRepository()
dict_repo = DataDictionaryRepository()
audit_repo = AuditLogRepository()
model_repo = ModelRunRepository()

@router.post("")
def submit_review(req: ExpertReviewCreate, current_user: dict = Depends(get_current_user)):
    data = req.model_dump()
    data["reviewer_email"] = current_user["email"]
    data["reviewer_name"] = current_user.get("full_name", current_user["email"])
    data["reviewer_role"] = current_user.get("role", "Clinical Reviewer")
    
    created = review_repo.create(data)
    
    # If flagged as needs investigation and targeting a feature, update dictionary flag
    if req.needs_investigation and req.target_type == "global_driver" and req.target_id:
        m = model_repo.get_by_id(req.model_id)
        if m:
            dict_repo.update_variable(m.get("dataset_id"), req.target_id, {
                "flagged_for_investigation": True,
                "investigation_note": req.comment
            })
            
    audit_repo.log(current_user["email"], "EXPERT_REVIEW_SUBMITTED", {
        "model_id": req.model_id,
        "verdict": req.verdict,
        "target_type": req.target_type
    })
    
    return created

@router.get("/{model_id}")
def get_model_reviews(model_id: str, current_user: dict = Depends(get_current_user)):
    return review_repo.list_for_model(model_id)

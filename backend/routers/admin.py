import sys
import platform
from fastapi import APIRouter, Depends
from backend.db.repositories import UserRepository, AuditLogRepository, DatasetRepository, ModelRunRepository
from backend.db.mongo import ping_database
from backend.security import get_current_user, require_role

router = APIRouter(prefix="/admin", tags=["Admin & System"])
user_repo = UserRepository()
audit_repo = AuditLogRepository()
dataset_repo = DatasetRepository()
model_repo = ModelRunRepository()

@router.get("/users")
def get_users(current_user: dict = Depends(require_role(["Admin"]))):
    return user_repo.list_all()

@router.get("/audit")
def get_audit_trail(limit: int = 100, current_user: dict = Depends(get_current_user)):
    return audit_repo.list_recent(limit=limit)

@router.get("/system")
def get_system_health(current_user: dict = Depends(get_current_user)):
    db_alive = ping_database()
    datasets = dataset_repo.list_all()
    models = model_repo.col.count_documents({})
    
    return {
        "status": "healthy" if db_alive else "degraded",
        "mongodb_connected": db_alive,
        "python_version": platform.python_version(),
        "platform": platform.platform(),
        "datasets_count": len(datasets),
        "total_model_runs": models,
        "disclaimer_active": True,
        "notice": "Research and quality-improvement use only. Historical de-identified records only."
    }

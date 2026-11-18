from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from backend.schemas import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, UserProfileResponse
from backend.db.repositories import UserRepository, AuditLogRepository
from backend.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user
from backend.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])
user_repo = UserRepository()
audit_repo = AuditLogRepository()

@router.post("/register", response_model=TokenResponse)
def register(req: UserRegister):
    existing = user_repo.get_by_email(req.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")
        
    pwd_hash = hash_password(req.password)
    user_data = {
        "email": req.email,
        "password_hash": pwd_hash,
        "full_name": req.full_name,
        "role": req.role if req.role in ["Analyst", "Clinical Reviewer", "Admin"] else "Analyst",
        "institution": req.institution
    }
    created = user_repo.create(user_data)
    
    audit_repo.log(req.email, "USER_REGISTERED", {"role": created["role"]})
    
    token_payload = {"sub": created["email"], "role": created["role"], "user_id": created["id"]}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": created["id"],
            "email": created["email"],
            "full_name": created["full_name"],
            "role": created["role"]
        }
    }

@router.post("/login", response_model=TokenResponse)
def login(req: UserLogin):
    user = user_repo.get_by_email(req.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    # Check lockout
    locked_until = user.get("locked_until")
    if locked_until:
        locked_dt = datetime.fromisoformat(locked_until) if isinstance(locked_until, str) else locked_until
        if locked_dt.tzinfo is None:
            locked_dt = locked_dt.replace(tzinfo=timezone.utc)
        if locked_dt > datetime.now(timezone.utc):
            mins_left = int((locked_dt - datetime.now(timezone.utc)).total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to multiple failed logins. Try again in {mins_left} minute(s)."
            )

    if not verify_password(req.password, user.get("password_hash", "")):
        user_repo.update_login_attempt(req.email, success=False, lockout_minutes=settings.LOCKOUT_MINUTES, max_failed=settings.MAX_FAILED_LOGINS)
        audit_repo.log(req.email, "LOGIN_FAILED", {})
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
        
    user_repo.update_login_attempt(req.email, success=True)
    audit_repo.log(req.email, "LOGIN_SUCCESS", {})
    
    token_payload = {"sub": user["email"], "role": user.get("role", "Analyst"), "user_id": user["id"]}
    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user.get("full_name", ""),
            "role": user.get("role", "Analyst")
        }
    }

@router.post("/refresh")
def refresh_token(req: RefreshTokenRequest):
    payload = decode_token(req.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        
    user = user_repo.get_by_email(payload.get("sub", ""))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        
    token_payload = {"sub": user["email"], "role": user.get("role", "Analyst"), "user_id": user["id"]}
    access_token = create_access_token(token_payload)
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user.get("full_name", ""),
        "role": current_user.get("role", "Analyst"),
        "institution": current_user.get("institution", ""),
        "created_at": str(current_user.get("created_at", ""))
    }

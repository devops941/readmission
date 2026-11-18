import sys
from pathlib import Path

# Ensure both project root and backend directory are in sys.path
_BACKEND_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _BACKEND_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from backend.config import settings
from backend.db.mongo import ping_database, ensure_indexes
from backend.routers import (
    auth,
    datasets,
    encounters,
    dictionary,
    patterns,
    models,
    explain,
    subgroups,
    monitor,
    reviews,
    reports,
    admin
)

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("readmitexplain")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing ReadmitExplain AI Backend...")
    try:
        ensure_indexes()
        logger.info("Database indexes checked.")
    except Exception as e:
        logger.warning(f"Could not connect to MongoDB on startup: {e}")
    yield
    logger.info("Shutting down ReadmitExplain AI Backend.")

app = FastAPI(
    title="ReadmitExplain AI — Quality Research Dashboard API",
    description=(
        "Research and quality-improvement API for explainable hospital readmission analysis. "
        "Operates on de-identified historical encounter records. NOT for real-time patient care decisions."
    ),
    version="2026.1.0",
    lifespan=lifespan
)

# CORS setup
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global validation exception handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        field = ".".join([str(loc) for loc in err.get("loc", [])])
        errors.append({"field": field, "message": err.get("msg")})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Input validation error", "code": "VALIDATION_ERROR", "fields": errors}
    )

# Health endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    db_ok = ping_database()
    return {
        "status": "ok" if db_ok else "unhealthy",
        "database_connected": db_ok,
        "database_name": settings.MONGODB_DB_NAME,
        "disclaimer": "Research and quality-improvement use only. Historical de-identified records only."
    }

# Include all routers
app.include_router(auth.router, prefix="/api")
app.include_router(datasets.router, prefix="/api")
app.include_router(encounters.router, prefix="/api")
app.include_router(dictionary.router, prefix="/api")
app.include_router(patterns.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(explain.router, prefix="/api")
app.include_router(subgroups.router, prefix="/api")
app.include_router(monitor.router, prefix="/api")
app.include_router(reviews.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

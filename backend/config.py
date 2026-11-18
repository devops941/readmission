from pathlib import Path
from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    APP_ENV: str = "development"
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000
    LOG_LEVEL: str = "INFO"
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173"

    MONGODB_URI: str
    MONGODB_DB_NAME: str = "readmitexplain"
    MONGODB_TEST_DB_NAME: str = "readmitexplain_test"
    MONGODB_TIMEOUT_MS: int = 8000

    JWT_SECRET: str
    JWT_ACCESS_MINUTES: int = 60
    JWT_REFRESH_DAYS: int = 7
    MAX_FAILED_LOGINS: int = 5
    LOCKOUT_MINUTES: int = 15
    ADMIN_EMAIL: str = "admin@readmitexplain.local"
    ADMIN_PASSWORD: str = "Admin@2026!Readmit"

    READMIT_WINDOW_DAYS: int = 30
    MIN_CELL_SIZE: int = 20
    MIN_EVENTS_SUBGROUP: int = 5
    MISSING_COLUMN_WARN_PCT: int = 40
    PHI_SCAN_ENABLED: bool = True
    RANDOM_SEED: int = 42
    BOOTSTRAP_ITERATIONS: int = 500
    SHAP_MAX_SAMPLES: int = 300
    PSI_WARN: float = 0.1
    PSI_CRITICAL: float = 0.25
    JOB_TIMEOUT_SEC: int = 600

    MODEL_DIR: Path = BACKEND_DIR / "outputs" / "models"
    REPORT_DIR: Path = BACKEND_DIR / "outputs" / "reports"
    UPLOAD_DIR: Path = BACKEND_DIR / "data" / "uploads"
    MAX_UPLOAD_MB: int = 50

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [x.strip() for x in v.split(",") if x.strip()]
        return v

    @field_validator("MONGODB_URI")
    def validate_mongo_uri(cls, v):
        if not v or "<" in v or "placeholder" in v:
            raise ValueError("MONGODB_URI is required and cannot be a placeholder.")
        return v

    @field_validator("JWT_SECRET")
    def validate_jwt_secret(cls, v):
        if not v or "change-me" in v:
            raise ValueError("JWT_SECRET is required and must not be a placeholder.")
        return v

    @field_validator("MODEL_DIR", "REPORT_DIR", "UPLOAD_DIR", mode="after")
    def resolve_to_backend(cls, v: Path) -> Path:
        if not v.is_absolute():
            clean_str = str(v).replace("\\", "/")
            if clean_str.startswith("backend/"):
                return BACKEND_DIR.parent / v
            return BACKEND_DIR / v
        return v

    def ensure_directories(self):
        self.MODEL_DIR.mkdir(parents=True, exist_ok=True)
        self.REPORT_DIR.mkdir(parents=True, exist_ok=True)
        self.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

settings = Settings()
settings.ensure_directories()

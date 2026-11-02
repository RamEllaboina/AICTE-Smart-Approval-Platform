import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    APP_ENV: str = "development"
    APP_NAME: str = "AICTE Smart Approval Platform"
    APP_BASE_URL: str = "http://localhost:8000"
    API_V1_PREFIX: str = "/api/v1"

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ADDITIONAL_CORS_ORIGINS: str = ""

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_ORIGIN.strip()]
        if self.ADDITIONAL_CORS_ORIGINS:
            origins.extend([o.strip() for o in self.ADDITIONAL_CORS_ORIGINS.split(",") if o.strip()])
        # Also include common local dev ports if in development
        if self.APP_ENV == "development":
            origins.extend(["http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:5173"])
        return list(set(origins))

    # Database
    DATABASE_URL: str = "sqlite:///./aicte_platform.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str = "dev_secret_key_change_in_production_aicte_sih_2026_super_secure_random"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage
    STORAGE_BACKEND: str = "local"  # 'local' or 's3'
    STORAGE_LOCAL_DIR: str = "./storage/documents"
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: str = "pdf,png,jpg,jpeg,doc,docx"

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.ALLOWED_EXTENSIONS.split(",") if ext.strip()]

    # Notifications & Email
    EMAIL_PROVIDER: str = "log"  # 'log', 'smtp'
    EMAIL_FROM_ADDRESS: str = "no-reply@aicte-smartapproval.gov.in"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""

    # Logging
    LOG_LEVEL: str = "INFO"


settings = Settings()

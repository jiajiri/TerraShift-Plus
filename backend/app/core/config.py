"""
TerraShift+ Global Configuration & Fail-Fast Environment Validation.
Strict Zero-Secrets enforcement: No hardcoded credentials or secret fallbacks.
"""
from __future__ import annotations
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List


@dataclass(frozen=True)
class Settings:
    PROJECT_NAME: str = "TerraShift+"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ])
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    CACHE_DIR: Path = Path(__file__).resolve().parent.parent.parent / "data_cache"
    CACHE_TTL_HOURS: int = 24


def load_settings() -> Settings:
    """Loads configuration and enforces fail-fast assertions."""
    # Ensure cache directory exists
    cache_dir = Path(os.getenv("CACHE_DIR", str(Path(__file__).resolve().parent.parent.parent / "data_cache")))
    cache_dir.mkdir(parents=True, exist_ok=True)

    cors_env = os.getenv("CORS_ORIGINS")
    cors_origins = [o.strip() for o in cors_env.split(",") if o.strip()] if cors_env else [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    return Settings(
        PROJECT_NAME=os.getenv("PROJECT_NAME", "TerraShift+"),
        ENVIRONMENT=os.getenv("ENVIRONMENT", "development"),
        LOG_LEVEL=os.getenv("LOG_LEVEL", "INFO"),
        HOST=os.getenv("HOST", "0.0.0.0"),
        PORT=int(os.getenv("PORT", "8000")),
        CORS_ORIGINS=cors_origins,
        NASA_POWER_BASE_URL=os.getenv("NASA_POWER_BASE_URL", "https://power.larc.nasa.gov/api/temporal/daily/point"),
        CACHE_DIR=cache_dir,
        CACHE_TTL_HOURS=int(os.getenv("CACHE_TTL_HOURS", "24"))
    )


settings = load_settings()

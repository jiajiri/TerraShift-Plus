"""
TerraShift+ Global Configuration & Fail-Fast Environment Validation.
Strict Zero-Secrets enforcement: No hardcoded credentials or secret fallbacks.
"""
from __future__ import annotations
import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Tuple, Optional


@dataclass(frozen=True)
class Settings:
    PROJECT_NAME: str = "TerraShift+"
    VERSION: str = "2.0.0"
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

    # Upstream NASA & Partner Open Science Endpoints
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    NASA_APPEEARS_URL: str = "https://appeears.earthdatacloud.nasa.gov/api"
    NASA_GLAM_URL: str = "https://glam1.gsfc.nasa.gov/api/gettbl/v4"
    NASA_CMR_URL: str = "https://cmr.earthdata.nasa.gov/search/granules.json"
    ISDA_SOIL_URL: str = "https://api.isda-africa.com"
    HARVEST_PORTAL_URL: str = "https://data.harvestportal.org/api/3/action"
    SOILGRIDS_FALLBACK_URL: str = "https://rest.isric.org/soilgrids/v2.0/properties/query"

    # Optional Earthdata & Partner Credentials (From .env only)
    EARTHDATA_USERNAME: str = ""
    EARTHDATA_PASSWORD: str = ""
    ISDA_USERNAME: str = ""
    ISDA_PASSWORD: str = ""
    HARVEST_API_TOKEN: str = ""

    # Google Gemini LLM API Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_DEFAULT_MODEL: str = "gemini-3.1-flash-lite"
    GEMINI_API_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"

    CACHE_DIR: Path = Path(__file__).resolve().parents[2] / "data_cache"
    MODEL_DIR: Path = Path(__file__).resolve().parents[2] / "app" / "models"
    CACHE_TTL_HOURS: int = 24

    def require_earthdata(self) -> Tuple[str, str]:
        if not self.EARTHDATA_USERNAME or not self.EARTHDATA_PASSWORD:
            raise RuntimeError(
                "EARTHDATA_USERNAME and EARTHDATA_PASSWORD must be configured in backend/.env for AppEEARS access."
            )
        return self.EARTHDATA_USERNAME, self.EARTHDATA_PASSWORD

    def require_isda(self) -> Tuple[str, str]:
        if not self.ISDA_USERNAME or not self.ISDA_PASSWORD:
            raise RuntimeError(
                "ISDA_USERNAME and ISDA_PASSWORD must be configured in backend/.env for iSDAsoil v2."
            )
        return self.ISDA_USERNAME, self.ISDA_PASSWORD


def load_settings() -> Settings:
    """Loads configuration dynamically from environment without secret fallbacks."""
    base_dir = Path(__file__).resolve().parents[2]
    # Check both backend/.env and root workspace .env
    for candidate in [base_dir / ".env", base_dir.parent / ".env"]:
        if candidate.exists():
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip("'").strip('"')
                            if k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

    cache_dir = base_dir / os.getenv("DATA_CACHE_DIR", "data_cache")
    model_dir = base_dir / os.getenv("MODEL_ARTIFACT_DIR", "app/models")

    cache_dir.mkdir(parents=True, exist_ok=True)
    model_dir.mkdir(parents=True, exist_ok=True)

    cors_env = os.getenv("CORS_ORIGINS")
    cors_origins = [o.strip() for o in cors_env.split(",") if o.strip()] if cors_env else [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000"
    ]

    return Settings(
        PROJECT_NAME=os.getenv("PROJECT_NAME", "TerraShift+"),
        VERSION=os.getenv("VERSION", "2.0.0"),
        ENVIRONMENT=os.getenv("ENVIRONMENT", "development"),
        LOG_LEVEL=os.getenv("LOG_LEVEL", "INFO"),
        HOST=os.getenv("HOST", "0.0.0.0"),
        PORT=int(os.getenv("PORT", "8000")),
        CORS_ORIGINS=cors_origins,
        NASA_POWER_BASE_URL=os.getenv("NASA_POWER_URL", "https://power.larc.nasa.gov/api/temporal/daily/point"),
        NASA_APPEEARS_URL=os.getenv("NASA_APPEEARS_URL", "https://appeears.earthdatacloud.nasa.gov/api"),
        NASA_GLAM_URL=os.getenv("NASA_GLAM_URL", "https://glam1.gsfc.nasa.gov/api/gettbl/v4"),
        NASA_CMR_URL=os.getenv("NASA_CMR_URL", "https://cmr.earthdata.nasa.gov/search/granules.json"),
        ISDA_SOIL_URL=os.getenv("ISDA_SOIL_URL", "https://api.isda-africa.com"),
        HARVEST_PORTAL_URL=os.getenv("HARVEST_PORTAL_URL", "https://data.harvestportal.org/api/3/action"),
        SOILGRIDS_FALLBACK_URL=os.getenv("SOILGRIDS_FALLBACK_URL", "https://rest.isric.org/soilgrids/v2.0/properties/query"),
        EARTHDATA_USERNAME=os.getenv("EARTHDATA_USERNAME", "").strip(),
        EARTHDATA_PASSWORD=os.getenv("EARTHDATA_PASSWORD", "").strip(),
        ISDA_USERNAME=os.getenv("ISDA_USERNAME", "").strip(),
        ISDA_PASSWORD=os.getenv("ISDA_PASSWORD", "").strip(),
        HARVEST_API_TOKEN=os.getenv("HARVEST_API_TOKEN", "").strip(),
        GEMINI_API_KEY=(os.getenv("GEMINI_API_KEY") or os.getenv("GEMMINI_API_KEY") or "").strip(),
        GEMINI_DEFAULT_MODEL=os.getenv("GEMINI_DEFAULT_MODEL", "gemini-3.1-flash-lite").strip(),
        GEMINI_API_BASE_URL=os.getenv("GEMINI_API_BASE_URL", "https://generativelanguage.googleapis.com/v1beta").strip(),
        CACHE_DIR=cache_dir,
        MODEL_DIR=model_dir,
        CACHE_TTL_HOURS=int(os.getenv("CACHE_TTL_HOURS", "24"))
    )


settings = load_settings()

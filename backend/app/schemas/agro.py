"""
Domain Models and Type-Safe Data Contracts for Agronomy, Climate, and Optimization.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
from enum import Enum


class SoilTexture(str, Enum):
    SANDY = "sandy"
    LOAM = "loam"
    SILTY_CLAY = "silty_clay"
    CLAY = "clay"


class CropCategory(str, Enum):
    GRAIN = "grain"
    LEGUME = "legume"
    OILSEED = "oilseed"
    COVER = "cover"


@dataclass(frozen=True)
class CropDefinition:
    id: str
    name: str
    scientific_name: str
    category: CropCategory
    base_gdd: float             # Base temperature for GDD (°C)
    required_gdd: float         # Phenological accumulation required to mature (°C-days)
    water_req_mm: float         # Seasonal water demand under standard cultivation (mm)
    nitrogen_demand_kg_ha: float # Total N removed per harvest (kg/ha)
    nitrogen_fixation_kg_ha: float # Total N fixed into soil (kg/ha)
    economic_margin_per_ha: float # Baseline economic return ($/ha)
    drought_tolerance_score: float # 0.0 (susceptible) to 1.0 (highly tolerant)
    soil_cover_score: float      # Erosion protection / organic matter contribution (0.0 to 1.0)
    family: str                  # Botanical family (e.g., Poaceae, Fabaceae, Brassicaceae)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["category"] = self.category.value
        return d


@dataclass(frozen=True)
class SoilProfile:
    texture: SoilTexture
    ph: float
    organic_matter_pct: float
    depth_cm: float
    current_nitrogen_kg_ha: float
    water_holding_capacity_mm: float

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["texture"] = self.texture.value
        return d


@dataclass(frozen=True)
class ClimateMetrics:
    latitude: float
    longitude: float
    elevation_m: float
    annual_precip_mm: float
    mean_temp_c: float
    max_temp_c: float
    min_temp_c: float
    mean_daily_solar_radiation_mj_m2: float
    frost_free_days: int
    annual_gdd: float
    drought_risk_index: float  # Coefficient of variation in rainfall (0.0 to 1.0)
    provenance_sources: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class RotationYearResult:
    year: int
    crop: CropDefinition
    projected_yield_pct: float
    soil_nitrogen_delta_kg: float
    water_stress_index: float  # 0 (no stress) to 1.0 (severe deficit)
    margin_usd: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "year": self.year,
            "crop": self.crop.to_dict(),
            "projected_yield_pct": round(self.projected_yield_pct, 2),
            "soil_nitrogen_delta_kg": round(self.soil_nitrogen_delta_kg, 2),
            "water_stress_index": round(self.water_stress_index, 3),
            "margin_usd": round(self.margin_usd, 2)
        }


@dataclass
class RotationPlan:
    plan_id: str
    archetype: str  # "Resilience-First", "Yield-Balanced", "Climate-Stress Adapted"
    description: str
    rotation_sequence: List[RotationYearResult]
    total_margin_usd: float
    net_nitrogen_balance_kg: float
    mean_resilience_score: float
    drought_vulnerability_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "archetype": self.archetype,
            "description": self.description,
            "rotation_sequence": [r.to_dict() for r in self.rotation_sequence],
            "total_margin_usd": round(self.total_margin_usd, 2),
            "net_nitrogen_balance_kg": round(self.net_nitrogen_balance_kg, 2),
            "mean_resilience_score": round(self.mean_resilience_score, 2),
            "drought_vulnerability_score": round(self.drought_vulnerability_score, 2)
        }

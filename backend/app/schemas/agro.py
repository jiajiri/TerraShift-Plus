"""
Domain Models and Type-Safe Data Contracts for Agronomy, Climate, and Optimization.
Pure Standard Python: Zero third-party dependency requirements.
"""
from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any, Literal
from enum import Enum


# --- Lightweight Dictionary-Backed Contracts for SSE Streaming & Chat ---

class SoilInput:
    def __init__(
        self,
        texture: Optional[str] = None,
        ph: Optional[float] = None,
        organic_matter_pct: Optional[float] = None,
        slope_pct: Optional[float] = None,
        drainage: str = "unknown"
    ):
        self.texture = texture
        self.ph = ph
        self.organic_matter_pct = organic_matter_pct
        self.slope_pct = slope_pct
        self.drainage = drainage

    @classmethod
    def from_dict(cls, d: Optional[Dict[str, Any]] = None) -> SoilInput:
        if not d:
            return cls()
        return cls(
            texture=d.get("texture"),
            ph=d.get("ph"),
            organic_matter_pct=d.get("organic_matter_pct"),
            slope_pct=d.get("slope_pct"),
            drainage=d.get("drainage", "unknown")
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "texture": self.texture,
            "ph": self.ph,
            "organic_matter_pct": self.organic_matter_pct,
            "slope_pct": self.slope_pct,
            "drainage": self.drainage
        }


class FarmerConstraints:
    def __init__(
        self,
        baseline_crop_id: str = "maize",
        irrigation_available_mm: float = 0.0,
        has_no_till_drill: bool = False,
        allow_cover_crops: bool = True,
        forage_needed: bool = True,
        avoid_frost: bool = True,
        priority_water: int = 85,
        priority_soil_om: int = 80,
        priority_erosion: int = 75,
        priority_pest_break: int = 70,
        priority_market: int = 65,
        max_consecutive_grain_years: int = 1
    ):
        self.baseline_crop_id = baseline_crop_id
        self.irrigation_available_mm = float(irrigation_available_mm)
        self.has_no_till_drill = bool(has_no_till_drill)
        self.allow_cover_crops = bool(allow_cover_crops)
        self.forage_needed = bool(forage_needed)
        self.avoid_frost = bool(avoid_frost)
        self.priority_water = int(priority_water)
        self.priority_soil_om = int(priority_soil_om)
        self.priority_erosion = int(priority_erosion)
        self.priority_pest_break = int(priority_pest_break)
        self.priority_market = int(priority_market)
        self.max_consecutive_grain_years = int(max_consecutive_grain_years)

    @classmethod
    def from_dict(cls, d: Optional[Dict[str, Any]] = None) -> FarmerConstraints:
        if not d:
            return cls()
        return cls(
            baseline_crop_id=d.get("baseline_crop_id", "maize"),
            irrigation_available_mm=d.get("irrigation_available_mm", 0.0),
            has_no_till_drill=d.get("has_no_till_drill", False),
            allow_cover_crops=d.get("allow_cover_crops", True),
            forage_needed=d.get("forage_needed", True),
            avoid_frost=d.get("avoid_frost", True),
            priority_water=d.get("priority_water", 85),
            priority_soil_om=d.get("priority_soil_om", 80),
            priority_erosion=d.get("priority_erosion", 75),
            priority_pest_break=d.get("priority_pest_break", 70),
            priority_market=d.get("priority_market", 65),
            max_consecutive_grain_years=d.get("max_consecutive_grain_years", 1)
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "baseline_crop_id": self.baseline_crop_id,
            "irrigation_available_mm": self.irrigation_available_mm,
            "has_no_till_drill": self.has_no_till_drill,
            "allow_cover_crops": self.allow_cover_crops,
            "forage_needed": self.forage_needed,
            "avoid_frost": self.avoid_frost,
            "priority_water": self.priority_water,
            "priority_soil_om": self.priority_soil_om,
            "priority_erosion": self.priority_erosion,
            "priority_pest_break": self.priority_pest_break,
            "priority_market": self.priority_market,
            "max_consecutive_grain_years": self.max_consecutive_grain_years
        }


class OptimizeRequest:
    def __init__(
        self,
        latitude: float,
        longitude: float,
        precip_delta_pct: float = 0.0,
        temp_delta_c: float = 0.0,
        soil_overrides: Optional[SoilInput] = None,
        constraints: Optional[FarmerConstraints] = None,
        language: str = "en"
    ):
        self.latitude = float(latitude)
        self.longitude = float(longitude)
        self.precip_delta_pct = float(precip_delta_pct)
        self.temp_delta_c = float(temp_delta_c)
        self.soil_overrides = soil_overrides or SoilInput()
        self.constraints = constraints or FarmerConstraints()
        self.language = str(language or "en")

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> OptimizeRequest:
        return cls(
            latitude=d["latitude"],
            longitude=d["longitude"],
            precip_delta_pct=d.get("precip_delta_pct", 0.0),
            temp_delta_c=d.get("temp_delta_c", 0.0),
            soil_overrides=SoilInput.from_dict(d.get("soil_overrides")),
            constraints=FarmerConstraints.from_dict(d.get("constraints")),
            language=d.get("language", "en")
        )


class ChatRequest:
    def __init__(
        self,
        question: str,
        optimization_context: Dict[str, Any],
        climate_context: Dict[str, Any]
    ):
        self.question = question
        self.optimization_context = optimization_context
        self.climate_context = climate_context

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> ChatRequest:
        return cls(
            question=d["question"],
            optimization_context=d.get("optimization_context", {}),
            climate_context=d.get("climate_context", {})
        )


# --- Core Dataclasses for Agronomy & Optimization Engine ---

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
    BRASSICA = "brassica"


class FarmerPriority(str, Enum):
    BALANCED = "balanced"
    WATER_CONSERVATION = "water_conservation"
    MAX_MARGIN = "max_margin"
    SOIL_CARBON_REGENERATION = "soil_carbon_regeneration"


@dataclass(frozen=True)
class CropDefinition:
    id: str
    name: str
    scientific_name: str
    category: CropCategory
    base_gdd: float
    required_gdd: float
    water_req_mm: float
    nitrogen_demand_kg_ha: float
    nitrogen_fixation_kg_ha: float
    economic_margin_per_ha: float
    drought_tolerance_score: float
    soil_cover_score: float
    family: str = "Poaceae"
    root_depth_m: float = 1.0
    c_factor_rusle: float = 0.25
    kc_mid: float = 1.05
    start_month: int = 3
    cycle_days: int = 120
    t_opt_max: float = 34.0
    t_min_kill: float = 0.0
    ph_min: float = 5.5
    ph_max: float = 7.5
    residue_t_ha: float = 2.5

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["category"] = self.category.value
        return d


@dataclass(frozen=True)
class SoilProfile:
    texture: SoilTexture
    ph: float
    organic_matter_pct: float
    clay_pct: float = 24.0
    sand_pct: float = 45.0
    slope_pct: float = 2.0
    depth_cm: float = 100.0
    current_nitrogen_kg_ha: float = 50.0
    water_holding_capacity_mm: float = 140.0

    @property
    def available_water_capacity_mm(self) -> float:
        s = max(0.01, min(0.98, self.sand_pct / 100.0))
        c = max(0.01, min(0.95, self.clay_pct / 100.0))
        om = max(0.2, min(12.0, self.organic_matter_pct))

        theta_1500t = -0.024 * s + 0.487 * c + 0.006 * om + 0.005 * (s * om) - 0.013 * (c * om) + 0.068 * (s * c) + 0.031
        theta_wp = theta_1500t + (0.14 * theta_1500t - 0.02)

        theta_33t = -0.251 * s + 0.195 * c + 0.011 * om + 0.006 * (s * om) - 0.027 * (c * om) + 0.452 * (s * c) + 0.299
        theta_fc = theta_33t + (1.283 * (theta_33t ** 2) - 0.374 * theta_33t - 0.015)

        awc_vol = max(0.04, min(0.30, theta_fc - theta_wp))
        return round(awc_vol * (self.depth_cm * 10.0), 1)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["texture"] = self.texture.value
        d["available_water_capacity_mm"] = self.available_water_capacity_mm
        return d


@dataclass(frozen=True)
class ClimateMetrics:
    latitude: float
    longitude: float
    annual_precipitation_mm: float
    mean_temp_c: float
    max_temp_c: float
    min_temp_c: float
    solar_radiation_mj_m2_day: float
    wind_speed_2m_m_s: float
    relative_humidity_pct: float
    fao56_reference_et_mm_day: float
    consecutive_dry_days: int
    elevation_m: float = 100.0
    gwet_root_current: float = 0.55
    gwet_root_z: float = 0.0
    spei_latest: float = 0.0
    monthly_climatology: List[Dict[str, Any]] = field(default_factory=list)
    is_cached: bool = False
    timestamp: Optional[str] = None
    yearly_trends: List[Dict[str, Any]] = field(default_factory=list)
    trend_slopes: Dict[str, float] = field(default_factory=dict)

    @property
    def annual_precip_mm(self) -> float:
        return self.annual_precipitation_mm

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["annual_precip_mm"] = self.annual_precipitation_mm
        d["yearly_trends"] = self.yearly_trends
        d["trend_slopes"] = self.trend_slopes
        return d


@dataclass
class RotationYearResult:
    year: int
    crop: CropDefinition
    predicted_yield_ratio: float
    margin_usd_ha: float
    margin_p10_usd_ha: float
    margin_p90_usd_ha: float
    water_stress_index: float
    et_demand_mm: float
    et_actual_mm: float
    nitrogen_balance_kg_ha: float
    rusle_soil_loss_tonnes_ha: float
    soc_delta_t_ha: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "year": self.year,
            "crop": self.crop.to_dict(),
            "predicted_yield_ratio": round(self.predicted_yield_ratio, 3),
            "margin_usd_ha": round(self.margin_usd_ha, 1),
            "margin_p10_usd_ha": round(self.margin_p10_usd_ha, 1),
            "margin_p90_usd_ha": round(self.margin_p90_usd_ha, 1),
            "water_stress_index": round(self.water_stress_index, 3),
            "et_demand_mm": round(self.et_demand_mm, 1),
            "et_actual_mm": round(self.et_actual_mm, 1),
            "nitrogen_balance_kg_ha": round(self.nitrogen_balance_kg_ha, 1),
            "rusle_soil_loss_tonnes_ha": round(self.rusle_soil_loss_tonnes_ha, 2),
            "soc_delta_t_ha": round(self.soc_delta_t_ha, 2)
        }


@dataclass
class RotationPlan:
    archetype: str
    years: List[RotationYearResult]
    total_gross_margin_5yr: float
    margin_p10_5yr: float
    margin_p90_5yr: float
    cvar_10_margin_5yr: float
    net_nitrogen_balance_5yr: float
    net_soc_delta_5yr: float
    mean_water_stress_index: float
    total_soil_loss_5yr_tonnes: float
    diversity_index: float
    explanation: str

    @property
    def rotation_sequence(self) -> List[RotationYearResult]:
        return self.years

    @property
    def total_margin_usd(self) -> float:
        return self.total_gross_margin_5yr

    def to_dict(self) -> Dict[str, Any]:
        return {
            "archetype": self.archetype,
            "years": [y.to_dict() for y in self.years],
            "rotation_sequence": [y.to_dict() for y in self.years],
            "total_gross_margin_5yr": round(self.total_gross_margin_5yr, 1),
            "total_margin_usd": round(self.total_gross_margin_5yr, 1),
            "margin_p10_5yr": round(self.margin_p10_5yr, 1),
            "margin_p90_5yr": round(self.margin_p90_5yr, 1),
            "cvar_10_margin_5yr": round(self.cvar_10_margin_5yr, 1),
            "net_nitrogen_balance_5yr": round(self.net_nitrogen_balance_5yr, 1),
            "net_soc_delta_5yr": round(self.net_soc_delta_5yr, 2),
            "mean_water_stress_index": round(self.mean_water_stress_index, 3),
            "total_soil_loss_5yr_tonnes": round(self.total_soil_loss_5yr_tonnes, 2),
            "diversity_index": round(self.diversity_index, 2),
            "explanation": self.explanation
        }

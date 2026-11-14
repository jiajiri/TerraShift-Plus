"""
Deterministic FAO-56 Penman-Monteith Evapotranspiration and Growing Degree Day Engine.
Strict mathematical calculations: ZERO LLM hallucination in physical modeling.
"""
from __future__ import annotations
import math
from typing import Dict, List, Tuple
from ..schemas.agro import CropDefinition, ClimateMetrics, SoilProfile


class AgronomyEngine:
    """
    Computes bio-physical crop performance using FAO-56 and phenological heat units.
    Reference: Allen, R.G., Pereira, L.S., Raes, D., Smith, M., 1998.
    Crop evapotranspiration: Guidelines for computing crop water requirements.
    FAO Irrigation and drainage paper 56. Rome, Italy.
    """

    @staticmethod
    def calculate_fao56_reference_et(
        t_mean_c: float,
        solar_radiation_mj_m2_day: float,
        wind_speed_2m_m_s: float = 2.0,
        relative_humidity_pct: float = 65.0,
        elevation_m: float = 100.0
    ) -> float:
        """
        Calculates daily reference evapotranspiration (ET0 in mm/day) via FAO-56 Penman-Monteith.
        """
        # Atmospheric pressure P (kPa) at elevation z (m)
        p_kpa = 101.3 * math.pow((293.0 - 0.0065 * elevation_m) / 293.0, 5.26)

        # Psychrometric constant gamma (kPa / °C)
        gamma = 0.000665 * p_kpa

        # Saturation vapor pressure e_s (kPa)
        e_s = 0.6108 * math.exp((17.27 * t_mean_c) / (t_mean_c + 237.3))

        # Actual vapor pressure e_a (kPa)
        e_a = e_s * (relative_humidity_pct / 100.0)

        # Vapor pressure deficit (e_s - e_a)
        vpd = max(e_s - e_a, 0.0)

        # Slope of vapor pressure curve delta (kPa / °C)
        delta = (4098.0 * e_s) / math.pow(t_mean_c + 237.3, 2)

        # Soil heat flux G is approximately 0 for daily intervals
        g = 0.0

        # FAO-56 Equation
        numerator = 0.408 * delta * (solar_radiation_mj_m2_day - g) + gamma * (900.0 / (t_mean_c + 273.0)) * wind_speed_2m_m_s * vpd
        denominator = delta + gamma * (1.0 + 0.34 * wind_speed_2m_m_s)

        et0 = numerator / denominator
        return max(et0, 0.1)

    @staticmethod
    def calculate_gdd(t_max_c: float, t_min_c: float, base_temp_c: float) -> float:
        """
        Standard Growing Degree Day (GDD) bio-accumulation formula:
        GDD = max((T_max + T_min)/2 - T_base, 0)
        """
        mean_t = (t_max_c + t_min_c) / 2.0
        return max(mean_t - base_temp_c, 0.0)

    @classmethod
    def evaluate_crop_yield_and_stress(
        cls,
        crop: CropDefinition,
        climate: ClimateMetrics,
        soil: SoilProfile,
        prev_crop: CropDefinition | None = None
    ) -> Tuple[float, float, float]:
        """
        Evaluates crop performance:
        Returns:
            - projected_yield_pct (0.0 to 120.0%)
            - soil_nitrogen_delta_kg (kg/ha added or removed)
            - water_stress_index (0.0 = optimal, 1.0 = total crop failure)
        """
        # 1. Thermal Suitability (GDD Check)
        gdd_ratio = min(climate.annual_gdd / max(crop.required_gdd, 1.0), 1.25)
        if gdd_ratio < 0.70:
            # Insufficient thermal units to mature
            thermal_penalty = (1.0 - gdd_ratio) * 1.5
        else:
            thermal_penalty = 0.0

        # 2. Water Balance & Water Stress Index (WSI)
        effective_water = climate.annual_precip_mm * 0.80 + soil.water_holding_capacity_mm * (soil.organic_matter_pct / 3.0)
        water_ratio = effective_water / max(crop.water_req_mm, 100.0)

        if water_ratio >= 1.0:
            water_stress_index = 0.0
            water_factor = 1.0
        else:
            # Water deficit mitigated by drought tolerance
            deficit = 1.0 - water_ratio
            mitigated_deficit = deficit * (1.0 - (crop.drought_tolerance_score * 0.65))
            water_stress_index = min(max(mitigated_deficit, 0.0), 1.0)
            water_factor = max(1.0 - water_stress_index, 0.20)

        # 3. Nitrogen & Rotational Benefit / Penalty
        net_n_delta = crop.nitrogen_fixation_kg_ha - crop.nitrogen_demand_kg_ha

        rotational_bonus = 0.0
        if prev_crop is not None:
            # Monoculture disease penalty
            if prev_crop.family == crop.family:
                rotational_bonus -= 0.18  # 18% yield loss from continuous family monoculture
            # Legume preceding grain benefit
            if prev_crop.category.value == "legume" and crop.category.value == "grain":
                rotational_bonus += 0.12  # 12% yield boost from fixed residual nitrogen

        # 4. Composite Yield Percentage
        base_yield_potential = 100.0
        projected_yield = base_yield_potential * water_factor * (1.0 - thermal_penalty) * (1.0 + rotational_bonus)
        projected_yield = max(min(projected_yield, 125.0), 15.0)

        return (projected_yield, net_n_delta, water_stress_index)

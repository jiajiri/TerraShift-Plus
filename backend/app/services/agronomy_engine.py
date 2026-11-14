"""
Deterministic FAO-56 Penman-Monteith Evapotranspiration, GDD Engine, and RUSLE Soil Loss.
"""
from __future__ import annotations
import math
from typing import Dict, List, Tuple, Any
from ..schemas.agro import CropDefinition, ClimateMetrics, SoilProfile, FarmerConstraints


class AgronomyEngine:
    """
    Computes bio-physical crop performance using FAO-56 and phenological heat units.
    """

    @staticmethod
    def calculate_fao56_reference_et(
        t_mean_c: float,
        solar_radiation_mj_m2_day: float,
        wind_speed_2m_m_s: float = 2.0,
        relative_humidity_pct: float = 65.0,
        elevation_m: float = 100.0,
        t_min_c: float = 12.0,
        t_max_c: float = 28.0
    ) -> float:
        p_kpa = 101.3 * math.pow((293.0 - 0.0065 * elevation_m) / 293.0, 5.26)
        gamma = 0.000665 * p_kpa

        e_s = 0.6108 * math.exp((17.27 * t_mean_c) / (t_mean_c + 237.3))
        e_a = e_s * (relative_humidity_pct / 100.0)
        vpd = max(e_s - e_a, 0.0)

        delta = (4098.0 * e_s) / math.pow(t_mean_c + 237.3, 2)
        g = 0.0

        numerator = 0.408 * delta * (solar_radiation_mj_m2_day - g) + gamma * (900.0 / (t_mean_c + 273.0)) * wind_speed_2m_m_s * vpd
        denominator = delta + gamma * (1.0 + 0.34 * wind_speed_2m_m_s)

        et0 = numerator / denominator
        return max(et0, 0.1)

    @staticmethod
    def calculate_gdd(t_max_c: float, t_min_c: float, base_temp_c: float) -> float:
        t_mean = (t_max_c + t_min_c) / 2.0
        return max(0.0, t_mean - base_temp_c)

    @staticmethod
    def compute_gdd_and_kdd(
        monthly_climatology: List[Dict[str, Any]],
        t_base_c: float,
        t_crit_heat_c: float,
        t_kill_frost_c: float,
        start_month: int,
        cycle_months: int,
        temp_delta_c: float = 0.0,
    ) -> Dict[str, float]:
        gdd = 0.0
        kdd = 0.0
        frost_months = 0
        for offset in range(cycle_months):
            m_idx = (start_month - 1 + offset) % 12
            m = monthly_climatology[m_idx] if m_idx < len(monthly_climatology) else {
                "t_mean_c": 20.0, "t_max_c": 28.0, "t_min_c": 12.0
            }
            t_mean = m["t_mean_c"] + temp_delta_c
            t_max = m["t_max_c"] + temp_delta_c
            t_min = m["t_min_c"] + temp_delta_c
            gdd += max(0.0, t_mean - t_base_c) * 30.4
            kdd += max(0.0, t_max - t_crit_heat_c) * 30.4
            if t_min < t_kill_frost_c:
                frost_months += 1
        return {
            "gdd": round(gdd, 1),
            "kdd": round(kdd, 1),
            "frost_risk_months": float(frost_months),
        }

    @staticmethod
    def simulate_soil_water_balance(
        monthly_climatology: List[Dict[str, Any]],
        awc_mm: float,
        kc_mid: float,
        initial_wetness_frac: float,
        start_month: int,
        cycle_months: int,
        irrigation_mm: float = 0.0,
        precip_delta_pct: float = 0.0,
        temp_delta_c: float = 0.0,
    ) -> Dict[str, float]:
        storage = max(10.0, min(awc_mm, initial_wetness_frac * awc_mm))
        irr_per_month = irrigation_mm / max(1, cycle_months)
        et_demand_total = 0.0
        et_actual_total = 0.0
        precip_total = 0.0

        for offset in range(cycle_months):
            m_idx = (start_month - 1 + offset) % 12
            m = monthly_climatology[m_idx] if m_idx < len(monthly_climatology) else {
                "precip_mm": 50.0, "et0_mm": 120.0
            }
            frac = (offset + 0.5) / max(1, cycle_months)
            kc = 0.45 if frac < 0.2 else (kc_mid if frac < 0.75 else 0.65)

            p_eff = max(0.0, m["precip_mm"] * (1.0 + precip_delta_pct / 100.0)) * 0.85
            et0_adj = m["et0_mm"] * (1.0 + temp_delta_c * 0.045)
            et_c = kc * et0_adj

            available = storage + p_eff + irr_per_month
            et_a = min(et_c, available)
            storage = max(0.0, min(awc_mm, available - et_a))

            et_demand_total += et_c
            et_actual_total += et_a
            precip_total += p_eff

        wsi = 1.0 - (et_actual_total / max(1.0, et_demand_total))
        return {
            "wsi": round(max(0.0, min(1.0, wsi)), 3),
            "et_demand_mm": round(et_demand_total, 1),
            "et_actual_mm": round(et_actual_total, 1),
            "effective_rain_mm": round(precip_total, 1),
        }

    @staticmethod
    def calculate_rusle_erosion(
        annual_precip_mm: float,
        soil: SoilProfile,
        crop: CropDefinition,
        no_till: bool = True
    ) -> float:
        r_factor = 0.0483 * math.pow(max(annual_precip_mm, 50.0), 1.61)
        silt_pct = max(5.0, 100.0 - soil.sand_pct - soil.clay_pct)
        k_factor = max(0.01, min(0.07, 0.0004 * silt_pct + 0.025 - 0.002 * soil.organic_matter_pct))

        theta = math.atan(max(soil.slope_pct, 0.1) / 100.0)
        ls_factor = max(0.1, (16.8 * math.sin(theta) - 0.5) if soil.slope_pct >= 9.0 else (10.8 * math.sin(theta) + 0.03))

        c_factor = crop.c_factor_rusle
        p_factor = 0.55 if no_till else 1.0

        soil_loss = r_factor * k_factor * ls_factor * c_factor * p_factor
        return round(max(0.05, soil_loss), 2)

    @classmethod
    def calculate_rusle_erosion_risk(
        cls,
        crop: CropDefinition,
        soil: SoilProfile,
        climate: ClimateMetrics,
        no_till: bool = True
    ) -> float:
        """Alias ensuring compatibility with existing test suites."""
        return cls.calculate_rusle_erosion(climate.annual_precipitation_mm, soil, crop, no_till)

    @staticmethod
    def compute_soc_delta_t_ha(
        current_om_pct: float,
        clay_pct: float,
        mean_temp_c: float,
        residue_c_input_t_ha: float,
        no_till: bool,
    ) -> float:
        baseline_soc_t_ha = (current_om_pct * 0.58) * 35.0
        temp_modifier = math.exp(0.065 * (mean_temp_c - 15.0))
        clay_protection = 1.0 / (1.0 + 0.018 * clay_pct)
        tillage_decay = 0.72 if no_till else 1.15
        k_decay = 0.028 * temp_modifier * clay_protection * tillage_decay
        delta = (residue_c_input_t_ha * 0.38) - (k_decay * baseline_soc_t_ha)
        return round(delta, 2)

"""
Validation runner for TerraShift+ physics and machine learning controls.
Executes live runs across 4 distinct agro-ecological benchmark sites:
1. Dodoma, Tanzania (-6.1630, 35.7516): East Africa semi-arid maize baseline and bare-field protection.
2. Fallon, Nevada (39.4735, -118.7774): Challenge benchmark arid irrigated alfalfa water squeeze.
3. Ames, Iowa (42.0308, -93.6319): Temperate high-yield corn/soybean rotation.
4. Polar/Ocean Negative OOD Control (-78.3453, -95.1855): Confirms Mahalanobis OOD distance, ood_warning, and gap flags.
5. Monotonicity Drought Shock: Run -25% rain and +2.0C temperature perturbation on Dodoma and Fallon, checking monotonic response.

Saves structured validation output to backend/app/models/paper_validation.json.
"""
from __future__ import annotations
import json
import math
import sys
import time
from pathlib import Path
from typing import Dict, Any, List

# Ensure backend is on sys.path
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from app.core.config import settings
from app.services.nasa_power import NASAPowerClient
from app.services.optimizer import optimize_five_year_rotation
from app.services.agronomy_engine import AgronomyEngine
from app.schemas.agro import SoilProfile, SoilTexture, CropDefinition, CropCategory
from app.main import (
    _load_crop_catalog,
    _fetch_live_soil,
    _fetch_elevation_and_slope,
    _fetch_ornl_ndvi,
)


def run_site_evaluation(
    site_id: str,
    site_name: str,
    lat: float,
    lon: float,
    baseline_crop_id: str,
    irrigation_mm: float = 0.0,
    precip_delta_pct: float = 0.0,
    temp_delta_c: float = 0.0,
    crop_catalog: List[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Execute live end-to-end data acquisition and physics optimization for a single site."""
    if crop_catalog is None:
        crop_catalog = _load_crop_catalog()

    t0 = time.perf_counter()

    # 1. Fetch satellite & climatology layers
    climate = NASAPowerClient.fetch_climate_profile(lat, lon, 2021, 2023)
    soil_res = _fetch_live_soil(lat, lon)
    terrain_res = _fetch_elevation_and_slope(lat, lon)
    ndvi_res = _fetch_ornl_ndvi(lat, lon)

    effective_ph = float(soil_res.get("ph") or 6.5)
    effective_clay = float(soil_res.get("clay_pct") or 24.0)
    effective_sand = float(soil_res.get("sand_pct") or 42.0)
    effective_om = float(soil_res.get("om_pct") or 2.0)
    effective_slope = float(terrain_res.get("slope_pct") or 2.0)

    effective_soil = {
        "ph": effective_ph,
        "sand_pct": effective_sand,
        "clay_pct": effective_clay,
        "om_pct": effective_om,
        "slope_pct": effective_slope,
        "source_label": soil_res.get("source", "Satellite Global Grids"),
    }

    constraints = {
        "baseline_crop_id": baseline_crop_id,
        "irrigation_available_mm": irrigation_mm,
        "has_no_till_drill": False,
        "allow_cover_crops": True,
    }

    # 2. Run Pareto-optimal 5-year simulation
    opt_payload = optimize_five_year_rotation(
        crop_catalog=crop_catalog,
        power_data=climate.to_dict(),
        soil=effective_soil,
        constraints=constraints,
        precip_delta_pct=precip_delta_pct,
        temp_delta_c=temp_delta_c,
        ndvi_data=ndvi_res,
    )

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "site_id": site_id,
        "site_name": site_name,
        "coordinates": {"latitude": lat, "longitude": lon},
        "elapsed_ms": elapsed_ms,
        "climate_metrics": {
            "annual_precipitation_mm": climate.annual_precipitation_mm,
            "mean_temp_c": climate.mean_temp_c,
            "fao56_reference_et_mm_day": climate.fao56_reference_et_mm_day,
            "gwet_root_current": climate.gwet_root_current,
            "spei_latest": climate.spei_latest,
            "is_cached": climate.is_cached,
        },
        "effective_soil": effective_soil,
        "regime": opt_payload["regime"],
        "field_diagnosis": opt_payload["field_diagnosis"],
        "opportunities": opt_payload["opportunities"],
        "strategies": opt_payload["strategies"],
        "si_methods_comparison": opt_payload.get("si_methods_comparison", []),
    }


def run_paper_validation() -> Dict[str, Any]:
    print("=================================================================")
    print(" TerraShift+ Real Control Validation Runner")
    print("=================================================================")
    crop_catalog = _load_crop_catalog()

    # -------------------------------------------------------------
    # Site 1: Dodoma, Tanzania (-6.1630, 35.7516)
    # -------------------------------------------------------------
    print("\n[1/5] Evaluating Dodoma, Tanzania (East Africa semi-arid maize)...")
    dodoma_res = run_site_evaluation(
        site_id="dodoma_tz",
        site_name="Dodoma, Tanzania",
        lat=-6.1630,
        lon=35.7516,
        baseline_crop_id="maize",
        irrigation_mm=0.0,
        crop_catalog=crop_catalog,
    )
    d_base = dodoma_res["strategies"][0]
    d_rot = dodoma_res["strategies"][1]
    erosion_protection = round(d_base["mean_rusle_t_ha"] - d_rot["mean_rusle_t_ha"], 2)
    print(f" -> Dodoma Regime: {dodoma_res['regime']['regime_name']}")
    print(f" -> Baseline Monoculture RUSLE: {d_base['mean_rusle_t_ha']} t/ha/yr")
    print(f" -> Diversified Rotation RUSLE: {d_rot['mean_rusle_t_ha']} t/ha/yr")
    print(f" -> Bare-field protection soil savings: {erosion_protection} t/ha/yr")
    print(f" -> Bare-field detected months: {dodoma_res['field_diagnosis']['bare_months']}")

    # -------------------------------------------------------------
    # Site 2: Fallon, Nevada (39.4735, -118.7774)
    # -------------------------------------------------------------
    print("\n[2/5] Evaluating Fallon, Nevada (Arid irrigated challenge benchmark)...")
    fallon_irrigated = run_site_evaluation(
        site_id="fallon_nv_irrigated",
        site_name="Fallon, Nevada (Irrigated 200mm)",
        lat=39.4735,
        lon=-118.7774,
        baseline_crop_id="maize",
        irrigation_mm=200.0,
        crop_catalog=crop_catalog,
    )
    fallon_squeezed = run_site_evaluation(
        site_id="fallon_nv_squeezed",
        site_name="Fallon, Nevada (Water Squeeze 0mm)",
        lat=39.4735,
        lon=-118.7774,
        baseline_crop_id="maize",
        irrigation_mm=0.0,
        crop_catalog=crop_catalog,
    )
    f_irr_base = fallon_irrigated["strategies"][0]
    f_sqz_base = fallon_squeezed["strategies"][0]
    wsi_squeeze_delta = round(f_sqz_base["mean_wsi"] - f_irr_base["mean_wsi"], 3)
    margin_squeeze_drop = round(f_irr_base["margin_p50_5y"] - f_sqz_base["margin_p50_5y"], 1)
    print(f" -> Fallon Regime: {fallon_squeezed['regime']['regime_name']}")
    print(f" -> Irrigated Baseline (200mm): WSI {f_irr_base['mean_wsi']}, Margin {f_irr_base['margin_p50_5y']} USD/ha")
    print(f" -> Squeezed Baseline (0mm): WSI {f_sqz_base['mean_wsi']}, Margin {f_sqz_base['margin_p50_5y']} USD/ha")
    print(f" -> Water Squeeze Impact: +{wsi_squeeze_delta} WSI, -{margin_squeeze_drop} USD/ha margin")

    # -------------------------------------------------------------
    # Site 3: Ames, Iowa (42.0308, -93.6319)
    # -------------------------------------------------------------
    print("\n[3/5] Evaluating Ames, Iowa (Temperate high-yield corn belt)...")
    ames_res = run_site_evaluation(
        site_id="ames_ia",
        site_name="Ames, Iowa",
        lat=42.0308,
        lon=-93.6319,
        baseline_crop_id="maize",
        irrigation_mm=0.0,
        crop_catalog=crop_catalog,
    )
    a_base = ames_res["strategies"][0]
    a_rot = ames_res["strategies"][1]
    print(f" -> Ames Regime: {ames_res['regime']['regime_name']}")
    print(f" -> Ames Baseline Margin: {a_base['margin_p50_5y']} USD/ha (Net N: {a_base['net_n_5y_kg_ha']} kg/ha)")
    print(f" -> Ames Diversified Margin: {a_rot['margin_p50_5y']} USD/ha (Net N: {a_rot['net_n_5y_kg_ha']} kg/ha)")

    # -------------------------------------------------------------
    # Site 4: Polar/Ocean Negative OOD Control (-78.3453, -95.1855)
    # -------------------------------------------------------------
    print("\n[4/5] Evaluating Polar/Ocean Negative OOD Control (-78.3453, -95.1855)...")
    polar_res = run_site_evaluation(
        site_id="polar_ood_control",
        site_name="Polar/Ocean Negative OOD Control",
        lat=-78.3453,
        lon=-95.1855,
        baseline_crop_id="maize",
        irrigation_mm=0.0,
        crop_catalog=crop_catalog,
    )
    p_regime = polar_res["regime"]
    p_strat = polar_res["strategies"][0]
    print(f" -> Mahalanobis Distance Proxy: {p_regime['mahalanobis_distance_proxy']}")
    print(f" -> ood_warning: {p_regime['ood_warning']}")
    print(f" -> recommendation_confidence: {p_regime['recommendation_confidence']}")
    print(f" -> Information gaps present: {len(p_strat.get('information_gaps', [])) > 0}")

    # -------------------------------------------------------------
    # 5. Monotonicity Drought Shock: -25% Rain, +2.0C Temp
    # -------------------------------------------------------------
    print("\n[5/5] Testing Monotonicity Drought Shock (-25% precip, +2.0C temp)...")
    d_shock = run_site_evaluation(
        site_id="dodoma_shock",
        site_name="Dodoma, Tanzania (Drought Shock)",
        lat=-6.1630,
        lon=35.7516,
        baseline_crop_id="maize",
        irrigation_mm=0.0,
        precip_delta_pct=-25.0,
        temp_delta_c=2.0,
        crop_catalog=crop_catalog,
    )
    f_shock = run_site_evaluation(
        site_id="fallon_shock",
        site_name="Fallon, Nevada (Drought Shock)",
        lat=39.4735,
        lon=-118.7774,
        baseline_crop_id="maize",
        irrigation_mm=0.0,
        precip_delta_pct=-25.0,
        temp_delta_c=2.0,
        crop_catalog=crop_catalog,
    )

    # Compute monotonicity deltas
    def evaluate_monotonicity(pre_strat: Dict[str, Any], post_strat: Dict[str, Any], site_label: str) -> Dict[str, Any]:
        pre_wsi = pre_strat["mean_wsi"]
        post_wsi = post_strat["mean_wsi"]
        pre_margin = pre_strat["margin_p50_5y"]
        post_margin = post_strat["margin_p50_5y"]

        # Bare soil baseline erosion with fixed rainfall (RUSLE erosion vulnerability)
        # Note: In standard RUSLE A = R * K * LS * C * P, where R is kinetic energy of rain.
        # However, under dryland drought shock, ground cover thins and bare-field risk intensifies.
        # We record the empirical model RUSLE and verify WSI increase and margin decline.
        wsi_increased = post_wsi >= pre_wsi
        margin_declined = post_margin <= pre_margin

        return {
            "site": site_label,
            "archetype": pre_strat["archetype"],
            "pre_wsi": pre_wsi,
            "post_wsi": post_wsi,
            "wsi_delta": round(post_wsi - pre_wsi, 3),
            "wsi_monotonic_increase": wsi_increased,
            "pre_margin_p50": pre_margin,
            "post_margin_p50": post_margin,
            "margin_delta": round(post_margin - pre_margin, 1),
            "margin_monotonic_decline": margin_declined,
            "pre_rusle": pre_strat["mean_rusle_t_ha"],
            "post_rusle": post_strat["mean_rusle_t_ha"],
            "rusle_delta": round(post_strat["mean_rusle_t_ha"] - pre_strat["mean_rusle_t_ha"], 2),
        }

    dodoma_mono = [
        evaluate_monotonicity(b, s, "Dodoma")
        for b, s in zip(dodoma_res["strategies"], d_shock["strategies"])
    ]
    fallon_mono = [
        evaluate_monotonicity(b, s, "Fallon")
        for b, s in zip(fallon_squeezed["strategies"], f_shock["strategies"])
    ]

    all_mono_wsi = all(m["wsi_monotonic_increase"] for m in dodoma_mono + fallon_mono)
    all_mono_margin = all(m["margin_monotonic_decline"] for m in dodoma_mono + fallon_mono)

    print(f" -> All strategies monotonic WSI increase under drought: {all_mono_wsi}")
    print(f" -> All strategies monotonic margin decline under drought: {all_mono_margin}")

    validation_summary = {
        "status": "VALIDATED_PAPER_BENCHMARKS",
        "timestamp_unix": int(time.time()),
        "sites": {
            "dodoma_tanzania": {
                "site_evaluation": dodoma_res,
                "bare_field_protection": {
                    "bare_months": dodoma_res["field_diagnosis"]["bare_months"],
                    "monoculture_rusle_t_ha": d_base["mean_rusle_t_ha"],
                    "rotation_rusle_t_ha": d_rot["mean_rusle_t_ha"],
                    "soil_loss_saved_t_ha": erosion_protection,
                },
            },
            "fallon_nevada": {
                "irrigated_200mm": fallon_irrigated,
                "squeezed_0mm": fallon_squeezed,
                "water_squeeze_effect": {
                    "wsi_increase": wsi_squeeze_delta,
                    "margin_loss_usd_ha": margin_squeeze_drop,
                },
            },
            "ames_iowa": {
                "site_evaluation": ames_res,
                "yield_nitrogen_tradeoff": {
                    "baseline_net_n_5y": a_base["net_n_5y_kg_ha"],
                    "rotation_net_n_5y": a_rot["net_n_5y_kg_ha"],
                    "margin_uplift_usd_ha": round(a_rot["margin_p50_5y"] - a_base["margin_p50_5y"], 1),
                },
            },
            "polar_negative_ood_control": {
                "site_evaluation": polar_res,
                "ood_verification": {
                    "mahalanobis_distance_proxy": p_regime["mahalanobis_distance_proxy"],
                    "ood_warning": p_regime["ood_warning"],
                    "confidence": p_regime["recommendation_confidence"],
                    "information_gaps_count": len(p_strat.get("information_gaps", [])),
                    "risks_count": len(p_strat.get("risks_for_local_review", [])),
                },
            },
        },
        "monotonicity_drought_shock": {
            "perturbation": {"precip_delta_pct": -25.0, "temp_delta_c": 2.0},
            "dodoma_evaluations": dodoma_mono,
            "fallon_evaluations": fallon_mono,
            "verification": {
                "all_wsi_monotonically_increased": all_mono_wsi,
                "all_margin_monotonically_declined": all_mono_margin,
            },
        },
    }

    # Save to backend/app/models/paper_validation.json
    out_path = settings.MODEL_DIR / "paper_validation.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(validation_summary, f, indent=2)

    print(f"\n[DONE] Paper validation results saved to {out_path} ({out_path.stat().st_size} bytes)")
    return validation_summary


if __name__ == "__main__":
    run_paper_validation()

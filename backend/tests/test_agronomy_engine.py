"""
Automated Unit Test Suite for TerraShift+ Agronomy & Optimization Engine.
Uses Python standard library unittest for seamless zero-dependency CI/CD execution.
Tests FAO-56 thermodynamics, GDD accumulation, O(1) state transitions, and edge cases.
"""
from __future__ import annotations
import sys
from pathlib import Path
import unittest

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.agronomy_engine import AgronomyEngine
from app.services.optimizer import RotationOptimizer
from app.services.nasa_power import NASAPowerClient
from app.schemas.agro import SoilProfile, SoilTexture, CropCategory, CropDefinition, ClimateMetrics


class TestTerraShiftAgronomyEngine(unittest.TestCase):

    def test_fao56_evapotranspiration_standard_benchmark(self):
        """
        Validates FAO-56 calculation against standard FAO Penman-Monteith benchmark range.
        Under typical mid-latitude summer conditions (T=20°C, Solar=20 MJ/m2/day, Wind=2m/s, RH=65%),
        ET0 must be approximately 3.5 - 5.5 mm/day.
        """
        et0 = AgronomyEngine.calculate_fao56_reference_et(
            t_mean_c=20.0,
            solar_radiation_mj_m2_day=20.0,
            wind_speed_2m_m_s=2.0,
            relative_humidity_pct=65.0,
            elevation_m=100.0
        )
        self.assertTrue(3.0 <= et0 <= 6.0, f"Expected ET0 in [3.0, 6.0], got {et0}")

    def test_gdd_calculation_sub_zero_frost_edge_case(self):
        """
        Ensures that freezing or sub-base temperatures do not accumulate negative GDD units.
        """
        gdd_freezing = AgronomyEngine.calculate_gdd(t_max_c=-2.0, t_min_c=-10.0, base_temp_c=10.0)
        self.assertEqual(gdd_freezing, 0.0)

        gdd_warm = AgronomyEngine.calculate_gdd(t_max_c=28.0, t_min_c=16.0, base_temp_c=10.0)
        self.assertEqual(gdd_warm, 12.0)  # (28+16)/2 - 10 = 12

    def test_rotation_optimizer_rejects_harmful_monoculture(self):
        """
        Validates that high-depletion crops cannot directly follow themselves in the rotation sequence.
        """
        corn = next(c for c in RotationOptimizer.DEFAULT_CATALOG if c.id == "corn")
        is_valid = RotationOptimizer._is_valid_transition(corn, corn)
        self.assertFalse(is_valid, "Monoculture of corn should be rejected")

    def test_pareto_optimizer_outputs_three_distinct_archetypes(self):
        """
        Ensures optimizer produces the 3 expected Pareto archetypes:
        Resilience, Yield, and Climate-Adapted.
        """
        climate = NASAPowerClient._generate_deterministic_fallback_profile(41.8781, -93.0977, "Test")
        soil = SoilProfile(
            texture=SoilTexture.LOAM,
            ph=6.8,
            organic_matter_pct=3.5,
            depth_cm=100.0,
            current_nitrogen_kg_ha=50.0,
            water_holding_capacity_mm=150.0
        )

        plans = RotationOptimizer.optimize_5year_rotation(climate, soil)
        self.assertEqual(len(plans), 3)

        archetype_names = [p.archetype for p in plans]
        self.assertTrue(any("Resilience" in a for a in archetype_names))
        self.assertTrue(any("Yield" in a for a in archetype_names))
        self.assertTrue(any("Climate-Stress" in a for a in archetype_names))

        for p in plans:
            self.assertEqual(len(p.rotation_sequence), 5)
            self.assertGreater(p.total_margin_usd, 0)
            # Verify that each plan has distinct crops (no single-crop loops)
            unique_crop_ids = set(r.crop.id for r in p.rotation_sequence)
            self.assertGreaterEqual(len(unique_crop_ids), 3, "Plans must exhibit multi-crop biological diversity")

    def test_rusle_erosion_calculation(self):
        """
        Validates RUSLE erosion physics: higher slope and poor canopy must yield higher hazard score.
        """
        climate = NASAPowerClient._generate_deterministic_fallback_profile(41.8781, -93.0977, "Test")
        soil_flat = SoilProfile(texture=SoilTexture.LOAM, ph=6.8, organic_matter_pct=3.5, depth_cm=100.0, current_nitrogen_kg_ha=50.0, water_holding_capacity_mm=150.0, slope_pct=1.0)
        soil_steep = SoilProfile(texture=SoilTexture.LOAM, ph=6.8, organic_matter_pct=3.5, depth_cm=100.0, current_nitrogen_kg_ha=50.0, water_holding_capacity_mm=150.0, slope_pct=12.0)

        clover = next(c for c in RotationOptimizer.DEFAULT_CATALOG if c.id == "clover_cover")
        corn = next(c for c in RotationOptimizer.DEFAULT_CATALOG if c.id == "corn")

        flat_loss = AgronomyEngine.calculate_rusle_erosion_risk(clover, soil_flat, climate)
        steep_loss = AgronomyEngine.calculate_rusle_erosion_risk(corn, soil_steep, climate)

        self.assertGreater(steep_loss, flat_loss, "Steep corn slope must suffer higher erosion than flat clover")


if __name__ == "__main__":
    unittest.main()

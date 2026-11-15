"""
Test suite verifying Next-Gen conversational SI chatbot and scenario anomaly endpoints for TerraShift+.
"""
from __future__ import annotations
import sys
from pathlib import Path
import unittest

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.llmops_guardrail import LLMOpsGuardrail, detect_farmer_language, generate_grounded_stream
from app.services.nasa_power import NASAPowerClient
from app.services.optimizer import RotationOptimizer
from app.schemas.agro import SoilProfile, SoilTexture


class TestTerraShiftNextGen(unittest.TestCase):

    def setUp(self):
        self.climate = NASAPowerClient._generate_deterministic_fallback_profile(41.8781, -93.0977, "Test")
        self.soil = SoilProfile(
            texture=SoilTexture.LOAM,
            ph=6.8,
            organic_matter_pct=3.5,
            depth_cm=100.0,
            current_nitrogen_kg_ha=50.0,
            water_holding_capacity_mm=140.0
        )
        self.plans = RotationOptimizer.optimize_5year_rotation(self.climate, self.soil)

    def test_chatbot_answers_with_verified_citations(self):
        """Validates that conversational queries return structured answers with verified citations."""
        reply = LLMOpsGuardrail.answer_farmer_query(
            query="Why should I plant clover or cover crops in Year 2?",
            active_plan=self.plans[0],
            climate=self.climate,
            soil=self.soil
        )
        self.assertEqual(reply["guardrail_status"], "SI_VERIFIED_GROUNDED")
        self.assertIn("Crimson Clover", reply["answer"])
        self.assertGreater(len(reply["citations"]), 2)
        # Check that NASA sensor datasets are cited
        citations_str = " ".join(reply["citations"])
        self.assertTrue("NASA" in citations_str or "FAO-56" in citations_str)

    def test_chatbot_drought_query_grounding(self):
        """Validates that drought questions cite real rainfall metrics and water stress bounds."""
        reply = LLMOpsGuardrail.answer_farmer_query(
            query="What is the drought risk under water stress conditions?",
            active_plan=self.plans[0],
            climate=self.climate,
            soil=self.soil
        )
        self.assertIn(str(round(self.climate.annual_precip_mm, 1)), reply["answer"])
        self.assertGreater(len(reply["citations"]), 1)

    def test_swahili_prompt_detection(self):
        """Validates that Swahili agricultural queries are identified as 'sw' and return Swahili responses."""
        prompt = "Kwanini shamba langu lina ukame na nipande nini?"
        lang = detect_farmer_language(prompt)
        self.assertEqual(lang, "sw")

        # Test generate_grounded_stream output
        climate_ctx = {"annual_precip_mm": 520.0, "annual_et0_mm": 1450.0, "spei_latest": -1.2, "gwet_root_z": -0.8}
        opt_ctx = {
            "strategies": [
                {"archetype": "Status Quo Baseline", "sequence_names": ["Mahindi"], "mean_wsi": 0.42, "margin_p50_5y": 350.0},
                {"archetype": "Resilience-First", "sequence_names": ["Mtama", "Kunde"], "mean_wsi": 0.18, "margin_p50_5y": 580.0, "net_n_5y_kg_ha": 45.0, "net_soc_5y_t_ha": 0.85, "mean_rusle_t_ha": 2.1}
            ]
        }
        events = list(generate_grounded_stream(prompt, climate_ctx, opt_ctx, language="auto"))
        meta_event = next((e for e in events if e.get("event") == "meta"), None)
        self.assertIsNotNone(meta_event)
        self.assertEqual(meta_event.get("detected_language"), "sw")

        tokens = "".join(e.get("text", "") for e in events if e.get("event") == "token")
        self.assertTrue(any(word in tokens.lower() for word in ["shamba", "udongo", "mvua", "ukame", "msongo"]))

        citations_event = next((e for e in events if e.get("event") == "citations"), None)
        self.assertIsNotNone(citations_event)
        self.assertTrue(any("NASA POWER" in c for c in citations_event.get("citations", [])))
        # Verify Swahili localized quick actions
        actions = citations_event.get("actions", [])
        self.assertTrue(any(a.get("action") == "water_stress" for a in actions))
        self.assertTrue(any("Msongo wa Maji" in a.get("label", "") for a in actions))

    def test_code_switched_prompt_detection(self):
        """Validates that mixed Swahili-English code-switching is accurately classified as 'sw'."""
        prompt = "Niambie water stress ya maize hapa Dodoma"
        lang = detect_farmer_language(prompt)
        self.assertEqual(lang, "sw")

    def test_english_prompt_detection(self):
        """Validates that English agronomic queries are classified as 'en'."""
        prompt = "Compare erosion risk for my strategies"
        lang = detect_farmer_language(prompt)
        self.assertEqual(lang, "en")

        climate_ctx = {"annual_precip_mm": 600.0, "annual_et0_mm": 1300.0, "spei_latest": 0.1, "gwet_root_z": 0.2}
        opt_ctx = {
            "strategies": [
                {"archetype": "Status Quo Baseline", "sequence_names": ["Corn"], "mean_wsi": 0.35, "margin_p50_5y": 400.0},
                {"archetype": "Optimal", "sequence_names": ["Soybean", "Wheat"], "mean_wsi": 0.20, "margin_p50_5y": 620.0, "net_n_5y_kg_ha": 30.0, "net_soc_5y_t_ha": 0.5, "mean_rusle_t_ha": 3.0}
            ]
        }
        events = list(generate_grounded_stream(prompt, climate_ctx, opt_ctx, language="en"))
        meta_event = next((e for e in events if e.get("event") == "meta"), None)
        self.assertIsNotNone(meta_event)
        self.assertEqual(meta_event.get("detected_language"), "en")

        citations_event = next((e for e in events if e.get("event") == "citations"), None)
        self.assertIsNotNone(citations_event)
        actions = citations_event.get("actions", [])
        self.assertTrue(any("Water Stress" in a.get("label", "") for a in actions))


if __name__ == "__main__":
    unittest.main()

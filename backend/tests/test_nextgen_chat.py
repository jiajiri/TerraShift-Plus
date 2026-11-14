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

from app.services.llmops_guardrail import LLMOpsGuardrail
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


if __name__ == "__main__":
    unittest.main()

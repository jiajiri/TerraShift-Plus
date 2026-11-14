import unittest
from backend.app.services.terrashift_guardrails import is_terrashift_domain_inquiry
from backend.app.knowledge.db import init_db, search_terrashift_corpus
from backend.app.services.terrashift_agent import run_terrashift_agent


class TestTerraShiftAgent(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()

    def test_guardrail_accepts_valid_nasa_and_agro_queries(self):
        valid_queries = [
            "How does SMAP root-zone soil moisture inform maize planting in Dodoma?",
            "What is the FAO-56 Penman-Monteith evapotranspiration demand for sorghum?",
            "How does MODIS NDVI bare field detection trigger cover crop seeding?",
            "Tathmini unyevu wa udongo na mmomonyoko wa shamba la mahindi",
        ]
        for q in valid_queries:
            is_valid, reason, sw_dec, en_dec = is_terrashift_domain_inquiry(q)
            self.assertTrue(is_valid, f"Expected '{q}' to be valid; got reason: {reason}")
            self.assertEqual(sw_dec, "")
            self.assertEqual(en_dec, "")

    def test_guardrail_rejects_non_domain_queries(self):
        invalid_queries = [
            "Write a python script for quicksort algorithm",
            "What is the best recipe for baking chocolate cake?",
            "Who won the premier league match yesterday?",
            "Give me dating advice and horoscope forecast",
        ]
        for q in invalid_queries:
            is_valid, reason, sw_dec, en_dec = is_terrashift_domain_inquiry(q)
            self.assertFalse(is_valid, f"Expected '{q}' to be rejected")
            self.assertIn("OUT_OF_SCOPE", reason)
            self.assertIn("OUT OF TERRASHIFT SCOPE", sw_dec)
            self.assertIn("NON-TERRASHIFT INQUIRY", en_dec)

    def test_fts5_knowledge_base_search(self):
        results = search_terrashift_corpus("smap moisture", limit=3)
        self.assertGreaterEqual(len(results), 1)
        self.assertTrue(any("SMAP" in r["title"] or "SMAP" in r["content"] for r in results))

        results_fao = search_terrashift_corpus("penman monteith", limit=3)
        self.assertGreaterEqual(len(results_fao), 1)
        self.assertTrue(any("FAO-56" in r["title"] or "Penman" in r["content"] for r in results_fao))

    def test_terrashift_agent_end_to_end_in_domain(self):
        telemetry = {
            "latitude": -6.163,
            "longitude": 35.7516,
            "annual_precipitation_mm": 540.0,
            "fao56_reference_et_mm_day": 4.5,
            "gwet_root_z": -1.2,
            "slope_pct": 3.0,
            "baseline_crop": "maize"
        }
        resp = run_terrashift_agent(
            user_query="Jinsi gani satelaiti za NASA na mzunguko wa mazao unasaidia kukabiliana na ukame?",
            telemetry=telemetry
        )
        self.assertEqual(resp.get("status"), "success")
        self.assertIn("structured_data", resp)
        self.assertIn("recommendation", resp["structured_data"])
        self.assertIn("verified_citations", resp["structured_data"])
        self.assertTrue(len(resp.get("advisory_swahili", "")) > 40)
        self.assertTrue(len(resp.get("advisory_english", "")) > 40)
        self.assertGreaterEqual(len(resp.get("retrieved_citations", [])), 1)

    def test_terrashift_agent_rejection(self):
        resp = run_terrashift_agent(user_query="Can you help me write a react component for a todo app?")
        self.assertEqual(resp.get("status"), "declined")
        self.assertEqual(resp.get("jurisdiction"), "OUT_OF_TERRASHIFT_SCOPE")
        self.assertIn("NON-TERRASHIFT INQUIRY", resp.get("advisory_english", ""))
        self.assertIn("OUT OF TERRASHIFT SCOPE", resp.get("advisory_swahili", ""))


if __name__ == "__main__":
    unittest.main()

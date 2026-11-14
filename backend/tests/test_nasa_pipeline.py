"""
Unit tests for TerraShift+ Multi-Source NASA Earth Observation Data Pipeline.
Validates HTTP 200 resource audits, NASA Earthdata CMR queries, and fail-safe handling.
"""
from __future__ import annotations
import sys
from pathlib import Path
import unittest

backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.services.nasa_pipeline import NASAPipelineEngine, OFFICIAL_CHALLENGE_RESOURCES


class TestNASAPipelineEngine(unittest.TestCase):

    def test_challenge_resources_catalog_completeness(self):
        """Validates that all major NASA and partner challenge resources are registered."""
        resource_ids = {r.id for r in OFFICIAL_CHALLENGE_RESOURCES}
        expected_keys = {
            "smap", "gpm_imerg", "landsat", "modis_viirs",
            "nasa_power", "srtm", "ecostress", "usda_ag_data",
            "web_soil_survey", "cropland_cdl", "prism_climate",
            "fao_gaez", "openet", "copernicus_s2", "era5_ecmwf", "gedi_biomass"
        }
        for key in expected_keys:
            self.assertIn(key, resource_ids, f"Missing challenge resource: {key}")

    def test_single_resource_ping_structure(self):
        """Tests that pinging an individual resource yields a 200 OK schema structure."""
        smap_res = next(r for r in OFFICIAL_CHALLENGE_RESOURCES if r.id == "smap")
        audit_result = NASAPipelineEngine.ping_resource(smap_res)

        self.assertIn("status_code", audit_result)
        self.assertIn("latency_ms", audit_result)
        self.assertIn("healthy", audit_result)
        self.assertEqual(audit_result["status_code"], 200)
        self.assertTrue(audit_result["healthy"])

    def test_audit_all_resources_execution(self):
        """Verifies that full catalog audit returns healthy status across all resources."""
        audit = NASAPipelineEngine.audit_all_resources()

        self.assertGreaterEqual(audit["total_resources"], 16)
        self.assertEqual(audit["healthy_count"], audit["total_resources"])
        self.assertEqual(audit["overall_status"], "ALL_SYSTEMS_OPERATIONAL")
        self.assertGreater(audit["average_latency_ms"], 0)

    def test_cmr_query_metadata_extraction(self):
        """Verifies that NASA Earthdata CMR queries return structured collection metadata."""
        cmr_result = NASAPipelineEngine.query_cmr_collections(keyword="SMAP", limit=2)

        self.assertEqual(cmr_result["status_code"], 200)
        self.assertGreater(cmr_result["collections_count"], 0)
        first_col = cmr_result["collections"][0]
        self.assertIn("id", first_col)
        self.assertIn("title", first_col)
        self.assertTrue("SMAP" in first_col["title"] or "Soil Moisture" in first_col["title"])


if __name__ == "__main__":
    unittest.main()

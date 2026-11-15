"""
Tests for Agentic MCP Tools and Field Advisor multi-step tool calls.
"""
import unittest
import json
import asyncio
from app.services.mcp_tools import list_mcp_tools, execute_mcp_tool
from app.services.llmops_guardrail import generate_grounded_stream

class TestMCPTools(unittest.TestCase):
    def test_list_mcp_tools(self):
        tools = list_mcp_tools()
        self.assertIsInstance(tools, list)
        self.assertEqual(len(tools), 5)
        names = [t["name"] for t in tools]
        self.assertIn("nasa_power_agroclimatology", names)
        self.assertIn("nasa_cmr_and_worldview_lookup", names)
        self.assertIn("subfield_dem_vulnerability_grid", names)
        self.assertIn("soil_and_crop_profile", names)
        self.assertIn("search_nasa_earthdata_knowledge", names)

    def test_execute_nasa_power_agroclimatology(self):
        res = execute_mcp_tool("nasa_power_agroclimatology", {"lat": -6.163, "lon": 35.7516})
        self.assertEqual(res["status"], "verified")
        self.assertIn("annual_precipitation_mm", res)
        self.assertIn("annual_et0_mm", res)
        self.assertIn("verified_links", res)
        self.assertTrue(any("power.larc.nasa.gov" in link["url"] for link in res["verified_links"]))

    def test_execute_nasa_cmr_and_worldview_lookup(self):
        res = execute_mcp_tool("nasa_cmr_and_worldview_lookup", {"lat": 43.3458, "lon": 13.1416, "layer": "SMAP_L4_SM_gph"})
        self.assertEqual(res["status"], "verified")
        self.assertIn("worldview_url", res)
        self.assertIn("verified_links", res)

    def test_execute_subfield_dem_vulnerability_grid(self):
        res = execute_mcp_tool("subfield_dem_vulnerability_grid", {"lat": -6.163, "lon": 35.7516})
        self.assertEqual(res["status"], "verified")
        self.assertEqual(len(res["cells"]), 9)
        self.assertIn("elevation_min_m", res)
        self.assertIn("elevation_max_m", res)
        self.assertIn("peak_hotspot_cell", res)

    def test_execute_soil_and_crop_profile(self):
        res = execute_mcp_tool("soil_and_crop_profile", {"lat": -6.163, "lon": 35.7516})
        self.assertEqual(res["status"], "verified")
        self.assertIn("soil_profile", res)
        self.assertIn("rusle_factors", res)

    def test_execute_search_nasa_earthdata_knowledge(self):
        res = execute_mcp_tool("search_nasa_earthdata_knowledge", {"query": "SMAP soil moisture drought"})
        self.assertEqual(res["status"], "verified")
        self.assertIn("results", res)
        self.assertTrue(len(res["results"]) > 0)

    def test_generate_grounded_stream_with_action_type(self):
        events = []
        for chunk in generate_grounded_stream(
            question="Show Water Stress Hotspots",
            climate_ctx={"annual_precipitation_mm": 800, "annual_et0_mm": 2100},
            opt_ctx={"strategies": [{"archetype": "Conservation", "crops": ["Pigeonpea"], "mean_wsi": 0.22, "margin_p50_5y": 2400}]},
            language="en",
            action_type="water_stress",
            coordinates={"lat": -6.163, "lon": 35.7516}
        ):
            events.append(chunk)

        event_types = [e.get("event") for e in events]
        self.assertIn("meta", event_types)
        self.assertIn("tool_call", event_types)
        self.assertIn("tool_result", event_types)
        self.assertIn("visual_card", event_types)
        self.assertIn("verified_links", event_types)
        self.assertIn("token", event_types)
        self.assertIn("citations", event_types)

if __name__ == "__main__":
    unittest.main()

"""
Integration test for real-time SSE streaming and grounded copilot stream.
Tests POST /api/v1/optimize/stream and POST /api/v1/chat/stream using standard library HTTP client.
"""
from __future__ import annotations
import json
import sys
import unittest
import threading
import time
import urllib.request
import urllib.parse
from http.server import HTTPServer
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))

from app.main import TerraShiftAPIHandler


class TestRealStreamingPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Start background standard library server on port 8923
        cls.port = 8923
        cls.server = HTTPServer(("127.0.0.1", cls.port), TerraShiftAPIHandler)
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        time.sleep(0.1)

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def _post_sse(self, path: str, payload: dict):
        url = f"http://127.0.0.1:{self.port}{path}"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        events = []
        with urllib.request.urlopen(req, timeout=15) as resp:
            self.assertEqual(resp.status, 200)
            current_event = None
            for line in resp:
                line_str = line.decode("utf-8").strip()
                if line_str.startswith("event:"):
                    current_event = line_str.split(":", 1)[1].strip()
                elif line_str.startswith("data:") and current_event:
                    data_str = line_str.split(":", 1)[1].strip()
                    events.append((current_event, json.loads(data_str)))
                    if current_event == "done":
                        break
                    current_event = None
        return events

    def test_01_live_crops_endpoint(self):
        url = f"http://127.0.0.1:{self.port}/api/v1/crops"
        with urllib.request.urlopen(url, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            crops = json.loads(resp.read().decode("utf-8"))
            self.assertGreaterEqual(len(crops), 6)

    def test_02_real_sse_stream_dodoma_farm(self):
        payload = {
            "latitude": -6.1630,
            "longitude": 35.7516,
            "precip_delta_pct": 0.0,
            "temp_delta_c": 0.0,
            "constraints": {"baseline_crop_id": "corn"},
        }
        events = self._post_sse("/api/v1/optimize/stream", payload)
        names = [e[0] for e in events]

        self.assertIn("init", names)
        self.assertIn("step", names)
        self.assertIn("optimization", names)
        self.assertIn("done", names)

        step_stages = {e[1]["stage"]: e[1] for e in events if e[0] == "step"}
        self.assertIn("climate", step_stages)
        self.assertGreater(step_stages["climate"]["data"]["annual_precipitation_mm"], 0)

        opt = next(e[1]["result"] for e in events if e[0] == "optimization")
        strategies = opt["strategies"]
        self.assertEqual(len(strategies), 4)

        for s in strategies:
            self.assertLessEqual(s["margin_p10_5y"], s["margin_p50_5y"])
            self.assertLessEqual(s["margin_p50_5y"], s["margin_p90_5y"])

        # Test streaming grounded chat using real computed output
        chat_events = self._post_sse("/api/v1/chat/stream", {
            "question": "How does water stress affect my rotation?",
            "climate_context": step_stages["climate"]["data"],
            "optimization_context": opt,
        })
        chat_text = "".join(e[1].get("text", "") for e in chat_events if e[0] == "token")
        self.assertIn("NASA POWER", chat_text)

    def test_03_drought_shock_monotonicity(self):
        base = self._post_sse("/api/v1/optimize/stream", {"latitude": -6.1630, "longitude": 35.7516, "precip_delta_pct": 0.0})
        dry = self._post_sse("/api/v1/optimize/stream", {"latitude": -6.1630, "longitude": 35.7516, "precip_delta_pct": -25.0})

        base_wsi = next(e[1]["result"] for e in base if e[0] == "optimization")["strategies"][0]["mean_wsi"]
        dry_wsi = next(e[1]["result"] for e in dry if e[0] == "optimization")["strategies"][0]["mean_wsi"]
        self.assertGreaterEqual(dry_wsi, base_wsi)


if __name__ == "__main__":
    unittest.main(verbosity=2)

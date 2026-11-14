"""
Production HTTP Server for TerraShift Next-Gen.
Provides high-performance REST endpoints for:
- /api/v1/climate (NASA POWER Daily Agroclimatology)
- /api/v1/optimize (Pareto Multi-Objective Solver with scenario sliders)
- /api/v1/chat (Audited Scientific Intelligence Conversational Copilot)
- / (Interactive Earth Observation Studio UI)
"""
from __future__ import annotations
import json
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any

from .core.config import settings
from .schemas.agro import SoilProfile, SoilTexture, ClimateMetrics
from .services.nasa_power import NASAPowerClient
from .services.optimizer import RotationOptimizer
from .services.llmops_guardrail import LLMOpsGuardrail


class TerraShiftAPIHandler(BaseHTTPRequestHandler):
    """Clean HTTP request handler implementing the TerraShift REST API."""

    def _set_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        # CORS Headers
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS pre-flight."""
        self._set_headers(204)

    def do_GET(self):
        """Handle GET requests."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/" or path == "/index.html":
            index_path = settings.CACHE_DIR.parent.parent / "frontend" / "public" / "index.html"
            if index_path.exists():
                self._set_headers(200, "text/html; charset=utf-8")
                with open(index_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            else:
                self._set_headers(200)
                payload = {
                    "status": "healthy",
                    "service": settings.PROJECT_NAME,
                    "version": settings.VERSION,
                    "engine": "Deterministic FAO-56 & NASA POWER v2.0"
                }
                self.wfile.write(json.dumps(payload).encode("utf-8"))
                return

        elif path == "/health":
            self._set_headers(200)
            payload = {
                "status": "healthy",
                "service": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "engine": "Deterministic FAO-56 & NASA POWER v2.0"
            }
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        elif path == "/api/v1/climate":
            lat = float(query.get("lat", [41.8781])[0])
            lon = float(query.get("lon", [-93.0977])[0])

            try:
                climate = NASAPowerClient.fetch_climate_profile(latitude=lat, longitude=lon)
                self._set_headers(200)
                self.wfile.write(json.dumps(climate.to_dict()).encode("utf-8"))
            except Exception as e:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/v1/crops":
            self._set_headers(200)
            crops_data = [c.to_dict() for c in RotationOptimizer.DEFAULT_CATALOG]
            self.wfile.write(json.dumps(crops_data).encode("utf-8"))
            return

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        """Handle POST requests."""
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            req_data = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except json.JSONDecodeError:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "Malformed JSON body"}).encode("utf-8"))
            return

        # -------------------------------------------------------------
        # Endpoint: /api/v1/optimize (Pareto Multi-Objective Solver)
        # -------------------------------------------------------------
        if path == "/api/v1/optimize":
            lat = float(req_data.get("latitude", 41.8781))
            lon = float(req_data.get("longitude", -93.0977))
            soil_raw = req_data.get("soil", {})

            # Scenario adjustments
            precip_delta_pct = float(req_data.get("precip_delta_pct", 0.0))  # e.g. -20%
            temp_delta_c = float(req_data.get("temp_delta_c", 0.0))          # e.g. +1.5 C

            # Parse Soil
            texture_str = soil_raw.get("texture", "loam").lower()
            try:
                texture = SoilTexture(texture_str)
            except ValueError:
                texture = SoilTexture.LOAM

            soil = SoilProfile(
                texture=texture,
                ph=float(soil_raw.get("ph", 6.8)),
                organic_matter_pct=float(soil_raw.get("organic_matter_pct", 3.2)),
                depth_cm=float(soil_raw.get("depth_cm", 90.0)),
                current_nitrogen_kg_ha=float(soil_raw.get("current_nitrogen_kg_ha", 45.0)),
                water_holding_capacity_mm=float(soil_raw.get("water_holding_capacity_mm", 140.0))
            )

            # Retrieve Baseline Climate
            base_climate = NASAPowerClient.fetch_climate_profile(latitude=lat, longitude=lon)

            # Apply Scenario Anomaly Adjustments if requested
            adjusted_precip = max(base_climate.annual_precip_mm * (1.0 + precip_delta_pct / 100.0), 50.0)
            adjusted_mean_temp = base_climate.mean_temp_c + temp_delta_c
            adjusted_gdd = max(base_climate.annual_gdd + (temp_delta_c * 180.0), 400.0)

            climate = ClimateMetrics(
                latitude=base_climate.latitude,
                longitude=base_climate.longitude,
                elevation_m=base_climate.elevation_m,
                annual_precip_mm=round(adjusted_precip, 1),
                mean_temp_c=round(adjusted_mean_temp, 1),
                max_temp_c=round(base_climate.max_temp_c + temp_delta_c, 1),
                min_temp_c=round(base_climate.min_temp_c + temp_delta_c, 1),
                mean_daily_solar_radiation_mj_m2=base_climate.mean_daily_solar_radiation_mj_m2,
                frost_free_days=min(max(base_climate.frost_free_days + int(temp_delta_c * 12), 60), 365),
                annual_gdd=round(adjusted_gdd, 1),
                drought_risk_index=min(base_climate.drought_risk_index * (1.0 + max(-precip_delta_pct, 0.0) / 100.0), 1.0),
                provenance_sources=list(base_climate.provenance_sources)
            )
            if precip_delta_pct != 0.0 or temp_delta_c != 0.0:
                climate.provenance_sources.append(
                    f"Scenario Anomaly Applied: Precip Δ={precip_delta_pct:+.1f}%, Temp Δ={temp_delta_c:+.1f}°C"
                )

            # Execute Optimization
            plans = RotationOptimizer.optimize_5year_rotation(climate=climate, soil=soil)

            # Generate LLMOps Audited Rationales
            rationales = {
                plan.plan_id: LLMOpsGuardrail.generate_grounded_rationale(plan, climate, soil)
                for plan in plans
            }

            # Generate Conventional / Status Quo Monoculture Plan for Comparison
            corn_crop = next(c for c in RotationOptimizer.DEFAULT_CATALOG if c.id == "corn")
            conventional_results = []
            conv_margin = 0.0
            conv_n_delta = 0.0
            conv_stress = 0.0
            prev_c = None
            for yr in range(1, 6):
                y_pct, n_d, st = RotationOptimizer.DEFAULT_CATALOG[0].__class__, 0, 0
                from .services.agronomy_engine import AgronomyEngine
                y_pct, n_d, st = AgronomyEngine.evaluate_crop_yield_and_stress(corn_crop, climate, soil, prev_c)
                margin = corn_crop.economic_margin_per_ha * (y_pct / 100.0)
                conv_margin += margin
                conv_n_delta += n_d
                conv_stress += st
                conventional_results.append({
                    "year": yr,
                    "crop": corn_crop.to_dict(),
                    "projected_yield_pct": round(y_pct, 1),
                    "soil_nitrogen_delta_kg": round(n_d, 1),
                    "water_stress_index": round(st, 2),
                    "margin_usd": round(margin, 2)
                })
                prev_c = corn_crop

            status_quo_plan = {
                "plan_id": "plan-status-quo",
                "archetype": "Status Quo (Continuous Monoculture)",
                "description": "Continuous single-crop farming without regenerative rotation. Vulnerable to soil depletion and pest build-up.",
                "rotation_sequence": conventional_results,
                "total_margin_usd": round(conv_margin, 2),
                "net_nitrogen_balance_kg": round(conv_n_delta, 2),
                "mean_resilience_score": 28.5,
                "drought_vulnerability_score": round((conv_stress / 5.0) * 100.0, 1)
            }

            response_payload = {
                "latitude": lat,
                "longitude": lon,
                "climate_summary": climate.to_dict(),
                "soil_profile": soil.to_dict(),
                "status_quo_plan": status_quo_plan,
                "pareto_plans": [p.to_dict() for p in plans],
                "grounded_rationales": rationales
            }

            self._set_headers(200)
            self.wfile.write(json.dumps(response_payload).encode("utf-8"))
            return

        # -------------------------------------------------------------
        # Endpoint: /api/v1/chat (Audited SI Agronomic Conversationalist)
        # -------------------------------------------------------------
        elif path == "/api/v1/chat":
            user_message = req_data.get("message", "").strip()
            if not user_message:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Empty message"}).encode("utf-8"))
                return

            lat = float(req_data.get("latitude", 41.8781))
            lon = float(req_data.get("longitude", -93.0977))
            plan_id = req_data.get("plan_id", "plan-resilience")
            soil_raw = req_data.get("soil", {})

            soil = SoilProfile(
                texture=SoilTexture.LOAM,
                ph=float(soil_raw.get("ph", 6.8)),
                organic_matter_pct=float(soil_raw.get("organic_matter_pct", 3.2)),
                depth_cm=100.0,
                current_nitrogen_kg_ha=50.0,
                water_holding_capacity_mm=140.0
            )

            climate = NASAPowerClient.fetch_climate_profile(latitude=lat, longitude=lon)
            plans = RotationOptimizer.optimize_5year_rotation(climate=climate, soil=soil)

            # Pick active plan matching plan_id
            active_plan = next((p for p in plans if p.plan_id == plan_id), plans[0])

            chat_reply = LLMOpsGuardrail.answer_farmer_query(
                query=user_message,
                active_plan=active_plan,
                climate=climate,
                soil=soil
            )

            self._set_headers(200)
            self.wfile.write(json.dumps(chat_reply).encode("utf-8"))
            return

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))


def run_server(port: int = 8000, host: str = "0.0.0.0"):
    """Starts the HTTP server."""
    server_address = (host, port)
    httpd = HTTPServer(server_address, TerraShiftAPIHandler)
    print(f"TerraShift Next-Gen Agro-Engine active at http://{host}:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()


if __name__ == "__main__":
    run_server(port=settings.PORT, host=settings.HOST)

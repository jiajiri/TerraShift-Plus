"""
Master TerraShift AI Agent (TerraShiftAgent).
An autonomous Earth Observation and Precision Agronomy Intelligence System.
Orchestrates:
1. NASA & Agronomic Domain Guardrail verification.
2. Ranked SQLite FTS5 NASA Earth Science & Agronomy Knowledge retrieval.
3. Live NASA Earth observation (POWER, SMAP, ECOSTRESS, GPM, MODIS, GEDI) telemetry binding.
4. Google Gemini LLM reasoning (with automatic model negotiation and deterministic PIML fallback).
5. Dual Output Contract (Strict JSON block + Bilingual Swahili/English advisory).
"""
from __future__ import annotations
import json
import logging
from typing import Dict, Any, List, Optional
from .terrashift_guardrails import is_terrashift_domain_inquiry
from .gemini_reasoning import query_terrashift_gemini_llm
from ..knowledge.db import search_terrashift_corpus

logger = logging.getLogger("uvicorn")

TERRASHIFT_AGENT_SYSTEM_PROMPT = """
You are "TerraShiftAgent" (Senior Earth Observation Specialist, Satellite Agro-Climatologist & Precision Agronomist for Terrashift+), an autonomous intelligence system specialized in fusing NASA Earth Science satellite missions with field-scale agronomy and crop rotation optimization.

STRICT MANDATORY DIRECTIVES:
1. JURISDICTION & SCOPE: You MUST ONLY address matters concerning NASA Earth observations, satellite telemetry (POWER, SMAP, ECOSTRESS, GPM, MODIS, GEDI, GRACE-FO), soil hydrology, crop phenology, rotational economics, and erosion dynamics.
2. ABSOLUTE SCIENTIFIC GROUNDING: Cite verified data sources, formulas, and DOIs:
   - NASA POWER MERRA-2 Agroclimatology (Solar, T2M, ET0)
   - NASA SMAP L4 Root-Zone Moisture (SPL4SMGP)
   - NASA ECOSTRESS Land Surface Temperature & Evaporative Stress Index
   - NASA GPM IMERG Precipitation Rates
   - NASA MODIS MOD13Q1 250m NDVI / Bare-Field Windows (<0.25)
   - FAO-56 Penman-Monteith Evapotranspiration
   - Saxton-Rawls Soil Pedotransfer Hydrology
   - USDA-NRCS RUSLE Topsoil Erosion Physics
3. ZERO EMOJIS: Never output emojis or conversational filler in any part of your response. Maintain an authoritative, professional scientist and agronomist tone at all times.
4. STRICT DUAL-SECTION FORMAT:
   You MUST return your response structured into exactly two sections:

   SECTION 1: A valid JSON code block enclosed in ```json ... ``` with keys:
   {
     "intent": "NASA_TELEMETRY_AUDIT | ROTATION_OPTIMIZATION | DROUGHT_MITIGATION | EROSION_CONTROL",
     "nasa_mission_audit": "Detailed multi-mission satellite telemetry audit",
     "recommendation": "OPTIMAL_ROTATION_RECOMMENDED | CAUTION_WATER_DEFICIT | COVER_CROPS_MANDATORY",
     "telemetry_findings": "Summary of live precipitation, ET0 demand, soil wetness Z-score, and DEM slope",
     "risk_flags": ["Specific risk 1", "Specific risk 2"],
     "rotational_actions": ["Action 1", "Action 2", "Action 3"],
     "verified_citations": ["Citation 1 with link/DOI", "Citation 2"]
   }

   SECTION 2: Formal Bilingual Earth Observation & Agronomic Advisory:
   ### USHAURI WA KISAYANSI WA TERRASHIFT (SWAHILI)
   ... (Rigorous, professional Swahili advisory detailing satellite findings, crop water balance, and soil management for the farmer)
   ### TERRASHIFT EARTH OBSERVATION & PRECISION AGRO ADVISORY (ENGLISH)
   ... (Comprehensive English technical advisory detailing satellite telemetry, physical formulas, and rotational strategy)
"""


def run_terrashift_agent(
    user_query: str,
    telemetry: Optional[Dict[str, Any]] = None,
    document_context: str = ""
) -> Dict[str, Any]:
    """
    Coordinates the complete TerraShiftAgent intelligence pipeline.
    """
    telemetry = telemetry or {}

    # 1. Domain Guardrail Check
    is_domain, reason, sw_declination, en_declination = is_terrashift_domain_inquiry(user_query, document_context)
    if not is_domain:
        return {
            "status": "declined",
            "jurisdiction": "OUT_OF_TERRASHIFT_SCOPE",
            "reason": reason,
            "structured_data": {
                "intent": "OUT_OF_SCOPE",
                "recommendation": "NON_DOMAIN_INQUIRY",
                "nasa_mission_audit": "N/A",
                "telemetry_findings": "N/A",
                "risk_flags": [],
                "rotational_actions": [],
                "verified_citations": []
            },
            "advisory_swahili": sw_declination,
            "advisory_english": en_declination
        }

    # 2. Ranked FTS5 Knowledge Retrieval
    kb_hits = search_terrashift_corpus(user_query, limit=4)
    kb_summary_lines = []
    for hit in kb_hits:
        kb_summary_lines.append(f"[{hit.get('doc_type')}] {hit.get('title')}: {hit.get('content')}")
    kb_context = "\n".join(kb_summary_lines) if kb_summary_lines else "Default: NASA Earth Science Missions, FAO-56 Penman-Monteith, and RUSLE guidelines."

    # 3. Assemble Live Satellite Telemetry Dictionary
    telemetry_summary = {
        "latitude": telemetry.get("latitude") or telemetry.get("lat"),
        "longitude": telemetry.get("longitude") or telemetry.get("lon"),
        "annual_precip_mm": telemetry.get("annual_precipitation_mm") or telemetry.get("annual_precip_mm", 600.0),
        "fao56_reference_et0_mm_day": telemetry.get("fao56_reference_et_mm_day", 4.2),
        "spei_drought_index": telemetry.get("spei_latest", 0.0),
        "smap_gwet_root_z_score": telemetry.get("gwet_root_z", 0.0),
        "elevation_m": telemetry.get("elevation_m", 500),
        "slope_pct": telemetry.get("slope_pct", 2.0),
        "soil_ph": telemetry.get("ph", 6.5),
        "soil_clay_pct": telemetry.get("clay_pct", 24.0),
        "soil_awc_mm": telemetry.get("awc_mm", 140.0),
        "baseline_crop": telemetry.get("baseline_crop", "maize")
    }
    telemetry_str = json.dumps(telemetry_summary, indent=2)

    # 4. Query Gemini LLM / PIML Engine
    agent_output = query_terrashift_gemini_llm(
        system_prompt=TERRASHIFT_AGENT_SYSTEM_PROMPT,
        user_query=user_query,
        telemetry_context=telemetry_str,
        kb_context=kb_context
    )

    agent_output["retrieved_citations"] = [
        {"title": h.get("title"), "category": h.get("category"), "reference": h.get("reference_id")}
        for h in kb_hits
    ]
    return agent_output

"""
Terrashift+ Knowledge Base: SQLite with FTS5 virtual indexing for NASA Earth Science
Missions, Agroclimatology Benchmarks, FAO-56 Crop Hydrology, and Soil Physics.
"""
from __future__ import annotations
import os
import sqlite3
import logging
from typing import Any, List, Dict
from pathlib import Path

logger = logging.getLogger("uvicorn")

DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "terrashift_kb.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize SQLite schema with FTS5 virtual tables for NASA Earth Science and Agronomy."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. NASA Earth Observation Missions & Instruments Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS nasa_missions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mission_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        agency TEXT NOT NULL,
        instrument_type TEXT NOT NULL,
        spatial_resolution TEXT NOT NULL,
        temporal_frequency TEXT NOT NULL,
        agricultural_application TEXT NOT NULL,
        doi_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Agronomic & Hydrological Benchmarks Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS agro_benchmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        topic TEXT NOT NULL,
        swahili_title TEXT NOT NULL,
        english_title TEXT NOT NULL,
        swahili_summary TEXT NOT NULL,
        english_summary TEXT NOT NULL,
        physics_equation TEXT,
        scientific_citation TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. FTS5 Virtual Table for Fast Earth Science & Agro Retrieval
    cursor.execute("""
    CREATE VIRTUAL TABLE IF NOT EXISTS terrashift_search_idx USING fts5(
        doc_type,          -- 'nasa_mission' or 'agro_benchmark'
        reference_id,      -- mission_id or topic
        title,             -- Mission name or Benchmark title
        category,          -- Satellites, Hydrology, Soil, Rotation, Pests
        content,           -- Full technical description and agronomic guidance
        tokenize = 'unicode61'
    );
    """)

    conn.commit()

    cursor.execute("SELECT count(*) FROM nasa_missions;")
    count = cursor.fetchone()[0]
    if count == 0:
        _seed_terrashift_corpus(conn)

    conn.close()
    logger.info("TerraShiftAgent NASA Earth Science SQLite DB initialized.")


def _seed_terrashift_corpus(conn: sqlite3.Connection) -> None:
    cursor = conn.cursor()

    # Seed NASA Earth Observation Missions
    missions = [
        (
            "smap_l4",
            "NASA Soil Moisture Active Passive (SMAP L4)",
            "NASA JPL / GSFC",
            "L-band Radiometer & GMAO Soil Model Assimilation",
            "9 km EASE-Grid v2",
            "2-3 Days",
            "Measures root-zone (0-100 cm) and surface (0-5 cm) soil moisture wetness anomalies (Z-score) to detect hydrological stress before visual crop wilt.",
            "https://doi.org/10.5067/KGLVZE4GMT46"
        ),
        (
            "ecostress_l2",
            "NASA ECOSTRESS (ISS Instrument)",
            "NASA JPL",
            "Multispectral Thermal Infrared Radiometer",
            "70 m x 70 m field scale",
            "Variable ISS overpass (1-5 days)",
            "Calculates Land Surface Temperature (LST), Evapotranspiration (ET), and Evaporative Stress Index (ESI) to detect plant water stress at field parcel level.",
            "https://doi.org/10.5067/ECOSTRESS/ECO2LSTE.001"
        ),
        (
            "gpm_imerg",
            "Global Precipitation Measurement (GPM IMERG)",
            "NASA / JAXA",
            "Dual-frequency Precipitation Radar & Microwave Radiometer",
            "0.1 deg (~10 km)",
            "Half-hourly / Daily",
            "Quantifies rain accumulation, extreme rainfall erosivity (RUSLE R-factor), and consecutive dry periods for drought forecasting.",
            "https://doi.org/10.5067/GPM/IMERGDF/DAY/06"
        ),
        (
            "modis_mod13q1",
            "NASA EOS Terra/Aqua MODIS (MOD13Q1 / MYD13Q1)",
            "NASA GSFC / LP DAAC",
            "Multispectral Optical Radiometer (250m)",
            "250 m",
            "16-Day Composites",
            "Delivers Normalized Difference Vegetation Index (NDVI) and Enhanced Vegetation Index (EVI). Triggers Bare-Field Vulnerability Alerts when NDVI < 0.25.",
            "https://doi.org/10.5067/MODIS/MOD13Q1.061"
        ),
        (
            "nasa_power_v2",
            "NASA POWER v2.0 Daily Agroclimatology",
            "NASA Langley Research Center",
            "GMAO MERRA-2 and GEOS-5.12.4 Assimilation",
            "0.5 deg x 0.625 deg",
            "Daily continuous (1981-present)",
            "Supplies point solar radiation (ALLSKY_SFC_SW_DWN), 2m temperature (T2M), humidity (RH2M), and wind speed (WS2M) for FAO-56 Penman-Monteith ET0.",
            "https://power.larc.nasa.gov/"
        ),
        (
            "gedi_l4a",
            "NASA Global Ecosystem Dynamics Investigation (GEDI)",
            "NASA GSFC / University of Maryland",
            "High-resolution Spaceborne Lidar",
            "25 m footprint",
            "ISS Orbit",
            "Profiles aboveground biomass density and vertical canopy structure for agroforestry, soil organic carbon (SOC) accounting, and carbon sequestration credits.",
            "https://doi.org/10.5067/GEDI/GEDI04_A.002"
        ),
        (
            "grace_fo",
            "NASA Gravity Recovery and Climate Experiment Follow-On (GRACE-FO)",
            "NASA JPL / GFZ Potsdam",
            "K-band Microwave & Laser Ranging Interferometry",
            "300 km equivalent",
            "Monthly",
            "Monitors regional changes in Terrestrial Water Storage (TWS) and deep aquifer recharge trends to inform sustainable irrigation extraction bounds.",
            "https://gracefo.jpl.nasa.gov/"
        )
    ]

    for m in missions:
        cursor.execute("""
        INSERT INTO nasa_missions (mission_id, name, agency, instrument_type, spatial_resolution,
            temporal_frequency, agricultural_application, doi_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, m)

        desc = (
            f"NASA Mission {m[1]} ({m[0]}), Agency {m[2]}. Resolution: {m[4]}, Frequency: {m[5]}. "
            f"Sensor: {m[3]}. Agricultural Application: {m[6]} DOI/URL: {m[7]}"
        )
        cursor.execute("""
        INSERT INTO terrashift_search_idx (doc_type, reference_id, title, category, content)
        VALUES ('nasa_mission', ?, ?, 'NASA Satellite Telemetry', ?);
        """, (m[0], m[1], desc))

    # Seed Agronomic & Hydrological Benchmarks
    benchmarks = [
        (
            "Hydrology",
            "FAO-56 Penman-Monteith Evapotranspiration",
            "Uvukizi wa Maji Kulingana na FAO-56 Penman-Monteith",
            "FAO-56 Penman-Monteith Reference Evapotranspiration",
            "FAO-56 inakokotoa uvukizi halisi wa maji (ET0) kwa kutumia mionzi ya jua ya NASA POWER, joto, unyevu wa hewa na kasi ya upepo. Hii inalinganishwa na mgawo wa zao (Kc) ili kujua mahitaji halisi ya maji shambani.",
            "FAO-56 Penman-Monteith calculates reference evapotranspiration (ET0) using NASA POWER solar radiation, air temperature, vapor pressure deficit, and wind speed. Crop water demand equals ET0 multiplied by phenological crop coefficient Kc.",
            "ET0 = [0.408 * Delta * (Rn - G) + gamma * (900 / (T + 273)) * u2 * (es - ea)] / [Delta + gamma * (1 + 0.34 * u2)]",
            "FAO Irrigation and Drainage Paper No. 56 (Allen et al., 1998)"
        ),
        (
            "Soil Physics",
            "Saxton-Rawls Available Water Capacity (AWC)",
            "Uwezo wa Udongo Kuhifadhi Maji (AWC) - Saxton-Rawls",
            "Saxton-Rawls Pedotransfer Soil Water Retention",
            "Mfumo wa Saxton-Rawls unatumia asilimia ya mchanga (sand), mfinyanzi (clay), na rutuba ya viumbe hai (organic matter) ili kukokotoa kiasi cha maji kinachoweza kushikiliwa na ardhi kati ya unyevu wa shambani (Field Capacity) na kiwango cha kukauka mazao (Wilting Point).",
            "Saxton-Rawls pedotransfer equations estimate volumetric Field Capacity (theta_33) and Permanent Wilting Point (theta_1500) from soil texture and organic matter, establishing Available Water Capacity (AWC mm) across the effective root zone.",
            "AWC = (theta_fc - theta_wp) * root_depth_mm",
            "Saxton & Rawls (2006), Soil Science Society of America Journal 70(5):1569-1578"
        ),
        (
            "Erosion Dynamics",
            "Revised Universal Soil Loss Equation (RUSLE)",
            "Kiwango cha Upotevu wa Udongo Chini ya RUSLE",
            "RUSLE Topsoil Erosion Abatement",
            "Mmomonyoko wa udongo unategemea nguvu ya mvua (R), ulaini wa udongo (K), urefu na mteremko (LS kutoka Open-Meteo DEM), ufunikaji wa mazao (C kutoka MODIS NDVI), na mbinu za kinga (P). Mzunguko unaojumuisha mazao ya kufunika udongo hupunguza thamani ya C hadi chini ya 0.15.",
            "RUSLE estimates average annual soil loss (tonnes/ha/yr). Topographic slope factor LS is derived from Open-Meteo DEM finite differences, while canopy cover factor C is calibrated against MOD13Q1 NDVI to model erosion abatement in diversified rotations.",
            "A = R * K * LS * C * P",
            "USDA Agricultural Handbook No. 703 (Renard et al., 1997)"
        ),
        (
            "Crop Protection",
            "Push-Pull & Pest Cycle Disruption",
            "Kuvunja Mzunguko wa Wadudu na Kwekwe (Striga)",
            "Pest and Weed Cycle Disruption via Crop Diversity",
            "Kilimo cha mahindi ya mfululizo huongeza viwavi jeshi (Fall Armyworm) na mbegu za kwekwe (Striga). Kupanda mzunguko wa mazao ya familia tofauti (Poaceae -> Fabaceae -> Asteraceae) huua mzunguko wa maisha ya wadudu hawa na kuboresha mfumo wa kinga ya shamba.",
            "Continuous cereal monoculture builds up severe pest reservoirs (Spodoptera frugiperda) and parasitic weed seedbanks (Striga hermonthica). Alternating across distinct botanical families (Poaceae -> Fabaceae -> Asteraceae) disrupts pest lifecycles without chemical reliance.",
            "Shannon Diversity Index H = -Sum(p_i * ln(p_i))",
            "ICIPE Push-Pull Technology Review / TARI Research Bulletin 2023"
        )
    ]

    for b in benchmarks:
        cursor.execute("""
        INSERT INTO agro_benchmarks (category, topic, swahili_title, english_title,
            swahili_summary, english_summary, physics_equation, scientific_citation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """, b)

        combined_content = f"{b[1]}: {b[2]} | {b[3]} Formula: {b[4]}. Citation: {b[5]}."
        cursor.execute("""
        INSERT INTO terrashift_search_idx (doc_type, reference_id, title, category, content)
        VALUES ('agro_benchmark', ?, ?, ?, ?);
        """, (b[0], b[1], b[0], combined_content))

    conn.commit()


def search_terrashift_corpus(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Executes ranked FTS5 search across NASA Earth science and agronomic knowledge base."""
    if not DB_FILE.exists():
        init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    clean_query = "".join([c if c.isalnum() or c.isspace() else " " for c in query]).strip()
    if not clean_query:
        conn.close()
        return []

    tokens = clean_query.split()
    fts_query = " OR ".join(tokens)

    try:
        cursor.execute("""
        SELECT doc_type, reference_id, title, category,
               snippet(terrashift_search_idx, 4, '<b>', '</b>', '...', 35) as snippet,
               content
        FROM terrashift_search_idx
        WHERE terrashift_search_idx MATCH ?
        ORDER BY rank
        LIMIT ?;
        """, (fts_query, limit))
        rows = cursor.fetchall()
        results = [dict(r) for r in rows]
    except Exception as exc:
        logger.warning(f"FTS search error in terrashift_kb: {exc}")
        results = []
    finally:
        conn.close()

    return results

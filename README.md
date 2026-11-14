# TerraShift+
### Closed-Loop NASA Earth Observation Decision Support & Physics-Informed Machine Learning (PIML) Crop Rotation Engine

NASA Space Apps Challenge Submission  
Challenge: Field Shift: Adapting Farms with NASA Data  
Track: Climate-Smart Agriculture, Space Telemetry & Generative AI Systems  

---

## 1. Executive Summary

Farmers worldwide face severe compounding pressures from accelerating climate anomalies: erratic precipitation, degree-day heatwaves, accelerated topsoil detachment, and soil organic carbon (SOC) depletion. Traditional agricultural advisory tools typically fall into two extremes: static historical almanacs that fail under non-stationary weather regimes, or ungrounded generative language models that hallucinate crop recommendations and numerical yields without thermodynamic or biological constraints.

TerraShift+ is a production-grade Agricultural Decision Support System (ADSS) designed on a pure React 18 + Vite frontend and a Python 3.14 backend. The engine fuses multi-mission NASA Earth Observations (POWER v2.0, SMAP L4, ECOSTRESS, GPM IMERG, MODIS MOD13Q1, GEDI L4A, GRACE-FO) with Physics-Informed Machine Learning (PIML), rigorous bio-physical modeling (FAO-56 Penman-Monteith reference evapotranspiration, phenological Growing Degree Days, Saxton-Rawls pedotransfer hydrology, RUSLE erosion dynamics), and a Pareto-optimal multi-objective rotation solver.

In addition, the system integrates **TerraShiftAgent**—an audited conversational agronomy intelligence powered by Google Gemini (configured dynamically via `.env` with zero hardcoded credentials) and ranked SQLite FTS5 satellite knowledge retrieval. Inquiries are verified by domain guardrails, grounded in live field telemetry, and streamed without hallucination or mock data.

---

## 2. System Architecture: Pure React + Python PIML

TerraShift+ separates high-performance physical computation and machine learning from an ultra-responsive, mobile-first scientific visualization cockpit.

```
+---------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                     |
|                       React 18 + Vite + Tailwind CSS Cockpit                          |
|  - Real-Time Map Clicks: Instant coordinate selection with automatic telemetry sync   |
|  - Leaflet 1.9 Basemaps: Cartographic, NASA MODIS TrueColor, LST Night, SMAP Moisture |
|  - Dual Satellite Compare Tool: Interactive layer cross-fading with opacity control   |
|  - 3x3 Sub-Field Vulnerability Grid: Micro-topographic erosion & frost pocket mapping |
|  - 5-Year Rotation Simulator: 4 Pareto strategies with live climate & soil sliders   |
|  - Grounded Agronomic Q&A: Streaming Copilot backed by Google Gemini & SQLite FTS5    |
+-------------------------------------------+-------------------------------------------+
                                            |
                                            | Server-Sent Events (SSE) & REST API
                                            v
+---------------------------------------------------------------------------------------+
|                                  BACKEND SERVER                                       |
|                          Python 3.14 High-Throughput HTTP                             |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|   +--------------------------+    +-----------------------+    +------------------+   |
|   | NASA Pipeline Engine     |    | Agronomy Physics Core |    | PIML Optimizer   |   |
|   | - SMAP L4 (9 km Soil)    |    | - FAO-56 Evapo. (ET0) |    | - Quantile Reg.  |   |
|   | - ECOSTRESS (70 m LST)   |    | - Saxton-Rawls AWC    |    | - Monte Carlo    |   |
|   | - GPM IMERG (0.1 deg)    |    | - GDD Bio-Phenology   |    | - CVaR10 Metric  |   |
|   | - NASA POWER MERRA-2     |    | - RUSLE Soil Loss     |    | - 4 Archetypes   |   |
|   | - MODIS MOD13Q1 (250m)   |    | - SOC Sequestration   |    | - Crop Family    |   |
|   | - CMR Mission Granules   |    | - Nitrogen Budget     |    |   Pruning        |   |
|   +--------------------------+    +-----------------------+    +------------------+   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | TerraShiftAgent & LLMOps Guardrail Tier                                       |   |
|   | - Domain Scope Verification (Accepts Agro & NASA; rejects off-topic queries)  |   |
|   | - Google Gemini LLM Reasoning (gemini-3.1-flash-lite via .env GEMINI_API_KEY)  |   |
|   | - Deterministic PIML Physics Fallback for zero-downtime offline execution     |   |
|   | - Ranked SQLite FTS5 NASA Earth Science & Agronomy Knowledge Base (45 papers) |   |
|   +-------------------------------------------------------------------------------+   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   | Sub-Field DEM Topographic Stencil Engine                                      |   |
|   | - 9-point elevation grid around clicked coordinate (Open-Meteo DEM 90m)       |   |
|   | - Micro-catchment relative elevation (crest vs. valley) & slope vector dx/dy  |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

---

## 3. NASA Earth Observation Data Pipeline

TerraShift+ ingests, harmonizes, and fuses observations across NASA Earth science missions and open pedological datasets:

| Mission / Sensor | Spatial Resolution | Temporal Frequency | Measured Parameter | Agronomic Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **NASA POWER v2.0** | $0.5^\circ \times 0.5^\circ$ | Daily Agroclimatology | Solar irradiance ($R_n$), $T_{2M}$, $WS_{2M}$, $RH_{2M}$, Precipitation | Computes daily FAO-56 Penman-Monteith reference evapotranspiration ($ET_0$) and 5-year Theil-Sen drift trends. |
| **NASA SMAP L4** | 9 km gridded | 3-hour / Daily | Root-zone soil wetness fraction (`GWETROOT`, $0.0-1.0$) | Evaluates soil water balance initialization and historical root-zone moisture anomalies ($Z$-score). |
| **NASA ECOSTRESS** | 70 meter thermal | ISS Precession | Land Surface Temperature (LST) & Evaporative Stress Index | Detects crop canopy heat stress and microclimate thermal extremes across field parcels. |
| **NASA GPM IMERG** | $0.1^\circ$ gridded | Daily / 30-min | Calibrated precipitation accumulation ($mm$) | Quantifies rainfall-runoff erosivity ($R$-factor) and water deficit indices ($P - ET_0$). |
| **NASA MODIS MOD13Q1** | 250 meter | 16-day composite | Normalized Difference Vegetation Index (NDVI) | Detects post-harvest bare-soil exposure windows ($\text{NDVI} < 0.25$) requiring cover crop protection. |
| **NASA GEDI L4A & GRACE-FO** | Footprint / Regional | Monthly / Orbit | Aboveground biomass density & groundwater equivalent thickness | Contextualizes regional aquifer depletion and aboveground carbon stock baselines. |
| **ISRIC SoilGrids 2.0** | 250 meter | Global Profile | Sand %, Clay %, Silt %, pH, Soil Organic Carbon (SOC) | Feeds Saxton-Rawls pedotransfer functions to compute Available Water Capacity (AWC). |
| **Open-Meteo / SRTM DEM** | 90 meter | Static | Elevation ($m$) and topographic slope (%) | Drives RUSLE $LS$ topographic factor and generates the 3x3 sub-field vulnerability grid. |

---

## 4. Mathematical & Biophysical Formulations

### A. Reference Evapotranspiration ($ET_0$) via FAO-56 Penman-Monteith
Crop water consumption and water stress indices are computed using the physical energy-balance equation:

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

Where:
- $R_n$: Net solar radiation at the crop canopy ($MJ/m^2/day$), sourced from NASA POWER `ALLSKY_SFC_SW_DWN`.
- $T$: Mean daily temperature at 2 meters ($T2M$, in $^\circ C$).
- $u_2$: Wind speed at 2 meters ($WS2M$, in $m/s$).
- $(e_s - e_a)$: Vapor pressure deficit ($kPa$), computed from saturation vapor pressure $e_s(T)$ and relative humidity `RH2M`.
- $\Delta$: Slope of the saturation vapor pressure curve ($kPa/^\circ C$).
- $\gamma$: Psychrometric constant ($kPa/^\circ C$) adjusted for barometric pressure at field elevation $z$.
- $G$: Soil heat flux density ($MJ/m^2/day$), taken as $0$ for daily calculations.

Actual crop water demand is computed as $ET_c = K_c \cdot ET_0$, where $K_c$ is the species-specific FAO-56 crop coefficient.

### B. Soil Water Balance & Available Water Capacity (AWC)
Available Water Capacity (AWC) is determined via Saxton-Rawls pedotransfer equations based on soil texture and organic matter:

$$\theta_{FC} = \theta_{1.5\text{MPa}} + \text{coeff}(Sand, Clay, OM)$$

$$\theta_{WP} = 0.0001 + 0.14 \cdot \text{Clay} + \text{coeff}(Sand, OM)$$

$$\text{AWC} = 1000 \cdot (\theta_{FC} - \theta_{WP}) \cdot \frac{D_{root}}{100} \quad (mm)$$

The daily root-zone soil water balance is tracked as:

$$S_t = \max\left(0, \min\left(\text{AWC}, S_{t-1} + P_t + I_t - ET_{c,t} - DP_t\right)\right)$$

Where $P_t$ is precipitation, $I_t$ is irrigation, $ET_{c,t}$ is actual crop evapotranspiration, and $DP_t$ is deep percolation. The **Water Stress Index (WSI)** is formulated as:

$$\text{WSI} = 1.0 - \frac{\sum ET_{actual}}{\sum ET_c}$$

### C. Phenological Growing Degree Days (GDD) & Killing Heat Days (KDD)
Crop physiological maturity and thermal hazard are modeled through cumulative degree-days:

$$\text{GDD} = \sum_{d=1}^{D_{cycle}} \max\left(\frac{T_{\max, d} + T_{\min, d}}{2} - T_{base}, 0\right)$$

$$\text{KDD} = \sum_{d=1}^{D_{cycle}} \max\left(T_{\max, d} - T_{crit}, 0\right)$$

If $\text{GDD} < \text{GDD}_{req}$, a yield penalty is enforced; extreme heat accumulation ($\text{KDD}$) depresses reproductive viability.

### D. Soil Organic Carbon (SOC) Sequestration Dynamics
Multi-year SOC delta ($\Delta \text{SOC}_{5y}$) incorporates temperature-adjusted mineralization and residue humification:

$$\Delta \text{SOC}_t = \left(h \cdot C_{residue}\right) - \left(k_0 \cdot \exp\left(0.07 \cdot (T_{mean} - 20)\right) \cdot \text{SOC}_t \cdot (1 - 0.25 \cdot \text{NoTill})\right)$$

Where:
- $h \approx 0.18$: Humification fraction of crop residue carbon.
- $k_0 \approx 0.025$: Baseline annual decomposition rate.
- $\text{NoTill} \in \{0, 1\}$: Binary modifier reflecting conservation tillage.

### E. Revised Universal Soil Loss Equation (RUSLE)
Soil detachment hazard ($t/ha/yr$) is computed from topographic slope, erodibility, and canopy cover:

$$A = R \cdot K \cdot LS \cdot C \cdot P$$

Where:
- $R$: Rainfall erosivity factor calculated from annual precipitation.
- $K$: Soil erodibility factor from ISRIC soil texture and organic matter.
- $LS = \left(\frac{\lambda}{22.13}\right)^{0.4} \cdot \left(65.41 \sin^2\theta + 4.56 \sin\theta + 0.065\right)$: Topographic factor based on parcel slope angle $\theta$.
- $C$: Crop canopy management factor ($0.12-0.35$).
- $P$: Conservation support practice factor ($0.60$ for no-till, $1.0$ for conventional).

### F. Multi-Objective Pareto Optimization & Risk Quantification
For a 5-year rotation sequence $S = [c_1, c_2, c_3, c_4, c_5]$ selected from candidate pool $\mathcal{K}$:

$$\max_{S} \quad J(S) = w_1 \cdot \text{Margin}_{P50} + w_2 \cdot \Delta N_{5y} + w_3 \cdot \Delta \text{SOC}_{5y} - w_4 \cdot \overline{\text{WSI}} - w_5 \cdot \overline{\text{RUSLE}}$$

Subject to:
1. **Pest/Pathogen Cycle Interruption:** $\text{Family}(c_t) \neq \text{Family}(c_{t-1})$ and no botanical family may appear 3 consecutive seasons.
2. **Moisture & Thermal Boundaries:** Crop selection penalized if annual rainfall falls outside $[W_{min}, W_{max}]$ or temperature deviates from optimal thermal bands.
3. **Downside Tail Risk (CVaR10):** Evaluated over 100 Monte Carlo climate shock draws ($P \pm 12\%$, $T \pm 0.7^\circ C$):

$$\text{CVaR}_{10} = \mathbb{E}\left[\text{Margin} \mid \text{Margin} \le q_{0.10}(\text{Margin})\right]$$

The optimizer yields 4 distinct strategy archetypes:
1. **Status Quo Baseline:** Continuous mono-cropping of the baseline crop.
2. **Resilience-First:** Maximizes soil organic carbon accretion, nitrogen fixation, and minimizes RUSLE erosion.
3. **Balanced Stewardship:** Optimizes the trade-off between profit, downside tail risk ($\text{CVaR}_{10}$), and moisture conservation.
4. **Yield-Maximizing:** Maximizes cumulative 5-year gross margin ($P50$) while satisfying rotational diversity rules.

---

## 5. Codebase Directory Structure

```
TerraShift/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py               # Settings, .env loader, fail-fast validations
│   │   ├── knowledge/
│   │   │   ├── __init__.py
│   │   │   └── db.py                   # SQLite FTS5 database with 45 NASA/agro benchmark papers
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── agro_models.json        # Calibrated ML quantile regression & GMM parameters
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── agro.py                 # Pydantic data schemas for API requests & responses
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── agronomy_engine.py      # FAO-56 Penman-Monteith, GDD, and RUSLE physics
│   │   │   ├── gemini_reasoning.py     # Google Gemini API connector with PIML fallback
│   │   │   ├── llmops_guardrail.py     # Live streaming conversational grounding engine
│   │   │   ├── ml_models.py            # Quantile Gradient Boosting & Mahalanobis OOD assessor
│   │   │   ├── nasa_pipeline.py        # Multi-mission CMR granule auditor & CKAN catalog search
│   │   │   ├── nasa_power.py           # NASA POWER daily climatology client, SPEI, and trends
│   │   │   ├── optimizer.py            # Pareto multi-objective 5-year rotation optimizer
│   │   │   ├── terrashift_agent.py     # Autonomous TerraShiftAgent orchestrator
│   │   │   └── terrashift_guardrails.py # Strict domain guardrails & bilingual declinations
│   │   ├── __init__.py
│   │   └── main.py                     # Multi-threaded production HTTP & SSE server
│   ├── data_cache/                     # Local satellite observation cache
│   ├── requirements.txt                # Python backend dependencies
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_agronomy_engine.py     # Biophysical formula validation tests
│   │   ├── test_nasa_pipeline.py       # CMR query and catalog audit tests
│   │   ├── test_nextgen_chat.py        # Conversational grounding tests
│   │   ├── test_real_streaming.py      # End-to-end SSE optimization stream tests
│   │   └── test_terrashift_agent.py    # TerraShiftAgent guardrail & FTS5 search tests
│   └── training/
│       └── train_surrogates.py         # Quantile regression and GMM calibration scripts
├── frontend/
│   ├── index.html                      # Single-page HTML entry point
│   ├── package.json                    # Frontend dependencies & build scripts
│   ├── postcss.config.js               # PostCSS configuration
│   ├── public/
│   │   └── data/
│   │       └── fao-ecocrop-traits.json # Calibrated FAO EcoCrop physiological traits
│   ├── src/
│   │   ├── api.js                      # SSE stream consumers & REST API client
│   │   ├── App.jsx                     # Master state coordinator, Leaflet sync, and UI layout
│   │   ├── components/
│   │   │   ├── BenchmarkMatrix.jsx     # 4-strategy side-by-side comparative table
│   │   │   ├── FAQ.jsx                 # Accordion knowledge base and methodology details
│   │   │   ├── Footer.jsx              # NASA mission citations and project licensing
│   │   │   ├── GeospatialMap.jsx       # Leaflet map, dual compare, 3x3 grid, and pin popups
│   │   │   ├── Hero.jsx                # Teleport controls, mission telemetry HUD, and overview
│   │   │   ├── Navbar.jsx              # Sticky navigation bar with live status indicator
│   │   │   ├── PresentationModal.jsx   # Interactive slide deck and whitepaper viewer
│   │   │   └── RotationSimulator.jsx   # 5-year timeline cards, sliders, and grounded Q&A
│   │   ├── index.css                   # Tailwind CSS styling and theme definitions
│   │   └── main.jsx                    # React 18 DOM mount entry point
│   ├── tailwind.config.js              # Typography, Swiss design system, and custom palettes
│   └── vite.config.js                  # Vite bundler configuration
├── .env                                # Environment variables (GEMINI_API_KEY, PORT, etc.)
└── README.md                           # Master engineering and scientific documentation
```

---

## 6. HTTP & Server-Sent Events (SSE) API Reference

### Real-Time Streaming Endpoints

#### 1. `POST /api/v1/optimize/stream`
Streams live NASA telemetry acquisition, DEM calculations, soil properties, and Pareto rotation optimization stage-by-stage over Server-Sent Events (SSE).

*Request Payload:*
```json
{
  "latitude": -6.2735,
  "longitude": 35.8213,
  "precip_delta_pct": 0.0,
  "temp_delta_c": 0.0,
  "soil_overrides": {
    "ph": 6.5,
    "clay_pct": 24.0,
    "organic_matter_pct": 2.0,
    "slope_pct": 2.0
  },
  "constraints": {
    "baseline_crop_id": "sorghum",
    "irrigation_available_mm": 0.0,
    "has_no_till_drill": false,
    "allow_cover_crops": true
  }
}
```

*Emitted SSE Event Stages:*
1. `init`: Coordinates confirmed and processing timer started.
2. `step` (`stage: "terrain"`): Open-Meteo DEM 90m elevation and slope computed.
3. `step` (`stage: "vulnerability_grid"`): 3x3 sub-field micro-topographic risk GeoJSON grid generated.
4. `step` (`stage: "cmr"`): NASA Earthdata CMR granule availability audit for SMAP, ECOSTRESS, GPM, GEDI, and GRACE-FO.
5. `step` (`stage: "ndvi"`): MODIS MOD13Q1 250m NDVI retrieval and bare-soil window evaluation.
6. `step` (`stage: "soil"`): ISRIC SoilGrids 2.0 pedological profile extracted.
7. `step` (`stage: "climate"`): NASA POWER 5-year agroclimatology, SPEI drought index, and Theil-Sen drift slopes.
8. `optimization`: Pareto 5-year solver completes, returning all 4 strategy archetypes with Monte Carlo $\text{CVaR}_{10}$ risk bounds.
9. `done`: Total runtime elapsed in milliseconds.

#### 2. `POST /api/v1/chat/stream`
Streams conversational agronomic answers grounded strictly in the active field's telemetry and NASA datasets. Off-topic queries receive an immediate formal declination.

*Request Payload:*
```json
{
  "question": "Can I grow maize here without irrigation?",
  "climate_context": {
    "annual_precip_mm": 903.9,
    "annual_et0_mm": 2551.7,
    "spei_latest": -0.23,
    "gwet_root_z": -0.15,
    "mean_temp_c": 22.9
  },
  "optimization_context": {
    "strategies": [...],
    "regime": {"assigned_cluster_name": "Semiarid Savanna", "mahalanobis_distance": 1.15},
    "field_diagnosis": {"bare_months": ["May", "Jun", "Jul", "Aug", "Sep", "Oct"]}
  }
}
```

#### 3. `POST /api/v1/agent/chat`
Autonomous **TerraShiftAgent** consultation endpoint. Fuses live telemetry, ranked SQLite FTS5 knowledge search, and Google Gemini LLM reasoning into a structured JSON contract and formal bilingual (Swahili & English) advisory.

*Request Payload:*
```json
{
  "query": "How does NASA SMAP root-zone moisture affect maize and pigeon pea rotation under drought?",
  "telemetry": {
    "latitude": -6.2735,
    "longitude": 35.8213,
    "annual_precipitation_mm": 903.9,
    "gwet_root_z": -0.23,
    "baseline_crop": "maize"
  }
}
```

*Response Structure:*
```json
{
  "status": "success",
  "llm_engine": "google-gemini",
  "active_model": "gemini-3.1-flash-lite",
  "structured_data": {
    "intent": "ROTATION_OPTIMIZATION",
    "recommendation": "OPTIMAL_ROTATION_RECOMMENDED",
    "nasa_mission_audit": "NASA POWER v2.0, NASA SMAP L4, NASA MODIS MOD13Q1",
    "telemetry_findings": "Precipitation 903.9 mm/yr vs ET0 demand 2551.7 mm/yr",
    "risk_flags": ["Terminal water stress during maize silking stage"],
    "rotational_actions": ["Transition baseline to deep-rooting pigeon pea and sorghum"],
    "verified_citations": ["NASA POWER v2.0", "NASA SMAP L4", "FAO Irrigation Paper 56"]
  },
  "advisory_swahili": "### USHAURI WA KISAYANSI WA TERRASHIFT (SWAHILI)\n...",
  "advisory_english": "### TERRASHIFT EARTH OBSERVATION & PRECISION AGRO ADVISORY (ENGLISH)\n..."
}
```

---

## 7. Quickstart & Installation

### Prerequisites
- Python 3.10+ (Python 3.14 recommended)
- Node.js 18+ and npm
- Valid Google Gemini API Key configured in `.env` (`GEMINI_API_KEY=...`)

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/laphilemon/TerraShift.git
cd TerraShift

# 2. Configure environment credentials
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# 3. Build React production bundle
cd frontend
npm install
npm run build
cd ..

# 4. Launch unified TerraShift+ production server
python3 -m backend.app.main --port 8000
```

The application will be live at `http://localhost:8000`.

### Running Verification Tests

```bash
# Execute backend test suite (physics, pipelines, and agent guardrails)
python3 -m unittest discover -s backend/tests -p "test_*.py" -v
```

---

## 8. NASA Earth Science Citations & Scientific Standards

1. **NASA POWER Project (LaRC MERRA-2 & GEOS-5.12.4):** Daily solar radiation, surface temperature, humidity, and wind speed. [https://power.larc.nasa.gov/](https://power.larc.nasa.gov/)
2. **NASA SMAP (Soil Moisture Active Passive):** Level 4 Global 9 km Root-Zone Soil Moisture (`SPL4SMGP`). [https://smap.jpl.nasa.gov/](https://smap.jpl.nasa.gov/)
3. **NASA ECOSTRESS (ISS Thermal Radiometer):** 70 m Land Surface Temperature and Evaporative Stress Index. [https://ecostress.jpl.nasa.gov/](https://ecostress.jpl.nasa.gov/)
4. **NASA GPM IMERG:** 0.1 degree global calibrated precipitation accumulation. [https://gpm.nasa.gov/](https://gpm.nasa.gov/)
5. **NASA MODIS MOD13Q1:** 250 m 16-day Vegetation Indices (NDVI/EVI). [https://modis.gsfc.nasa.gov/](https://modis.gsfc.nasa.gov/)
6. **NASA GEDI:** Level 4A Aboveground Biomass Density. [https://gedi.umd.edu/](https://gedi.umd.edu/)
7. **FAO Irrigation and Drainage Paper 56:** Crop Evapotranspiration Guidelines for Computing Crop Water Requirements.
8. **USDA-NRCS Agricultural Handbook No. 703:** Revised Universal Soil Loss Equation (RUSLE).

---

## 9. License

This project is licensed under the MIT License. Built for the NASA Space Apps Challenge.

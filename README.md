# TerraShift+
### Closed-Loop NASA Earth Observation Decision Support & Constrained Soil-Regenerative Optimization Engine

NASA Space Apps Challenge 2026 Submission
Challenge: Field Shift: Adapting Farms with NASA Data
Team: TerraShift+ (Dar es Salaam Local Event)

---

## 1. Executive Summary

Farmers worldwide face compounding pressures from shifting precipitation regimes, extreme degree-day heat spikes, and declining soil organic carbon (SOC). Traditional agricultural advisory tools either present static almanacs or rely on ungrounded language models that hallucinate crop recommendations and numerical yields without thermodynamic or biological grounding.

TerraShift+ is a scientifically verified, production-grade agricultural decision support system (ADSS). It couples live NASA Earth Observations (NASA POWER agroclimatology, SMAP soil moisture, ECOSTRESS thermal anomalies, and GPM precipitation) with a deterministic bio-physical agronomic engine (FAO-56 Penman-Monteith and Growing Degree Day phenology) and a Pareto-optimal constrained rotation optimizer (Dynamic Programming with amortized O(1) state transitions).

An audited LLMOps Guardrail layer translates the Pareto-optimal mathematical frontier into actionable guidance for extension agents and farmers, strictly bounded by data contracts and deterministic citations to USDA, FAO, and NASA technical records.

---

## 2. Theoretical & Mathematical Foundations

### A. Reference Evapotranspiration (ET0) via FAO-56 Penman-Monteith
Reference crop evapotranspiration (ET0 in mm/day) is computed using the standard FAO-56 Penman-Monteith formulation:

$$ET_0 = \frac{0.408 \Delta (R_n - G) + \gamma \frac{900}{T + 273} u_2 (e_s - e_a)}{\Delta + \gamma (1 + 0.34 u_2)}$$

Variables:
- R_n: Net solar radiation at crop surface (MJ/m^2/day from NASA POWER ALLSKY_SFC_SW_DWN)
- T: Mean daily temperature at 2 m (T2M)
- u_2: Wind speed at 2 m (WS2M)
- (e_s - e_a): Vapor pressure deficit calculated from RH2M and saturation vapor pressure e_s(T)
- Delta: Slope of the vapor pressure curve (kPa / deg C)
- gamma: Psychrometric constant adjusted for atmospheric pressure P(z)
- G: Soil heat flux density (approximated as 0 for daily steps)

### B. Phenological Bio-Accumulation (Growing Degree Days - GDD)
$$\text{GDD} = \sum_{d=1}^{D_{\text{frost}}} \max\left( \frac{T_{\max, d} + T_{\min, d}}{2} - T_{\text{base}}, 0 \right)$$

If seasonal thermal accumulation fails to reach a crop's required maturity threshold (GDD < GDD_req), the candidate crop is penalized or marked non-viable.

### C. Constrained Multi-Objective Pareto Optimization
For a 5-year sequence C = [c_1, c_2, c_3, c_4, c_5]:

$$\max \sum_{t=1}^5 \text{GrossMargin}(c_t, \text{YieldPct}_t)$$

Subject to:
1. Cumulative Soil Nitrogen Balance: Delta N_5yr >= N_floor
2. Water Stress Index: WSI_t <= W_max
3. Monoculture / Pest Cycle Break: Transition(c_{t-1}, c_t) = 1

Constant-time O(1) state space pruning eliminates consecutive monocultures of high-depletion crops and enforces phytopathogenic disease breaks.

---

## 3. System Architecture & CAP Trade-Off

```
[ NASA POWER REST API ]     [ NASA SMAP L4 / MERRA-2 ]     [ Soil Physical Profiles ]
           |                                |                              |
           +-----------------------+--------+------------------------------+
                                   |
                                   v
                      +---------------------------+
                      |   Idempotent Cache Tier   |
                      |  (SHA-256 Geohash Store)  |
                      +-------------+-------------+
                                   |
                                   v
                      +---------------------------+
                      |   Agronomy Physics Core   |
                      |  - FAO-56 Penman-Monteith |
                      |  - GDD Phenology Engine   |
                      +-------------+-------------+
                                   |
                                   v
                      +---------------------------+
                      | Pareto Dynamic Optimizer  |
                      |   - O(1) Bitmask Filter   |
                      |   - 3 Distinct Archetypes |
                      +-------------+-------------+
                                   |
                                   v
                      +---------------------------+
                      |    Audited LLMOps Layer   |
                      | - Strict Pydantic Schemas |
                      | - Zero Calculation in LLM |
                      | - Verified NASA Citations |
                      +-------------+-------------+
                                   |
                                   v
                      +---------------------------+
                      | Production Web Cockpit    |
                      | - Multi-Sensor Telemetry  |
                      | - 5-Year Rotation Grid    |
                      | - 4-Way Benchmark Matrix  |
                      | - TerraCopilot SI Chat    |
                      +---------------------------+
```

CAP Classification: Consistency & Partition Tolerance (CP)
- Consistency: The engine never evaluates corrupted or temporally mismatched climate epochs.
- Partition Tolerance: If upstream NASA servers experience timeouts, cryptographically verified local geospatial slices serve requests without fabricating synthetic weather values.

---

## 4. Zero-Secrets & Engineering Standards

1. Zero Hardcoded Secrets: All runtime configuration loads via environment variables (.env) with fail-fast assertions.
2. Clean Code, KISS, DRY: Modular architecture separating thermodynamic modeling, dynamic programming, and user-facing presentation.
3. Zero Math Hallucination: The LLM explainer acts purely as a narrative synthesis layer over verified numerical outputs.

---

## 5. Quick Start & Execution

### Prerequisites
- Python 3.10+
- Standard browser (Chrome, Firefox, Safari, Edge)

### Option A: Direct Local Execution
```bash
# Clone the repository
git clone https://github.com/laphilemon/TerraShift.git
cd TerraShift

# Start the TerraShift+ Engine
python3 -m backend.app.main
```
Open http://localhost:8000 in your browser to access the cockpit.

### Option B: Running the Automated Test Suite
```bash
python3 -m unittest discover -s backend/tests -p "test_*.py" -v
```

### Option C: Containerized Deployment (Docker)
```bash
docker compose up --build -d
```

---

## 6. Official NASA Datasets & Provenance

1. NASA POWER v2.0 (LaRC MERRA-2 Agroclimatology):
   - ALLSKY_SFC_SW_DWN: All Sky Surface Shortwave Downward Irradiance (MJ/m^2/day)
   - T2M, T2M_MAX, T2M_MIN: Temperature at 2 Meters (deg C)
   - PRECTOTCORR: Precipitation Corrected (mm/day)
   - RH2M: Relative Humidity at 2 Meters (%)
   - WS2M: Wind Speed at 2 Meters (m/s)
2. NASA CERES: Surface radiative flux datasets for daily solar radiation calibration.
3. NASA SMAP L4: Global root-zone and surface soil moisture extraction boundaries.
4. NASA ECOSTRESS: Thermal evapotranspiration stress indicators from the International Space Station.
5. FAO Irrigation and Drainage Paper 56: Reference crop evapotranspiration standards.
6. USDA-NRCS Agricultural Database: Soil water holding capacities and nutrient uptake profiles.

---

## 7. Project Structure

```
TerraShift+/
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── README.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── agro.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── agronomy_engine.py
│   │       ├── llmops_guardrail.py
│   │       ├── nasa_power.py
│   │       └── optimizer.py
│   ├── data_cache/
│   │   └── .gitkeep
│   ├── requirements.txt
│   └── tests/
│       ├── __init__.py
│       ├── test_agronomy_engine.py
│       └── test_nextgen_chat.py
└── frontend/
    └── public/
        └── index.html
```

---

## 8. License

This project is licensed under the MIT License.

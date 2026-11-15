# TerraShift+
### Physics-Informed Crop Rotation Decision Support & NASA Earth Observation Workstation

**NASA Space Apps Challenge 2026** | Challenge: *Field Shift: Adapting Farms with NASA Data*  
**Track:** Climate-Smart Agriculture, Space Telemetry & Generative AI Systems  
**Organization:** [Jiajiri](https://github.com/jiajiri)  
**Repository:** [https://github.com/jiajiri/TerraShift](https://github.com/jiajiri/TerraShift)  
**Team Profile:** [NASA Space Apps Team Page](https://www.spaceappschallenge.org/2026/find-a-team/terrashift5/)  
**Team:** Lazaro A. Philemon (Tanzania), Jackson Haruni (Tanzania), Arnold Philemon (Kenya)

---

## Live Application & Submission Deliverables

| Deliverable | Live Link | Description |
| :--- | :--- | :--- |
| **NASA Team Page** | [terrashift5](https://www.spaceappschallenge.org/2026/find-a-team/terrashift5/) | Official NASA Space Apps Challenge project page and team details |
| **Live Workstation** | [terrashift-plus.pages.dev](https://terrashift-plus.pages.dev/) | Production edge web app (NASA GIBS, POWER, SMAP L4, bilingual EN/SW) |
| **Research Paper** | [research-paper.pdf](https://terrashift-plus.pages.dev/research-paper.pdf) | 10-page formal technical paper in IEEE format |
| **Slide Presentation** | [TerraShift-Demo-7Slides.pdf](https://terrashift-plus.pages.dev/TerraShift-Demo-7Slides.pdf) | 7-slide NASA Space Apps Challenge pitch deck |
| **Interactive API Docs**| [docs.html](https://terrashift-plus.pages.dev/docs.html) | OpenAPI 3.1 Swagger UI with live voice & telemetry endpoints |
| **Voice Audio Sample** | [test_morogoro_audio.wav](https://terrashift-plus.pages.dev/test_morogoro_audio.wav) | 24kHz RIFF WAVE synthesized Tanzanian Swahili audio |

### Scan to Open Live on Mobile
<p align="left">
  <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https%3A//terrashift-plus.pages.dev/&margin=2" alt="Scan to Launch TerraShift+ Live" width="180" height="180" />
  <br />
  <sub>Scan with smartphone camera to launch live on mobile</sub>
</p>

---

## 1. Overview

TerraShift+ helps farmers and agricultural extension officers (*Maafisa Ugani*) evaluate multi-year crop rotation strategies under changing rainfall, soil moisture, heat stress, and topsoil erosion pressures. It fuses live NASA Earth Observation streams and local soil baselines with deterministic biophysical equations and calibrated uncertainty intervals—providing transparent decision support without replacing farmer judgment or local agronomic expertise.

### Key Capabilities
- **Live Multi-Mission Telemetry (Zero Mocked Data):** Streams real data on every map click, search, or GPS fix from **NASA POWER v2.0**, **NASA GIBS WMTS** (MODIS True Color, LST, SMAP L4), **ORNL DAAC MODIS MOD13Q1**, **NASA CMR** (SMAP, ECOSTRESS, GPM IMERG, GEDI, GRACE-FO), **iSDAsoil v2 (30m Africa)** / **ISRIC SoilGrids 2.0 (250m global)**, and **Open-Meteo DEM (90m)**.
- **3x3 Sub-Field Vulnerability Heatmap:** Computes local elevation range, slope gradient, erosion runoff risk, water stress hotspots, and topographic frost pockets around any selected field.
- **Physics-Informed ML & Monte Carlo Pareto Optimizer:** Combines **FAO-56 Penman-Monteith $ET_0$**, **Saxton-Rawls Available Water Capacity**, **Soil Bucket Water Stress Index ($WSI$)**, **GDD/KDD**, **RUSLE**, **RothC $\Delta SOC$**, and **Log-Logistic SPEI** with spatial cross-validated **Quantile Regression (`P10/P50/P90`)**, **GMM Mahalanobis Out-of-Distribution (OOD)** checks, and **`CVaR10`** downside-risk optimization across 4 strategies (*Status Quo Baseline*, *Resilience-First*, *Balanced Stewardship*, *Yield-Maximizing*).
- **Bilingual UI & Agentic MCP Field Advisor (`EN` / `SW`):** Full English and Tanzanian Swahili (`sw-TZ`) internationalization with automatic personal language detection, inline 3x3 heatmaps, SMAP previews, clickable NASA verification links, and JSON field export.
- **Technical Research Paper & Interactive Swagger API Docs:** Includes a compiled 10-page two-column LaTeX technical paper (`/research-paper.pdf`) and interactive OpenAPI 3.1 Swagger documentation (`/docs.html` on Cloudflare Pages, `/docs` on FastAPI).

---

## 2. Deployment Architectures

### Option A: Single-Domain Cloudflare Pages + Edge Functions (`/functions`)
- **Static Frontend:** Vite + React build output in `frontend/dist/`.
- **Serverless Edge API (`/functions/api/*`):** Handles `/api/health`, `/api/v1/crops`, `/api/v1/pipeline/health`, `/api/v1/mcp/tools`, `/api/v1/optimize/stream`, and `/api/v1/chat/stream` using standard Web `fetch`, `TransformStream` SSE, and `context.env` encrypted secrets.
- **SPA Routing Guard (`public/_routes.json`):** Routes `/api/*` exclusively to Cloudflare Pages Functions while serving `index.html`, `/docs.html`, `/openapi.json`, and `/research-paper.pdf` directly from CDN edge storage.

### Option B: Local Python High-Throughput Server + ML Training Pipeline
- **Training Scripts (`backend/training/`):** `build_dataset.py` (supports NASA AppEEARS batch extraction + NASA POWER + iSDAsoil) and `train_models.py` (`scikit-learn` Quantile GBR + GMM OOD saved to `backend/app/models/`).
- **Local FastAPI / HTTP Server (`backend/app/main.py`):** Exposes SSE endpoints, MCP tool execution, and local development endpoints.

---

## 3. Quickstart

### Local Cloudflare Pages + Functions Testing (`wrangler`)
```bash
# 1. Configure local Worker secrets (never commit .dev.vars)
cp .dev.vars.example .dev.vars

# 2. Build frontend
cd frontend && npm install && npm run build && cd ..

# 3. Serve dist/ + /functions/api/* locally
npx wrangler pages dev frontend/dist --compatibility-date=2026-11-01
```
Open [http://localhost:8788](http://localhost:8788) for the app and [http://localhost:8788/docs.html](http://localhost:8788/docs.html) for Swagger UI.

### Local Python ML Training & Backend Testing
```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Execute verification suite (34 tests)
python3 -m unittest discover -s tests -p "test_*.py" -v

# 3. Launch backend server
python3 -m app.main --port 8000
```

---

## 4. API Reference & Swagger UI

Interactive OpenAPI 3.1 documentation is available live at **`/docs.html`**:
- **`GET /api/health`**: System status, runtime info, and active service health.
- **`GET /api/v1/crops`**: Physiological crop catalog loaded from FAO EcoCrop traits.
- **`GET /api/v1/pipeline/health`**: Real-time audit of NASA CMR & Harvest Portal granules for coordinate queries (`lat`, `lon`).
- **`GET /api/v1/mcp/tools`**: Model Context Protocol (MCP) tool schema definitions.
- **`POST /api/v1/optimize/stream`**: Server-Sent Events (SSE) streaming endpoint delivering live terrain, 3x3 vulnerability grid, soil parameters, climate metrics, and 4 Pareto rotation strategies.
- **`POST /api/v1/chat/stream`**: Multi-step agentic SSE streaming endpoint executing the **Agentic Field Advisor** with grounded numerical citations.

---

## 5. NASA Earth Science Citations & Scientific Standards

1. **NASA POWER Project (LaRC MERRA-2 & GEOS-5.12.4):** Daily solar radiation, surface temperature, humidity, and wind speed. [https://power.larc.nasa.gov/](https://power.larc.nasa.gov/)
2. **NASA SMAP (Soil Moisture Active Passive):** Level 4 Global 9 km Root-Zone Soil Moisture (`SPL4SMGP`). [https://doi.org/10.5067/T5RUATAQREF8](https://doi.org/10.5067/T5RUATAQREF8)
3. **NASA ECOSTRESS (ISS Thermal Radiometer):** 70 m Land Surface Temperature and Evaporative Stress Index. [https://doi.org/10.5067/ECOSTRESS/ECO2LSTE.001](https://doi.org/10.5067/ECOSTRESS/ECO2LSTE.001)
4. **NASA GPM IMERG:** 0.1 degree global calibrated precipitation accumulation. [https://doi.org/10.5067/GPM/IMERGDF/DAY/07](https://doi.org/10.5067/GPM/IMERGDF/DAY/07)
5. **NASA MODIS MOD13Q1:** 250 m 16-day Vegetation Indices (NDVI/EVI). [https://doi.org/10.5067/MODIS/MOD13Q1.061](https://doi.org/10.5067/MODIS/MOD13Q1.061)
6. **NASA GEDI:** Level 4A Aboveground Biomass Density. [https://gedi.umd.edu/](https://gedi.umd.edu/)
7. **FAO Irrigation and Drainage Paper 56:** Crop Evapotranspiration Guidelines for Computing Crop Water Requirements.
8. **USDA-NRCS Agricultural Handbook No. 703:** Revised Universal Soil Loss Equation (RUSLE).

---

## 6. Organization & License

Developed under the **[Jiajiri](https://github.com/jiajiri)** organization for the **NASA Space Apps Challenge 2026**.

This project is licensed under the **MIT License** - see the LICENSE file for details.

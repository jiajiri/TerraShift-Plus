#!/usr/bin/env python3
"""
Generate an executive, judge-winning 7-Slide Presentation Deck PDF for TerraShift+
(NASA Space Apps Challenge 2026 Submission).
Renders 16:9 widescreen presentation slides (1280x720px) via headless Chromium:
- docs/TerraShift-Demo-7Slides.pdf
- frontend/public/TerraShift-Demo-7Slides.pdf
"""

import base64
import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCS_PDF = REPO_ROOT / "docs" / "TerraShift-Demo-7Slides.pdf"
PUBLIC_PDF = REPO_ROOT / "frontend" / "public" / "TerraShift-Demo-7Slides.pdf"
ASSETS_DIR = REPO_ROOT / "docs" / "demo-deck" / "assets"

def get_b64(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

SHOT_HERO_MAP = get_b64(ASSETS_DIR / "shot_hero_map.png")
SHOT_STRAT = get_b64(ASSETS_DIR / "shot_strategies.png")
SHOT_SWAHILI = get_b64(ASSETS_DIR / "shot_swahili.png")
SHOT_ADVISOR = get_b64(ASSETS_DIR / "shot_advisor.png")

HTML_TEMPLATE = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TerraShift+ 7-Slide Executive Pitch Deck</title>
  <style>
    @page {{
      size: 1280px 720px;
      margin: 0;
    }}
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0F1713;
      color: #E2ECE5;
      -webkit-font-smoothing: antialiased;
      image-rendering: -webkit-optimize-contrast;
    }}
    .slide {{
      width: 1280px;
      height: 720px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      padding: 40px 52px 34px 52px;
      background: #0E1B14;
    }}

    /* Light mineral theme for data & results slides */
    .slide.light {{
      background: #F7F5EE;
      color: #19261E;
    }}

    /* Top metadata bar */
    .top-meta {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      padding-bottom: 10px;
    }}
    .light .top-meta {{
      border-bottom: 1px solid rgba(0,0,0,0.1);
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 4px;
      background: rgba(46, 125, 50, 0.25);
      color: #66BB6A;
      border: 1px solid rgba(102, 187, 106, 0.4);
    }}
    .light .badge {{
      background: #E8F5E9;
      color: #1B5E20;
      border: 1px solid #A5D6A7;
    }}
    .slide-num {{
      font-size: 12px;
      font-family: "SF Mono", monospace;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.05em;
    }}
    .light .slide-num {{
      color: rgba(0,0,0,0.45);
    }}

    /* Headings */
    h1 {{
      font-size: 38px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: #FFFFFF;
      margin-bottom: 8px;
    }}
    .light h1 {{
      color: #13281D;
    }}
    h2 {{
      font-size: 27px;
      font-weight: 750;
      line-height: 1.2;
      letter-spacing: -0.015em;
      color: #FFFFFF;
      margin-bottom: 6px;
    }}
    .light h2 {{
      color: #13281D;
    }}
    .subhead {{
      font-size: 14px;
      line-height: 1.45;
      color: #9DB4A6;
      margin-bottom: 20px;
    }}
    .light .subhead {{
      color: #4A6353;
    }}

    /* Cards */
    .card {{
      background: #14281E;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 16px 18px;
    }}
    .light .card {{
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }}

    /* Layout Splits */
    .split-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 26px;
      flex: 1;
      min-height: 0;
    }}
    .split-hero {{
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 30px;
      flex: 1;
      align-items: center;
      min-height: 0;
    }}
    .split-table {{
      display: grid;
      grid-template-columns: 1.12fr 0.88fr;
      gap: 22px;
      flex: 1;
      min-height: 0;
    }}

    /* Bullet List */
    ul.metric-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 11px;
    }}
    ul.metric-list li {{
      font-size: 13px;
      line-height: 1.45;
      position: relative;
      padding-left: 16px;
      color: #CCDCD2;
    }}
    .light ul.metric-list li {{
      color: #2D4235;
    }}
    ul.metric-list li::before {{
      content: "";
      position: absolute;
      left: 0;
      top: 6px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4CAF50;
    }}
    .light ul.metric-list li::before {{
      background: #2E7D32;
    }}

    /* Frame for Crisp Viewport Screenshots */
    .img-frame {{
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.18);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      background: #112218;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
    }}
    .light .img-frame {{
      border: 1px solid rgba(0,0,0,0.12);
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
      background: #FAFAFA;
      padding: 6px;
    }}
    .img-frame img {{
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }}

    /* Footer Meta Bar */
    .footer-bar {{
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: rgba(255,255,255,0.5);
    }}
    .light .footer-bar {{
      border-top: 1px solid rgba(0,0,0,0.08);
      color: rgba(0,0,0,0.5);
    }}

    /* Highlighting */
    .highlight {{
      color: #81C784;
      font-weight: 700;
    }}
    .light .highlight {{
      color: #1B5E20;
      font-weight: 700;
    }}
    .alert-tag {{
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(239, 83, 80, 0.2);
      color: #EF5350;
      border: 1px solid rgba(239, 83, 80, 0.4);
    }}
    .light .alert-tag {{
      background: #FFEBEE;
      color: #C62828;
      border: 1px solid #FFCDD2;
    }}

    /* Tables */
    table.data-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }}
    table.data-table th {{
      text-align: left;
      padding: 6px 8px;
      background: #EAE6DB;
      color: #1C2E22;
      font-weight: 700;
      border-bottom: 2px solid #C9C4B5;
    }}
    table.data-table td {{
      padding: 6px 8px;
      border-bottom: 1px solid #E5E1D5;
      color: #2D3D32;
    }}
    table.data-table tr:last-child td {{
      border-bottom: none;
    }}

    /* Pipeline Step Cards */
    .pipeline-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 6px;
    }}
    .step-card {{
      background: #152C20;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 12px 14px;
    }}
    .step-num {{
      font-size: 10px;
      font-weight: 800;
      color: #81C784;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 3px;
    }}
    .step-title {{
      font-size: 12.5px;
      font-weight: 750;
      color: #FFF;
      margin-bottom: 5px;
    }}
    .step-desc {{
      font-size: 11px;
      line-height: 1.4;
      color: #A3BCAE;
    }}
  </style>
</head>
<body>

  <!-- SLIDE 1: COVER & HERO (Accurate Badge: FIELD SHIFT SUBMISSION) -->
  <div class="slide">
    <div class="top-meta">
      <div class="badge">NASA Space Apps Challenge 2026 &bull; Field Shift Submission</div>
      <div class="slide-num">01 / 07</div>
    </div>
    <div class="split-hero">
      <div>
        <div style="font-size: 12px; font-weight: 700; color: #81C784; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 6px;">Field Shift: Adapting Farms with NASA Data</div>
        <h1>TerraShift+</h1>
        <div style="font-size: 19px; font-weight: 600; color: #C8E6C9; line-height: 1.3; margin-bottom: 14px;">
          Physics-Informed Crop Rotation Decision Support with NASA Earth Observations
        </div>
        <div class="subhead" style="margin-bottom: 20px;">
          A bilingual (English &amp; Swahili) agronomic engine that adapts multi-year rotations to shifting rainfall, extreme heat, and bare-soil erosion without replacing farmer agency.
        </div>
        <div class="card" style="margin-bottom: 18px; background: rgba(255,255,255,0.04);">
          <div style="font-size: 11px; font-weight: 700; color: #FFFFFF; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em;">Development Team</div>
          <div style="font-size: 12px; color: #CCDCD2; line-height: 1.5;">
            <strong>Lazaro A. Philemon</strong> (Tanzania) &bull; <strong>Jackson Haruni</strong> (Tanzania) &bull; <strong>Arnold Philemon</strong> (Kenya)
          </div>
        </div>
        <div style="display: flex; gap: 14px; font-size: 11.5px; font-family: monospace;">
          <span style="color: #81C784;">Live: https://terrashift-plus.pages.dev</span>
          <span style="color: #A5D6A7;">GitHub: jiajiri/TerraShift</span>
        </div>
      </div>
      <div class="img-frame" style="height: 480px;">
        <img src="{SHOT_HERO_MAP}" alt="TerraShift+ Live Platform Interface">
      </div>
    </div>
    <div class="footer-bar">
      <span>TerraShift+ &bull; Physics-Informed ML &amp; Multi-Mission NASA Pipeline</span>
      <span>Edge Architecture on Cloudflare Pages</span>
    </div>
  </div>

  <!-- SLIDE 2: THE FARMER'S CHALLENGE -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Problem Context &bull; Agricultural Vulnerability</div>
      <div class="slide-num">02 / 07</div>
    </div>
    <h2>The Smallholder Challenge &amp; Why Current Tools Fail</h2>
    <div class="subhead">Climate volatility renders static planting almanacs obsolete, while black-box LLMs hallucinate unsafe crop advice.</div>
    <div class="split-2">
      <div class="card">
        <div style="font-size: 13.5px; font-weight: 800; color: #8A2B1D; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Field Reality: Ground-Level Stressors</div>
        <ul class="metric-list" style="margin-bottom: 16px;">
          <li><strong>Dodoma, Tanzania (Semi-Arid):</strong> Confronts 6 consecutive bare-soil months (May&ndash;Oct). Status quo continuous maize causes <strong>10.31 t/ha/yr</strong> RUSLE topsoil detachment and <strong>-175 kg/ha</strong> 5-yr nitrogen deficit.</li>
          <li><strong>Fallon, Nevada (Desert Aridity):</strong> Extreme evaporative deficit with only <strong>127.5 mm</strong> precipitation against <strong>1,841.4 mm</strong> Penman-Monteith evaporative demand.</li>
          <li><strong>Bare Field Trap:</strong> Delayed rainy seasons leave harvested fields unprotected, triggering severe erosion and permanent loss of soil organic matter.</li>
        </ul>
        <div style="background: #FDEDEC; border: 1px solid #F5B7B1; border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #78281F;">
          <strong>Core Requirement:</strong> Farmers need concrete, season-by-season rotational sequences that preserve ground cover and restore soil chemistry, rather than generic single-crop yield predictions.
        </div>
      </div>

      <div class="card">
        <div style="font-size: 13.5px; font-weight: 800; color: #1E4620; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Systemic Tool Breakdown</div>
        <div style="display: flex; flex-direction: column; gap: 9px;">
          <div style="background: #FDFEFE; border: 1px solid #E5E7E9; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 750; color: #C0392B;">1. Static Historical Almanacs</div>
            <div style="font-size: 11px; color: #5D6D7E; margin-top: 2px;">Rely on 30-year climate averages that fail under sudden monsoon delays, leading to planting into dry spells and total crop loss.</div>
          </div>
          <div style="background: #FDFEFE; border: 1px solid #E5E7E9; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 750; color: #D35400;">2. Generic Generative AI / LLMs</div>
            <div style="font-size: 11px; color: #5D6D7E; margin-top: 2px;">Hallucinate agronomic metrics, violate water mass-balance physics, and lack access to daily root-zone soil telemetry.</div>
          </div>
          <div style="background: #E8F8F5; border: 1px solid #A3E4D7; border-radius: 6px; padding: 10px 12px;">
            <div style="font-size: 12px; font-weight: 750; color: #117864;">3. TerraShift+ Closed-Loop PIML</div>
            <div style="font-size: 11px; color: #145A32; margin-top: 2px;">Couples 10 live NASA satellite missions with deterministic biophysical laws (FAO-56, Saxton-Rawls, RUSLE, RothC) and quantile risk bounds.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>Field Problem &bull; Dodoma, Tanzania &amp; Fallon, Nevada Test Baselines</span>
      <span>TerraShift+ Decision Framework</span>
    </div>
  </div>

  <!-- SLIDE 3: DATA ARCHITECTURE (Dedicated Vector SVG Architecture Diagram - NO DUPLICATE IMAGE!) -->
  <div class="slide">
    <div class="top-meta">
      <div class="badge">Data Architecture &bull; Ingestion Pipeline</div>
      <div class="slide-num">03 / 07</div>
    </div>
    <h2>Automatic Geo-Aware NASA Data Fusion Pipeline</h2>
    <div class="subhead">Instant edge geo-location pairs coordinates with 10 remote sensing missions without manual data wrangling.</div>
    <div class="split-hero">
      <div>
        <div class="card" style="margin-bottom: 12px;">
          <div style="font-size: 12.5px; font-weight: 750; color: #81C784; margin-bottom: 4px;">Zero-Click Location Resolution</div>
          <p style="font-size: 11.5px; line-height: 1.45; color: #CCDCD2;">
            When a user opens TerraShift+, Cloudflare Edge Geo-IP immediately pinpoints their region (&lt;100ms) with optional GPS refinement, streaming live satellite telemetry into a unified 12-month calendar.
          </p>
        </div>

        <div class="pipeline-grid" style="grid-template-columns: 1fr 1fr; gap: 9px;">
          <div class="step-card">
            <div class="step-num">NASA POWER v2.0</div>
            <div class="step-title">Atmospheric Fluxes</div>
            <div class="step-desc">Solar insolation, temperature extremes, humidity, and wind speed for FAO-56 Penman-Monteith ET0.</div>
          </div>
          <div class="step-card">
            <div class="step-num">NASA SMAP L4</div>
            <div class="step-title">Root-Zone Wetness</div>
            <div class="step-desc">0&ndash;100 cm subsurface soil moisture (SPL4SMGP) to compute crop water stress indices.</div>
          </div>
          <div class="step-card">
            <div class="step-num">GPM IMERG + MODIS</div>
            <div class="step-title">Rainfall &amp; Canopy Cover</div>
            <div class="step-desc">Half-hourly calibrated precipitation and 16-day 250m NDVI to detect bare-field exposure windows.</div>
          </div>
          <div class="step-card">
            <div class="step-num">ISDA / SOILGRIDS / SRTM</div>
            <div class="step-title">Soil Physics &amp; Relief</div>
            <div class="step-desc">30m sand, clay, organic carbon profiles with 30m SRTM DEM slope factors for RUSLE erosion modeling.</div>
          </div>
        </div>
      </div>

      <!-- Dedicated Vector SVG Architecture & Common-Grid Fusion Diagram -->
      <div class="card" style="height: 480px; display: flex; flex-direction: column; justify-content: center; background: #0B1610; border: 1px solid rgba(255,255,255,0.15);">
        <div style="font-size: 11px; font-weight: 800; color: #81C784; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; text-align: center;">Multi-Mission Harmonization Pipeline</div>
        <svg viewBox="0 0 460 380" style="width: 100%; height: auto;">
          <!-- Stage 1: Edge Geo Trigger -->
          <rect x="20" y="20" width="420" height="45" rx="6" fill="#14281E" stroke="#2D7A4D" stroke-width="1.5"/>
          <text x="230" y="42" fill="#E2ECE5" font-size="12" font-weight="700" text-anchor="middle" font-family="sans-serif">Visitor Geo-IP / Browser GPS / Map Click</text>
          <text x="230" y="56" fill="#81C784" font-size="10" text-anchor="middle" font-family="monospace">Instant Edge Coordinate Resolution (&lt; 100 ms)</text>

          <!-- Connecting Arrow -->
          <line x1="230" y1="65" x2="230" y2="85" stroke="#4CAF50" stroke-width="2" stroke-dasharray="3,3"/>
          <polygon points="226,85 234,85 230,90" fill="#4CAF50"/>

          <!-- Stage 2: Concurrent Multi-Mission SSE Streams -->
          <rect x="20" y="90" width="420" height="95" rx="6" fill="#112219" stroke="#3D5A47" stroke-width="1.2"/>
          <text x="230" y="108" fill="#A5D6A7" font-size="11" font-weight="750" text-anchor="middle" font-family="sans-serif">Concurrent Edge Worker Telemetry Streams</text>
          
          <rect x="35" y="118" width="90" height="24" rx="4" fill="#1C3827"/><text x="80" y="134" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">NASA POWER</text>
          <rect x="135" y="118" width="90" height="24" rx="4" fill="#1C3827"/><text x="180" y="134" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">SMAP L4 9km</text>
          <rect x="235" y="118" width="90" height="24" rx="4" fill="#1C3827"/><text x="280" y="134" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">GPM IMERG</text>
          <rect x="335" y="118" width="90" height="24" rx="4" fill="#1C3827"/><text x="380" y="134" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">MODIS 250m</text>

          <rect x="35" y="148" width="90" height="24" rx="4" fill="#1C3827"/><text x="80" y="164" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">ECOSTRESS</text>
          <rect x="135" y="148" width="90" height="24" rx="4" fill="#1C3827"/><text x="180" y="164" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">GEDI Canopy</text>
          <rect x="235" y="148" width="90" height="24" rx="4" fill="#1C3827"/><text x="280" y="164" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">iSDAsoil 30m</text>
          <rect x="335" y="148" width="90" height="24" rx="4" fill="#1C3827"/><text x="380" y="164" fill="#C8E6C9" font-size="9" text-anchor="middle" font-family="monospace">SRTM 3x3 DEM</text>

          <!-- Connecting Arrow -->
          <line x1="230" y1="185" x2="230" y2="205" stroke="#4CAF50" stroke-width="2" stroke-dasharray="3,3"/>
          <polygon points="226,205 234,205 230,210" fill="#4CAF50"/>

          <!-- Stage 3: Harmonized 12-Month Temporal Grid -->
          <rect x="20" y="210" width="420" height="65" rx="6" fill="#14281E" stroke="#2D7A4D" stroke-width="1.5"/>
          <text x="230" y="230" fill="#E2ECE5" font-size="12" font-weight="700" text-anchor="middle" font-family="sans-serif">Harmonized 12-Month Spatiotemporal Grid</text>
          <text x="230" y="246" fill="#81C784" font-size="10" text-anchor="middle" font-family="monospace">Monthly Infiltration &bull; Bare-Soil Exposure &bull; Dual Kc ET0</text>
          <text x="230" y="260" fill="#A3BCAE" font-size="9.5" text-anchor="middle" font-family="sans-serif">Saxton-Rawls Hydrology (AWC) + Dynamic Root-Zone Deficit</text>

          <!-- Connecting Arrow -->
          <line x1="230" y1="275" x2="230" y2="295" stroke="#4CAF50" stroke-width="2" stroke-dasharray="3,3"/>
          <polygon points="226,295 234,295 230,300" fill="#4CAF50"/>

          <!-- Stage 4: Closed-Loop Decision Engine -->
          <rect x="20" y="300" width="420" height="60" rx="6" fill="#1B3D2A" stroke="#4CAF50" stroke-width="1.5"/>
          <text x="230" y="322" fill="#FFFFFF" font-size="12.5" font-weight="750" text-anchor="middle" font-family="sans-serif">4-Strategy PIML Optimization Engine</text>
          <text x="230" y="340" fill="#C8E6C9" font-size="10" text-anchor="middle" font-family="monospace">100 Monte Carlo Weather Draws &bull; Worst-Decile CVaR10</text>
        </svg>
      </div>
    </div>
    <div class="footer-bar">
      <span>Data Fusion &bull; 10 Remote Sensing Missions &amp; Global Pedotransfer Baselines</span>
      <span>NASA Earth Observations Ingestion</span>
    </div>
  </div>

  <!-- SLIDE 4: THE MATHEMATICS & PIML ARCHITECTURE -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Scientific Methodology &bull; Biophysical ML</div>
      <div class="slide-num">04 / 07</div>
    </div>
    <h2>Biophysical Governing Laws &amp; Quantile Machine Learning</h2>
    <div class="subhead">Replacing black-box guessing with audited physical principles and rigorous uncertainty bounds.</div>
    
    <div class="pipeline-grid" style="margin-bottom: 20px;">
      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #1B5E20; text-transform: uppercase;">Stage 1: Biophysical Laws</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">Deterministic Mass Balance</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          <strong>FAO-56 Dual Kc:</strong> Evapotranspiration energy balance.<br>
          <strong>Saxton-Rawls:</strong> Soil hydrology &amp; AWC.<br>
          <strong>RUSLE:</strong> Rain erosivity &amp; soil loss.<br>
          <strong>RothC:</strong> Multi-pool carbon turnover.
        </p>
      </div>

      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #1B5E20; text-transform: uppercase;">Stage 2: Quantile Surrogate</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">Spatial Gradient Boosting</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          Spatial-CV regressors predict yield percentiles (<strong>P10/P50/P90</strong>).<br>
          <strong>R&sup2; = 0.942</strong> vs. FAO-56.<br>
          <strong>RMSE = 0.050</strong> pinball accuracy.<br>
          <strong>83.5%</strong> empirical 80% CI coverage.
        </p>
      </div>

      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #B71C1C; text-transform: uppercase;">Stage 3: Safety Guardrail</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">GMM Mahalanobis OOD</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          72-cluster Gaussian Mixture Model tracks feature manifold.<br>
          Inputs with <strong>D_M &gt; 4.50</strong> trigger OOD safety fallback, suppressing uncalibrated advice in polar/desert extremes.
        </p>
      </div>

      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #1B5E20; text-transform: uppercase;">Stage 4: Optimization</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">Stochastic Pareto Solver</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          Simulates 100 Monte Carlo weather draws.<br>
          Optimizes margin, drought risk, and carbon across 4 archetypes using worst-decile <strong>CVaR_10</strong> safety floors.
        </p>
      </div>
    </div>

    <div class="card" style="background: #EAE6DB; border: 1px solid #D8D2C2;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 750; color: #1B3D2A;">Surrogate Acceleration: Complete 5-year multi-objective optimization executes in <strong>1.50 ms</strong> (cached) and <strong>585 ms</strong> (cold start).</span>
        <span style="font-size: 10.5px; font-family: monospace; color: #335340;">SSE Streaming Protocol &bull; Zero Serverless Bottlenecks</span>
      </div>
    </div>

    <div class="footer-bar">
      <span>Methodology &bull; Audited PIML Formulation</span>
      <span>TerraShift+ Mathematical Core</span>
    </div>
  </div>

  <!-- SLIDE 5: VERIFIED RESULTS & 4 STRATEGIES -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Validation &bull; Empirical Controls</div>
      <div class="slide-num">05 / 07</div>
    </div>
    <h2>Verified Control Results &amp; 4-Strategy Multi-Objective Matrix</h2>
    <div class="subhead">Empirically validated across international benchmark stations and harsh climatic shocks.</div>
    <div class="split-table">
      <div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Station / Scenario</th>
              <th>Status Quo</th>
              <th>Resilience-First Strategy</th>
              <th>Net Impact &amp; Safety</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Dodoma, Tanzania</strong><br><span style="font-size: 9.5px; color: #666;">Semi-Arid Smallholder</span></td>
              <td>Continuous Maize<br>Erosion: 10.31 t/ha<br>N Balance: -175 kg/ha</td>
              <td><strong>Pigeonpea &rarr; Sorghum &rarr; Cowpea</strong><br>Erosion: 5.09 t/ha<br>N Balance: +145 kg/ha</td>
              <td><span class="highlight">-50.6% Erosion</span><br><span class="highlight">+35% Margin ($2.7k/ha)</span><br>Positive N Balance</td>
            </tr>
            <tr>
              <td><strong>Ames, Iowa</strong><br><span style="font-size: 9.5px; color: #666;">US Corn Belt Commercial</span></td>
              <td>Continuous Corn<br>N Balance: -175 kg/ha</td>
              <td><strong>Soybean &rarr; Corn &rarr; Cover Rye</strong><br>N Balance: +115 kg/ha</td>
              <td><span class="highlight">+$618.20/ha Margin</span><br>Full N replenishment</td>
            </tr>
            <tr>
              <td><strong>Fallon, Nevada</strong><br><span style="font-size: 9.5px; color: #666;">High-Desert Aridity</span></td>
              <td>Alfalfa Monoculture<br>Erosion: 0.62 t/ha</td>
              <td><strong>Sorghum-Sudangrass &rarr; Triticale</strong><br>Erosion: 0.30 t/ha</td>
              <td><span class="highlight">-51.6% Erosion</span><br>Preserves scarce water</td>
            </tr>
            <tr>
              <td><strong>Polar Negative Control</strong><br><span style="font-size: 9.5px; color: #666;">Antarctic -78.34&deg;</span></td>
              <td>Uncalibrated Query</td>
              <td>OOD Guardrail Active<br>D_M = 8.40 (&gt; 4.50)</td>
              <td><span class="alert-tag">Rejection Verified</span><br>Prevents false crop advice</td>
            </tr>
            <tr>
              <td><strong>Drought Stress Test</strong><br><span style="font-size: 9.5px; color: #666;">-25% Rain, +2.0&deg;C Warming</span></td>
              <td>Baseline Yield Collapse</td>
              <td>Monotonic WSI Response</td>
              <td><span class="highlight">100% Pass</span><br>Zero optimization inversion</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="img-frame" style="height: 470px;">
        <img src="{SHOT_STRAT}" alt="4-Strategy Comparison Matrix & Cards">
      </div>
    </div>
    <div class="footer-bar">
      <span>Field Validation &bull; Control Benchmark Stations</span>
      <span>Empirical Performance Verification</span>
    </div>
  </div>

  <!-- SLIDE 6: FARMER UX: SWAHILI & FIELD ADVISOR (Clean Viewports - ZERO BROWSER TABS) -->
  <div class="slide">
    <div class="top-meta">
      <div class="badge">Farmer Experience &bull; Inclusive Technology</div>
      <div class="slide-num">06 / 07</div>
    </div>
    <h2>Farmer-Centered UX: Tanzanian Swahili &amp; Field Advisor</h2>
    <div class="subhead">Bridging complex space science to local smallholders and agricultural extension officers.</div>
    <div class="split-2">
      <div>
        <div class="img-frame" style="height: 350px; margin-bottom: 12px;">
          <img src="{SHOT_SWAHILI}" alt="Tanzanian Swahili Interface">
        </div>
        <div class="card">
          <div style="font-size: 12.5px; font-weight: 750; color: #81C784; margin-bottom: 4px;">Native Swahili Localization (sw-TZ)</div>
          <p style="font-size: 11px; line-height: 1.4; color: #CCDCD2;">
            Accessible interface in Swahili (<em>Msimamo wa Sasa, Ustahimilivu wa Ukame, Mahindi, Mbaazi</em>) with local soil-test calibration (texture, labor, irrigation) to complement, rather than replace, local agronomic wisdom.
          </p>
        </div>
      </div>

      <div>
        <div class="img-frame" style="height: 350px; margin-bottom: 12px;">
          <img src="{SHOT_ADVISOR}" alt="NASA Field Advisor Drawer">
        </div>
        <div class="card">
          <div style="font-size: 12.5px; font-weight: 750; color: #81C784; margin-bottom: 4px;">NASA Field Advisor Drawer</div>
          <p style="font-size: 11px; line-height: 1.4; color: #CCDCD2;">
            Interactive drawer with 3&times;3 micro-topography water stress heatmaps, live NASA SMAP tiles, and clickable 200 OK audit links to NASA Worldview, DAACs, and open soil repositories.
          </p>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>Human-Centered Design &bull; Multilingual Accessibility</span>
      <span>TerraShift+ Deployment</span>
    </div>
  </div>

  <!-- SLIDE 7: PRODUCTION, CITATIONS & OPEN SCIENCE -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Open Science &bull; Reproducibility</div>
      <div class="slide-num">07 / 07</div>
    </div>
    <h2>Production Deployment, Open Science &amp; Data Citations</h2>
    <div class="subhead">Full public reproducibility, interactive API documentation, and peer-reviewed technical paper.</div>
    <div class="split-2">
      <div class="card">
        <div style="font-size: 13px; font-weight: 800; color: #1B5E20; margin-bottom: 10px; text-transform: uppercase;">Production Infrastructure</div>
        <ul class="metric-list" style="margin-bottom: 14px;">
          <li><strong>Cloudflare Edge Architecture:</strong> Global Pages &amp; Pages Functions (V8 Workers) with Server-Sent Events for fast multi-stream delivery.</li>
          <li><strong>Interactive OpenAPI / Swagger:</strong> Fully documented REST endpoints accessible at <code>/docs.html</code>.</li>
          <li><strong>Rigorous LaTeX Research Paper:</strong> 11-page complete mathematical proof and validation document at <code>/research-paper.pdf</code>.</li>
          <li><strong>Zero Hardcoded Credentials:</strong> Full compliance with strict environment configuration standards.</li>
        </ul>
        <div style="background: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #1B5E20;">
          <strong>Live Access:</strong> <a href="https://terrashift-plus.pages.dev" style="color: #1B5E20; font-weight: 700; text-decoration: none;">https://terrashift-plus.pages.dev</a><br>
          <strong>Open Source:</strong> <a href="https://github.com/jiajiri/TerraShift" style="color: #1B5E20; font-weight: 700; text-decoration: none;">https://github.com/jiajiri/TerraShift</a>
        </div>
      </div>

      <div class="card">
        <div style="font-size: 13px; font-weight: 800; color: #1B5E20; margin-bottom: 10px; text-transform: uppercase;">Data Sources &amp; Mission Citations</div>
        <div style="font-size: 10.5px; line-height: 1.5; color: #2D3D32; display: flex; flex-direction: column; gap: 5px;">
          <div>&bull; <strong>NASA POWER v2.0:</strong> Daily meteorology &amp; solar radiation (Sparks, 2018).</div>
          <div>&bull; <strong>NASA SMAP L4:</strong> Global 9km root-zone soil wetness (Reichle et al., 10.5067/T5RUATAQREF8).</div>
          <div>&bull; <strong>GPM IMERG:</strong> Multi-satellite calibrated precipitation (Huffman et al., 10.5067/GPM/IMERGDF/DAY/07).</div>
          <div>&bull; <strong>MODIS MOD13Q1:</strong> 250m 16-day NDVI vegetation dynamics (Didan, 10.5067/MODIS/MOD13Q1.061).</div>
          <div>&bull; <strong>ECOSTRESS &amp; GEDI:</strong> Thermal stress &amp; canopy structural height.</div>
          <div>&bull; <strong>iSDAsoil 30m &amp; ISRIC SoilGrids 2.0:</strong> African and global pedotransfer datasets.</div>
          <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #DDD; font-size: 10px; color: #666;">
            <strong>AI &amp; SI Statement:</strong> Machine learning is restricted to surrogate function acceleration and interface translation; core agronomic logic adheres strictly to verified physical laws.
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>NASA Space Apps Challenge 2026 Submission &bull; Team TerraShift+</span>
      <span>Thank you to the Judges and the NASA Earth Science Division</span>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    print("Generating TerraShift-Demo-7Slides.pdf...")
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(HTML_TEMPLATE)
        temp_html = f.name

    try:
        if DOCS_PDF.exists():
            DOCS_PDF.unlink()

        cmd = [
            "chromium-browser",
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--user-data-dir=/tmp/chromium_deck_render",
            "--print-to-pdf-no-header",
            f"--print-to-pdf={DOCS_PDF}",
            temp_html
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        # Give chromium up to 15 seconds to finish writing the full multi-page PDF
        for _ in range(30):
            time.sleep(0.5)
            if DOCS_PDF.exists() and os.path.getsize(DOCS_PDF) > 100000:
                # Give an extra half second to flush completely
                time.sleep(0.5)
                break
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        
        # Copy to frontend public and dist
        subprocess.run(["cp", str(DOCS_PDF), str(PUBLIC_PDF)], check=True)
        dist_pdf = REPO_ROOT / "frontend" / "dist" / "TerraShift-Demo-7Slides.pdf"
        if dist_pdf.parent.exists():
            subprocess.run(["cp", str(DOCS_PDF), str(dist_pdf)], check=True)
        print(f"Successfully generated: {DOCS_PDF} ({os.path.getsize(DOCS_PDF)} bytes)")
        print(f"Copied to: {PUBLIC_PDF} and {dist_pdf}")
    finally:
        if os.path.exists(temp_html):
            os.remove(temp_html)

if __name__ == "__main__":
    generate_pdf()

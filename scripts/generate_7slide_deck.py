#!/usr/bin/env python3
"""
Generate an executive, judge-winning 7-Slide Presentation Deck PDF for TerraShift+
(NASA Space Apps Challenge 2026 Submission).
Focuses 100% on smallholder farmer impact, agricultural resilience, and verified NASA science.
Zero developer jargon (no Cloudflare, V8, React, Vite, SSE, MCP).
16:9 widescreen presentation slides (1280x720px) via headless Chromium:
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
DIST_PDF = REPO_ROOT / "frontend" / "dist" / "TerraShift-Demo-7Slides.pdf"
ASSETS_DIR = REPO_ROOT / "docs" / "demo-deck" / "assets"

def get_b64(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

SHOT_MAP = get_b64(ASSETS_DIR / "shot_map_overview.png")
SHOT_STRAT = get_b64(ASSETS_DIR / "shot_strategies_clean.png")
SHOT_SWAHILI = get_b64(ASSETS_DIR / "shot_swahili_clean.png")
SHOT_ADVISOR = get_b64(ASSETS_DIR / "shot_advisor_clean.png")

HTML_TEMPLATE = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TerraShift+ 7-Slide Presentation Deck</title>
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
      padding: 38px 48px 30px 48px;
      background: #0E1B14;
    }}

    /* Light theme for data & results slides */
    .slide.light {{
      background: #F7F5EE;
      color: #19261E;
    }}

    /* Top metadata bar */
    .top-meta {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
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
      font-size: 36px;
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
      font-size: 26px;
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
      font-size: 13.5px;
      line-height: 1.45;
      color: #9DB4A6;
      margin-bottom: 18px;
    }}
    .light .subhead {{
      color: #4A6353;
    }}

    /* Cards */
    .card {{
      background: #14281E;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 15px 18px;
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
      gap: 24px;
      flex: 1;
      min-height: 0;
    }}
    .split-hero {{
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 28px;
      flex: 1;
      align-items: center;
      min-height: 0;
    }}
    .split-table {{
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      gap: 22px;
      flex: 1;
      min-height: 0;
    }}

    /* Bullet List */
    ul.metric-list {{
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }}
    ul.metric-list li {{
      font-size: 12.5px;
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
      border: 1px solid rgba(255,255,255,0.16);
      box-shadow: 0 8px 24px rgba(0,0,0,0.35);
      background: #112218;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
    }}
    .light .img-frame {{
      border: 1px solid rgba(0,0,0,0.12);
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
      background: #FFFFFF;
      padding: 4px;
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
      font-size: 10.5px;
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

  <!-- SLIDE 1: COVER & HERO -->
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
          Helping Farmers Adapt Crop Rotations Using NASA Earth Observations
        </div>
        <div class="subhead" style="margin-bottom: 20px;">
          A bilingual (English &amp; Swahili) agronomic decision workstation that adapts multi-year crop sequences to shifting rainfall, extreme heat, and bare-soil erosion without replacing farmer agency.
        </div>
        <div class="card" style="margin-bottom: 18px; background: rgba(255,255,255,0.04);">
          <div style="font-size: 11px; font-weight: 700; color: #FFFFFF; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.05em;">Development Team</div>
          <div style="font-size: 12px; color: #CCDCD2; line-height: 1.5;">
            <strong>Lazaro A. Philemon</strong> (Tanzania) &bull; <strong>Jackson Haruni</strong> (Tanzania) &bull; <strong>Arnold Philemon</strong> (Kenya)
          </div>
        </div>
        <div style="display: flex; gap: 14px; font-size: 11.5px; font-family: monospace;">
          <span style="color: #81C784;">Live Platform: https://terrashift-plus.pages.dev</span>
          <span style="color: #A5D6A7;">Source: github.com/jiajiri/TerraShift</span>
        </div>
      </div>
      <div class="img-frame" style="height: 480px;">
        <img src="{SHOT_MAP}" alt="TerraShift+ Live Platform Interface">
      </div>
    </div>
    <div class="footer-bar">
      <span>NASA Space Apps Challenge 2026 &bull; Field Shift: Adapting Farms with NASA Data</span>
      <span>Live Field Decision Workstation</span>
    </div>
  </div>

  <!-- SLIDE 2: WHY WE BUILT THIS (THE FARMER'S REALITY) -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">The Farmer's Challenge &bull; Ground-Level Reality</div>
      <div class="slide-num">02 / 07</div>
    </div>
    <h2>Why We Built This: When Planting Seasons Move</h2>
    <div class="subhead">Climate volatility renders static planting almanacs obsolete, while generic AI chatbots hallucinate unsafe crop advice.</div>
    <div class="split-2">
      <div class="card">
        <div style="font-size: 13px; font-weight: 800; color: #8A2B1D; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em;">Field Reality: Ground-Level Stressors</div>
        <ul class="metric-list" style="margin-bottom: 14px;">
          <li><strong>Dodoma, Tanzania (Semi-Arid):</strong> Confronts 6 consecutive dry bare-soil months (May&ndash;Oct). Continuous maize monoculture causes <strong>10.31 t/ha/yr</strong> topsoil erosion and <strong>-175 kg/ha</strong> 5-yr soil nitrogen depletion.</li>
          <li><strong>Fallon, Nevada (Desert Aridity):</strong> Extreme evaporative deficit with only <strong>127.5 mm</strong> annual precipitation against <strong>1,841 mm</strong> atmospheric crop water demand.</li>
          <li><strong>The Bare-Soil Trap:</strong> Delayed rainy seasons leave harvested fields unshaded, triggering severe wind/water erosion and permanent loss of fertile organic matter.</li>
        </ul>
        <div style="background: #FDEDEC; border: 1px solid #F5B7B1; border-radius: 6px; padding: 9px 12px; font-size: 11px; color: #78281F;">
          <strong>Core Need:</strong> Smallholder farmers need concrete multi-year rotational sequences that keep soil covered, fix natural nitrogen, and conserve water, rather than one-size-fits-all yield estimates.
        </div>
      </div>

      <div class="card">
        <div style="font-size: 13px; font-weight: 800; color: #1E4620; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Why Current Decision Support Fails</div>
        <div style="display: flex; flex-direction: column; gap: 9px;">
          <div style="background: #FDFEFE; border: 1px solid #E5E7E9; border-radius: 6px; padding: 9px 12px;">
            <div style="font-size: 12px; font-weight: 750; color: #C0392B;">1. Static Historical Planting Calendars</div>
            <div style="font-size: 11px; color: #5D6D7E; margin-top: 2px;">Rely on 30-year averages that miss sudden monsoon shifts, encouraging farmers to plant into mid-season dry spells where seeds wither.</div>
          </div>
          <div style="background: #FDFEFE; border: 1px solid #E5E7E9; border-radius: 6px; padding: 9px 12px;">
            <div style="font-size: 12px; font-weight: 750; color: #D35400;">2. Generic Large Language Models</div>
            <div style="font-size: 11px; color: #5D6D7E; margin-top: 2px;">Prone to ungrounded agronomic hallucinations, violate basic soil water conservation laws, and have zero live satellite telemetry.</div>
          </div>
          <div style="background: #E8F8F5; border: 1px solid #A3E4D7; border-radius: 6px; padding: 9px 12px;">
            <div style="font-size: 12px; font-weight: 750; color: #117864;">3. TerraShift+ Physics-Informed Decision Support</div>
            <div style="font-size: 11px; color: #145A32; margin-top: 2px;">Combines live NASA satellite observations with deterministic water and soil science, giving farmers realistic best-to-worst year risk ranges.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>Field Problem &bull; Dodoma, Tanzania &amp; Fallon, Nevada Test Baselines</span>
      <span>TerraShift+ Problem Statement</span>
    </div>
  </div>

  <!-- SLIDE 3: WHAT TERRASHIFT+ DOES: WORKFLOW & ACTIONABLE PLAN -->
  <div class="slide">
    <div class="top-meta">
      <div class="badge">Farmer Experience &bull; Actionable Workflow</div>
      <div class="slide-num">03 / 07</div>
    </div>
    <h2>What TerraShift+ Does: From Farm Pin to Actionable Plan</h2>
    <div class="subhead">How smallholder farmers and extension officers transform space data into resilient 5-year cropping decisions.</div>
    <div class="split-hero">
      <div>
        <div class="card" style="margin-bottom: 12px;">
          <div style="font-size: 12.5px; font-weight: 750; color: #81C784; margin-bottom: 4px;">4 Simple Steps on the Field Workstation</div>
          <p style="font-size: 11.5px; line-height: 1.45; color: #CCDCD2;">
            A farmer clicks their field on the map or searches their village. TerraShift+ automatically compiles multi-year satellite climate history and soil baselines without requiring complex data entry.
          </p>
        </div>

        <div class="pipeline-grid" style="grid-template-columns: 1fr 1fr; gap: 9px;">
          <div class="step-card">
            <div class="step-num">Step 1: Locate Field</div>
            <div class="step-title">Pinpoint Farm Coordinates</div>
            <div class="step-desc">Clicking any parcel loads 5 years of daily satellite weather, root-zone wetness, and soil texture.</div>
          </div>
          <div class="step-card">
            <div class="step-num">Step 2: Detect Stress</div>
            <div class="step-title">Expose Bare-Soil Months</div>
            <div class="step-desc">Identifies months where harvested ground sits uncovered and vulnerable to severe seasonal erosion.</div>
          </div>
          <div class="step-card">
            <div class="step-num">Step 3: Calibrate Farm</div>
            <div class="step-title">Farmer Input &amp; Constraints</div>
            <div class="step-desc">Farmers adjust local soil feel (sand/clay), irrigation access, or household labor limits.</div>
          </div>
          <div class="step-card">
            <div class="step-num">Step 4: Compare Options</div>
            <div class="step-title">4 Actionable Strategies</div>
            <div class="step-desc">Presents existing baseline against drought-resilient, soil-restoring, and high-yield rotation alternatives.</div>
          </div>
        </div>
      </div>

      <!-- Custom SVG 4-Step Diagram & 12-Month Harmonized Calendar -->
      <div class="card" style="height: 480px; display: flex; flex-direction: column; justify-content: center; background: #0B1610; border: 1px solid rgba(255,255,255,0.15);">
        <div style="font-size: 11px; font-weight: 800; color: #81C784; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; text-align: center;">12-Month Satellite Climate &amp; Soil Coverage Calendar</div>
        <svg viewBox="0 0 460 380" style="width: 100%; height: auto;">
          <!-- Top Farm Pin Box -->
          <rect x="20" y="20" width="420" height="45" rx="6" fill="#14281E" stroke="#2D7A4D" stroke-width="1.5"/>
          <text x="230" y="42" fill="#E2ECE5" font-size="12" font-weight="700" text-anchor="middle" font-family="sans-serif">Farm Pinpoint: Dodoma Region, Tanzania (-6.163, 35.752)</text>
          <text x="230" y="56" fill="#81C784" font-size="10" text-anchor="middle" font-family="monospace">5-Yr Satellite Agroclimatology &bull; 954 mm Precip &bull; 23.1&deg;C Mean</text>

          <!-- Connecting Arrow -->
          <line x1="230" y1="65" x2="230" y2="85" stroke="#4CAF50" stroke-width="2" stroke-dasharray="3,3"/>
          <polygon points="226,85 234,85 230,90" fill="#4CAF50"/>

          <!-- 12-Month Calendar Bar -->
          <rect x="20" y="90" width="420" height="95" rx="6" fill="#112219" stroke="#3D5A47" stroke-width="1.2"/>
          <text x="230" y="108" fill="#A5D6A7" font-size="11" font-weight="750" text-anchor="middle" font-family="sans-serif">Annual Soil Moisture &amp; Vegetation Exposure Cycle</text>
          
          <!-- Rainy Season (Green) -->
          <rect x="35" y="120" width="130" height="26" rx="4" fill="#2E7D32"/>
          <text x="100" y="137" fill="#FFFFFF" font-size="9.5" font-weight="700" text-anchor="middle">Jan - Apr (Rainy Season)</text>

          <!-- Bare Soil Stress (Red) -->
          <rect x="175" y="120" width="190" height="26" rx="4" fill="#C62828"/>
          <text x="270" y="137" fill="#FFFFFF" font-size="9.5" font-weight="700" text-anchor="middle">May - Oct (Critical Bare-Soil Window)</text>

          <!-- Early Rains (Green) -->
          <rect x="375" y="120" width="50" height="26" rx="4" fill="#2E7D32"/>
          <text x="400" y="137" fill="#FFFFFF" font-size="9.5" font-weight="700" text-anchor="middle">Nov-Dec</text>

          <text x="230" y="168" fill="#CCDCD2" font-size="9.5" text-anchor="middle">Status Quo maize leaves 6 months bare &bull; Alternative introduces drought legume cover</text>

          <!-- Connecting Arrow -->
          <line x1="230" y1="185" x2="230" y2="205" stroke="#4CAF50" stroke-width="2" stroke-dasharray="3,3"/>
          <polygon points="226,205 234,205 230,210" fill="#4CAF50"/>

          <!-- 4 Rotation Strategies Grid -->
          <rect x="20" y="210" width="420" height="150" rx="6" fill="#14281E" stroke="#2D7A4D" stroke-width="1.5"/>
          <text x="230" y="232" fill="#FFFFFF" font-size="12" font-weight="750" text-anchor="middle">4 Adaptive Crop Rotation Pathways Evaluated</text>
          
          <rect x="35" y="246" width="185" height="44" rx="4" fill="#1B3B2B"/>
          <text x="127" y="262" fill="#E2ECE5" font-size="10" font-weight="700" text-anchor="middle">1. Status Quo (Maize)</text>
          <text x="127" y="278" fill="#EF9A9A" font-size="9" text-anchor="middle">10.3 t/ha erosion, -175 kg N</text>

          <rect x="240" y="246" width="185" height="44" rx="4" fill="#1B3B2B"/>
          <text x="332" y="262" fill="#A5D6A7" font-size="10" font-weight="700" text-anchor="middle">2. Resilience-First</text>
          <text x="332" y="278" fill="#81C784" font-size="9" text-anchor="middle">-50% erosion, +145 kg N balance</text>

          <rect x="35" y="300" width="185" height="44" rx="4" fill="#1B3B2B"/>
          <text x="127" y="316" fill="#E2ECE5" font-size="10" font-weight="700" text-anchor="middle">3. Balanced Stewardship</text>
          <text x="127" y="332" fill="#81C784" font-size="9" text-anchor="middle">Steady food yield + soil protection</text>

          <rect x="240" y="300" width="185" height="44" rx="4" fill="#1B3B2B"/>
          <text x="332" y="316" fill="#E2ECE5" font-size="10" font-weight="700" text-anchor="middle">4. High-Yield Sequence</text>
          <text x="332" y="332" fill="#81C784" font-size="9" text-anchor="middle">Maximized harvest in good rain years</text>
        </svg>
      </div>
    </div>
    <div class="footer-bar">
      <span>Farmer Workflow &bull; 4 Steps From Farm Pin to Actionable Plan</span>
      <span>NASA Space Apps Challenge 2026</span>
    </div>
  </div>

  <!-- SLIDE 4: WHY NASA DATA + PROVEN AGRONOMY WORKS -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Scientific Foundation &bull; NASA Satellite Missions</div>
      <div class="slide-num">04 / 07</div>
    </div>
    <h2>Why NASA Data + Proven Agronomy Works</h2>
    <div class="subhead">Replacing guesswork with 6 verified satellite missions and time-tested biophysical laws.</div>
    
    <div class="pipeline-grid" style="margin-bottom: 20px;">
      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #1B5E20; text-transform: uppercase;">Rainfall &amp; Moisture</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">NASA GPM &amp; SMAP L4</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          <strong>GPM IMERG:</strong> Tracks daily rainfall timing &amp; dry spell duration.<br>
          <strong>SMAP L4:</strong> Measures root-zone soil wetness (0&ndash;100 cm) to anticipate crop water stress before plants wilt.
        </p>
      </div>

      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #1B5E20; text-transform: uppercase;">Sun, Heat &amp; Greenness</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">NASA POWER &amp; MODIS</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          <strong>NASA POWER:</strong> Solar radiation, extreme heat, and evaporative water demand.<br>
          <strong>MODIS 250m:</strong> Measures actual vegetative ground cover to detect unprotected bare soil.
        </p>
      </div>

      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #1B5E20; text-transform: uppercase;">Topography &amp; Soil</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">SRTM DEM &amp; SoilGrids</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          <strong>SRTM 30m:</strong> Maps sub-field slope to calculate water runoff and topsoil detachment risk.<br>
          <strong>iSDAsoil / SoilGrids:</strong> Soil clay, sand, and organic carbon storage capacity.
        </p>
      </div>

      <div class="card" style="padding: 14px;">
        <div style="font-size: 11px; font-weight: 800; color: #B71C1C; text-transform: uppercase;">Agronomic Guardrails</div>
        <div style="font-size: 13px; font-weight: 750; color: #13281D; margin: 4px 0 8px 0;">Proven Biophysical Laws</div>
        <p style="font-size: 11px; line-height: 1.4; color: #3E5346;">
          Uses established FAO-56 Penman-Monteith, Saxton-Rawls soil hydrology, and RUSLE erosion equations.<br>
          Automatically flags non-agricultural areas instead of guessing.
        </p>
      </div>
    </div>

    <div class="card" style="background: #EAE6DB; border: 1px solid #D8D2C2;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 12px; font-weight: 750; color: #1B3D2A;">Uncertainty &bull; Every crop rotation calculates realistic <strong>worst-year to best-year yield ranges</strong> so farmers can prepare for drought.</span>
        <span style="font-size: 10.5px; font-family: monospace; color: #335340;">100 Weather Simulations &bull; Safety Floor Guarantee</span>
      </div>
    </div>

    <div class="footer-bar">
      <span>Scientific Integrity &bull; Verified Biophysical Formulations</span>
      <span>NASA Earth Observations Core</span>
    </div>
  </div>

  <!-- SLIDE 5: WHAT WE ACHIEVED (VERIFIED FIELD GAINS) -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Field Validation &bull; Real-World Outcomes</div>
      <div class="slide-num">05 / 07</div>
    </div>
    <h2>What We Achieved: Verified Field Gains Across Real Climates</h2>
    <div class="subhead">Tested across diverse agro-ecological zones to prove erosion control, soil fertility gains, and financial safety.</div>
    <div class="split-table">
      <div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Station / Scenario</th>
              <th>Status Quo Baseline</th>
              <th>TerraShift+ Adaptive Rotation</th>
              <th>Farmer Impact &amp; Benefit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Dodoma, Tanzania</strong><br><span style="font-size: 9.5px; color: #666;">Semi-Arid Smallholder</span></td>
              <td>Continuous Maize<br>Erosion: 10.31 t/ha<br>N Balance: -175 kg/ha</td>
              <td><strong>Pigeonpea &rarr; Sorghum &rarr; Cowpea</strong><br>Erosion: 5.09 t/ha<br>N Balance: +145 kg/ha</td>
              <td><span class="highlight">-50.6% Topsoil Loss</span><br><span class="highlight">+35% 5-Yr Income ($2,727/ha)</span><br>Positive N Fertility</td>
            </tr>
            <tr>
              <td><strong>Ames, Iowa</strong><br><span style="font-size: 9.5px; color: #666;">Corn Belt Commercial</span></td>
              <td>Continuous Corn<br>N Balance: -175 kg/ha</td>
              <td><strong>Soybean &rarr; Corn &rarr; Cover Rye</strong><br>N Balance: +115 kg/ha</td>
              <td><span class="highlight">+$618.20/ha 5-Yr Income</span><br>Full N restoration</td>
            </tr>
            <tr>
              <td><strong>Fallon, Nevada</strong><br><span style="font-size: 9.5px; color: #666;">High-Desert Aridity</span></td>
              <td>Alfalfa Monoculture<br>Erosion: 0.62 t/ha</td>
              <td><strong>Sorghum-Sudangrass &rarr; Triticale</strong><br>Erosion: 0.30 t/ha</td>
              <td><span class="highlight">-51.6% Topsoil Loss</span><br>Conserves scarce water</td>
            </tr>
            <tr>
              <td><strong>Polar Non-Farm Check</strong><br><span style="font-size: 9.5px; color: #666;">Antarctic -78.34&deg;</span></td>
              <td>Extreme Cold Input</td>
              <td>Guardrail Triggers<br>Recognizes non-farm climate</td>
              <td><span class="alert-tag">Safely Rejected</span><br>Prevents false crop advice</td>
            </tr>
            <tr>
              <td><strong>Drought Stress Test</strong><br><span style="font-size: 9.5px; color: #666;">-25% Rain, +2.0&deg;C Warming</span></td>
              <td>Baseline Crop Failure</td>
              <td>Adapts to drought-hardy crops</td>
              <td><span class="highlight">100% Consistent</span><br>Protects baseline livelihood</td>
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
      <span>Verified Agricultural Gains</span>
    </div>
  </div>

  <!-- SLIDE 6: BUILT FOR REAL FARMERS: SWAHILI & INTERACTIVE ADVISOR -->
  <div class="slide">
    <div class="top-meta">
      <div class="badge">Inclusive Technology &bull; Farmer-Centered Design</div>
      <div class="slide-num">06 / 07</div>
    </div>
    <h2>Built for Real Farmers: Tanzanian Swahili &amp; Field Advisor</h2>
    <div class="subhead">Bridging complex satellite science directly to smallholders and local extension officers (Maafisa Ugani).</div>
    <div class="split-2">
      <div>
        <div class="img-frame" style="height: 350px; margin-bottom: 12px;">
          <img src="{SHOT_SWAHILI}" alt="Tanzanian Swahili Interface">
        </div>
        <div class="card">
          <div style="font-size: 12.5px; font-weight: 750; color: #81C784; margin-bottom: 4px;">Native Tanzanian Swahili Localization (sw-TZ)</div>
          <p style="font-size: 11px; line-height: 1.4; color: #CCDCD2;">
            Accessible interface in Swahili (<em>Msimamo wa Sasa, Ustahimilivu wa Ukame, Mahindi, Mbaazi</em>) with local soil-test calibration (texture, labor, irrigation) to complement, rather than replace, local agricultural wisdom.
          </p>
        </div>
      </div>

      <div>
        <div class="img-frame" style="height: 350px; margin-bottom: 12px;">
          <img src="{SHOT_ADVISOR}" alt="NASA Field Advisor Drawer">
        </div>
        <div class="card">
          <div style="font-size: 12.5px; font-weight: 750; color: #81C784; margin-bottom: 4px;">Interactive NASA Field Advisor Drawer</div>
          <p style="font-size: 11px; line-height: 1.4; color: #CCDCD2;">
            Sub-field 3&times;3 water stress and erosion heatmaps with direct links to NASA Worldview and open satellite archives, allowing extension officers to verify every agronomic recommendation.
          </p>
        </div>
      </div>
    </div>
    <div class="footer-bar">
      <span>Inclusive Design &bull; Tanzanian Swahili &amp; English Workstation</span>
      <span>Empowering Smallholders and Extension Officers</span>
    </div>
  </div>

  <!-- SLIDE 7: REAL-WORLD IMPACT, OPEN RESOURCES & CITATIONS -->
  <div class="slide light">
    <div class="top-meta">
      <div class="badge">Open Science &bull; Community Impact</div>
      <div class="slide-num">07 / 07</div>
    </div>
    <h2>Real-World Impact, Open Resources &amp; NASA Citations</h2>
    <div class="subhead">Open-access tools empowering farming communities, extension officers, and agricultural researchers worldwide.</div>
    <div class="split-2">
      <div class="card">
        <div style="font-size: 13px; font-weight: 800; color: #1B5E20; margin-bottom: 10px; text-transform: uppercase;">Who Benefits &amp; Real Impact</div>
        <ul class="metric-list" style="margin-bottom: 14px;">
          <li><strong>Smallholder Farmers:</strong> Avoid devastating dry spells, preserve topsoil, and cut synthetic fertilizer costs through natural legume nitrogen fixation.</li>
          <li><strong>Agricultural Extension Officers:</strong> Practical digital tool to counsel farming communities with transparent satellite evidence and local language support.</li>
          <li><strong>Cooperatives &amp; Planners:</strong> Regional insights to plan community seed banks and climate-resilient crop distribution.</li>
          <li><strong>100% Free &amp; Open Access:</strong> Fully accessible decision workstation with no paywalls or gated logins.</li>
        </ul>
        <div style="background: #E8F5E9; border: 1px solid #C8E6C9; border-radius: 6px; padding: 10px 12px; font-size: 11px; color: #1B5E20;">
          <strong>Live Web Application:</strong> <a href="https://terrashift-plus.pages.dev" style="color: #1B5E20; font-weight: 700; text-decoration: none;">https://terrashift-plus.pages.dev</a><br>
          <strong>Open Source Repository:</strong> <a href="https://github.com/jiajiri/TerraShift" style="color: #1B5E20; font-weight: 700; text-decoration: none;">https://github.com/jiajiri/TerraShift</a><br>
          <strong>Full Technical Paper:</strong> <a href="https://terrashift-plus.pages.dev/research-paper.pdf" style="color: #1B5E20; font-weight: 700; text-decoration: none;">https://terrashift-plus.pages.dev/research-paper.pdf</a>
        </div>
      </div>

      <div class="card">
        <div style="font-size: 13px; font-weight: 800; color: #1B5E20; margin-bottom: 10px; text-transform: uppercase;">NASA Data &amp; Partner Citations</div>
        <div style="font-size: 10.5px; line-height: 1.5; color: #2D3D32; display: flex; flex-direction: column; gap: 5px;">
          <div>&bull; <strong>NASA POWER v2.0:</strong> Daily meteorology &amp; solar radiation (Sparks, 2018).</div>
          <div>&bull; <strong>NASA SMAP L4:</strong> Global 9km root-zone soil wetness (Reichle et al., 10.5067/T5RUATAQREF8).</div>
          <div>&bull; <strong>GPM IMERG:</strong> Multi-satellite calibrated precipitation (Huffman et al., 10.5067/GPM/IMERGDF/DAY/07).</div>
          <div>&bull; <strong>MODIS MOD13Q1:</strong> 250m 16-day NDVI vegetation dynamics (Didan, 10.5067/MODIS/MOD13Q1.061).</div>
          <div>&bull; <strong>ECOSTRESS &amp; GEDI:</strong> Thermal stress &amp; canopy structural height.</div>
          <div>&bull; <strong>iSDAsoil 30m &amp; ISRIC SoilGrids 2.0:</strong> African and global pedotransfer datasets.</div>
          <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #DDD; font-size: 10px; color: #666;">
            <strong>AI &amp; SI Statement:</strong> Machine learning is restricted to surrogate mathematical acceleration and natural language clarification; core crop advice strictly adheres to verified biophysical laws.
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
        cmd = [
            "chromium-browser",
            "--headless",
            "--disable-gpu",
            "--no-sandbox",
            "--user-data-dir=/tmp/chromium_deck_build",
            "--print-to-pdf-no-header",
            f"--print-to-pdf={DOCS_PDF}",
            temp_html
        ]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        for _ in range(30):
            time.sleep(0.5)
            if DOCS_PDF.exists() and os.path.getsize(DOCS_PDF) > 100000:
                time.sleep(0.5)
                break
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except Exception:
            proc.kill()
        
        # Copy to frontend public and dist
        subprocess.run(["cp", str(DOCS_PDF), str(PUBLIC_PDF)], check=True)
        if DIST_PDF.parent.exists():
            subprocess.run(["cp", str(DOCS_PDF), str(DIST_PDF)], check=True)
        print(f"Successfully generated: {DOCS_PDF} ({os.path.getsize(DOCS_PDF)} bytes)")
        print(f"Copied to: {PUBLIC_PDF} and {DIST_PDF}")
    finally:
        if os.path.exists(temp_html):
            os.remove(temp_html)

if __name__ == "__main__":
    generate_pdf()

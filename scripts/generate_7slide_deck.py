#!/usr/bin/env python3
"""
Generate an executive, judge-winning, minimalist 7-Slide Pitch Deck for TerraShift+
(NASA Space Apps Challenge 2026 Submission).

Design System:
- Professional presentation layout matching winning reference decks (Twisters black theme + clean Canva nature palette)
- Zero "vibecoded" / AI artifacts (no green card-in-card containers, no weird rounded borders, no floating badges)
- Large, bold headlines and scannable stats
- Clean, centered, flush screenshots with natural fit
- 60% less text (max 25-45 words per slide)
- Zero NASA meatball/worm logos (Space Apps 2026 compliant)
- Scannable QR code on Slide 7 (https://terrashift-plus.pages.dev)
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

SHOT_HERO = get_b64(ASSETS_DIR / "shot_hero_map_big.png")
SHOT_MAP = get_b64(ASSETS_DIR / "shot_map_clean_fitted.png")
SHOT_STRAT = get_b64(ASSETS_DIR / "shot_strategies_clean.png")
SHOT_SWAHILI = get_b64(ASSETS_DIR / "shot_swahili_big.png")
SHOT_ADVISOR = get_b64(ASSETS_DIR / "shot_advisor_fitted.png")
QR_CODE = get_b64(ASSETS_DIR / "qr_terrashift.png")

HTML_TEMPLATE = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>TerraShift+ Pitch Deck</title>
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
      -webkit-font-smoothing: antialiased;
      image-rendering: -webkit-optimize-contrast;
      margin: 0;
      padding: 0;
      background: #000000;
    }}
    .slide {{
      width: 1280px;
      height: 720px;
      position: relative;
      overflow: hidden;
      page-break-after: always;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }}

    /* SLIDE 1: Twisters-style dark minimalist title */
    .slide-dark {{
      background: #0C0F0D;
      color: #FFFFFF;
      padding: 56px 64px 44px 64px;
      justify-content: space-between;
    }}

    /* SLIDE LIGHT: Clean cream/mineral theme matching Canva Scope of Work */
    .slide-light {{
      background: #F4F3EE;
      color: #1A261D;
      padding: 44px 60px 32px 60px;
      justify-content: space-between;
    }}

    /* Clean subtle top bar */
    .slide-header {{
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 2px solid #E2DEC8;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }}
    .slide-dark .slide-header {{
      border-bottom: 1px solid rgba(255, 255, 255, 0.15);
      margin-bottom: 20px;
    }}
    .section-tag {{
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #386641;
    }}
    .slide-dark .section-tag {{
      color: #52B788;
    }}
    .slide-index {{
      font-size: 13px;
      font-weight: 600;
      color: #7B857E;
      letter-spacing: 0.05em;
    }}

    /* Clean Headings */
    h1.title {{
      font-size: 68px;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1.02;
      color: #FFFFFF;
      margin-bottom: 16px;
    }}
    .lead-subtitle {{
      font-size: 24px;
      font-weight: 400;
      line-height: 1.35;
      color: #B7C9BD;
      max-width: 820px;
    }}

    h2.slide-title {{
      font-size: 34px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: #1A3022;
      margin-bottom: 6px;
    }}
    .slide-dark h2.slide-title {{
      color: #FFFFFF;
    }}
    .slide-desc {{
      font-size: 16px;
      color: #526356;
      line-height: 1.4;
      margin-bottom: 20px;
    }}

    /* Clean presentation bullet points with circular green marker */
    .point-item {{
      margin-bottom: 22px;
    }}
    .point-head {{
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 6px;
    }}
    .point-dot {{
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #2D6A4F;
      flex-shrink: 0;
    }}
    .point-title {{
      font-size: 19px;
      font-weight: 750;
      color: #1A3022;
      letter-spacing: -0.01em;
    }}
    .point-body {{
      font-size: 14.5px;
      color: #435448;
      line-height: 1.45;
      padding-left: 26px;
    }}

    /* Footer bar */
    .slide-footer {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #DFDBD0;
      padding-top: 10px;
      font-size: 11.5px;
      color: #6E7972;
    }}
    .slide-dark .slide-footer {{
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      color: #8C9990;
    }}

    /* Clean Image Display - ZERO nested card borders or heavy margins */
    .clean-frame {{
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      background: #FFFFFF;
    }}
    .clean-frame img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      background: #FAF9F5;
    }}

    /* Big stat block */
    .stat-number {{
      font-size: 56px;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
      color: #1A3022;
    }}
    .stat-label {{
      font-size: 14.5px;
      font-weight: 700;
      color: #2D6A4F;
      margin-top: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .stat-desc {{
      font-size: 13.5px;
      color: #55665A;
      line-height: 1.4;
      margin-top: 4px;
    }}
  </style>
</head>
<body>

  <!-- ===================================================================
       SLIDE 1: CLEAN COVER (Twisters Style - Bold Minimalist Impact)
       =================================================================== -->
  <div class="slide slide-dark">
    <div class="slide-header">
      <div class="section-tag">NASA Space Apps Challenge 2026 &bull; Field Shift</div>
      <div class="slide-index">01 / 07</div>
    </div>

    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; max-width: 960px;">
      <h1 class="title">TerraShift+</h1>
      <p class="lead-subtitle">
        Turning NASA Earth Observations Into Climate-Resilient Crop Rotations for Smallholder Farmers.
      </p>
      
      <div style="margin-top: 40px; display: flex; gap: 48px; border-left: 3px solid #52B788; padding-left: 20px;">
        <div>
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8C9990;">Focus Region</div>
          <div style="font-size: 17px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">East Africa Semi-Arid &bull; Dodoma, Tanzania</div>
        </div>
        <div>
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8C9990;">NASA Satellite Telemetry</div>
          <div style="font-size: 17px; font-weight: 700; color: #52B788; margin-top: 2px;">SMAP Soil Moisture &bull; MODIS NDVI &bull; NASA POWER</div>
        </div>
        <div>
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #8C9990;">Product</div>
          <div style="font-size: 17px; font-weight: 700; color: #FFFFFF; margin-top: 2px;">Open-Access Field Decision Workstation</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Team: Lazaro A. Philemon (TZ) &bull; Jackson Haruni (TZ) &bull; Arnold Philemon (KE)</span>
      <span>Live Web App: terrashift-plus.pages.dev</span>
    </div>
  </div>

  <!-- ===================================================================
       SLIDE 2: THE FARMER'S CHALLENGE (Human Story + Big Numbers)
       =================================================================== -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="section-tag">The Challenge</div>
      <div class="slide-index">02 / 07</div>
    </div>

    <div style="flex: 1; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 50px; align-items: center;">
      <!-- Left: Ground Reality -->
      <div>
        <h2 class="slide-title">When Rains Shift 28 Days,<br>Monoculture Fails.</h2>
        <div style="font-size: 18px; font-style: italic; color: #2D6A4F; line-height: 1.45; margin: 20px 0; border-left: 4px solid #2D6A4F; padding-left: 18px;">
          "Smallholder farmers in Dodoma face 6 to 7 months of bare, unshaded soil every dry season. When the rains arrive late or pause mid-season, continuous maize crops suffer complete vegetative arrest."
        </div>
        <p style="font-size: 15px; color: #435448; line-height: 1.5;">
          Farmers cannot afford expensive laboratory soil tests or commercial agronomists. Without seasonal soil water balance data, smallholders cannot predict when to intercrop legumes or switch to drought-hardy sorghum.
        </p>
      </div>

      <!-- Right: Clean Big Stats -->
      <div style="display: flex; flex-direction: column; gap: 24px; padding-left: 20px; border-left: 1px solid #D5CEBE;">
        <div>
          <div class="stat-number">6 Mos</div>
          <div class="stat-label">Bare Soil Vulnerability</div>
          <div class="stat-desc">May to October dry season topsoil is stripped by wind and baking equatorial heat.</div>
        </div>
        <div>
          <div class="stat-number">1,241 mm</div>
          <div class="stat-label">Annual Evapotranspiration Deficit</div>
          <div class="stat-desc">NASA POWER records 1,833 mm annual thirst against only 592 mm seasonal rainfall.</div>
        </div>
        <div>
          <div class="stat-number">82%</div>
          <div class="stat-label">Smallholder Reliance</div>
          <div class="stat-desc">Community food security depends on rainfed maize without irrigation buffers.</div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Baseline Telemetry: Dodoma, Tanzania (-6.1630, 35.7516)</span>
      <span>NASA POWER v2.0 5-Year Climatology Baseline</span>
    </div>
  </div>

  <!-- ===================================================================
       SLIDE 3: HOW IT WORKS (Canva Scope of Work Layout)
       =================================================================== -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="section-tag">Methodology &bull; Field Shift</div>
      <div class="slide-index">03 / 07</div>
    </div>

    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
      <h2 class="slide-title" style="margin-bottom: 24px;">How TerraShift+ Solves The Gap</h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 36px;">
        <div class="point-item">
          <div class="point-head">
            <div class="point-dot"></div>
            <div class="point-title">1. Locate Any Farm</div>
          </div>
          <div class="point-body">
            Search any village, district, or GPS coordinate across East Africa. TerraShift+ instantly pulls localized satellite observations with zero login or setup required.
          </div>
        </div>

        <div class="point-item">
          <div class="point-head">
            <div class="point-dot"></div>
            <div class="point-title">2. Diagnose Soil Water</div>
          </div>
          <div class="point-body">
            Pairs SMAP root-zone soil wetness (0–100 cm) with MODIS 250m vegetative cover to flag vulnerable bare-soil months and water stress intervals before planting.
          </div>
        </div>

        <div class="point-item">
          <div class="point-head">
            <div class="point-dot"></div>
            <div class="point-title">3. Recommend Rotations</div>
          </div>
          <div class="point-body">
            Simulates 4 multi-season cropping strategies balancing drought survival, soil nitrogen replenishment, and continuous food security under real climate extremes.
          </div>
        </div>
      </div>

      <div style="margin-top: 20px; padding: 14px 20px; background: #E8E5DA; border-radius: 6px; font-size: 13.5px; color: #2D4031; line-height: 1.45;">
        <strong>Bilingual Accessibility:</strong> Designed for agricultural extension officers (<em>Maafisa Ugani</em>) and village cooperatives with immediate one-click Swahili &amp; English switching.
      </div>
    </div>

    <div class="slide-footer">
      <span>Biophysical Validation: FAO-56 Penman-Monteith Evapotranspiration + NASA Earth Science Telemetry</span>
      <span>Fully Open-Source Platform</span>
    </div>
  </div>

  <!-- ===================================================================
       SLIDE 4: THE LIVE FIELD INTERFACE (Clean Image + Scope Bullets)
       =================================================================== -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="section-tag">Live Interface</div>
      <div class="slide-index">04 / 07</div>
    </div>

    <div style="flex: 1; display: grid; grid-template-columns: 1fr 1.35fr; gap: 36px; align-items: center;">
      <!-- Left: Clean bullets matching user reference -->
      <div>
        <h2 class="slide-title" style="margin-bottom: 18px;">Real-Time Farm Diagnostics</h2>
        
        <div class="point-item">
          <div class="point-head">
            <div class="point-dot"></div>
            <div class="point-title">Root-Zone Wetness Map</div>
          </div>
          <div class="point-body">
            High-resolution regional view showing live SMAP surface &amp; root-zone soil moisture alongside 3x3 neighbor risk grids.
          </div>
        </div>

        <div class="point-item">
          <div class="point-head">
            <div class="point-dot"></div>
            <div class="point-title">Bare-Soil Exposure Alert</div>
          </div>
          <div class="point-body">
            Flags critical months where vegetative cover falls below NDVI 0.25, exposing unshaded soil to severe wind and rainfall erosion.
          </div>
        </div>

        <div class="point-item">
          <div class="point-head">
            <div class="point-dot"></div>
            <div class="point-title">Water Balance Deficit</div>
          </div>
          <div class="point-body">
            Compares monthly crop water thirst (ET₀) directly against rainfall history to pinpoint when soil storage runs dry.
          </div>
        </div>
      </div>

      <!-- Right: Clean centered image, NO card border or heavy margin -->
      <div class="clean-frame" style="height: 480px;">
        <img src="{SHOT_MAP}" alt="Live Workstation Map and Water Balance">
      </div>
    </div>

    <div class="slide-footer">
      <span>Field Telemetry: Dodoma Baseline &bull; Active Water Balance Table</span>
      <span>NASA SMAP &bull; MODIS MOD13Q1</span>
    </div>
  </div>

  <!-- ===================================================================
       SLIDE 5: 4-STRATEGY CLIMATE SIMULATION (Clean Wide Matrix)
       =================================================================== -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="section-tag">Rotational Decision Matrix</div>
      <div class="slide-index">05 / 07</div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px;">
      <div>
        <h2 class="slide-title">4 Cropping Pathways for Climate Volatility</h2>
        <div class="slide-desc" style="margin-bottom: 0;">Evaluating drought risk, soil nitrogen balance, and farmer food security across multi-year cycles.</div>
      </div>
      <div style="display: flex; gap: 20px; font-size: 13px; font-weight: 700; color: #2D6A4F;">
        <div>&bull; Current Baseline</div>
        <div>&bull; Max Drought Buffer</div>
        <div>&bull; High-Yield Rotation</div>
        <div>&bull; Balanced Legume Intercrop</div>
      </div>
    </div>

    <!-- Clean Wide Image Display -->
    <div class="clean-frame" style="flex: 1; min-height: 0; max-height: 470px;">
      <img src="{SHOT_STRAT}" alt="4-Strategy Comparison Matrix" style="object-fit: contain; background: #FAF9F5;">
    </div>

    <div class="slide-footer" style="margin-top: 12px;">
      <span>Every strategy evaluates seasonal water demand against 5-year NASA POWER rainfall probability</span>
      <span>Zero Monoculture Vulnerability</span>
    </div>
  </div>

  <!-- ===================================================================
       SLIDE 6: LOCAL IMPACT & EXTENSION SUPPORT (Swahili + Advisor)
       =================================================================== -->
  <div class="slide slide-light">
    <div class="slide-header">
      <div class="section-tag">Community &bull; Field Accessibility</div>
      <div class="slide-index">06 / 07</div>
    </div>

    <div style="margin-bottom: 14px;">
      <h2 class="slide-title">Built For Local Extension Officers (Maafisa Ugani)</h2>
      <div class="slide-desc" style="margin-bottom: 0;">Full Swahili language support paired with interactive agronomic guidance for field calibration.</div>
    </div>

    <div style="flex: 1; display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; min-height: 0; max-height: 470px;">
      <!-- Left: Swahili Workstation View -->
      <div class="clean-frame" style="height: 100%;">
        <img src="{SHOT_SWAHILI}" alt="Tanzanian Swahili Workstation View">
      </div>

      <!-- Right: Field Advisor Guidance -->
      <div class="clean-frame" style="height: 100%;">
        <img src="{SHOT_ADVISOR}" alt="Field Agronomic Guidance Drawer" style="object-fit: contain; background: #FAF9F5;">
      </div>
    </div>

    <div class="slide-footer" style="margin-top: 12px;">
      <span>Advisory tool strictly designed to support—never replace—local farmer wisdom and extension officers</span>
      <span>Bilingual Swahili &amp; English</span>
    </div>
  </div>

  <!-- ===================================================================
       SLIDE 7: TEST LIVE & OPEN SCIENCE (Twisters Dark Closure)
       =================================================================== -->
  <div class="slide slide-dark">
    <div class="slide-header">
      <div class="section-tag">Open Science &bull; Test Live</div>
      <div class="slide-index">07 / 07</div>
    </div>

    <div style="flex: 1; display: grid; grid-template-columns: 1.35fr 0.65fr; gap: 48px; align-items: center;">
      <!-- Left: Mission & Links -->
      <div>
        <h2 class="slide-title" style="font-size: 44px; margin-bottom: 16px;">Adapt Every Season.<br>Protect Every Soil.</h2>
        <p style="font-size: 16px; color: #B7C9BD; line-height: 1.5; margin-bottom: 24px; max-width: 600px;">
          TerraShift+ is 100% free, public, and open-source for smallholders, agricultural cooperatives, extension workers, and climate researchers worldwide.
        </p>

        <div style="display: flex; flex-direction: column; gap: 10px; font-size: 14px; margin-bottom: 24px;">
          <div><strong style="color: #FFFFFF;">Live Web Application:</strong> <span style="color: #52B788; font-weight: 700;">https://terrashift-plus.pages.dev</span></div>
          <div><strong style="color: #FFFFFF;">Open Source Repository:</strong> <span style="color: #52B788; font-weight: 700;">https://github.com/jiajiri/TerraShift</span></div>
          <div><strong style="color: #FFFFFF;">Technical Science Paper:</strong> <span style="color: #52B788; font-weight: 700;">https://terrashift-plus.pages.dev/research-paper.pdf</span></div>
        </div>

        <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 12px; font-size: 11px; color: #8C9990; line-height: 1.45; max-width: 640px;">
          <strong>NASA Earth Science Datasets:</strong> NASA POWER v2.0 Climatology &bull; SMAP L4 Global Root-Zone Soil Moisture &bull; MODIS MOD13Q1 Vegetation Index &bull; FAO-56 Penman-Monteith Evapotranspiration.
        </div>
      </div>

      <!-- Right: Clean Minimalist QR Code Box -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: #FFFFFF; border-radius: 12px; padding: 24px; box-shadow: 0 8px 30px rgba(0,0,0,0.4);">
        <img src="{QR_CODE}" alt="QR Code to https://terrashift-plus.pages.dev" style="width: 210px; height: 210px; display: block; margin-bottom: 12px;">
        <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; color: #0C0F0D;">SCAN TO TEST LIVE</div>
        <div style="font-size: 11.5px; color: #526356; margin-top: 4px; font-weight: 600;">terrashift-plus.pages.dev</div>
      </div>
    </div>

    <div class="slide-footer">
      <span>NASA Space Apps Challenge 2026 Submission &bull; Team TerraShift+</span>
      <span>Thank you to the Judges and the NASA Earth Science Division</span>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    print("Generating TerraShift-Demo-7Slides.pdf using Playwright...")
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(HTML_TEMPLATE)
        temp_html = f.name

    js_code = f"""
const {{ chromium }} = require("playwright");
const fs = require("fs");

(async () => {{
  const browser = await chromium.launch({{
    executablePath: "/usr/bin/chromium-browser",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  }});
  const page = await browser.newPage({{
    viewport: {{ width: 1280, height: 720 }},
    deviceScaleFactor: 2
  }});
  await page.goto("file://{temp_html}", {{ waitUntil: "networkidle" }});
  await page.pdf({{
    path: "{DOCS_PDF}",
    width: "1280px",
    height: "720px",
    printBackground: true,
    margin: {{ top: 0, right: 0, bottom: 0, left: 0 }}
  }});
  await browser.close();
  console.log("PDF generation complete via Playwright!");
}})();
"""
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as jf:
        jf.write(js_code)
        temp_js = jf.name

    try:
        env = os.environ.copy()
        env["NODE_PATH"] = str(REPO_ROOT / "node_modules")
        res = subprocess.run(["node", temp_js], capture_output=True, text=True, check=True, env=env, cwd=str(REPO_ROOT))
        print(res.stdout)
        
        # Copy to frontend public and dist locally
        subprocess.run(["cp", str(DOCS_PDF), str(PUBLIC_PDF)], check=True)
        if DIST_PDF.parent.exists():
            subprocess.run(["cp", str(DOCS_PDF), str(DIST_PDF)], check=True)
        print(f"Successfully generated: {DOCS_PDF} ({os.path.getsize(DOCS_PDF)} bytes)")
        print(f"Copied to: {PUBLIC_PDF} and {DIST_PDF}")
    finally:
        if os.path.exists(temp_html):
            os.remove(temp_html)
        if os.path.exists(temp_js):
            os.remove(temp_js)

if __name__ == "__main__":
    generate_pdf()

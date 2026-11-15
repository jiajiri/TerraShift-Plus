#!/usr/bin/env python3
"""
Generate NASA Space Apps Challenge 2026 Submission Images:
1. Project Cover Photo (16:9 Widescreen: 1920x1080 and 1280x720) with 70% Safe Zone
2. Team Avatar (1:1 Square: 800x800 and 512x512) with Circular Crop-Safe Margin
"""

import base64
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from PIL import Image

REPO_ROOT = Path(__file__).resolve().parent.parent
DOCS_ASSETS = REPO_ROOT / "docs" / "nasa-assets"
PUBLIC_ASSETS = REPO_ROOT / "frontend" / "public" / "assets"
ASSETS_DIR = REPO_ROOT / "docs" / "demo-deck" / "assets"

def get_b64(path):
    with open(path, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode("utf-8")

SHOT_MAP = get_b64(ASSETS_DIR / "shot_map_clean_fitted.png")

HTML_COVER = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    body {{
      width: 1920px;
      height: 1080px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 80% 20%, #1B3D2B 0%, #0C1510 65%, #060B08 100%);
      color: #FFFFFF;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }}

    /* Subtle orbital lines */
    .orbit {{
      position: absolute;
      border: 1px solid rgba(82, 183, 136, 0.12);
      border-radius: 50%;
      pointer-events: none;
    }}
    .orbit-1 {{ width: 1400px; height: 1400px; right: -300px; top: -400px; }}
    .orbit-2 {{ width: 1800px; height: 1800px; right: -500px; top: -600px; }}

    /* SAFE ZONE: Middle 70% (1344 x 756 px) with 288px left/right margins */
    .safe-container {{
      width: 1680px;
      height: 920px;
      display: grid;
      grid-template-columns: 1fr 1.05fr;
      gap: 48px;
      align-items: center;
      z-index: 10;
    }}

    /* Left Content Rail */
    .left-rail {{
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}

    .tag-badge {{
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 750;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #52B788;
      margin-bottom: 20px;
    }}

    h1.hero-title {{
      font-size: 92px;
      font-weight: 950;
      letter-spacing: -0.035em;
      line-height: 1;
      color: #FFFFFF;
      margin-bottom: 20px;
    }}

    p.hero-subtitle {{
      font-size: 26px;
      font-weight: 450;
      line-height: 1.35;
      color: #D2E4D8;
      margin-bottom: 36px;
      max-width: 760px;
    }}

    .telemetry-row {{
      display: flex;
      gap: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.16);
      margin-bottom: 36px;
    }}
    .telemetry-item {{
      display: flex;
      flex-direction: column;
    }}
    .telemetry-label {{
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8C9990;
      margin-bottom: 4px;
    }}
    .telemetry-val {{
      font-size: 18px;
      font-weight: 750;
      color: #FFFFFF;
    }}

    .meta-bar {{
      font-size: 15px;
      color: #A3B8AB;
      line-height: 1.5;
    }}
    .meta-bar strong {{
      color: #FFFFFF;
    }}

    /* Right Preview Rail (Framed Map Screenshot) */
    .right-preview {{
      width: 100%;
      height: 600px;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(82, 183, 136, 0.35);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(45, 106, 79, 0.25);
      background: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
    }}
    .right-preview img {{
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #F4F3EE;
      display: block;
    }}
  </style>
</head>
<body>
  <div class="orbit orbit-1"></div>
  <div class="orbit orbit-2"></div>

  <div class="safe-container">
    <div class="left-rail">
      <div class="tag-badge">&bull; NASA Space Apps Challenge 2026 &bull; Field Shift</div>
      <h1 class="hero-title">TerraShift+</h1>
      <p class="hero-subtitle">
        Turning NASA Earth Observations Into Climate-Resilient Crop Rotations for Smallholder Farmers.
      </p>

      <div class="telemetry-row">
        <div class="telemetry-item">
          <div class="telemetry-label">NASA Satellites</div>
          <div class="telemetry-val" style="color: #52B788;">SMAP &bull; MODIS &bull; POWER</div>
        </div>
        <div class="telemetry-item">
          <div class="telemetry-label">Farming Focus</div>
          <div class="telemetry-val">Dodoma &amp; Semi-Arid Tropics</div>
        </div>
        <div class="telemetry-item">
          <div class="telemetry-label">Live App</div>
          <div class="telemetry-val" style="color: #64B5F6;">terrashift-plus.pages.dev</div>
        </div>
      </div>

      <div class="meta-bar">
        <strong>Team:</strong> Lazaro A. Philemon (TZ) &bull; Jackson Haruni (TZ) &bull; Arnold Philemon (KE)
      </div>
    </div>

    <div class="right-preview">
      <img src="{SHOT_MAP}" alt="TerraShift+ Live Workstation">
    </div>
  </div>
</body>
</html>
"""

HTML_AVATAR = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 800px;
      height: 800px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: radial-gradient(circle at 50% 40%, #163826 0%, #0D1C14 60%, #060B08 100%);
      color: #FFFFFF;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-font-smoothing: antialiased;
    }

    /* Outer circular boundary representation for verification */
    .avatar-wrapper {
      width: 660px;
      height: 660px;
      border-radius: 50%;
      border: 3px solid rgba(82, 183, 136, 0.45);
      background: radial-gradient(circle, rgba(45, 106, 79, 0.25) 0%, rgba(12, 24, 18, 0.85) 100%);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(82, 183, 136, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      position: relative;
    }

    /* Satellite / Sprout SVG Emblem */
    .emblem-svg {
      width: 160px;
      height: 160px;
      margin-bottom: 24px;
      filter: drop-shadow(0 6px 16px rgba(82, 183, 136, 0.4));
    }

    h1.logo-title {
      font-size: 56px;
      font-weight: 950;
      letter-spacing: -0.03em;
      line-height: 1;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    h1.logo-title span {
      color: #52B788;
    }

    .logo-sub {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #8CBA9E;
      margin-bottom: 20px;
    }

    .badge-pill {
      font-size: 13px;
      font-weight: 750;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 20px;
      background: rgba(82, 183, 136, 0.2);
      color: #52B788;
      border: 1px solid rgba(82, 183, 136, 0.4);
    }
  </style>
</head>
<body>
  <div class="avatar-wrapper">
    <!-- Clean geometric earth + seedling telemetry SVG -->
    <svg class="emblem-svg" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="44" stroke="#52B788" stroke-width="3" stroke-dasharray="6 4" opacity="0.6"/>
      <circle cx="50" cy="50" r="32" fill="#1B4332" stroke="#52B788" stroke-width="2.5"/>
      <!-- Seedling / Earth Path -->
      <path d="M50 68 V38" stroke="#D8F3DC" stroke-width="4" stroke-linecap="round"/>
      <path d="M50 48 C42 44 36 34 50 26 C50 34 46 44 50 48 Z" fill="#74C69D"/>
      <path d="M50 42 C58 38 64 28 50 20 C50 28 54 38 50 42 Z" fill="#95D5B2"/>
      <!-- Orbital sensor arcs -->
      <path d="M22 34 C30 20 70 20 78 34" stroke="#52B788" stroke-width="3" stroke-linecap="round"/>
    </svg>

    <h1 class="logo-title">TerraShift<span>+</span></h1>
    <div class="logo-sub">FIELD SHIFT &bull; 2026</div>
    <div class="badge-pill">NASA Space Apps Team</div>
  </div>
</body>
</html>
"""

def generate_images():
    print("Generating NASA Space Apps Cover & Avatar Images...")
    DOCS_ASSETS.mkdir(parents=True, exist_ok=True)
    PUBLIC_ASSETS.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(HTML_COVER)
        cover_html = f.name

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(HTML_AVATAR)
        avatar_html = f.name

    cover_1080 = DOCS_ASSETS / "project-cover-1920x1080.png"
    cover_720 = DOCS_ASSETS / "project-cover-1280x720.png"
    avatar_800 = DOCS_ASSETS / "team-avatar-800x800.png"
    avatar_512 = DOCS_ASSETS / "team-avatar-512x512.png"

    js_code = f"""
const {{ chromium }} = require("playwright");

(async () => {{
  const browser = await chromium.launch({{
    executablePath: "/usr/bin/chromium-browser",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  }});

  // 1. Cover Photo 1920x1080
  const page1 = await browser.newPage({{ viewport: {{ width: 1920, height: 1080 }}, deviceScaleFactor: 1 }});
  await page1.goto("file://{cover_html}", {{ waitUntil: "networkidle" }});
  await page1.screenshot({{ path: "{cover_1080}", type: "png" }});
  console.log("Captured project-cover-1920x1080.png");

  // 2. Team Avatar 800x800
  const page2 = await browser.newPage({{ viewport: {{ width: 800, height: 800 }}, deviceScaleFactor: 1 }});
  await page2.goto("file://{avatar_html}", {{ waitUntil: "networkidle" }});
  await page2.screenshot({{ path: "{avatar_800}", type: "png" }});
  console.log("Captured team-avatar-800x800.png");

  await browser.close();
}})();
"""
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as jf:
        jf.write(js_code)
        temp_js = jf.name

    try:
        env = os.environ.copy()
        env["NODE_PATH"] = str(REPO_ROOT / "node_modules")
        subprocess.run(["node", temp_js], check=True, env=env, cwd=str(REPO_ROOT))

        # Generate 1280x720 and 512x512 downscaled versions using Pillow
        im_cover = Image.open(cover_1080)
        im_cover_720 = im_cover.resize((1280, 720), Image.Resampling.LANCZOS)
        im_cover_720.save(cover_720, optimize=True)

        im_avatar = Image.open(avatar_800)
        im_avatar_512 = im_avatar.resize((512, 512), Image.Resampling.LANCZOS)
        im_avatar_512.save(avatar_512, optimize=True)

        # Copy to frontend/public/assets
        subprocess.run(["cp", str(cover_1080), str(PUBLIC_ASSETS / "project-cover.png")], check=True)
        subprocess.run(["cp", str(avatar_800), str(PUBLIC_ASSETS / "team-avatar.png")], check=True)

        print("\n=== All NASA Space Apps Assets Created ===")
        for p in [cover_1080, cover_720, avatar_800, avatar_512]:
            print(f"- {p.name}: {p.stat().st_size / 1024:.1f} KB ({Image.open(p).size})")
    finally:
        for t in [cover_html, avatar_html, temp_js]:
            if os.path.exists(t):
                os.remove(t)

if __name__ == "__main__":
    generate_images()

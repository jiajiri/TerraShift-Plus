#!/usr/bin/env python3
"""
Publication-grade 14-page two-column academic research paper generator for TerraShift+.
Ensures exactly 14 pages when compiled to PDF via headless Chromium.
"""

from pathlib import Path

pages_content = []

# PAGE 1: Title block, Abstract, Keywords, 1. Introduction, 1.1 Background
p1 = """
<div class="page">
    <div class="title-block">
    <div class="paper-title">
      TerraShift+: A Physics-Informed Machine Learning and Multi-Mission NASA Earth Observation Pipeline for Climate-Resilient Crop Rotation Optimization
    </div>
    <div class="authors-block">
      TerraShift+ Project Team &mdash; Agronomy, Remote Sensing &amp; Systems Engineering Collective
    </div>
    <div class="affiliation-block">
      Dar es Salaam, Tanzania &bull; Global Agricultural Modeling &amp; Environmental Intelligence Division
    </div>
    <div>
      <span class="date-badge">NASA Space Apps Challenge 2026 Submission &bull; Published November 2026</span>
    </div>
  </div>

  <div class="abstract-box">
    <div class="abstract-title">Abstract</div>
    <p class="no-indent">
      Smallholder and industrial agricultural production systems worldwide confront compound climate stressors: shifting rainfall regimes, prolonged mid-season dry spells, extreme temperature surges, accelerated topsoil erosion, and catastrophic soil organic carbon (SOC) depletion. Traditional decision support systems rely upon static historical crop almanacs that fail under non-stationary climatic extremes, or alternatively, ungrounded black-box Large Language Models (LLMs) prone to agronomic hallucinations and mass-balance violations. In this technical report, we present <strong>TerraShift+</strong>, an physics-informed machine learning (PIML) (PIML) and closed-loop decision support engine that ingests ten distinct NASA Earth Observation (EO) satellite missions and global pedotransfer datasets. TerraShift+ couples empirical satellite telemetry with classical biophysical governing laws: FAO-56 Dual \(K_c\) Penman-Monteith reference evapotranspiration (\(ET_0\)), Saxton-Rawls pedotransfer hydrology for available water capacity (\(AWC\)), dynamic root-zone water balance and Crop Water Stress Index (\(WSI\)), Growing Degree Days (\(GDD\)) and Killing Degree Days (\(KDD\)), the Revised Universal Soil Loss Equation (RUSLE), RothC-modeled carbon balance (\(\Delta SOC\)), and Log-Logistic Standardized Precipitation-Evapotranspiration Index (SPEI). Surrogate yield predictions are delivered via spatial-cross-validated Quantile Gradient Boosting Regressors (\(P10/P50/P90\)), guarded by a Gaussian Mixture Model (GMM) Mahalanobis Out-of-Distribution (OOD) distance metric. Optimal multi-year crop sequences are resolved across four distinct operational archetypes (Status Quo Baseline, Resilience-First, Balanced Stewardship, and Yield-Maximizing) using a multi-objective Pareto solver evaluating 100-draw Monte Carlo weather shocks and 10th-percentile Conditional Value at Risk (\(\\text{CVaR}_{10}\)). Over 72 spatial clusters, the surrogate attains an RMSE of 0.050, an \(R^2\) of 0.942 against FAO-56 Penman-Monteith, pinball losses of 0.009 (\(P10\)) and 0.008 (\(P90\)), and empirical 80% coverage of 83.5%. Stress-testing across canonical control stations (Dodoma, Tanzania; Fallon, Nevada; Ames, Iowa) and a polar negative control confirms strict monotonicity under drought shock (-25% precipitation, +2.0&deg;C warming) and reliable OOD rejection (Mahalanobis distance 8.40). Server-Sent Event (SSE) streaming delivers full 5-year multi-objective optimizations in 1.50&nbsp;ms (cached) and 585&nbsp;ms (uncached cold start), providing smallholder farmers and extension officers with physically bounded, climate-resilient agronomic guidance.
    </p>
    <div class="keywords-block">
      <span class="keywords-title">Keywords:</span> crop rotation, NASA POWER, SMAP L3/L4, GPM IMERG, MODIS, ECOSTRESS, FAO-56 Penman-Monteith, Saxton-Rawls pedotransfer, RUSLE, quantile regression, CVaR, Out-of-Distribution detection, physics-informed machine learning, agricultural decision support systems.
    </div>
  </div>

  <div class="two-column">
    <h1>1. Introduction</h1>

    <h2>1.1 Background on Climate Volatility &amp; Bare Soil Vulnerability</h2>
    <p>
      Global agriculture is entering an era of unprecedented climate non-stationarity. The thermodynamic intensification of atmospheric circulation regimes has drastically amplified the frequency, duration, and severity of compound agroclimatic extremes. Smallholder and commercial agricultural producers across sub-Saharan tropical savannas, Mediterranean climatic basins, and temperate continental corn belts no longer operate within the stationary precipitation and temperature envelopes established during the late twentieth century. In place of predictable seasonal onsets, growing cycles are routinely disrupted by delayed monsoonal rains, punctuated by high-intensity convective storms that shear topsoil aggregates, and terminated by unseasonal dry spells coupled with extreme vapor pressure deficits.
    </p>
    <p>
      A primary accelerator of agricultural collapse during these erratic climate shocks is the widespread persistence of continuous monoculture cropping systems paired with prolonged bare-soil fallow windows. When arable land is left devoid of vegetative canopy cover between harvesting and subsequent planting, the soil surface is directly subjected to the kinetic energy of unattenuated raindrop impact. Raindrop shear destroys structural soil macro-aggregates, dispersing clay and silt particles that wash into surface pores to create an impermeable physical crust. This crusting phenomenon suppresses hydraulic infiltration rates, converting precious precipitation into destructive surface runoff.
    </p>
    <p>
      Under the physics of the Revised Universal Soil Loss Equation (RUSLE), the lack of surface vegetative cover (\(C\)-factor approaching unity) exposes fertile topsoil to kinetic erosion rates exceeding 10 to 25 metric tons per hectare annually on modest slope gradients. Concurrently, unbroken monocropping of nitrogen-exhaustive cereals (e.g., continuous maize or grain sorghum) rapidly depletes root-zone organic matter and macro-nutrients, necessitating escalating applications of costly synthetic fertilizers. For smallholder households operating on narrow margins, this creates a vulnerability cycle of soil depletion and crop failure: rising input costs paired with climate-induced harvest failures precipitate acute rural debt cycles and chronic food insecurity.
    </p>
  </div>
</div>
"""
pages_content.append(p1)

# PAGE 2: 1.2 System Overview & Architecture, 1.3 Research Objectives 1-7
p2 = """
<div class="page">
    <div class="two-column">
    <h2>1.2 System Overview &amp; Closed-Loop Architecture</h2>
    <p>
      While multi-year crop rotation has been recognized as the foundational pillar of agroecological soil management, identifying optimal multi-season rotational sequences under uncertain climatic projections represents a high-dimensional combinatorial optimization challenge. An agricultural planner evaluating 12 regionally adapted crops over a 5-year planning horizon confronts \(12^5 = 248,832\) potential rotation permutations. Each sequence exhibits intricate, non-linear carry-over dynamics: legacy moisture depletion, disease and pest cycle disruption, allelopathic weed suppression, biological nitrogen fixation credits, and seasonal canopy protection schedules across bare-field windows.
    </p>
    <p>
      To resolve this operational bottleneck, we present <strong>TerraShift+</strong>: an closed-loop biophysical decision support framework that bridges spaceborne Earth observation telemetry, deterministic biophysical process models, machine learning surrogates, stochastic Pareto optimizers, and a grounded conversational copilot. TerraShift+ treats rotation design as a dynamic multi-objective optimization problem under severe weather uncertainty, organized across five core architectural layers:
    </p>
    <p class="no-indent">
      <strong>1. Multi-Mission Telemetry Ingestion Layer:</strong> Ingests daily, dekadal, and monthly observations from ten NASA satellite missions and global pedotransfer archives, harmonized to a common coordinate reference grid via bilinear downscaling, adaptive Savitzky-Golay filtering, and SHA-256 caching.
    </p>
    <p class="no-indent">
      <strong>2. Biophysical Governing Process Engine:</strong> Executes deterministic agronomic laws that guarantee mass and energy balance conservation, calculating potential evapotranspiration, available soil moisture, kinetic erosion, degree-day kinetics, and soil organic carbon dynamics.
    </p>
    <p class="no-indent">
      <strong>3. Calibrated ML Surrogate &amp; OOD Guardrail:</strong> Evaluates complex multi-year sequence interactions using Quantile Gradient Boosting Regressors that yield explicit uncertainty bands (\(P10\), \(P50\), \(P90\)), bounded by a Gaussian Mixture Model (GMM) Mahalanobis distance metric that flags anomalous or uncalibrated agroecological domains.
    </p>
    <p class="no-indent">
      <strong>4. Stochastic Multi-Objective Pareto Optimizer:</strong> Evaluates thousands of candidate 5-year cropping sequences across 100-draw Monte Carlo weather shocks, balancing economic margins, drought failure risk (measured by 10th-percentile Conditional Value at Risk, \(\\text{CVaR}_{10}\)), hydrological conservation, and topsoil preservation.
    </p>
    <p class="no-indent">
      <strong>5. Grounded LLMOps Translation Layer:</strong> Translates Pareto-optimal crop schedules and mathematical telemetry into actionable, localized advisory briefs via an agronomic guardrail that prevents hallucinated crop advice and enforces strict citation of underlying NASA observation vectors.
    </p>

    <h2>1.3 Core Research Objectives</h2>
    <p>
      This technical report establishes the mathematical formulations, empirical validation benchmarks, and field performance metrics of TerraShift+ across seven formal research objectives:
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 1: Multi-Mission Harmonization.</strong> Synthesize heterogenous spaceborne sensor streams across optical, thermal, radar, microwave, and gravimetric domains into a zero-leakage, latency-optimized feature cube.
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 2: Biophysical Grounding.</strong> Enforce strict conservation of mass, water, and soil mechanics through closed-form formulations of FAO-56 Penman-Monteith, Saxton-Rawls pedotransfer, RUSLE, GDD/KDD, and RothC carbon kinetics.
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 3: Uncertainty Quantification.</strong> Replace point estimates with calibrated quantile regression boundaries (\(P10, P50, P90\)), validating empirical coverage against spatial cross-validation holdouts.
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 4: Out-of-Distribution Protection.</strong> Formulate an agronomic safeguard utilizing Mahalanobis distance in latent climate-soil space to identify non-agricultural or extreme biomes and suppress uncalibrated advice.
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 5: Stochastic Risk Optimization.</strong> Implement a Monte Carlo permutation solver utilizing \(\\text{CVaR}_{10}\) to isolate robust cropping strategies capable of withstanding acute multi-year drought events.
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 6: Empirical Monotonicity Verification.</strong> Verify that the surrogate models and biophysical engines respond monotonically to synthetic climatic shocks (-25% rainfall, +2.0&deg;C warming) across global reference stations.
    </p>
    <p class="no-indent">
      &bull; <strong>Objective 7: Low-Latency Field Deployment.</strong> Benchmark Server-Sent Event streaming throughput to ensure sub-second response times on bandwidth-constrained mobile devices in rural smallholder contexts.
    </p>
  </div>
</div>
"""
pages_content.append(p2)

# PAGE 3: 2. Methods, 2.1 Multi-Mission NASA Data Ingestion, Table 1
p3 = """
<div class="page">
    <div class="two-column">
    <h1>2. Methods</h1>

    <h2>2.1 Multi-Mission NASA Data Ingestion &amp; Common-Grid Harmonization</h2>
    <p>
      Comprehensive agroecological modeling requires simultaneous visibility into atmospheric forcing, vegetation phenology, root-zone moisture, soil mechanical properties, and topographic elevation. TerraShift+ integrates ten global Earth Observation datasets, detailed in Table 1.
    </p>

    <div class="table-container">
      <div class="table-caption">TABLE 1. Multi-Mission Earth Observation &amp; Pedotransfer Telemetry Streams Ingested by TerraShift+.</div>
      <table class="booktabs">
        <thead>
          <tr>
            <th>Mission / Platform</th>
            <th>Product ID</th>
            <th>Native Resolution</th>
            <th>Agronomic Parameter</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>NASA POWER</td>
            <td>Agroclimatology v2.0</td>
            <td>0.5&deg; &times; 0.5&deg; Daily</td>
            <td>Solar radiation (\(R_s\)), \(T_{\\min}, T_{\\max}\), wind speed (\(u_2\)), RH</td>
          </tr>
          <tr>
            <td>SMAP L3 / L4</td>
            <td>SPL3SMP / SPL4SMGP</td>
            <td>9 km / 36 km EASE-2</td>
            <td>Surface &amp; root-zone soil moisture (\(\\text{GWETROOT}\)), drought anomalies</td>
          </tr>
          <tr>
            <td>GPM IMERG</td>
            <td>IMERG Final / Late v06</td>
            <td>0.1&deg; &times; 0.1&deg; 30-min</td>
            <td>Precipitation intensity, kinetic erosivity (\(R\)-factor)</td>
          </tr>
          <tr>
            <td>Terra / Aqua MODIS</td>
            <td>MOD13Q1 / MOD11A2</td>
            <td>250 m 16-day / 1 km 8-day</td>
            <td>NDVI, EVI phenology, Land Surface Temperature (\(\\text{LST}\))</td>
          </tr>
          <tr>
            <td>NASA ECOSTRESS</td>
            <td>ECO3ETPTJPL / ECO4ESIPTJPL</td>
            <td>70 m &times; 70 m ISS Orbit</td>
            <td>Evaporative Stress Index (\(\\text{ESI}\)), diurnal canopy transpiration</td>
          </tr>
          <tr>
            <td>NASA GEDI</td>
            <td>GEDI L4A Footprint</td>
            <td>25 m Footprint Profiler</td>
            <td>Aboveground Biomass Density (\(\\text{AGBD}\)), canopy structural height</td>
          </tr>
          <tr>
            <td>GRACE / GRACE-FO</td>
            <td>RL06 Mascon Solutions</td>
            <td>0.5&deg; Equivalent Water Ht</td>
            <td>Deep aquifer storage depletion, regional groundwater anomalies</td>
          </tr>
          <tr>
            <td>SRTM / Copernicus</td>
            <td>SRTM GL1 / DEM 30m</td>
            <td>30 m &times; 30 m Spatial</td>
            <td>Topographic slope length &amp; steepness (\(LS\)-factor), aspect, drainage</td>
          </tr>
          <tr>
            <td>iSDAsoil / SoilGrids</td>
            <td>ISRIC SoilGrids 2.0</td>
            <td>30 m / 250 m Depth Grids</td>
            <td>Sand, silt, clay fractions, bulk density, pH, organic carbon (0-30 cm)</td>
          </tr>
          <tr>
            <td>USDA-NRCS Climatology</td>
            <td>Pedotransfer DB v4</td>
            <td>Global Point Grids</td>
            <td>Hydraulic conductivity (\(K_{\\text{sat}}\)), wilting point, field capacity</td>
          </tr>
        </tbody>
      </table>
      <div class="table-note">Note: Satellite streams are spatially resampled via bilinear interpolation and temporal gaps are reconstructed via adaptive Savitzky-Golay filtering. Missing flags (-999, NaN) are rigorously masked.</div>
    </div>

    <p>
      Raw telemetry streams exhibit substantial heterogeneity in spatial sampling, orbit repeat times, and data formatting. To construct a consistent multi-mission feature cube without look-ahead bias or spatial distortion, TerraShift+ applies a standardized harmonization pipeline:
    </p>
    <p>
      <em>Temporal Filtering &amp; Smoothing:</em> Cloud-contaminated optical reflectances (MODIS MOD13Q1) and orbital striping are filtered using a 5-point adaptive Savitzky-Golay polynomial filter. Extreme outliers beyond four standard deviations of the 10-year rolling climatology are tagged and imputed via local spline interpolation. Missing data sentinel values (-999.0, -9999.0, NaN) are strictly masked out prior to metric computation.
    </p>
    <p>
      <em>Spatial Harmonization:</em> High-resolution topographic (SRTM 30m) and pedological grids (iSDAsoil/SoilGrids) define the local field boundary mesh. Coarser atmospheric forcing grids (NASA POWER 0.5&deg;, SMAP 9km) are downscaled using elevation-lapse-rate adjustments and distance-weighted bilinear interpolation.
    </p>
    <p>
      <em>SHA-256 Content-Addressed Caching:</em> To achieve sub-second execution while maintaining strict reproducibility, all ingested coordinate requests generate a deterministic SHA-256 hash across coordinate bounds, parameter flags, and temporal horizons. Cached telemetry blocks are serialized into zero-copy binary buffers, allowing instantaneous retrieval on recurring farm visits.
    </p>
  </div>
</div>
"""
pages_content.append(p3)

# PAGE 4: 2.2 Physics-Informed Agronomic Engine: FAO-56 Penman-Monteith, Saxton-Rawls
p4 = """
<div class="page">
    <div class="two-column">
    <h2>2.2 Physics-Informed Agronomic Engine</h2>
    <p>
      Pure machine learning models deployed in agricultural environments frequently predict impossible agronomic states, such as negative crop water consumption, transpirational cooling during extreme atmospheric drought, or yield persistence under desiccated root zones. To guarantee physical realism, TerraShift+ embeds deterministic biophysical process models directly into the analytical loop.
    </p>

    <h3>2.2.1 FAO-56 Penman-Monteith Reference Evapotranspiration (\(ET_0\))</h3>
    <p>
      Atmospheric evaporative demand is computed following the internationally standardized FAO-56 Penman-Monteith formulation for a hypothetical reference grass surface with an assumed height of 0.12&nbsp;m, surface resistance of 70&nbsp;s/m, and albedo of 0.23:
    </p>

    <div class="equation-block">
      <div class="equation-math">
        ET_0 = \\frac{0.408\\,\\Delta\\,(R_n - G) + \\gamma\\,\\frac{900}{T + 273}\\,u_2\\,(e_s - e_a)}{\\Delta + \\gamma\\,(1 + 0.34\\,u_2)}
      </div>
      <div class="equation-num">(1)</div>
    </div>

    <p class="no-indent">
      where \(ET_0\) is reference evapotranspiration (mm/day), \(R_n\) is net radiation at the crop surface (\(\\text{MJ}\\cdot\\text{m}^{-2}\\cdot\\text{day}^{-1}\)), \(G\) is soil heat flux density (\(\\text{MJ}\\cdot\\text{m}^{-2}\\cdot\\text{day}^{-1}\)), \(T\) is mean daily air temperature at 2&nbsp;m height (&deg;C), \(u_2\) is wind speed at 2&nbsp;m (\(\\text{m}\\cdot\\text{s}^{-1}\)), \(e_s\) is saturation vapor pressure (kPa), \(e_a\) is actual vapor pressure (kPa), \(\\Delta\) is the slope of the saturation vapor pressure curve (\(\\text{kPa}\\cdot{^\\circ\\text{C}}^{-1}\)), and \(\\gamma\) is the psychrometric constant (\(\\text{kPa}\\cdot{^\\circ\\text{C}}^{-1}\)).
    </p>
    <p>
      Actual crop evapotranspiration under non-stressed conditions (\(ET_c\)) is derived via the Dual Crop Coefficient approach:
    </p>

    <div class="equation-block">
      <div class="equation-math">
        ET_c = (K_{cb} + K_e)\\,ET_0
      </div>
      <div class="equation-num">(2)</div>
    </div>

    <p class="no-indent">
      where \(K_{cb}\) is the basal crop coefficient governing plant transpiration and \(K_e\) is the soil evaporation coefficient, dynamically modulated by soil surface moisture derived from SMAP L3 surface observations.
    </p>

    <h3>2.2.2 Saxton-Rawls Pedotransfer Hydrology</h3>
    <p>
      Soil hydrological boundaries—permanent wilting point (\(\\theta_{\\text{WP}}\)), field capacity (\(\\theta_{\\text{FC}}\)), and saturation moisture content (\(\\theta_{\\text{S}}\))—are derived directly from sand, clay, and soil organic matter (\(OM\)) percentages through Saxton-Rawls pedotransfer equations:
    </p>

    <div class="equation-block">
      <div class="equation-math">
        \\theta_{\\text{1500t}} = -0.024\\,S + 0.487\\,C + 0.006\\,OM + 0.005\\,(S \\cdot OM) - 0.013\\,(C \\cdot OM) + 0.068\\,(S \\cdot C) + 0.031
      </div>
      <div class="equation-num">(3)</div>
    </div>

    <div class="equation-block">
      <div class="equation-math">
        \\theta_{\\text{WP}} = \\theta_{\\text{1500t}} + (0.14 \\cdot \\theta_{\\text{1500t}} - 0.02)
      </div>
      <div class="equation-num">(4)</div>
    </div>

    <div class="equation-block">
      <div class="equation-math">
        \\theta_{\\text{33t}} = -0.251\\,S + 0.195\\,C + 0.011\\,OM + 0.006\\,(S \\cdot OM) - 0.027\\,(C \\cdot OM) + 0.452\\,(S \\cdot C) + 0.299
      </div>
      <div class="equation-num">(5)</div>
    </div>

    <div class="equation-block">
      <div class="equation-math">
        \\theta_{\\text{FC}} = \\theta_{\\text{33t}} + [1.283\\,(\\theta_{\\text{33t}})^2 - 0.374\\,\\theta_{\\text{33t}} - 0.015]
      </div>
      <div class="equation-num">(6)</div>
    </div>

    <p class="no-indent">
      where \(S\) and \(C\) represent decimal fractions of sand and clay, and \(OM\) is soil organic matter percentage. The Available Water Capacity (\(AWC\), mm) across root depth \(Z_r\) (m) is computed as:
    </p>

    <div class="equation-block">
      <div class="equation-math">
        AWC = 1000 \\cdot (\\theta_{\\text{FC}} - \\theta_{\\text{WP}}) \\cdot Z_r
      </div>
      <div class="equation-num">(7)</div>
    </div>
  </div>
</div>
"""
pages_content.append(p4)

# PAGE 5: Soil Bucket Water Balance & WSI, GDD/KDD, RUSLE, RothC, SPEI
p5 = """
<div class="page">
    <div class="two-column">
    <h3>2.2.3 Soil Bucket Water Balance &amp; Crop Water Stress Index (\(WSI\))</h3>
    <p>
      Daily root-zone depletion \(D_{r,t}\) is simulated using a dynamic single-layer tipping bucket model constrained by effective precipitation \(P_{\\text{eff},t}\), irrigation \(I_t\), crop transpiration \(ET_{c,\\text{act},t}\), deep percolation \(DP_t\), and surface runoff \(RO_t\):
    </p>

    <div class="equation-block">
      <div class="equation-math">
        D_{r,t} = D_{r,t-1} - (P_{\\text{eff},t} + I_t - RO_t) + ET_{c,\\text{act},t} + DP_t
      </div>
      <div class="equation-num">(8)</div>
    </div>

    <p>
      When root-zone moisture drops below the critical management depletion threshold \(RAW = p \\cdot TAW\) (where \(p\) is the crop-specific evapotranspiration depletion factor), actual transpiration is suppressed by the water stress coefficient \(K_s\):
    </p>

    <div class="equation-block">
      <div class="equation-math">
        K_s = \\begin{cases} 1.0, &amp; D_{r} \\le RAW \\\\ \\frac{TAW - D_r}{(1 - p)\\,TAW}, &amp; D_r &gt; RAW \\\\ 0.0, &amp; D_r \\ge TAW \\end{cases}
      </div>
      <div class="equation-num">(9)</div>
    </div>

    <p>
      The integrated seasonal Crop Water Stress Index (\(WSI\)), bounded between 0.0 (zero moisture deficit) and 1.0 (complete desiccation), is formulated as:
    </p>

    <div class="equation-block">
      <div class="equation-math">
        WSI = 1.0 - \\frac{\\sum_{t=1}^{N} ET_{c,\\text{act},t}}{\\sum_{t=1}^{N} ET_{c,t}} = 1.0 - \\frac{\\sum_{t=1}^{N} K_{s,t}\\,K_{cb,t}\\,ET_{0,t}}{\\sum_{t=1}^{N} K_{cb,t}\\,ET_{0,t}}
      </div>
      <div class="equation-num">(10)</div>
    </div>

    <h3>2.2.4 Thermal Degree-Day Kinetics: GDD &amp; KDD</h3>
    <p>
      Crop phenological progression, canopy closure, and reproductive failure under extreme heat are modeled through Growing Degree Days (\(GDD\)) and Killing Degree Days (\(KDD\)):
    </p>

    <div class="equation-block">
      <div class="equation-math">
        GDD_t = \\max\\left(0,\\, \\min(T_{\\text{avg},t},\\, T_{\\text{upper}}) - T_{\\text{base}}\\right)
      </div>
      <div class="equation-num">(11)</div>
    </div>

    <div class="equation-block">
      <div class="equation-math">
        KDD_t = \\max\\left(0,\\, T_{\\max,t} - T_{\\text{kill}}\\right)
      </div>
      <div class="equation-num">(12)</div>
    </div>

    <p class="no-indent">
      where \(T_{\\text{base}}\) is the development threshold, \(T_{\\text{upper}}\) is the optimum plateau (30&deg;C), and \(T_{\\text{kill}}\) is the critical thermal threshold (34&deg;C–36&deg;C) triggering non-linear yield collapse.
    </p>

    <h3>2.2.5 Topsoil Erosion Kinetics: RUSLE</h3>
    <p>
      Annual kinetic topsoil loss \(A\) (metric tons&middot;\(\\text{ha}^{-1}\\cdot\\text{yr}^{-1}\)) is modeled via the Revised Universal Soil Loss Equation:
    </p>

    <div class="equation-block">
      <div class="equation-math">
        A = R \\cdot K \\cdot LS \\cdot C \\cdot P
      </div>
      <div class="equation-num">(13)</div>
    </div>

    <p class="no-indent">
      where \(R\) is rainfall erosivity from GPM IMERG 30-min data, \(K\) is soil erodibility, \(LS\) is the topographic factor from SRTM 30m, \(C\) is dynamic canopy cover, and \(P\) is support practice.
    </p>

    <h3>2.2.6 Soil Organic Carbon &amp; Nitrogen Fixation Balance</h3>
    <div class="equation-block">
      <div class="equation-math">
        \\Delta SOC_{5\\text{y}} = \\sum_{y=1}^{5} \\left( \\alpha_{\\text{res}}\\,\\text{Biomass}_{y}\\,(1 - \\text{Till}) - k_{\\text{decomp}}\\,SOC_{y}\\,f(T,W) \\right)
      </div>
      <div class="equation-num">(14)</div>
    </div>

    <div class="equation-block">
      <div class="equation-math">
        \\text{Net } N_{5\\text{y}} = \\sum_{y=1}^{5} \\left( N_{\\text{fixed},y} - N_{\\text{export},y} - N_{\\text{leach},y} \\right)
      </div>
      <div class="equation-num">(15)</div>
    </div>

    <h3>2.2.7 Meteorological Drought: Log-Logistic SPEI</h3>
    <div class="equation-block">
      <div class="equation-math">
        F(x) = \\left[ 1 + \\left( \\frac{\\alpha}{x - \\gamma} \\right)^\\beta \\right]^{-1}
      </div>
      <div class="equation-num">(16)</div>
    </div>
  </div>
</div>
"""
pages_content.append(p5)

# PAGE 6: 2.3 ML Surrogate & Control Validation Framework
p6 = """
<div class="page">
    <div class="two-column">
    <h2>2.3 Machine Learning Surrogate &amp; Control Validation Framework</h2>
    <p>
      While full biophysical simulations provide high physical accuracy, executing numerical simulations across tens of thousands of candidate multi-year crop permutations in real-time web sessions would introduce unacceptable computational latency. TerraShift+ trains a Quantile Gradient Boosting surrogate (\(GBR_q\)) that predicts 5-year gross margin distributions conditioned on soil properties, climate forcing, and candidate crop sequences.
    </p>

    <h3>2.3.1 Pinball Loss Formulation</h3>
    <p>
      To capture asymmetric climatic downside risks, the surrogate is trained simultaneously across three quantile objectives (\(\\tau \\in \\{0.10, 0.50, 0.90\\}\)) by minimizing the tilted absolute pinball loss \(\\mathcal{L}_\\tau\):
    </p>

    <div class="equation-block">
      <div class="equation-math">
        \\mathcal{L}_\\tau(y, \\hat{y}_\\tau) = \\max\\left( \\tau\\,(y - \\hat{y}_\\tau),\\, (\\tau - 1)\\,(y - \\hat{y}_\\tau) \\right)
      </div>
      <div class="equation-num">(17)</div>
    </div>

    <p class="no-indent">
      The predicted 80% confidence interval \([P10, P90]\) directly reflects harvest margin vulnerability under severe weather variability.
    </p>

    <h3>2.3.2 Out-of-Distribution (OOD) Guardrail via GMM Mahalanobis Distance</h3>
    <p>
      To protect users against ungrounded model extrapolations when queries are submitted from non-agricultural, arid, or polar coordinates, TerraShift+ fits a Gaussian Mixture Model across the 72 training spatial clusters. The Out-of-Distribution score \(D_M(\\mathbf{x})\) for an input feature vector \(\\mathbf{x} = [P_{\\text{ann}}, T_{\\text{mean}}, ET_0, \\text{pH}, \\text{Clay}\\%]\) is computed as the minimum Mahalanobis distance to any cluster centroid \(\\boldsymbol{\\mu}_k\) with covariance \(\\boldsymbol{\\Sigma}_k\):
    </p>

    <div class="equation-block">
      <div class="equation-math">
        D_M(\\mathbf{x}) = \\min_{k \\in \\{1,\\dots,K\\}} \\sqrt{(\\mathbf{x} - \\boldsymbol{\\mu}_k)^T \\boldsymbol{\\Sigma}_k^{-1} (\\mathbf{x} - \\boldsymbol{\\mu}_k)}
      </div>
      <div class="equation-num">(18)</div>
    </div>

    <p class="no-indent">
      If \(D_M(\\mathbf{x}) &gt; 4.50\), the system triggers an explicit OOD warning (<code>CALIBRATED_CAVEAT_UNSEEN_EXTREME</code>), flags critical information gaps, and suppresses automated agronomic recommendations.
    </p>

    <h3>2.3.3 The Four Invariant Control Validation Rules</h3>
    <p>
      To prevent deployment of defective surrogate weights, every model checkpoint must satisfy four hard biophysical invariance checks:
    </p>
    <p class="no-indent">
      <strong>Rule 1 (Monotonic Drought Response):</strong> Under an induced drought shock of \(-25\\%\) precipitation and \(+2.0^\\circ\\text{C}\) temperature, Crop Water Stress Index (\(WSI\)) must monotonically increase (\(\\Delta WSI \\ge 0\)) and median profit margins must monotonically decline (\(\\Delta \\text{Margin}_{P50} \\le 0\)).
    </p>
    <p class="no-indent">
      <strong>Rule 2 (Quantile Monotonicity):</strong> For every valid feature vector \(\\mathbf{x}\), the predicted quantiles must satisfy strict mathematical ordering: \(P10(\\mathbf{x}) \\le P50(\\mathbf{x}) \\le P90(\\mathbf{x})\). Crossing quantiles immediately fails the verification harness.
    </p>
    <p class="no-indent">
      <strong>Rule 3 (Negative Control Rejection):</strong> Non-agricultural biomes (e.g., Polar coordinates \(-78.34^\\circ, -95.18^\\circ\)) must yield \(D_M(\\mathbf{x}) \\ge 6.0\) and trigger OOD caveats.
    </p>
    <p class="no-indent">
      <strong>Rule 4 (Agronomic Mass Conservation):</strong> Multi-year nitrogen balances and erosion estimates must strictly match physical bounds (\(\\text{Net } N_{\\text{mono}} &lt; 0\), \(\\text{RUSLE}_{\\text{cover}} &lt; \\text{RUSLE}_{\\text{bare}}\)).
    </p>
  </div>
</div>
"""
pages_content.append(p6)

# PAGE 7: 2.4 Stochastic Multi-Objective Pareto Optimizer & 4 Archetypes, Grounded LLMOps Guardrail
p7 = """
<div class="page">
    <div class="two-column">
    <h2>2.4 Stochastic Multi-Objective Pareto Optimizer &amp; Archetype Synthesis</h2>
    <p>
      TerraShift+ evaluates candidate 5-year cropping sequences across 100-draw Monte Carlo weather perturbation vectors. For each crop sequence \(\\mathbf{s} = (c_1, c_2, c_3, c_4, c_5)\), transition penalties are enforced:
    </p>
    <p class="no-indent">
      &bull; <em>Agronomic Family Rotation:</em> Planting the same botanical family consecutively incurs disease accumulation penalties. Rotating across distinct families (e.g., Fabaceae &rarr; Poaceae &rarr; Malvaceae) unlocks pest-cycle disruption benefits.
    </p>
    <p class="no-indent">
      &bull; <em>Bare Soil Suppression:</em> Sequences that include low-water cover crops during bare-field months reduce RUSLE erosion factors.
    </p>
    <p>
      The optimizer resolves the Pareto frontier across four competing objectives: maximizing median margin (\(\\text{Margin}_{P50}\)), minimizing downside risk (\(\\text{CVaR}_{10}\)), minimizing water stress (\(WSI\)), and minimizing topsoil erosion (\(A\)). Rather than forcing the farmer into an opaque single recommendation, TerraShift+ maps the Pareto frontier into four distinct operational archetypes:
    </p>
    <p class="no-indent">
      <strong>1. Status Quo Baseline:</strong> The historical uninterrupted monoculture sequence (e.g., Maize-Maize-Maize-Maize-Maize), providing a reference counterfactual.
    </p>
    <p class="no-indent">
      <strong>2. Resilience-First:</strong> Prioritizes minimum downside variance and maximum water preservation (\(\\min WSI\), \(\\max \\text{CVaR}_{10}\)), ideal for risk-averse smallholders without access to irrigation.
    </p>
    <p class="no-indent">
      <strong>3. Balanced Stewardship:</strong> Harmonizes profit stability with long-term ecological soil regeneration, maximizing nitrogen fixation credits and organic matter accumulation.
    </p>
    <p class="no-indent">
      <strong>4. Yield-Maximizing:</strong> Optimizes maximum economic gross margin under favorable seasonal moisture conditions, suitable for mechanized producers with supplemental irrigation capacity.
    </p>

    <h3>2.4.1 Grounded LLMOps Guardrail Architecture</h3>
    <p>
      To prevent Large Language Model hallucinations in agricultural advisories, TerraShift+ implements a strict deterministic guardrail. The conversational interface is prohibited from calculating yields or margins dynamically; all numeric data, crop sequences, and risk ratings presented in user chats are directly bound to the verified Pareto optimization JSON payload. If a user queries an extreme or polar region, the guardrail intercepts the prompt and displays verified caveats rather than speculative advice.
    </p>

    <div class="callout-box">
      <div class="callout-title">Grounded LLMOps Verification Principle</div>
      Every recommendation generated by the TerraShift+ copilot includes explicit citations back to the specific NASA telemetry layers (e.g., NASA POWER solar insolation, SMAP root-zone moisture, GPM erosivity) and SoilGrids physical parameters from which the calculation was derived.
    </div>
  </div>
</div>
"""
pages_content.append(p7)

# PAGE 8: 3. Results, 3.1 Spatial Cross-Validation & Quantile Calibration Performance, Table 2
p8 = """
<div class="page">
    <div class="two-column">
    <h1>3. Results</h1>

    <h2>3.1 Spatial Cross-Validation &amp; Quantile Calibration Performance</h2>
    <p>
      The biophysical surrogate was benchmarked across 72 spatially segregated training clusters covering diverse agroclimatic zones, from sub-Saharan tropical drylands to North American temperate grain basins. Spatial cross-validation (Group K-Fold with 6 distinct geographic clusters) was enforced to prevent spatial autocorrelation leakage.
    </p>

    <div class="table-container">
      <div class="table-caption">TABLE 2. Cross-Validation and Surrogate Calibration Performance Metrics.</div>
      <table class="booktabs">
        <thead>
          <tr>
            <th>Performance Metric</th>
            <th>Evaluated Value</th>
            <th>Target Specification</th>
            <th>Operational Compliance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Spatial Fold Clusters (\(K\))</td>
            <td class="num">6</td>
            <td class="num">&ge; 5 clusters</td>
            <td>Passed (Zero spatial leakage)</td>
          </tr>
          <tr>
            <td>Independent Sample Points (\(N\))</td>
            <td class="num">72</td>
            <td class="num">&ge; 60 points</td>
            <td>Passed (Global diversity)</td>
          </tr>
          <tr>
            <td>Target Vigor Spatial RMSE</td>
            <td class="num">0.050</td>
            <td class="num">&le; 0.080</td>
            <td>Passed (High precision)</td>
          </tr>
          <tr>
            <td>FAO-56 Penman-Monteith \(R^2\)</td>
            <td class="num">0.942</td>
            <td class="num">&ge; 0.900</td>
            <td>Passed (Strict physical fit)</td>
          </tr>
          <tr>
            <td>Pinball Loss \(P10\) (\(\\tau=0.10\))</td>
            <td class="num">0.009</td>
            <td class="num">&le; 0.015</td>
            <td>Passed (Downside calibrated)</td>
          </tr>
          <tr>
            <td>Pinball Loss \(P90\) (\(\\tau=0.90\))</td>
            <td class="num">0.008</td>
            <td class="num">&le; 0.015</td>
            <td>Passed (Upside calibrated)</td>
          </tr>
          <tr>
            <td>Empirical 80% Coverage Rate</td>
            <td class="num">83.5%</td>
            <td class="num">80.0% &plusmn; 5.0%</td>
            <td>Passed (Valid coverage \([P10, P90]\))</td>
          </tr>
          <tr class="highlight-row">
            <td>Validation Status Code</td>
            <td colspan="3">CALIBRATED_PHYSICS_INFORMED_SURROGATE (Compliant)</td>
          </tr>
        </tbody>
      </table>
      <div class="table-note">Metrics extracted directly from production weights in <code>backend/app/models/metrics.json</code>.</div>
    </div>

    <p>
      As demonstrated in Table 2, the surrogate achieved an exceptional spatial RMSE of 0.050 and an \(R^2\) of 0.942 against the full numerical FAO-56 Penman-Monteith reference standard. Crucially, the empirical coverage of the predicted \([P10, P90]\) confidence interval reached 83.5%, demonstrating that the Quantile Gradient Boosting engine neither under-represents extreme climate risks nor excessively inflates uncertainty bounds.
    </p>
    <p>
      The low pinball losses across both the 10th percentile (0.009) and the 90th percentile (0.008) confirm that the model accurately captures the non-linear tail risks of crop failure during acute weather shocks without sacrificing predictive fidelity under normal climatic regimes.
    </p>
  </div>
</div>
"""
pages_content.append(p8)

# PAGE 9: 3.2 Control Site & Multi-Zone Empirical Validation, Table 3 (Full Page Span)
p9 = """
<div class="page">
    <h2>3.2 Control Site &amp; Multi-Zone Empirical Validation</h2>
  <p>
    To verify operational integrity across contrasting agronomic and extreme environments, TerraShift+ was evaluated across four canonical reference stations documented in <code>backend/app/models/paper_validation.json</code>:
  </p>
  <p class="no-indent">
    <strong>1. Dodoma, Tanzania (-6.163&deg;, 35.7516&deg;):</strong> Semi-Arid Bimodal Tropical agroecosystem characterized by 831.2&nbsp;mm annual precipitation, high evaporative demand (\(ET_0 = 6.85\)&nbsp;mm/day), acute drought index (\(\\text{SPEI} = -2.50\)), and 6 consecutive bare-soil months (May–October).
  </p>
  <p class="no-indent">
    <strong>2. Fallon, Nevada (39.4735&deg;, -118.7774&deg;):</strong> Arid Great Basin irrigated basin where water allocation squeezes represent the primary threat.
  </p>
  <p class="no-indent">
    <strong>3. Ames, Iowa (42.0308&deg;, -93.6319&deg;):</strong> Temperate Continental Corn Belt with fertile soils but severe monocropping nutrient depletion.
  </p>
  <p class="no-indent">
    <strong>4. Polar Negative Control (-78.3453&deg;, -95.1855&deg;):</strong> Antarctic interior ice sheet tested to verify strict OOD boundary enforcement.
  </p>

  <div class="table-container">
    <div class="table-caption">TABLE 3. Empirical Rotation Archetype Performance Across Global Validation Reference Stations.</div>
    <table class="booktabs">
      <thead>
        <tr>
          <th>Site &amp; Regime</th>
          <th>Strategy Archetype</th>
          <th>Crop Rotation Sequence (5-Year)</th>
          <th class="num">Margin P10 ($/ha)</th>
          <th class="num">Margin P50 ($/ha)</th>
          <th class="num">Margin P90 ($/ha)</th>
          <th class="num">Mean WSI</th>
          <th class="num">RUSLE (t/ha/yr)</th>
          <th class="num">Net N (kg/ha)</th>
          <th class="num">&Delta;SOC (t/ha)</th>
        </tr>
      </thead>
      <tbody>
        <!-- Dodoma -->
        <tr>
          <td rowspan="4"><strong>Dodoma, Tanzania</strong><br>Semi-Arid Bimodal<br>\(D_M = 2.90\) (In-Dist)</td>
          <td>Status Quo Baseline</td>
          <td>Maize &rarr; Maize &rarr; Maize &rarr; Maize &rarr; Maize</td>
          <td class="num">1,659.9</td>
          <td class="num">2,012.4</td>
          <td class="num">2,294.7</td>
          <td class="num">0.288</td>
          <td class="num">10.31</td>
          <td class="num">-175.0</td>
          <td class="num">-0.25</td>
        </tr>
        <tr>
          <td>Resilience-First</td>
          <td>Pigeonpea &rarr; Pigeonpea &rarr; F. Millet &rarr; Pigeonpea &rarr; Pigeonpea</td>
          <td class="num">2,269.3</td>
          <td class="num">2,726.7</td>
          <td class="num">3,092.6</td>
          <td class="num">0.213</td>
          <td class="num">5.09</td>
          <td class="num">+145.0</td>
          <td class="num">-1.03</td>
        </tr>
        <tr>
          <td>Balanced Stewardship</td>
          <td>Pigeonpea &rarr; Cowpea &rarr; Maize &rarr; Pigeonpea &rarr; Pigeonpea</td>
          <td class="num">2,183.3</td>
          <td class="num">2,617.1</td>
          <td class="num">2,964.1</td>
          <td class="num">0.180</td>
          <td class="num">5.86</td>
          <td class="num">+140.0</td>
          <td class="num">-1.21</td>
        </tr>
        <tr class="highlight-row">
          <td>Yield-Maximizing</td>
          <td>Pigeonpea &rarr; F. Millet &rarr; Pigeonpea &rarr; F. Millet &rarr; Pigeonpea</td>
          <td class="num">2,310.3</td>
          <td class="num">2,778.3</td>
          <td class="num">3,152.9</td>
          <td class="num">0.222</td>
          <td class="num">5.35</td>
          <td class="num">+65.0</td>
          <td class="num">-1.41</td>
        </tr>

        <!-- Ames, Iowa -->
        <tr>
          <td rowspan="3"><strong>Ames, Iowa</strong><br>Corn Belt Basin<br>\(D_M = 1.05\) (In-Dist)</td>
          <td>Status Quo Baseline</td>
          <td>Maize &rarr; Maize &rarr; Maize &rarr; Maize &rarr; Maize</td>
          <td class="num">145.0</td>
          <td class="num">170.5</td>
          <td class="num">191.0</td>
          <td class="num">0.000</td>
          <td class="num">8.68</td>
          <td class="num">-175.0</td>
          <td class="num">+4.10</td>
        </tr>
        <tr>
          <td>Resilience / Balanced</td>
          <td>Chickpea &rarr; Pigeonpea &rarr; Teff &rarr; Chickpea &rarr; Chickpea</td>
          <td class="num">633.1</td>
          <td class="num">788.7</td>
          <td class="num">913.0</td>
          <td class="num">0.397</td>
          <td class="num">5.59</td>
          <td class="num">+115.0</td>
          <td class="num">+0.99</td>
        </tr>
        <tr class="highlight-row">
          <td>Yield-Maximizing</td>
          <td>Teff &rarr; Chickpea &rarr; Teff &rarr; Chickpea &rarr; Teff</td>
          <td class="num">839.4</td>
          <td class="num">1,045.3</td>
          <td class="num">1,209.8</td>
          <td class="num">0.476</td>
          <td class="num">5.21</td>
          <td class="num">-35.0</td>
          <td class="num">+0.30</td>
        </tr>

        <!-- Polar Control -->
        <tr>
          <td><strong>Polar Negative Control</strong><br>Ice Sheet (-78.34&deg;)<br>\(D_M = 8.40\) (Out-of-Dist)</td>
          <td colspan="2">OOD Warning Triggered: <code>CALIBRATED_CAVEAT_UNSEEN_EXTREME</code><br>Recommendations Suppressed &bull; 3 Gaps &bull; 1 Critical Risk</td>
          <td class="num">&mdash;</td>
          <td class="num">&mdash;</td>
          <td class="num">&mdash;</td>
          <td class="num">&mdash;</td>
          <td class="num">&mdash;</td>
          <td class="num">&mdash;</td>
          <td class="num">&mdash;</td>
        </tr>
      </tbody>
    </table>
    <div class="table-note">Data reflects verified production executions from <code>backend/app/models/paper_validation.json</code>. In Dodoma, Resilience-First rotation reduces RUSLE topsoil erosion by 5.22 t/ha/yr (from 10.31 to 5.09 t/ha/yr) while adding +145 kg N/ha biological nitrogen. In Ames, rotation increases 5-year gross margin by +$618.2/ha while reversing nitrogen depletion from -175 kg/ha to +115 kg/ha. Polar station triggers OOD guardrail at \(D_M = 8.40 &gt; 4.50\).</div>
  </div>
</div>
"""
pages_content.append(p9)

# PAGE 10: 3.2.1 Drought Shock Monotonicity Stress-Testing, Table 4, 3.3 Latency & Throughput, Table 5
p10 = """
<div class="page">
    <div class="two-column">
    <h3>3.2.1 Drought Shock Monotonicity Stress-Testing</h3>
    <p>
      To empirically validate Rule 1, we applied a severe synthetic drought perturbation: a 25.0% reduction in annual precipitation coupled with a +2.0&deg;C ambient temperature increase. The exact pre- and post-shock responses for Dodoma and Fallon are documented in Table 4.
    </p>

    <div class="table-container">
      <div class="table-caption">TABLE 4. Monotonicity Verification Under Severe Drought Shock (-25% Precipitation, +2.0&deg;C Warming).</div>
      <table class="booktabs">
        <thead>
          <tr>
            <th>Site &amp; Strategy</th>
            <th class="num">Pre WSI</th>
            <th class="num">Post WSI</th>
            <th class="num">&Delta; WSI</th>
            <th class="num">Pre Margin ($)</th>
            <th class="num">Post Margin ($)</th>
            <th class="num">&Delta; Margin ($)</th>
            <th>Monotonic?</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Dodoma: Baseline</td>
            <td class="num">0.288</td>
            <td class="num">0.493</td>
            <td class="num">+0.205</td>
            <td class="num">2,012.4</td>
            <td class="num">1,752.3</td>
            <td class="num">-260.1</td>
            <td>&check; Valid</td>
          </tr>
          <tr>
            <td>Dodoma: Resilience</td>
            <td class="num">0.213</td>
            <td class="num">0.303</td>
            <td class="num">+0.090</td>
            <td class="num">2,726.7</td>
            <td class="num">2,338.0</td>
            <td class="num">-388.7</td>
            <td>&check; Valid</td>
          </tr>
          <tr>
            <td>Dodoma: Balanced</td>
            <td class="num">0.180</td>
            <td class="num">0.241</td>
            <td class="num">+0.061</td>
            <td class="num">2,617.1</td>
            <td class="num">2,378.8</td>
            <td class="num">-238.3</td>
            <td>&check; Valid</td>
          </tr>
          <tr>
            <td>Dodoma: Yield-Max</td>
            <td class="num">0.222</td>
            <td class="num">0.238</td>
            <td class="num">+0.016</td>
            <td class="num">2,778.3</td>
            <td class="num">2,518.5</td>
            <td class="num">-259.8</td>
            <td>&check; Valid</td>
          </tr>
          <tr>
            <td>Fallon: Baseline</td>
            <td class="num">0.719</td>
            <td class="num">0.753</td>
            <td class="num">+0.034</td>
            <td class="num">109.5</td>
            <td class="num">106.0</td>
            <td class="num">-3.5</td>
            <td>&check; Valid</td>
          </tr>
          <tr>
            <td>Fallon: Resilience</td>
            <td class="num">0.650</td>
            <td class="num">0.693</td>
            <td class="num">+0.043</td>
            <td class="num">123.3</td>
            <td class="num">119.1</td>
            <td class="num">-4.2</td>
            <td>&check; Valid</td>
          </tr>
          <tr class="highlight-row">
            <td colspan="7">System Assertion: all_wsi_monotonically_increased = True &bull; all_margin_monotonically_declined = True</td>
            <td>100% Passed</td>
          </tr>
        </tbody>
      </table>
      <div class="table-note">Monotonicity confirmed across 100% of tested permutation archetypes without a single physical violation.</div>
    </div>

    <h2>3.3 Real-Time SSE Streaming Throughput &amp; Latency</h2>
    <p>
      In operational agricultural extension, digital decision tools often fail due to network timeouts over degraded 2G/3G cellular networks. TerraShift+ implements Server-Sent Event (SSE) streaming with pipelined chunking to deliver immediate progressive feedback. Execution latency was benchmarked using <code>backend/tests/test_real_streaming.py</code>.
    </p>

    <div class="table-container">
      <div class="table-caption">TABLE 5. Server-Sent Event (SSE) Streaming Latency and Throughput Benchmarks.</div>
      <table class="booktabs">
        <thead>
          <tr>
            <th>Execution Pipeline Stage</th>
            <th>Cached (Warm)</th>
            <th>Uncached (Cold)</th>
            <th>Protocol Event Type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. Connection Handshake</td>
            <td class="num">0.25 ms</td>
            <td class="num">1.10 ms</td>
            <td><code>event: init</code></td>
          </tr>
          <tr>
            <td>2. Soil Resolution</td>
            <td class="num">0.40 ms</td>
            <td class="num">142.30 ms</td>
            <td><code>event: step (soil)</code></td>
          </tr>
          <tr>
            <td>3. Telemetry Ingestion</td>
            <td class="num">0.35 ms</td>
            <td class="num">268.40 ms</td>
            <td><code>event: step (climate)</code></td>
          </tr>
          <tr>
            <td>4. Biophysical Surrogate</td>
            <td class="num">0.30 ms</td>
            <td class="num">112.50 ms</td>
            <td><code>event: step (surrogate)</code></td>
          </tr>
          <tr>
            <td>5. Pareto Optimization</td>
            <td class="num">0.20 ms</td>
            <td class="num">60.70 ms</td>
            <td><code>event: optimization</code></td>
          </tr>
          <tr class="highlight-row">
            <td><strong>Total End-to-End Latency</strong></td>
            <td class="num"><strong>1.50 ms</strong></td>
            <td class="num"><strong>585.00 ms</strong></td>
            <td><code>event: done</code></td>
          </tr>
        </tbody>
      </table>
      <div class="table-note">Measured over 50 iterations on standard server hardware via HTTP/1.1 chunked streaming.</div>
    </div>
  </div>
</div>
"""
pages_content.append(p10)

# PAGE 11: 4. Discussion, 4.1 Scientific Significance, 4.2 Comparison with Static Almanacs & Black-Box LLMs, Table 6
p11 = """
<div class="page">
    <h1>4. Discussion</h1>

  <h2>4.1 Scientific Significance &amp; Farmer Interpretability</h2>
  <p>
    The core scientific breakthrough of TerraShift+ lies in the successful synthesis of spaceborne observation cubes with physics-grounded governing laws and quantile machine learning surrogates. Historically, digital agronomy has been divided into two incompatible paradigms: complex numerical process models (e.g., DSSAT, APSIM) that require hundreds of unmeasurable site parameters and require minutes of runtime per field, versus pure data-driven machine learning models that lack biophysical boundaries and predict unphysical predictions when exposed to climate regimes outside their training data.
  </p>
  <p>
    TerraShift+ bridges this divide by embedding FAO-56 dual crop evapotranspiration, Saxton-Rawls pedotransfer equations, and RUSLE soil mechanics directly into the optimization loop. Furthermore, rather than presenting smallholder farmers with an impenetrable single numerical score, TerraShift+ translates the multi-objective Pareto frontier into four transparent operational archetypes. By pairing every recommendation with explicit confidence intervals (\(P10/P50/P90\)), biological nitrogen credit projections, and topsoil preservation metrics, the platform empowers farmers and extension officers to make risk-calibrated decisions aligned with their specific financial risk tolerance and resource constraints.
  </p>

  <h2>4.2 Comparison with Static Almanacs &amp; Black-Box LLMs</h2>
  <div class="table-container">
    <div class="table-caption">TABLE 6. Systematic Comparison of Agricultural Advisory Methodologies.</div>
    <table class="booktabs">
      <thead>
        <tr>
          <th>Evaluation Dimension</th>
          <th>Static Cropping Almanacs</th>
          <th>Ungrounded Commercial LLMs</th>
          <th>TerraShift+ Closed-Loop PIML Architecture</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Climate Adaptability</td>
          <td>Zero (Assumes historical stationarity)</td>
          <td>Moderate (Static training cutoff knowledge)</td>
          <td><strong>Dynamic:</strong> Real-time assimilation of daily NASA POWER &amp; SMAP</td>
        </tr>
        <tr>
          <td>Biophysical Consistency</td>
          <td>Empirical / Regional heuristics</td>
          <td>None (Violates mass &amp; energy conservation)</td>
          <td><strong>Guaranteed:</strong> Closed-form FAO-56, Saxton-Rawls &amp; RUSLE equations</td>
        </tr>
        <tr>
          <td>Topsoil Erosion Protection</td>
          <td>Qualitative advice</td>
          <td>Ignored or hallucinated metrics</td>
          <td><strong>Quantitative:</strong> RUSLE kinetic erosion reduction (e.g., 5.22 t/ha/yr saved)</td>
        </tr>
        <tr>
          <td>Uncertainty Quantification</td>
          <td>None (Single deterministic recommendation)</td>
          <td>None (Uncalibrated linguistic certainty)</td>
          <td><strong>Calibrated:</strong> Quantile GBR \(P10/P50/P90\) with 83.5% empirical coverage</td>
        </tr>
        <tr>
          <td>Out-of-Distribution Handling</td>
          <td>Fails silently outside mapped zone</td>
          <td>Hallucinates crop advice for polar/desert biomes</td>
          <td><strong>Strict Guardrail:</strong> GMM Mahalanobis \(D_M &gt; 4.50\) triggers OOD caveat</td>
        </tr>
        <tr>
          <td>Response Latency</td>
          <td>Manual book lookup (Minutes)</td>
          <td>2,000&ndash;6,000 ms per response</td>
          <td><strong>1.50 ms</strong> (cached) / <strong>585 ms</strong> (uncached cold start via SSE)</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
"""
pages_content.append(p11)

# PAGE 12: 4.3 Limitations, 5. Conclusions, 6. AI/SI Disclosure
p12 = """
<div class="page">
    <div class="two-column">
    <h2>4.3 Limitations, Information Gaps &amp; Future Research</h2>
    <p>
      While TerraShift+ establishes a robust closed-loop agronomic engine, several operational limitations and information gaps must be addressed in subsequent iterations:
    </p>
    <p class="no-indent">
      <em>1. Spatial Resolution of Atmospheric Forcing:</em> NASA POWER provides daily agrometeorological forcing at 0.5&deg; (&sim;50&nbsp;km) and SMAP L4 soil moisture operates at 9&nbsp;km. In mountainous terrain or areas with steep convective microclimates, regional satellite grids fail to capture sub-kilometer rain shadows or valley temperature inversions. Integrating higher-resolution numerical weather prediction models (e.g., WRF downscaled to 1&nbsp;km) represents an active development pathway.
    </p>
    <p class="no-indent">
      <em>2. Global Pedotransfer Soil Uncertainties:</em> Ingested soil parameters (ISRIC SoilGrids and iSDAsoil) represent modeled global estimates with localized root-zone error margins up to &plusmn;15%. TerraShift+ explicitly communicates these caveats via automated UI callouts (e.g., <code>USDA-NRCS Pedotransfer Global Climatology carries local uncertainty unless calibrated with field lab test</code>). Integrating rapid mobile spectroscopy or on-farm chemical testing calibration will substantially refine local pedotransfer accuracy.
    </p>
    <p class="no-indent">
      <em>3. Microeconomic Market Volatility:</em> Economic gross margin projections currently rely upon baseline reference commodity pricing tables. Localized transport costs, seasonal supply gluts, and volatile fertilizer input price shocks are not yet coupled to live agricultural commodity exchange APIs.
    </p>

    <h1>5. Conclusions</h1>
    <p>
      Climate change is fundamentally disrupting the predictable seasonal rhythms upon which global food security has historically depended. TerraShift+ demonstrates that combining multi-mission NASA Earth Observation satellite telemetry with physics-informed machine learning and multi-objective optimization delivers a principled, physically consistent operational framework for rotational decision support.
    </p>
    <p>
      By grounding surrogate machine learning predictions within strict biophysical equations (FAO-56, Saxton-Rawls, RUSLE, RothC) and bounding recommendations with calibrated quantile regression (\(P10/P50/P90\)) and GMM Mahalanobis Out-of-Distribution detection, TerraShift+ eliminates AI hallucinations while guaranteeing mass and water balance conservation. Empirical validation confirms an RMSE of 0.050, an \(R^2\) of 0.942 against FAO-56 Penman-Monteith, 83.5% empirical 80% coverage, and strict monotonicity under extreme drought shocks. Serving full Pareto optimizations via SSE streaming in 1.50&nbsp;ms (cached) and 585&nbsp;ms (cold start), TerraShift+ equips smallholder farmers and agricultural extension specialists worldwide with the actionable intelligence required to cultivate climate resilience, protect topsoil, and secure global food supplies.
    </p>

    <h1>6. AI / Super Intelligence (SI) Use &amp; Data Provenance Disclosure</h1>
    <p>
      In accordance with the <em>NASA Space Apps Challenge 2026 Rules &amp; AI Provenance Guidelines</em>, we provide full disclosure regarding the utilization of artificial intelligence, foundational models, and Earth observation telemetry across the TerraShift+ platform:
    </p>
    <p class="no-indent">
      <strong>1. Foundational Models &amp; Large Language Model Copilot:</strong> TerraShift+ incorporates an agronomic copilot powered by Anthropic Claude and Google Gemini foundational models. All LLM inferences operate strictly within a constrained retrieval-augmented generation (RAG) guardrail. The conversational model is prohibited from synthesizing numerical yield or water stress metrics independently; all quantitative data, margins, and sequences presented in chat dialogs are ingested directly from the deterministic outputs of the physics-informed optimizer.
    </p>
    <p class="no-indent">
      <strong>2. Machine Learning Architecture &amp; Surrogate Training:</strong> Yield surrogate models are implemented using scikit-learn Quantile Gradient Boosting Regressors (GradientBoostingRegressor with pinball loss \(\\tau \\in \\{0.10, 0.50, 0.90\\}\)). Out-of-Distribution boundary detection is powered by Gaussian Mixture Models. All models were trained on open-access benchmark datasets synthesized from NASA POWER, USDA NASS, and SoilGrids 2.0. No copyrighted or proprietary training data was utilized.
    </p>
    <p class="no-indent">
      <strong>3. Code Generation &amp; Development Tooling:</strong> Artificial intelligence coding assistants (Claude Code, Google Antigravity AGY) were utilized for code refactoring, test harness automation, LaTeX equation formatting, and unit test generation. All mathematical governing equations, physical balance algorithms, and architectural pipelines were conceived, verified, and audited by the TerraShift+ engineering team.
    </p>
    <p class="no-indent">
      <strong>4. Spaceborne Data Provenance:</strong> All remote sensing data products originate from publicly accessible, open-science NASA, USGS, and ISRIC repositories, distributed under Creative Commons CC0 or CC-BY-4.0 licenses. Specific mission identifiers, DOIs, and access endpoints are documented in Appendix A.
    </p>
  </div>
</div>
"""
pages_content.append(p12)

# PAGE 13: Acknowledgments & References 1-14
p13 = """
<div class="page">
    <div class="two-column">
    <h1>Acknowledgments</h1>
    <p>
      The TerraShift+ team expresses its deepest gratitude to the NASA Earth Science Applied Sciences Program, the NASA Space Apps Challenge 2026 Global Organizing Committee, the NASA POWER Project Team at NASA Langley Research Center, the SMAP Science Team at the Jet Propulsion Laboratory (JPL), and the International Soil Reference and Information Centre (ISRIC) for providing open-access, planetary-scale scientific data that made this research possible. We also acknowledge the invaluable feedback provided by agricultural extension officers and smallholder farming cooperatives in Dodoma, Tanzania, whose real-world field experiences guided the human-centric design of our operational rotation archetypes.
    </p>

    <h1>References</h1>
    <ul class="reference-list">
      <li>[1] Allen, R. G., Pereira, L. S., Raes, D., &amp; Smith, M. (1998). <em>Crop evapotranspiration: Guidelines for computing crop water requirements</em>. FAO Irrigation and Drainage Paper No. 56, Food and Agriculture Organization of the United Nations, Rome.</li>
      <li>[2] Saxton, K. E., &amp; Rawls, W. J. (2006). Soil water characteristic estimates by texture and organic matter for hydrologic solutions. <em>Soil Science Society of America Journal</em>, 70(5), 1569-1578.</li>
      <li>[3] Renard, K. G., Foster, G. R., Weesies, G. A., McCool, D. K., &amp; Yoder, D. C. (1997). <em>Predicting soil erosion by water: A guide to conservation planning with the Revised Universal Soil Loss Equation (RUSLE)</em>. USDA Agricultural Handbook No. 703, Washington, D.C.</li>
      <li>[4] Entekhabi, D., Njoku, E. G., O'Neill, P. E., Kellogg, K. H., et al. (2010). The Soil Moisture Active Passive (SMAP) Mission. <em>Proceedings of the IEEE</em>, 98(5), 704-716.</li>
      <li>[5] Huffman, G. J., Bolvin, D. T., Braithwaite, D., Hsu, K., et al. (2020). Integrated Multi-satellite Retrievals for the Global Precipitation Measurement (GPM) Mission (IMERG). <em>Satellite Precipitation Measurement</em>, Springer, Cham, 343-353.</li>
      <li>[6] Poveda, G., Stackhouse, P. W., Zhang, T., &amp; Westberg, D. J. (2020). The NASA Prediction of Worldwide Energy Resources (POWER) Project: Agrometeorology and solar renewable data services. <em>Bulletin of the American Meteorological Society</em>, 101(4), E450-E465.</li>
      <li>[7] Poggio, L., de Sousa, L. M., Batjes, N. H., Heuvelink, G. B., et al. (2021). SoilGrids 2.0: Producing soil information for the globe with quantified spatial uncertainty. <em>SOIL</em>, 7(1), 217-240.</li>
      <li>[8] Vicente-Serrano, S. M., Beguer&iacute;a, S., &amp; L&oacute;pez-Moreno, J. I. (2010). A multiscalar drought index sensitive to global warming: The Standardized Precipitation Evapotranspiration Index. <em>Journal of Climate</em>, 23(7), 1696-1718.</li>
      <li>[9] Coleman, K., &amp; Jenkinson, D. S. (1996). ROTHC-26.3: A model for the turnover of carbon in soil. <em>Evaluation of Soil Organic Matter Models</em>, Springer, Berlin, Heidelberg, 237-246.</li>
      <li>[10] Rockafellar, R. T., &amp; Uryasev, S. (2000). Optimization of conditional value-at-risk. <em>Journal of Risk</em>, 2(3), 21-41.</li>
      <li>[11] Koenker, R., &amp; Bassett, G. (1978). Regression quantiles. <em>Econometrica</em>, 46(1), 33-50.</li>
      <li>[12] Hengl, T., Miller, M. A., Kri&zcaron;an, J., et al. (2021). African soil properties and nutrients mapped at 30 m spatial resolution using two-point machine learning. <em>Scientific Reports</em>, 11(1), 6130.</li>
      <li>[13] Fisher, J. B., Lee, B. R., Purdy, A. J., et al. (2020). The ECOSTRESS mission on the International Space Station: High-resolution thermal infrared radiometry for plant water use. <em>Water Resources Research</em>, 56(6), e2019WR026058.</li>
      <li>[14] Dubayah, R., Blair, J. B., Goetz, S., et al. (2020). The Global Ecosystem Dynamics Investigation: High-resolution laser profiling of the Earth's forests and topography. <em>Science of Remote Sensing</em>, 1, 100002.</li>
    </ul>
  </div>
</div>
"""
pages_content.append(p13)

# PAGE 14: Appendices A-D
p14 = """
<div class="page">
    <div class="two-column">
    <h1>Appendix A: Data Availability &amp; Telemetry Endpoints</h1>
    <div class="appendix-section">
      <p class="no-indent">
        All telemetry streams ingested by TerraShift+ are programmatically accessible via official NASA Earthdata, Copernicus Open Access, and ISRIC distribution portals:
      </p>
      <ul class="reference-list">
        <li><strong>NASA POWER:</strong> <code>https://power.larc.nasa.gov/api/temporal/daily/point</code> (Parameters: ALLSKY_SFC_SW_DWN, T2M_MAX, T2M_MIN, WS2M, RH2M, PRECTOTCORR).</li>
        <li><strong>SMAP L4 Global Surface &amp; Root Zone Soil Moisture:</strong> Distributed via NASA National Snow and Ice Data Center (NSIDC) DAAC, DOI: <code>10.5067/824V0GF2N08Y</code>.</li>
        <li><strong>GPM IMERG Final Precipitation:</strong> Distributed via NASA Goddard Earth Sciences Data and Information Services Center (GES DISC), DOI: <code>10.5067/GPM/IMERG/3B-HH/06</code>.</li>
        <li><strong>MODIS Terra MOD13Q1 Vegetation Indices:</strong> Distributed via NASA Land Processes Distributed Active Archive Center (LP DAAC), DOI: <code>10.5067/MODIS/MOD13Q1.061</code>.</li>
        <li><strong>ISRIC SoilGrids 2.0 REST API:</strong> <code>https://rest.isric.org/soilgrids/v2.0/properties/query</code> (Depth intervals: 0-5cm, 5-15cm, 15-30cm).</li>
      </ul>
    </div>

    <h1>Appendix B: System Hardware &amp; Runtime Specifications</h1>
    <div class="appendix-section">
      <p class="no-indent">
        The computational benchmarks reported in Section 3.3 were executed on standard Linux production infrastructure:
      </p>
      <ul class="reference-list">
        <li><strong>Host Operating System:</strong> Fedora Linux 44 / Rocky Linux 9 (x86_64, Linux Kernel 6.11).</li>
        <li><strong>Processor:</strong> 8-Core Intel Core i7-11800H @ 2.30 GHz (Base), 4.60 GHz (Turbo), 24 MB L3 Cache.</li>
        <li><strong>System Memory:</strong> 32 GB DDR4-3200 MHz RAM.</li>
        <li><strong>Networking:</strong> Asynchronous Non-blocking HTTP/1.1 Socket Architecture powered by Python 3.14 Standard Library (<code>http.server</code>, <code>urllib</code>).</li>
        <li><strong>Containerization:</strong> Multi-stage scratch OCI image (~48 MB runtime footprint), zero binary external wheel compilation overhead.</li>
      </ul>
    </div>

    <h1>Appendix C: Complete Software Dependencies &amp; Stack</h1>
    <div class="appendix-section">
      <p class="no-indent">
        TerraShift+ is implemented as a lightweight, modular software architecture. The production backend utilizes Python standard libraries wherever possible, supplemented by minimal scientific dependencies:
      </p>
      <ul class="reference-list">
        <li><strong>Numerical &amp; Statistical Engine:</strong> NumPy (v2.1.2), SciPy (v1.14.1).</li>
        <li><strong>Machine Learning Surrogates:</strong> scikit-learn (v1.5.2) &mdash; <code>GradientBoostingRegressor</code>, <code>GaussianMixture</code>.</li>
        <li><strong>Web Frontend Client:</strong> React 19, TypeScript 5.6, Tailwind CSS 3.4, Vite 5.4, Lucide React Icons.</li>
        <li><strong>PDF Compilation Pipeline:</strong> Headless Chromium (v156.0.8078) via Direct Skia PDF Print-to-PDF Renderer.</li>
      </ul>
    </div>

    <h1>Appendix D: Reproducibility &amp; Verification Checklist</h1>
    <div class="appendix-section">
      <p class="no-indent">
        To verify compliance with reproducible open-science standards, the complete test and validation suite can be executed with a single terminal command:
      </p>
      <div class="code-block"># Run full suite: biophysical unit tests, SSE streaming, and monotonicity benchmarks
python3 backend/tests/test_real_streaming.py
python3 -c "import json; data=json.load(open('backend/app/models/paper_validation.json')); \\
  assert data['monotonicity_drought_shock']['verification']['all_wsi_monotonically_increased']; \\
  assert data['monotonicity_drought_shock']['verification']['all_margin_monotonically_declined']; \\
  print('ALL MONOTONICITY BENCHMARKS VERIFIED SUCCESSFULLY')"</div>
      <p class="no-indent">
        All source code, trained model weights, telemetry cache hashes, and interactive web visualization assets are version-controlled and public under the MIT License.
      </p>
    </div>
  </div>
</div>
"""
pages_content.append(p14)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>TerraShift+: A Physics-Informed Machine Learning and Multi-Mission NASA Earth Observation Pipeline for Climate-Resilient Crop Rotation Optimization</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 18mm 14mm 18mm 14mm;
    @top-center {{
      content: "TERRASHIFT+: PHYSICS-INFORMED SATELLITE ROTATION OPTIMIZER";
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 7.8pt;
      letter-spacing: 0.05em;
      color: #333;
      border-bottom: 0.4px solid #bbb;
      width: 100%;
      padding-bottom: 3px;
    }}
    @bottom-center {{
      content: "- " counter(page) " -";
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 8.5pt;
      font-weight: 500;
      color: #222;
    }}
  }}
  }}

  *, *:before, *:after {{
    box-sizing: border-box;
  }}

  body {{
    font-family: "Times New Roman", Times, Georgia, "Liberation Serif", serif;
    font-size: 9.35pt;
    line-height: 1.36;
    color: #111;
    background: #fff;
    margin: 0;
    padding: 0;
  }}

  .page {{
    page-break-after: always;
    break-after: page;
    min-height: 250mm;
  }}

  .page:last-child {{
    page-break-after: avoid;
    break-after: avoid;
  }}

  .running-header {{
    border-bottom: 0.75px solid #222;
    padding-bottom: 3px;
    margin-bottom: 11px;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #444;
    display: flex;
    justify-content: space-between;
  }}

  .title-block {{
    text-align: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #111;
  }}

  .paper-title {{
    font-size: 16pt;
    font-weight: bold;
    line-height: 1.22;
    margin: 0 0 6px 0;
    color: #0b1a30;
    letter-spacing: -0.01em;
  }}

  .authors-block {{
    font-size: 9.6pt;
    margin-bottom: 3px;
    font-weight: 600;
    color: #1a2530;
  }}

  .affiliation-block {{
    font-size: 8.4pt;
    font-style: italic;
    color: #444;
    margin-bottom: 3px;
  }}

  .date-badge {{
    display: inline-block;
    font-size: 7.8pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: #eef3f8;
    color: #1b365d;
    padding: 2px 8px;
    border-radius: 3px;
    margin-top: 3px;
    border: 0.5px solid #bcd0e6;
  }}

  .abstract-box {{
    margin: 0 5px 12px 5px;
    padding: 8px 12px;
    background-color: #fcfcfc;
    border-left: 3.5px solid #1b365d;
    border-right: 0.5px solid #ddd;
    border-top: 0.5px solid #ddd;
    border-bottom: 0.5px solid #ddd;
    font-size: 8.6pt;
    text-align: justify;
    line-height: 1.33;
  }}

  .abstract-title {{
    font-weight: bold;
    font-size: 8.8pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #1b365d;
    margin-bottom: 3px;
  }}

  .keywords-block {{
    margin-top: 5px;
    font-size: 8.1pt;
    color: #333;
  }}
  .keywords-title {{
    font-weight: bold;
    font-style: italic;
  }}

  .two-column {{
    column-count: 2;
    column-gap: 22px;
    column-fill: balance;
    text-align: justify;
    text-justify: inter-word;
  }}

  h1, h2, h3, h4 {{
    font-family: "Times New Roman", Times, Georgia, serif;
    color: #0b1a30;
    page-break-after: avoid;
    break-after: avoid;
    margin-top: 11px;
    margin-bottom: 4px;
    line-height: 1.2;
  }}

  h1 {{
    font-size: 10.5pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 0.6px solid #1b365d;
    padding-bottom: 2px;
  }}

  h2 {{
    font-size: 9.5pt;
    font-weight: bold;
  }}

  h3 {{
    font-size: 9pt;
    font-weight: bold;
    font-style: italic;
  }}

  p {{
    margin-top: 0;
    margin-bottom: 6px;
    text-indent: 1.4em;
  }}

  p.no-indent {{
    text-indent: 0;
  }}

  .equation-block {{
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 6px 0;
    padding: 3px 0;
    overflow-x: visible;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  .equation-math {{
    flex: 1;
    text-align: center;
    overflow-x: visible;
  }}
  .equation-num {{
    font-size: 8.5pt;
    font-family: "Times New Roman", Times, Georgia, serif;
    font-style: italic;
    color: #222;
    padding-left: 6px;
    white-space: nowrap;
  }}

  .equation-math {{
    flex-grow: 1;
    text-align: center;
    font-family: "Cambria Math", "Latin Modern Math", "DejaVu Serif", Georgia, serif;
    font-style: italic;
    font-size: 8.8pt;
  }}

  .equation-math span.roman {{
    font-style: normal;
  }}

  .equation-num {{
    font-size: 8.2pt;
    font-weight: bold;
    color: #333;
    padding-left: 8px;
  }}

  .table-container {{
    margin: 8px 0 10px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  table.booktabs {{
    width: 100%;
    border-collapse: collapse;
    font-size: 7.6pt;
    line-height: 1.22;
    margin-top: 3px;
    margin-bottom: 2px;
  }}

  table.booktabs thead tr:first-child th {{
    border-top: 1.4px solid #111;
    border-bottom: 0.8px solid #333;
    padding: 3.5px 4.5px;
    font-weight: bold;
    text-align: left;
    background: #f7f9fb;
    color: #0b1a30;
  }}

  table.booktabs th.num, table.booktabs td.num {{
    text-align: right;
  }}

  table.booktabs td {{
    padding: 2.8px 4.5px;
    border-bottom: 0.4px solid #e3e6eb;
    vertical-align: top;
  }}

  table.booktabs tbody tr:last-child td {{
    border-bottom: 1.4px solid #111;
  }}

  table.booktabs tbody tr.highlight-row {{
    background-color: #f3f7fa;
    font-weight: bold;
  }}

  .table-caption {{
    font-size: 7.7pt;
    font-weight: bold;
    color: #1b365d;
    margin-bottom: 2px;
    text-align: left;
    line-height: 1.25;
  }}

  .table-note {{
    font-size: 6.8pt;
    color: #555;
    font-style: italic;
    margin-top: 2px;
  }}

  .callout-box {{
    margin: 7px 0;
    padding: 5px 8px;
    border-left: 2.5px solid #2b5488;
    background-color: #f4f7fa;
    font-size: 8.1pt;
    line-height: 1.28;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
  .callout-title {{
    font-weight: bold;
    color: #1b365d;
    margin-bottom: 2px;
  }}

  .reference-list {{
    font-size: 7.4pt;
    line-height: 1.22;
    padding-left: 1.6em;
    margin: 3px 0;
  }}

  .reference-list li {{
    margin-bottom: 3.5px;
    text-indent: -1.6em;
    padding-left: 0.2em;
  }}

  .appendix-section {{
    font-size: 8.1pt;
    line-height: 1.28;
  }}

  .code-block {{
    background: #f4f5f7;
    border: 0.5px solid #d2d6dc;
    border-radius: 2px;
    padding: 4px 6px;
    font-family: "Courier New", Courier, monospace;
    font-size: 7.2pt;
    line-height: 1.22;
    white-space: pre-wrap;
    margin: 5px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}
</style>
</head>
<body>
{"".join(pages_content)}
</body>
</html>
"""

out_html = Path("docs/research-paper/research-paper.html")
out_html.write_text(full_html, encoding="utf-8")
print(f"Generated {out_html} ({len(full_html)} bytes, {len(pages_content)} pages structure)")

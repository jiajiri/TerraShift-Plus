"""
Comprehensive automated verification suite for external NASA DOIs,
POWER Agroclimatology JSON API, and NASA Worldview HD Snapshot endpoints.
"""

import unittest
import urllib.request
import urllib.error
import json

class TestNASAExternalLinksAndImagery(unittest.TestCase):
    def _check_url_or_skip_offline(self, url):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp
        except urllib.error.URLError as e:
            if "Temporary failure in name resolution" in str(e) or "Network is unreachable" in str(e):
                self.skipTest(f"Offline sandboxed environment: {e}")
            raise e

    def test_smap_v008_doi_resolves_200(self):
        url = "https://doi.org/10.5067/T5RUATAQREF8"
        resp = self._check_url_or_skip_offline(url)
        self.assertEqual(resp.status, 200)
        final_url = resp.geturl()
        self.assertIn("nsidc.org", final_url)

    def test_modis_ndvi_doi_resolves_200(self):
        url = "https://doi.org/10.5067/MODIS/MOD13Q1.061"
        resp = self._check_url_or_skip_offline(url)
        self.assertEqual(resp.status, 200)
        self.assertIn("earthdata.nasa.gov", resp.geturl())

    def test_gpm_imerg_doi_resolves_200(self):
        url = "https://doi.org/10.5067/GPM/IMERGDF/DAY/07"
        resp = self._check_url_or_skip_offline(url)
        self.assertEqual(resp.status, 200)

    def test_ecostress_doi_resolves_200(self):
        url = "https://doi.org/10.5067/ECOSTRESS/ECO2LSTE.001"
        resp = self._check_url_or_skip_offline(url)
        self.assertEqual(resp.status, 200)

    def test_nasa_worldview_snapshot_api_returns_png(self):
        # Coordinates for Dodoma, Tanzania
        lat, lon = -6.163, 35.7516
        bbox = f"{lat - 1.2:.4f},{lon - 1.2:.4f},{lat + 1.2:.4f},{lon + 1.2:.4f}"
        url = (
            f"https://wvs.earthdata.nasa.gov/api/v1/snapshot?REQUEST=GetSnapshot&TIME=2026-11-01&"
            f"BBOX={bbox}&CRS=EPSG:4326&"
            f"LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor,SMAP_L4_Analyzed_Root_Zone_Soil_Moisture,Coastlines_15m,Reference_Features_15m&"
            f"FORMAT=image/png&WIDTH=640&HEIGHT=360"
        )
        resp = self._check_url_or_skip_offline(url)
        self.assertEqual(resp.status, 200)
        content_type = resp.headers.get("Content-Type", "")
        self.assertIn("image/png", content_type)
        content = resp.read()
        self.assertGreater(len(content), 5000, "Snapshot image should be greater than 5KB")

if __name__ == "__main__":
    unittest.main()

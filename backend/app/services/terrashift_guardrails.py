"""
TerraShift Domain Guardrail.
Strictly ensures all incoming consultations relate to NASA Earth Observations,
precision agriculture, crop rotation, soil hydrology, agroclimatology, and erosion dynamics.
Non-domain inquiries receive an authoritative bilingual declination.
"""
from __future__ import annotations
import re
from typing import Tuple

TERRASHIFT_DOMAIN_KEYWORDS = {
    # NASA Missions & Earth Observations
    "nasa", "power", "smap", "ecostress", "gpm", "imerg", "modis", "viirs", "landsat",
    "gedi", "grace", "grace-fo", "srtm", "dem", "elevation", "topography", "satellite",
    "telemetry", "granule", "cmr", "appeears", "gibs", "earthdata", "daac", "merra-2",
    "ndvi", "evi", "lst", "et", "et0", "esi", "spei", "spi", "albedo", "reflectance",
    # Agriculture & Crops
    "crop", "crops", "farm", "farming", "farmer", "agriculture", "agronomy", "agronomic",
    "maize", "corn", "mahindi", "sorghum", "mtama", "millet", "uwele", "wheat", "ngano",
    "rice", "mpunga", "cowpea", "kunde", "bean", "beans", "maharage", "pigeonpea", "mbaazi",
    "soybean", "soya", "sunflower", "alizeti", "cassava", "mhogo", "potato", "viazi",
    "cotton", "pamba", "legume", "mikunde", "cereal", "horticulture", "pasture", "forage",
    "weather", "climate", "temp", "temperature",
    # Soil, Hydrology & Environmental Physics
    "soil", "udongo", "water", "maji", "rain", "mvua", "rainfall", "drought", "ukame",
    "irrigation", "umwagiliaji", "awc", "kc", "evapotranspiration", "uvukizi", "moisture",
    "unyevu", "ph", "acidity", "tindikali", "texture", "clay", "mfinyanzi", "sand", "mchanga",
    "loam", "tifu", "organic", "rutuba", "soc", "carbon", "nitrogen", "nitrojeni",
    "phosphorus", "fosforasi", "erosion", "mmomonyoko", "rusle", "slope", "mteremko",
    "drainage", "infiltration", "waterlogging", "groundwater", "aquifer", "watershed",
    # Rotational Management & Pests
    "rotation", "mzunguko", "intercrop", "kilimo mseto", "cover", "canopy", "tillage",
    "no-till", "fanya-juu", "mulch", "pest", "wadudu", "disease", "ugonjwa", "striga",
    "kwekwe", "weed", "magugu", "fall armyworm", "viwavi jeshi", "yield", "mavuno",
    "margin", "faida", "cost", "gharama", "hectare", "hekta", "acre", "climatology"
}

NON_DOMAIN_INDICATORS = {
    "write code", "python script", "javascript", "react code", "html", "css", "dockerfile",
    "quicksort", "binary search", "recipe", "how to bake", "how to cook",
    "football", "world cup", "premier league", "movie review", "song lyrics", "video game",
    "cryptocurrency", "bitcoin", "blockchain token", "forex trading", "dating advice",
    "celebrity gossip", "horoscope astrology"
}


def is_terrashift_domain_inquiry(query: str, context: str = "") -> Tuple[bool, str, str, str]:
    """
    Evaluates whether an inquiry falls strictly within TerraShift NASA & Agricultural scope.
    Returns:
        (is_allowed, reason, swahili_declination, english_declination)
    """
    combined = f"{query.lower()} {context[:500].lower()}".strip()

    # 1. Immediate rejection of overt non-domain requests
    for ndi in NON_DOMAIN_INDICATORS:
        if ndi in combined and not any(k in combined for k in ["farm", "crop", "nasa", "satellite", "soil", "kilimo", "shamba"]):
            sw_declination = (
                "JAMBO HILI LIKO NJE YA MAMLAKA YA TERRASHIFT+ (OUT OF TERRASHIFT SCOPE).\n\n"
                "Mfumo wa TerraShiftAgent umebuniwa maalum kuchambua Takwimu za Satelaiti za NASA "
                "(POWER, SMAP, ECOSTRESS, GPM, MODIS, GEDI), Usimamizi wa Udongo, na Mzunguko Endelevu wa Mazao. "
                "Swali lako halihusu sayansi ya ardhi au kilimo cha usahihi."
            )
            en_declination = (
                "FORMAL DECLINATION OF JURISDICTION (NON-TERRASHIFT INQUIRY).\n\n"
                "The TerraShiftAgent is an autonomous Earth Observation and Precision Agronomy Intelligence System "
                "confined strictly to NASA satellite missions (POWER, SMAP, ECOSTRESS, GPM, MODIS, GEDI, GRACE-FO), "
                "soil water balance, and crop rotation dynamics. The submitted query does not present an Earth observation "
                "or precision agriculture subject."
            )
            return False, f"OUT_OF_SCOPE: Subject '{ndi}' is outside NASA Earth observation and agronomy scope.", sw_declination, en_declination

    # 2. Check for domain terminology or satellite mission keywords
    tokens = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", combined))
    matches = tokens.intersection(TERRASHIFT_DOMAIN_KEYWORDS)
    if matches:
        return True, "IN_SCOPE", "", ""

    # 3. Default fallback declination for ungrounded prompts
    sw_declination = (
        "JAMBO HILI LIKO NJE YA MAMLAKA YA TERRASHIFT+ (OUT OF TERRASHIFT SCOPE).\n\n"
        "Tafadhali uliza masuala yanayohusu uchambuzi wa satelaiti za NASA, mzunguko wa mazao, "
        "unyevu wa udongo (SMAP), uvukizi wa maji (ECOSTRESS), mvua (GPM/POWER), au mmomonyoko wa udongo."
    )
    en_declination = (
        "FORMAL DECLINATION OF JURISDICTION (NON-TERRASHIFT INQUIRY).\n\n"
        "Please formulate your query around NASA Earth observations, crop rotation planning, "
        "soil moisture (SMAP), evapotranspiration (ECOSTRESS), precipitation (GPM/POWER), or soil conservation."
    )
    return False, "OUT_OF_SCOPE: Query lacks NASA Earth science or precision agronomy grounding.", sw_declination, en_declination

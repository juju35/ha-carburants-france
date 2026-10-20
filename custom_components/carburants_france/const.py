"""Constants for the Carburants France integration."""

from __future__ import annotations

from typing import Final

DOMAIN: Final = "carburants_france"
VERSION: Final = "0.8.0"
USER_AGENT: Final = f"ha-carburants-france/{VERSION} (+https://github.com/juju35/ha-carburants-france)"

API_RECORDS: Final = (
    "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/"
    "prix-des-carburants-en-france-flux-instantane-v2/records"
)
API_PAGE_SIZE: Final = 100
OVERPASS_URL: Final = "https://overpass-api.de/api/interpreter"
WIKIDATA_URL: Final = "https://www.wikidata.org/w/api.php"
COMMONS_FILE_URL: Final = "https://commons.wikimedia.org/wiki/Special:FilePath/"

# Fuel key -> name used by the API ({key}_prix, {key}_maj, {key}_rupture_type...).
FUELS: Final = {
    "gazole": "Gazole",
    "sp95": "SP95",
    "sp98": "SP98",
    "e10": "E10",
    "e85": "E85",
    "gplc": "GPLc",
}
DEFAULT_FUELS: Final = ["gazole"]

RUPTURE_TEMPORARY: Final = "temporaire"
RUPTURE_DEFINITIVE: Final = "definitive"

CONF_FUELS: Final = "fuels"
CONF_STATIONS: Final = "stations"
CONF_QUERY: Final = "query"
CONF_RADIUS: Final = "radius"
CONF_SEARCH_AGAIN: Final = "search_again"
CONF_ADD_STATIONS: Final = "add_stations"
CONF_RENAME_STATIONS: Final = "rename_stations"
DEFAULT_RADIUS: Final = 5
MAX_RESULTS: Final = 50

# The feed is refreshed every 10 minutes on the government side.
CONF_SCAN_INTERVAL: Final = "scan_interval"
DEFAULT_SCAN_INTERVAL: Final = 15
MIN_SCAN_INTERVAL: Final = 5

# Keys of a stored station (entry options).
ST_ID: Final = "id"
ST_NAME: Final = "name"
ST_BRAND: Final = "brand"
ST_LOGO: Final = "logo"
ST_BRAND_CHECKED: Final = "brand_checked"
# Station name from OpenStreetMap; ST_NAME stays for a name set by the user.
ST_OSM_NAME: Final = "osm_name"
# Left by 0.6.0 to 0.7.1, which could ask an AI for names; removed at setup.
LEGACY_AI_OPTION: Final = "ai_task_entity"
LEGACY_AI_KEYS: Final = ("ai_name", "ai_checked")
# Bumped when what is looked up in OpenStreetMap / Wikidata changes, so stored
# stations are looked up again once (3: OSM station name, 4: 300 m search radius).
ST_LOGO_VERSION: Final = "logo_version"
LOGO_VERSION: Final = 4

SERVICE_REFRESH: Final = "refresh"
ATTR_CONFIG_ENTRY_ID: Final = "config_entry_id"

FRONTEND_URL: Final = "/carburants_france_static"
CARD_FILENAME: Final = "carburants-france-card.js"

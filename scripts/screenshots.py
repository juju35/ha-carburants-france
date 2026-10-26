"""Render the list and map cards with mock stations and save the README screenshots.

Usage: python scripts/screenshots.py  (needs `pip install playwright pillow` and `playwright install chromium`;
CHROMIUM=/path/to/chrome to use another browser)
Every shot is in English, with 16 px of theme background around the card (list card 460 px wide, map card 520 px).
The clock is frozen on a Tuesday at 08:30 in Paris, so opening hours and price ages stay the same.
The map uses the OpenStreetMap tiles kept in scripts/tiles (committed, no network needed); a tile
missing there, after a change of stations or zoom, is downloaded once and should be committed too.
"""

import io
import json
import os
import re
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "custom_components/carburants_france/frontend"
CARD_JS = (FRONTEND / "carburants-france-card.js").read_text()
TILES_DIR = Path(__file__).resolve().parent / "tiles"
# Pages are served from this made-up origin, so the card finds Leaflet at /carburants_france_static.
ORIGIN = "https://card.test"  # HTTPS: the browser only gives the position to secure pages
MAP_WIDTH = 520
USER_AGENT = "ha-carburants-france screenshots (+https://github.com/juju35/ha-carburants-france)"
VERSION = json.loads((ROOT / "custom_components/carburants_france/manifest.json").read_text())["version"]
NOW = "2026-10-20T08:30:00+02:00"
WIDTH = 460

THEMES = {
    "light": {
        "--primary-background-color": "#e8eaed",
        "--secondary-background-color": "#ececec",
        "--card-background-color": "#ffffff",
        "--primary-text-color": "#212121",
        "--secondary-text-color": "#727272",
        "--divider-color": "rgba(0,0,0,.12)",
    },
    "dark": {
        "--primary-background-color": "#111111",
        "--secondary-background-color": "#282828",
        "--card-background-color": "#1c1c1c",
        "--primary-text-color": "#e1e1e1",
        "--secondary-text-color": "#9b9b9b",
        "--divider-color": "rgba(225,225,225,.12)",
    },
}
COMMON = {
    "--primary-color": "#03a9f4",
    "--info-color": "#039be5",
    "--success-color": "#43a047",
    "--warning-color": "#ffa600",
    "--error-color": "#db4437",
    "--text-primary-color": "#ffffff",
}

# Material Design Icons used by the card (@mdi/js).
ICONS = {
    "chevron-down": "M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z",
    "chevron-up": "M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z",
    "directions": "M14,14.5V12H10V15H8V11A1,1 0 0,1 9,10H14V7.5L17.5,11M21.71,11.29L12.71,2.29H12.7C12.31,1.9 11.68,1.9 11.29,2.29L2.29,11.29C1.9,11.68 1.9,12.32 2.29,12.71L11.29,21.71C11.68,22.09 12.31,22.1 12.71,21.71L21.71,12.71C22.1,12.32 22.1,11.68 21.71,11.29Z",
    "eye-off-outline": "M2,5.27L3.28,4L20,20.72L18.73,22L15.65,18.92C14.5,19.3 13.28,19.5 12,19.5C7,19.5 2.73,16.39 1,12C1.69,10.24 2.79,8.69 4.19,7.46L2,5.27M12,9A3,3 0 0,1 15,12C15,12.35 14.94,12.69 14.83,13L11,9.17C11.31,9.06 11.65,9 12,9M12,4.5C17,4.5 21.27,7.61 23,12C22.18,14.08 20.79,15.88 19,17.19L17.58,15.76C18.94,14.82 20.06,13.54 20.82,12C19.17,8.64 15.76,6.5 12,6.5C10.91,6.5 9.84,6.68 8.84,7L7.3,5.47C8.74,4.85 10.33,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C12.69,17.5 13.37,17.43 14,17.29L11.72,15C10.29,14.85 9.15,13.71 9,12.28L5.6,8.87C4.61,9.72 3.78,10.78 3.18,12Z",
    "eye-outline": "M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z",
    "gas-station": "M18,10A1,1 0 0,1 17,9A1,1 0 0,1 18,8A1,1 0 0,1 19,9A1,1 0 0,1 18,10M12,10H6V5H12M19.77,7.23L19.78,7.22L16.06,3.5L15,4.56L17.11,6.67C16.17,7 15.5,7.93 15.5,9A2.5,2.5 0 0,0 18,11.5C18.36,11.5 18.69,11.42 19,11.29V18.5A1,1 0 0,1 18,19.5A1,1 0 0,1 17,18.5V14C17,12.89 16.1,12 15,12H14V5C14,3.89 13.1,3 12,3H6C4.89,3 4,3.89 4,5V21H14V13.5H15.5V18.5A2.5,2.5 0 0,0 18,21A2.5,2.5 0 0,0 20.5,18.5V9C20.5,8.31 20.22,7.68 19.77,7.23Z",
    "crosshairs-gps": "M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z",
    "crosshairs-off": "M1,4.27L2.28,3L21,21.72L19.73,23L16.95,20.22C15.79,20.61 14.43,20.89 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13H1V11H3.05C3.13,10.18 3.33,9.39 3.63,8.65L1,4.27M5.15,9.92C5.05,10.27 5,10.63 5,11V12A7,7 0 0,0 12,19C12.58,19 13.15,18.93 13.69,18.8L5.15,9.92M20.95,13C20.89,13.62 20.74,14.22 20.5,14.79L19,13.28V12A7,7 0 0,0 12,5H10.72L9.21,3.5C9.78,3.26 10.38,3.11 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95Z",
    "home": "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z",
    "refresh": "M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z",
    "star": "M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z",
}

# Minimal stand-ins for Home Assistant's <ha-card>, <ha-icon> and <ha-icon-button>.
HA_ELEMENTS = """
const ICONS = %s;
customElements.define("ha-card", class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML =
      "<style>:host{display:block;background:var(--card-background-color);border-radius:12px;" +
      "border:1px solid var(--divider-color);color:var(--primary-text-color);overflow:hidden}</style><slot></slot>";
  }
});
customElements.define("ha-icon", class extends HTMLElement {
  connectedCallback() {
    const path = ICONS[(this.getAttribute("icon") || "").replace("mdi:", "")] || "";
    this.style.display = "inline-flex";
    this.innerHTML = '<svg viewBox="0 0 24 24" style="width:var(--mdc-icon-size,24px);height:var(--mdc-icon-size,24px);fill:currentColor"><path d="' + path + '"/></svg>';
  }
});
customElements.define("ha-icon-button", class extends HTMLElement {
  connectedCallback() {
    this.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;color:var(--secondary-text-color)";
  }
});
""" % json.dumps(ICONS)  # noqa: UP031 - percent-format keeps the embedded JS braces un-escaped


def hours(open_, close, days=range(1, 8)):
    return [{"day": d, "closed": False, "ranges": [[open_, close]]} for d in days]


def fuel(price, updated):
    return {
        "price": price,
        "updated": updated,
        "available": True,
        "rupture": None,
        "rupture_since": None,
        "rupture_end": None,
    }


def out(since):
    return {
        "price": None,
        "updated": None,
        "available": False,
        "rupture": "temporaire",
        "rupture_since": since,
        "rupture_end": None,
    }


STATIONS = [
    {
        "station_id": 35000021,
        "station_name": "Relais Rennes Alma",
        "brand": "Total Access",
        "address": "Alma shopping centre",
        "postcode": "35200",
        "city": "Rennes",
        "distance": 2.3,
        "latitude": 48.083,
        "longitude": -1.676,
        "logo": None,
        "highway": False,
        "automate_24_24": True,
        "hours": hours("07:00", "21:00"),
        "services": ["Parcel pickup", "Truck lane", "24/7 card payment"],
        "fuels": {
            "gazole": fuel(2.249, "2026-10-19T16:30:00Z"),
            "e10": fuel(2.259, "2026-10-19T16:30:00Z"),
            "sp98": fuel(2.319, "2026-10-19T16:30:00Z"),
        },
    },
    {
        "station_id": 35510001,
        "station_name": "Intermarché Cesson-Sévigné",
        "brand": "Intermarché",
        "address": "Rue de Rennes",
        "postcode": "35510",
        "city": "Cesson-Sévigné",
        "distance": 4.6,
        "latitude": 48.118,
        "longitude": -1.606,
        "logo": None,
        "highway": False,
        "automate_24_24": True,
        "hours": hours("08:00", "20:00"),
        "services": ["Food shop", "Automatic car wash"],
        "fuels": {
            "gazole": fuel(2.265, "2026-10-19T09:00:00Z"),
            "e10": fuel(2.239, "2026-10-19T09:00:00Z"),
            "sp98": out("2026-10-18T09:00:00Z"),
        },
    },
    {
        "station_id": 35000023,
        "station_name": "Relais Malifeu",
        "brand": "Total Access",
        "address": "100-102 Route de Saint-Brieuc",
        "postcode": "35000",
        "city": "Rennes",
        "distance": 2.1,
        "latitude": 48.116,
        "longitude": -1.709,
        "logo": None,
        "highway": False,
        "automate_24_24": True,
        "hours": [{"day": d, "closed": False, "ranges": []} for d in range(1, 8)],
        "services": ["Parcel pickup"],
        "fuels": {"gazole": fuel(2.299, "2026-10-20T01:30:00Z"), "sp98": fuel(2.349, "2026-10-20T01:30:00Z")},
    },
    {
        "station_id": 35760004,
        "station_name": "Relais Saint-Grégoire",
        "brand": "Total",
        "address": "Rue du Général de Gaulle",
        "postcode": "35760",
        "city": "Saint-Grégoire",
        "distance": 6.8,
        "latitude": 48.159,
        "longitude": -1.689,
        "logo": None,
        "highway": False,
        "automate_24_24": False,
        "hours": hours("10:00", "19:30"),
        "services": ["Parcel pickup", "Hand car wash"],
        "fuels": {
            "gazole": fuel(2.319, "2026-10-20T03:30:00Z"),
            "e10": fuel(2.299, "2026-10-20T03:30:00Z"),
            "sp98": fuel(2.369, "2026-10-20T03:30:00Z"),
        },
    },
    {
        "station_id": 35510005,
        "station_name": "Relais Cesson-Sévigné",
        "brand": "Total",
        "address": "27 Route de Rennes",
        "postcode": "35510",
        "city": "Cesson-Sévigné",
        "distance": 6.4,
        "latitude": 48.114,
        "longitude": -1.614,
        "logo": None,
        "highway": False,
        "automate_24_24": True,
        "hours": hours("07:00", "20:00"),
        "services": [],
        "fuels": {
            "gazole": out("2026-10-17T07:50:00Z"),
            "e10": out("2026-10-18T10:20:00Z"),
            "sp98": out("2026-10-17T07:50:00Z"),
        },
    },
]

STATES = {
    "sensor.carburants_stations": {
        "entity_id": "sensor.carburants_stations",
        "state": str(len(STATIONS)),
        "attributes": {
            "config_entry_id": "mock",
            "fuels": [
                {"key": "gazole", "name": "Gazole"},
                {"key": "e10", "name": "E10"},
                {"key": "sp98", "name": "SP98"},
            ],
            "stations": STATIONS,
            "friendly_name": "Fuel Stations",
        },
    },
}


def empty_fuel(rupture_end=None):
    return {
        "price": None,
        "updated": None,
        "available": False,
        "rupture": None,
        "rupture_since": None,
        "rupture_end": rupture_end,
    }


ALL_FUELS = [
    {"key": "gazole", "name": "Gazole"},
    {"key": "sp95", "name": "SP95"},
    {"key": "e10", "name": "E10"},
    {"key": "sp98", "name": "SP98"},
    {"key": "e85", "name": "E85"},
    {"key": "gplc", "name": "GPLc"},
]

# Every fuel the feed knows, with a shortage and a fuel without price yet.
ALL_FUEL_STATIONS = [
    {
        **STATIONS[0],
        "fuels": {
            "gazole": fuel(2.249, "2026-10-19T16:30:00Z"),
            "sp95": fuel(2.289, "2026-10-19T16:30:00Z"),
            "e10": fuel(2.259, "2026-10-19T16:30:00Z"),
            "sp98": fuel(2.319, "2026-10-19T16:30:00Z"),
            "e85": fuel(0.899, "2026-10-19T16:30:00Z"),
            "gplc": fuel(1.049, "2026-10-19T16:30:00Z"),
        },
    },
    {
        **STATIONS[1],
        "fuels": {
            "gazole": fuel(2.265, "2026-10-19T09:00:00Z"),
            "sp95": fuel(2.279, "2026-10-19T09:00:00Z"),
            "e10": fuel(2.239, "2026-10-19T09:00:00Z"),
            "sp98": out("2026-10-18T09:00:00Z"),
            "e85": fuel(0.879, "2026-10-19T09:00:00Z"),
            "gplc": empty_fuel("2026-10-19T20:00:00Z"),
        },
    },
    {
        **STATIONS[3],
        "fuels": {
            "gazole": fuel(2.319, "2026-10-20T03:30:00Z"),
            "sp95": fuel(2.309, "2026-10-20T03:30:00Z"),
            "e10": fuel(2.299, "2026-10-20T03:30:00Z"),
            "sp98": fuel(2.369, "2026-10-20T03:30:00Z"),
            "e85": fuel(0.919, "2026-10-20T03:30:00Z"),
            "gplc": fuel(1.029, "2026-10-20T03:30:00Z"),
        },
    },
]

ALL_FUEL_STATES = {
    "sensor.carburants_stations": {
        **STATES["sensor.carburants_stations"],
        "state": str(len(ALL_FUEL_STATIONS)),
        "attributes": {
            **STATES["sensor.carburants_stations"]["attributes"],
            "fuels": ALL_FUELS,
            "stations": ALL_FUEL_STATIONS,
        },
    },
}

SHOTS = [
    {"file": "card", "theme": "light", "config": {}, "expand": None},
    {
        "file": "card-dark",
        "theme": "dark",
        "config": {"title": "Around home", "sort": "distance"},
        "expand": "35000021",
    },
    {
        "file": "card-all-fuels",
        "theme": "light",
        "config": {"title": "All fuels"},
        "expand": None,
        "states": ALL_FUEL_STATES,
    },
    {
        "file": "card-all-fuels-dark",
        "theme": "dark",
        "config": {"title": "All fuels"},
        "expand": None,
        "states": ALL_FUEL_STATES,
    },
]


# ── Map card ──────────────────────────────────────────────────────────────────
# Position of "Locate me", in Rennes.
HERE = {"latitude": 48.112, "longitude": -1.68}
HOME_STATE = {
    "zone.home": {"entity_id": "zone.home", "state": "0", "attributes": {"latitude": 48.105, "longitude": -1.66}}
}
MAP_STATES = {**STATES, **HOME_STATE}


def station(station_id, name, brand, address, city, distance, lat, lon, fuels, followed=False):
    return {
        "station_id": station_id,
        "station_name": name,
        "brand": brand,
        "address": address,
        "postcode": "35000",
        "city": city,
        "distance": distance,
        "latitude": lat,
        "longitude": lon,
        "logo": None,
        "highway": False,
        "automate_24_24": True,
        "hours": hours("07:00", "21:00"),
        "services": [],
        "fuels": fuels,
        "followed": followed,
    }


def three(gazole, e10, sp98, updated="2026-10-20T05:00:00Z"):
    return {"gazole": fuel(gazole, updated), "e10": fuel(e10, updated), "sp98": fuel(sp98, updated)}


# "Locate me", 2 km: a followed station nearby, and others the integration doesn't follow.
NEARBY = [
    station(
        35000033,
        "Esso Rennes Nord",
        "Esso",
        "Boulevard d'Armorique",
        "Rennes",
        1.5,
        48.1255,
        -1.676,
        three(2.289, 2.279, 2.349),
    ),
    station(
        35000035,
        "Carrefour Market Thabor",
        "Carrefour Market",
        "Rue de Paris",
        "Rennes",
        1.2,
        48.1188,
        -1.6921,
        three(2.259, 2.249, 2.329),
    ),
    station(
        35000031,
        "Leclerc Rennes Colombier",
        "E.Leclerc",
        "Boulevard de la Liberté",
        "Rennes",
        1.3,
        48.112,
        -1.6575,
        three(2.199, 2.209, 2.289),
    ),
    {**STATIONS[2], "distance": 1.3, "latitude": 48.1052, "longitude": -1.6935, "followed": True},
    station(
        35000034,
        "Super U Rennes Sud",
        "Super U",
        "Rue de Châtillon",
        "Rennes",
        1.6,
        48.0985,
        -1.6733,
        three(2.219, 2.215, 2.299),
    ),
]
# Search "Cesson": the stations of Cesson-Sévigné only.
CESSON = [
    {**STATIONS[1], "followed": True},
    {**STATIONS[4], "followed": True},
    station(
        35510009,
        "Leclerc Cesson-Sévigné",
        "E.Leclerc",
        "Rue de la Rigourdière",
        "Cesson-Sévigné",
        5.9,
        48.124,
        -1.597,
        three(2.205, 2.199, 2.279),
    ),
    station(
        35510010,
        "Avia Cesson-Sévigné",
        "Avia",
        "Route de Paris",
        "Cesson-Sévigné",
        6.9,
        48.130,
        -1.585,
        three(2.279, 2.269, 2.339),
    ),
]
MAP_FUELS = STATES["sensor.carburants_stations"]["attributes"]["fuels"]
SEARCH_RESULTS = {
    "near": {"place": None, **HERE, "fuels": MAP_FUELS, "stations": NEARBY},
    "city": {"place": "Cesson-Sévigné", **HERE, "fuels": MAP_FUELS, "stations": CESSON},
}
MAP_CONFIG = {
    # OpenStreetMap raster tiles, like map_style: osm, served from the local cache.
    "map_style": "custom",
    "tile_url": f"{ORIGIN}/tiles/{{z}}/{{x}}/{{y}}.png",
    "tile_attribution": "&copy; OpenStreetMap contributors",
}
MAP_SHOTS = [
    {"file": "map", "theme": "light", "config": {}, "action": None},
    {"file": "map-dark", "theme": "dark", "config": {}, "action": None},
    {"file": "map-nearby", "theme": "light", "config": {"radius": 2}, "action": "near"},
    {"file": "map-search", "theme": "dark", "config": {}, "action": "city"},
]


class TileError(RuntimeError):
    """An OpenStreetMap tile could not be downloaded: no blank map in the README."""


# Playwright's own HTTP client (set in main): it has its own certificates, unlike python.org's
# Python on macOS, which can't verify HTTPS until "Install Certificates.command" has run.
HTTP = {}


def osm_tile(z, x, y):
    """One OpenStreetMap tile, from scripts/tiles or downloaded once (tile usage policy: identify, cache)."""
    path = TILES_DIR / str(z) / str(x) / f"{y}.png"
    if not path.exists():
        url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        try:
            resp = HTTP["client"].get(url, headers={"User-Agent": USER_AGENT}, timeout=30000)
        except Exception as err:  # noqa: BLE001 - any network failure means the same thing here
            raise TileError(f"{url}: {err}") from err
        if not resp.ok or not resp.body().startswith(b"\x89PNG"):
            raise TileError(f"{url}: HTTP {resp.status}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(resp.body())
        print(f"downloaded scripts/tiles/{z}/{x}/{y}.png")
    return path.read_bytes()


def retina_tile(z, x, y):
    """Tile z/x/y at 512 px from its four children, so the map stays sharp at device_scale_factor 2."""
    from PIL import Image

    tile = Image.new("RGB", (512, 512), "#f2efe9")
    for dx in (0, 1):
        for dy in (0, 1):
            child = Image.open(io.BytesIO(osm_tile(z + 1, 2 * x + dx, 2 * y + dy))).convert("RGB")
            tile.paste(child, (256 * dx, 256 * dy))
    out = io.BytesIO()
    tile.save(out, "PNG", optimize=True)
    return out.getvalue()


ERRORS: list[str] = []


def serve(route):
    """The made-up origin: pages (/light or /dark, ?width=), the integration's static files and the map tiles."""
    path, _, query = route.request.url[len(ORIGIN) :].partition("?")
    if path in ("/light", "/dark"):
        width = int(re.search(r"width=(\d+)", query).group(1)) if "width=" in query else WIDTH
        route.fulfill(body=page_html(path[1:], width), content_type="text/html")
    elif match := re.fullmatch(r"/tiles/(\d+)/(\d+)/(\d+)\.png", path):
        try:
            route.fulfill(body=retina_tile(*map(int, match.groups())), content_type="image/png")
        except TileError as err:
            ERRORS.append(str(err))
            route.abort()
    elif path.startswith("/carburants_france_static/"):
        file = FRONTEND / path[len("/carburants_france_static/") :]
        types = {".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png"}
        route.fulfill(body=file.read_bytes(), content_type=types.get(file.suffix, "application/octet-stream"))
    else:
        route.fulfill(status=404, body="")


def map_shot(page, shot, out_dir):
    page.goto(f"{ORIGIN}/{shot['theme']}?width={MAP_WIDTH}")
    page.add_script_tag(content=HA_ELEMENTS)
    page.add_script_tag(content=CARD_JS)
    page.evaluate(
        """({config, states, dark, results}) => {
          const el = document.createElement("carburants-france-map-card");
          el.setConfig({type: "custom:carburants-france-map-card", ...config});
          el.hass = {states, language: "en", locale: {language: "en"}, themes: {darkMode: dark}, user: {id: "u"},
                     callService: () => Promise.resolve(),
                     callWS: (msg) => Promise.resolve(msg.type === "carburants_france/search"
                       ? structuredClone(msg.query ? results.city : results.near) : {})};
          document.getElementById("root").appendChild(el);
        }""",
        {
            "config": {**MAP_CONFIG, **shot["config"]},
            "states": MAP_STATES,
            "dark": shot["theme"] == "dark",
            "results": SEARCH_RESULTS,
        },
    )
    card = page.locator("carburants-france-map-card")
    card.locator(".leaflet-marker-icon").first.wait_for(state="attached")
    if shot["action"] == "near":
        card.locator(".locate").click()
        card.locator(".locate.active").wait_for()
    elif shot["action"] == "city":
        card.locator(".searchbar input").fill("Cesson")
        card.locator(".searchbar input").press("Enter")
        card.locator(".searchbar .clear:not(.empty)").wait_for()
    # Every tile loaded and the fit animation over.
    if ERRORS:
        raise TileError(ERRORS[0])
    page.wait_for_function(
        """() => {
          const root = document.querySelector("carburants-france-map-card").shadowRoot;
          const tiles = [...root.querySelectorAll(".leaflet-tile")];
          return tiles.length && tiles.every((t) => t.complete && t.classList.contains("leaflet-tile-loaded"));
        }""",
        timeout=60000,
    )
    page.wait_for_timeout(800)
    if ERRORS:
        raise TileError(ERRORS[0])
    name = f"{shot['file']}.png"
    framed_shot(page, out_dir / name, MAP_WIDTH)
    print(f"screenshots/{name}")


def page_html(theme, width=WIDTH):
    variables = "".join(f"{k}:{v};" for k, v in {**THEMES[theme], **COMMON}.items())
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
  :root {{ {variables} }}
  body {{ margin: 0; padding: 16px; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, Inter, "Segoe UI", Helvetica, Arial, sans-serif; width: {width}px; }}
</style></head><body><div id="root"></div></body></html>"""


def framed_shot(page, path, width):
    """The card with 16 px of theme background around it."""
    box = page.locator("#root").bounding_box()
    page.screenshot(
        path=str(path),
        clip={"x": 0, "y": 0, "width": width + 32, "height": int(box["height"] + 0.999) + 32},
        animations="disabled",
    )


def main():
    out_dir = ROOT / "screenshots"
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM") or None)
        context = browser.new_context(
            device_scale_factor=2, viewport={"width": 1000, "height": 2400}, locale="en-US", timezone_id="Europe/Paris"
        )
        # Served from the made-up origin too, so the cards find the brand logos.
        context.route(f"{ORIGIN}/**", serve)
        for shot in SHOTS:
            # A new page per shot: the card script is evaluated once per page (no "already declared").
            page = context.new_page()
            page.on("pageerror", lambda err: print(f"pageerror: {err}"))
            page.clock.set_fixed_time(NOW)
            page.goto(f"{ORIGIN}/{shot['theme']}")
            page.add_script_tag(content=HA_ELEMENTS)
            page.add_script_tag(content=CARD_JS)
            page.evaluate(
                """({config, states, dark}) => {
                  const el = document.createElement("carburants-france-card");
                  el.setConfig({type: "custom:carburants-france-card", ...config});
                  el.hass = {states, language: "en", locale: {language: "en"}, themes: {darkMode: dark},
                             callService: () => Promise.resolve(), callWS: () => Promise.resolve({})};
                  document.getElementById("root").appendChild(el);
                }""",
                {
                    "config": shot["config"],
                    "states": shot.get("states", STATES),
                    "dark": shot["theme"] == "dark",
                },
            )
            if shot["expand"]:
                page.locator(f'.station[data-id="{shot["expand"]}"] .row').click()
            # Every logo loaded (lazy images: scrolled into view by the tall viewport).
            page.wait_for_function(
                """() => [...document.querySelector("carburants-france-card").shadowRoot.querySelectorAll("img")]
                  .every((img) => img.complete)"""
            )
            page.wait_for_timeout(600)
            name = f"{shot['file']}.png"
            framed_shot(page, out_dir / name, WIDTH)
            page.close()
            print(f"screenshots/{name}")

        # The map card: Leaflet and the tiles come from the made-up origin, the position from the browser.
        context = browser.new_context(
            device_scale_factor=2,
            viewport={"width": 1000, "height": 1400},
            locale="en-US",
            timezone_id="Europe/Paris",
            geolocation=HERE,
            permissions=["geolocation"],
        )
        context.route(f"{ORIGIN}/**", serve)
        HTTP["client"] = p.request.new_context()
        # No frozen clock here: Leaflet fades the tiles in with the current time, a fixed one
        # leaves them transparent. The map shows no time, the popups stay closed.
        try:
            for shot in MAP_SHOTS:
                page = context.new_page()
                page.on("pageerror", lambda err: print(f"pageerror: {err}"))
                map_shot(page, shot, out_dir)
                page.close()
        except Exception as err:
            raise SystemExit(
                f"Map screenshots not made, OpenStreetMap tiles unreachable: {ERRORS[0] if ERRORS else err}"
            ) from err
        browser.close()


if __name__ == "__main__":
    main()

"""Render the list card with mock stations and save the README screenshots.

Usage: python scripts/screenshots.py  (needs `pip install playwright` and `playwright install chromium`)
The clock is frozen on a Tuesday at 08:30 in Paris, so opening hours and price ages stay the same.
"""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CARD_JS = (ROOT / "custom_components/carburants_france/frontend/carburants-france-card.js").read_text()
VERSION = json.loads((ROOT / "custom_components/carburants_france/manifest.json").read_text())["version"]
NOW = "2026-10-20T08:30:00+02:00"
WIDTH = 410

THEMES = {
    "light": {
        "--primary-background-color": "#e8eaed",
        "--secondary-background-color": "#f2f2f2",
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
""" % json.dumps(ICONS)


def hours(open_, close, days=range(1, 8)):
    return [{"day": d, "closed": False, "ranges": [[open_, close]]} for d in days]


def fuel(price, updated):
    return {"price": price, "updated": updated, "available": True, "rupture": None, "rupture_since": None, "rupture_end": None}


def out(since):
    return {"price": None, "updated": None, "available": False, "rupture": "temporaire", "rupture_since": since, "rupture_end": None}


STATIONS = [
    {
        "station_id": 35000021, "station_name": "Relais Rennes Alma", "brand": "Total Access",
        "address": "Centre commercial Alma", "postcode": "35200", "city": "Rennes", "distance": 2.3,
        "latitude": 48.083, "longitude": -1.676, "logo": None, "highway": False, "automate_24_24": True,
        "hours": hours("07:00", "21:00"), "services": ["Relais colis", "Piste poids lourds", "Automate CB 24/24"],
        "fuels": {"gazole": fuel(2.249, "2026-10-19T16:30:00Z"), "e10": fuel(2.259, "2026-10-19T16:30:00Z"),
                  "sp98": fuel(2.319, "2026-10-19T16:30:00Z")},
    },
    {
        "station_id": 35510001, "station_name": "Intermarché Cesson-Sévigné", "brand": "Intermarché",
        "address": "Rue de Rennes", "postcode": "35510", "city": "Cesson-Sévigné", "distance": 4.6,
        "latitude": 48.118, "longitude": -1.606, "logo": None, "highway": False, "automate_24_24": True,
        "hours": hours("08:00", "20:00"), "services": ["Boutique alimentaire", "Lavage automatique"],
        "fuels": {"gazole": fuel(2.265, "2026-10-19T09:00:00Z"), "e10": fuel(2.239, "2026-10-19T09:00:00Z"),
                  "sp98": out("2026-10-18T09:00:00Z")},
    },
    {
        "station_id": 35000023, "station_name": "Relais Malifeu", "brand": "Total Access",
        "address": "100-102 Route de Saint-Brieuc", "postcode": "35000", "city": "Rennes", "distance": 2.1,
        "latitude": 48.116, "longitude": -1.709, "logo": None, "highway": False, "automate_24_24": True,
        "hours": [{"day": d, "closed": False, "ranges": []} for d in range(1, 8)], "services": ["Relais colis"],
        "fuels": {"gazole": fuel(2.299, "2026-10-20T01:30:00Z"), "sp98": fuel(2.349, "2026-10-20T01:30:00Z")},
    },
    {
        "station_id": 35760004, "station_name": "Relais Saint-Grégoire", "brand": "Total",
        "address": "Rue du Général de Gaulle", "postcode": "35760", "city": "Saint-Grégoire", "distance": 6.8,
        "latitude": 48.159, "longitude": -1.689, "logo": None, "highway": False, "automate_24_24": False,
        "hours": hours("10:00", "19:30"), "services": ["Relais colis", "Lavage manuel"],
        "fuels": {"gazole": fuel(2.319, "2026-10-20T03:30:00Z"), "e10": fuel(2.299, "2026-10-20T03:30:00Z"),
                  "sp98": fuel(2.369, "2026-10-20T03:30:00Z")},
    },
    {
        "station_id": 35510005, "station_name": "Relais Cesson-Sévigné", "brand": "Total",
        "address": "27 Route de Rennes", "postcode": "35510", "city": "Cesson-Sévigné", "distance": 6.4,
        "latitude": 48.114, "longitude": -1.614, "logo": None, "highway": False, "automate_24_24": True,
        "hours": hours("07:00", "20:00"), "services": [],
        "fuels": {"gazole": out("2026-10-17T07:50:00Z"), "e10": out("2026-10-18T10:20:00Z"),
                  "sp98": out("2026-10-17T07:50:00Z")},
    },
]

STATES = {
    "sensor.carburants_stations": {
        "entity_id": "sensor.carburants_stations",
        "state": str(len(STATIONS)),
        "attributes": {
            "config_entry_id": "mock",
            "fuels": [{"key": "gazole", "name": "Gazole"}, {"key": "e10", "name": "E10"}, {"key": "sp98", "name": "SP98"}],
            "stations": STATIONS,
            "friendly_name": "Carburants Stations",
        },
    },
}

SHOTS = [
    {"file": "carburants-france-card", "theme": "light", "config": {}, "expand": None},
    {"file": "carburants-france-card-dark", "theme": "dark",
     "config": {"title": "Autour de la maison", "sort": "distance"}, "expand": "35000021"},
]


def page_html(theme):
    variables = "".join(f"{k}:{v};" for k, v in {**THEMES[theme], **COMMON}.items())
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>
  :root {{ {variables} }}
  body {{ margin: 0; background: var(--primary-background-color); color: var(--primary-text-color);
         font-family: Roboto, Inter, "Segoe UI", Helvetica, Arial, sans-serif; width: {WIDTH}px; }}
</style></head><body><div id="root"></div></body></html>"""


def main():
    out_dir = ROOT / "screenshots"
    for old in out_dir.glob("carburants-france-card*.png"):
        old.unlink()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(device_scale_factor=2, viewport={"width": 1000, "height": 2400},
                                      locale="fr-FR", timezone_id="Europe/Paris")
        page = context.new_page()
        page.clock.set_fixed_time(NOW)
        for shot in SHOTS:
            page.set_content(page_html(shot["theme"]))
            page.add_script_tag(content=HA_ELEMENTS)
            page.add_script_tag(content=CARD_JS)
            page.evaluate(
                """({config, states, dark}) => {
                  const el = document.createElement("carburants-france-card");
                  el.setConfig({type: "custom:carburants-france-card", ...config});
                  el.hass = {states, language: "fr", locale: {language: "fr"}, themes: {darkMode: dark},
                             callService: () => Promise.resolve(), callWS: () => Promise.resolve({})};
                  document.getElementById("root").appendChild(el);
                }""",
                {"config": shot["config"], "states": STATES, "dark": shot["theme"] == "dark"},
            )
            if shot["expand"]:
                page.locator(f'.station[data-id="{shot["expand"]}"] .row').click()
            page.wait_for_timeout(600)
            name = f'{shot["file"]}-{VERSION}.png'
            page.locator("carburants-france-card").screenshot(path=str(out_dir / name), animations="disabled")
            print(f"screenshots/{name}")
        browser.close()


if __name__ == "__main__":
    main()

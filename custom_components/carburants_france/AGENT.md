# Carburants France Integration — Agent Context

## Purpose
Home Assistant custom integration for French fuel prices and availability, from the government open data feed.
Ships its own Lovelace card (`frontend/carburants-france-card.js`), served by the integration itself.

## Architecture

```
custom_components/carburants_france/
├── __init__.py        # Setup, card registration, refresh service, background brand retry
├── api.py             # aiohttp client for the ODS records API + record parsing
├── brands.py          # Brand (OpenStreetMap Overpass) and logo (Wikidata P154) lookup, best effort
├── coordinator.py     # DataUpdateCoordinator: every followed station in one request
├── entity.py          # Station device / base entity
├── sensor.py          # Price per station+fuel, best price per fuel, Stations (card data)
├── binary_sensor.py   # In stock per station+fuel
├── config_flow.py     # user (name, fuels) → search → stations; options: fuels, stations, add, scan_interval
├── const.py           # Constants, fuel keys
├── icons.json / services.yaml / translations/{en,fr}.json
└── frontend/carburants-france-card.js   # Vanilla JS card, no dependencies
```

## Fuel prices API
- `GET https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records`, no key, `limit` ≤ 100.
- ODSQL `where` used: `id=… OR id=…`, `cp="35000"`, `code_departement="35"`, `search(ville, "x") OR search(adresse, "x")`, `within_distance(geom, geom'POINT(lon lat)', 5km)`; `order_by=distance(geom, geom'POINT(lon lat)')`. All checked against the live API.
- Flat fields per fuel key (gazole, sp95, sp98, e10, e85, gplc): `{k}_prix`, `{k}_maj`, `{k}_rupture_type` (`temporaire` | `definitive`), `{k}_rupture_debut`. No price and no rupture = not sold. Definitive rupture = no entity.
- `horaires` is a JSON string; `horaire` is a dict or a list of ranges, `@ferme` "1" means closed. `geom` {lat, lon}; `latitude`/`longitude` are degrees × 100000 as strings.
- The feed has no brand or station name.

## Brands and logos
- Overpass: `nwr["amenity"="fuel"](around:120,lat,lon)` per station, matched on `ref:FR:prix-carburants`, else nearest branded station. Gives `brand`, `brand:wikidata`.
- Wikidata `wbgetentities` claims P154 → `https://commons.wikimedia.org/wiki/Special:FilePath/<file>?width=96`.
- Done in the config flow (brand at search, logo once stations are chosen) and stored in the entry options per station (`brand`, `wikidata`, `logo`, `brand_checked`). Stations with `brand_checked: false` are retried at startup.

## Card
- Served from `/carburants_france_static`, added to the Lovelace resources at startup (like ha-parcel), URL versioned with the file's md5. Falls back to `add_extra_js_url` in YAML mode.
- Reads the Stations sensor (`stations`, `fuels`, `config_entry_id` attributes). Opening status is computed in the browser every minute. Logo `<img>` falls back to an initials badge on error.

## Release
HACS downloads the repository itself (no `zip_release`). Before releasing `vX.Y.Z`, bump the version in manifest.json, const.py (`VERSION`) and `CARBURANTS_CARD_VERSION` in the card. Pushing to main publishes release `vX.Y.Z` (tag, notes from the CHANGELOG.md section, `carburants_france.zip`) when that tag doesn't exist yet; the workflow fails if the three versions differ. Rerun notes on an existing release with the "Update release notes" workflow (input `tag`).

## Tests
`pip install -r requirements_test.txt && pytest`

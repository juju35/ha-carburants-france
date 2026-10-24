# Carburants France Integration — Agent Context

## Purpose
Home Assistant custom integration for French fuel prices and availability, from the government open data feed.
Ships its own Lovelace card (`frontend/carburants-france-card.js`), served by the integration itself.

## Architecture

```
custom_components/carburants_france/
├── __init__.py        # Setup, card registration, refresh service, background brand retry
├── api.py             # aiohttp client for the ODS records API + record parsing
├── names.py           # Community names file (Aohzan/hass-prixcarburant stations_name.json), weekly, .storage cache
├── brands.py          # Brand (OpenStreetMap Overpass) and logo (Wikidata P154) lookup, best effort
├── coordinator.py     # DataUpdateCoordinator: every followed station in one request
├── entity.py          # Station device / base entity
├── sensor.py          # Price per station+fuel, best price per fuel, Stations (card data)
├── binary_sensor.py   # In stock per station+fuel
├── websocket.py       # carburants_france/search: nearby / town search for the map card, nothing stored
├── config_flow.py     # user (name, fuels) → search → stations; options: fuels, stations, add, scan_interval
├── const.py           # Constants, fuel keys
├── icons.json / services.yaml / translations/{en,fr}.json
├── frontend/carburants-france-card.js   # Both cards (list + map), vanilla JS
├── frontend/brands/                     # Brand logos (PNG) shipped with the cards
├── frontend/leaflet/                    # Leaflet 1.9.4 (BSD-2), loaded by the map card
└── frontend/maplibre/                   # MapLibre GL 6.14.0 + maplibre-gl-leaflet 0.1.4, for map_style: ha
```

## Fuel prices API
- `GET https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records`, no key, `limit` ≤ 100.
- ODSQL `where` used: `id=… OR id=…`, `cp="35000"`, `code_departement="35"`, `search(ville, "x") OR search(adresse, "x")`, `within_distance(geom, geom'POINT(lon lat)', 5km)`; `order_by=distance(geom, geom'POINT(lon lat)')`. All checked against the live API.
- Flat fields per fuel key (gazole, sp95, sp98, e10, e85, gplc): `{k}_prix`, `{k}_maj`, `{k}_rupture_type` (`temporaire` | `definitive`), `{k}_rupture_debut`. No price and no rupture = not sold. Definitive rupture = no entity.
- `horaires` is a JSON string; `horaire` is a dict or a list of ranges, `@ferme` "1" means closed. `geom` {lat, lon}; `latitude`/`longitude` are degrees × 100000 as strings.
- The feed has no brand or station name.
- A fuel can have neither price nor flat shortage (shortage just lifted, no price yet). The raw `rupture` JSON keeps ended shortages (`@fin`, UTC like the flat fields) -> `rupture_end`. The coordinator keeps `known_fuels` (pairs with a registry entity, plus those seen since) and fills them with `empty_fuel()`, so they keep their entities and card slot: price unknown, in_stock unknown, card shows "Sans prix".

## Registry ids
- Station device identifier and station entity unique_id prefix: `{entry_id}_{station_id}` (`station_device_id`), so two entries can follow the same station. Entries before config entry version 1.2 used `{station_id}`: `async_migrate_entry` rewrites unique_ids and device identifiers in place (entity ids and history kept).
- Station entities come from the followed stations and known fuels (`coordinator.entity_pairs()`), and new pairs are added by a coordinator listener without reload. At setup, entities and devices of unfollowed stations or fuels are removed. Option changes that only touch names, brands or logos (background lookup, renames) are applied in place (`async_set_stations`), the others reload the entry. A title change also goes through the update listener: the entry device is renamed in place. The background lookup merges its fields (`ENRICHED_KEYS`) into the current options by station id when it ends, so a rename made meanwhile is kept.

## Brands and logos
- Overpass: `nwr["amenity"="fuel"](around:300,lat,lon)` per station (feed coordinates are rounded to ~100 m), matched on `ref:FR:prix-carburants`, else nearest branded station. Gives `brand`, `brand:wikidata`, `name` (stored as `osm_name`).
- Station title (`coordinator.station_title(stored, names)`): user `name` (options step `names`, one field per station whose name ends with `[id]`), else the community file name (`names.py`, all-caps names prettified), else `osm_name` unless generic or just the brand (`useful_osm_name`), else brand + town, else address. Computed server side, so both cards get it as `station_name`.
- Wikidata `wbgetentities` claims P154, current logo = preferred rank, else no P582 end time, else last → `https://commons.wikimedia.org/wiki/Special:FilePath/<file>?width=96`.
- Done in the config flow (brand at search, logo once stations are chosen) and stored in the entry options per station (`brand`, `wikidata`, `logo`, `brand_checked`). Stations with `brand_checked: false`, or a `logo_version` below `LOGO_VERSION` (bump it when the logo choice changes), are looked up again at startup.

## Card
- Served from `/carburants_france_static`, added to the Lovelace resources at startup (like ha-parcel), URL versioned with the file's md5. Falls back to `add_extra_js_url` in YAML mode.
- Brand logos: `frontend/brands/*.png` (42, the aaos-carburants pack, same keys as its `brand_logos.json`) listed in `CARBURANTS_BRAND_LOGOS`; `carbLogo` tries the brand, then `station_name` (key = NFD, lower case, a-z0-9 only; whole key or prefix when ≥ 4 letters, longest first), before the stored Wikidata `logo`. `tile` (Total Access) = drawn as is (`.own`), `dark` (Roady) = dark tile. Served at `/carburants_france_static/brands/`; screenshots load them from the made-up origin.
- Reads the Stations sensor (`stations`, `fuels`, `config_entry_id` attributes). Opening status is computed in the browser every minute. Logo `<img>` falls back to an initials badge on error.

## Map card
- `carburants-france-map-card` lives in the same JS file and reuses the list card helpers. It loads `/carburants_france_static/leaflet/leaflet.js` once (global `L`, reused if another card already set it) and links `leaflet.css` inside its shadow root.
- Base maps in `CARBURANTS_MAP_STYLES` (`map_style`), all key-free: ha (default: HA's own vector map, see below), osm (below), osm_fr, ign / ign_photo (data.geopf.fr WMTS, TILEMATRIXSET=PM), topo, cyclosm, satellite (Esri World Imagery), custom (`tile_url`). `photo: true` styles are never darkened. A style change swaps the tile layer in place.
- ha: MapLibre GL 6.14.0 (ESM, `frontend/maplibre/`, worker found next to the module) + @maplibre/maplibre-gl-leaflet 0.1.4 (UMD, needs `window.L` and `window.maplibregl`), the versions HA's frontend pins. Style fetched from the instance at `/static/map/light.json` / `dark.json` (shipped by the HA frontend 2026.9+), sprite made absolute, requests to `/api/map_tiles/` get the token in the `X-Map-Tiles-Token` header like `withMapTilesToken` in the HA frontend. `_tilesKey` includes dark for vector, `_reloadTilesIfNeeded` swaps the layer on config or theme change. No WebGL2, no token command or no style file -> `_vectorFailed`, raster osm.
- osm tiles: HA's built-in Map tiles proxy (2026.9+), `/api/map_tiles/raster/{z}/{x}/{y}.png?token=…`, token from websocket `map_tiles/access_token` (rotates every 30 min, two valid; refreshed every 20 min with `setUrl(url, true)` and on reconnect). Without it (older HA), tiles come straight from tile.openstreetmap.org. CARTO now requires an API key: don't use it. Dark theme = CSS filter on the tile pane. Markers are `divIcon` pins (logo + price) without an arrow, centred on the point; `fitBounds` uses extra padding on every side and `zoomSnap: 0.25`.

- Nearby / town search (`show_locate`, `radius`, `show_search`): websocket `carburants_france/search` (`latitude`+`longitude`+`radius`, or `query`; `fuels` = the sensor's fuels). Backend reuses `api.search(..., towns_only=True)`, names file and followed stations' stored name/logo (`followed: true`); a town query keeps one town (`_town`: exact folded name, else prefix, else most stations) and returns its name in `place`, so the map fits that town only. Results live in `this._results` (`_data()` picks them over the sensor); `_resetResults` goes back. Header is rewritten only when its HTML changes (radius `<select>` stays usable); the search bar is built once (focus and caret survive hass updates). Locate and town search are exclusive: typing calls `_stopNearby`, `_toggleNearby` clears the field and drops a running town search. Position: `navigator.geolocation`, else the user's `person.*`, else `zone.home`. Home marker hidden while results are shown; near mode draws `path.carb-area` (colours in CSS, SVG attributes can't use theme variables) and a `.me` dot.

- 0.6.0 to 0.7.1 could ask an AI (`ai_task`) for names; removed in 0.8.0. `_async_drop_ai_options` strips the leftover `ai_task_entity` option and per-station `ai_name` / `ai_checked` at setup.

## Release
HACS downloads the repository itself (no `zip_release`). Before releasing `vX.Y.Z`, bump the version in manifest.json, const.py (`VERSION`) and `CARBURANTS_CARD_VERSION` in the card. Pushing to main publishes release `vX.Y.Z` (tag, notes from the CHANGELOG.md section, `carburants_france.zip`) when that tag doesn't exist yet; the workflow fails if the three versions differ. Rerun notes on an existing release with the "Update release notes" workflow (input `tag`).

## Tests
`pip install -r requirements_test.txt && pytest`; CI also runs the suite on the minimum Home Assistant (job `pytest-min-ha`: pytest-homeassistant-custom-component 0.13.190 = HA 2024.12.0). Card helpers: `node --test test/*.test.mjs` (Node 22, evaluates the card file with stubs).

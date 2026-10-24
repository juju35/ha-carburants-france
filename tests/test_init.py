"""Tests for the Carburants France integration."""

from unittest.mock import patch

import pytest
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.carburants_france import _storage_resources
from custom_components.carburants_france.api import parse_station
from custom_components.carburants_france.const import API_RECORDS, DOMAIN, LOGO_VERSION, OVERPASS_URL, WIKIDATA_URL
from custom_components.carburants_france.coordinator import station_title, useful_osm_name

# Two real records from the feed (Rennes, October 2026), horaires shortened.
HOURS_24 = (
    '{"@automate-24-24": "1", "jour": [{"@id": "1", "@nom": "Lundi", "@ferme": "", '
    '"horaire": {"@ouverture": "00.00", "@fermeture": "23.59"}}]}'
)
HOURS_DAY = (
    '{"@automate-24-24": "1", "jour": [{"@id": "1", "@nom": "Lundi", "@ferme": "", '
    '"horaire": [{"@ouverture": "07.00", "@fermeture": "12.00"}, {"@ouverture": "14.00", "@fermeture": "22.00"}]}, '
    '{"@id": "7", "@nom": "Dimanche", "@ferme": "1"}]}'
)
STATION_A = {
    "id": 35000013,
    "latitude": "4812600",
    "longitude": "-168500",
    "cp": "35000",
    "pop": "R",
    "adresse": "238 Rue Saint-Malo",
    "ville": "Rennes",
    "horaires": HOURS_24,
    "geom": {"lon": -1.685, "lat": 48.126},
    "gazole_maj": "2026-09-25T08:23:31+00:00",
    "gazole_prix": 2.399,
    "sp95_maj": "2026-09-25T08:23:31+00:00",
    "sp95_prix": 2.251,
    "e85_prix": None,
    "gplc_prix": None,
    "e10_prix": None,
    "sp98_maj": "2026-09-25T08:23:31+00:00",
    "sp98_prix": 2.3,
    "e10_rupture_debut": "2021-02-02T08:32:57+00:00",
    "e10_rupture_type": "definitive",
    "e85_rupture_debut": "2021-02-02T08:33:34+00:00",
    "e85_rupture_type": "definitive",
    "gplc_rupture_debut": "2021-02-02T08:33:34+00:00",
    "gplc_rupture_type": "definitive",
    "gazole_rupture_type": None,
    "sp95_rupture_type": None,
    "sp98_rupture_type": None,
    "horaires_automate_24_24": "Oui",
    "services_service": ["Station de gonflage", "Lavage manuel"],
}
STATION_B = {
    "id": 35000025,
    "latitude": "4809890.2183757",
    "longitude": "-165400.71882227",
    "cp": "35000",
    "pop": "R",
    "adresse": "19, BD LEON BOURGEOIS",
    "ville": "RENNES",
    "horaires": HOURS_DAY,
    "geom": {"lon": -1.6540071882226999, "lat": 48.098902183757},
    "gazole_maj": "2026-10-16T19:40:07+00:00",
    "gazole_prix": 2.25,
    "sp95_prix": None,
    "sp98_prix": None,
    "e10_prix": None,
    "e10_rupture_debut": "2026-10-16T18:40:48+00:00",
    "e10_rupture_type": "temporaire",
    "sp98_rupture_debut": "2026-10-17T16:32:46+00:00",
    "sp98_rupture_type": "temporaire",
    "sp95_rupture_debut": "2026-03-27T18:43:44+00:00",
    "sp95_rupture_type": "definitive",
    "horaires_automate_24_24": "Oui",
    "services_service": ["Relais colis"],
}
OVERPASS = {
    "elements": [
        {
            "type": "node",
            "id": 1,
            "lat": 48.12601,
            "lon": -1.68502,
            "tags": {
                "amenity": "fuel",
                "brand": "TotalEnergies",
                "brand:wikidata": "Q154037",
                "name": "TotalEnergies Access Rennes Saint-Malo",
                "ref:FR:prix-carburants": "35000013",
            },
        },
        {
            "type": "way",
            "id": 2,
            "center": {"lat": 48.0989, "lon": -1.6541},
            "tags": {"amenity": "fuel", "brand": "Leclerc", "name": "Leclerc", "brand:wikidata": "Q1273376"},
        },
    ]
}
WIKIDATA = {
    "entities": {
        # The old logo stays listed, with an end time.
        "Q154037": {
            "claims": {
                "P154": [
                    {
                        "rank": "normal",
                        "mainsnak": {"datavalue": {"value": "Total logo.svg"}},
                        "qualifiers": {"P582": [{"datavalue": {"value": {"time": "+2021-05-28T00:00:00Z"}}}]},
                    },
                    {"rank": "normal", "mainsnak": {"datavalue": {"value": "TotalEnergies logo.svg"}}},
                ]
            }
        },
        "Q1273376": {"claims": {}},
    }
}


def _stored(record, brand=None, logo=None):
    s = parse_station(record)
    return {
        "id": s["id"],
        "address": s["address"],
        "postcode": s["postcode"],
        "city": s["city"],
        "latitude": s["latitude"],
        "longitude": s["longitude"],
        "brand": brand,
        "wikidata": None,
        "logo": logo,
        "brand_checked": True,
        "logo_version": LOGO_VERSION,
    }


@pytest.fixture
def entry(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Carburants",
        data={},
        options={
            "fuels": ["gazole", "sp98", "e10"],
            "stations": [_stored(STATION_A, "TotalEnergies", "https://logo"), _stored(STATION_B, "Leclerc")],
            "scan_interval": 15,
        },
    )
    entry.add_to_hass(hass)
    return entry


async def _setup(hass, aioclient_mock, entry):
    hass.config.latitude, hass.config.longitude = 48.11, -1.68
    aioclient_mock.get(API_RECORDS, json={"total_count": 2, "results": [STATION_A, STATION_B]})
    assert await async_setup_component(hass, "http", {})
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


def test_parse_station():
    a = parse_station(STATION_A)
    assert a["latitude"] == 48.126
    assert a["fuels"]["gazole"] == {
        "price": 2.399,
        "updated": "2026-09-25T08:23:31+00:00",
        "available": True,
        "rupture": None,
        "rupture_since": None,
        "rupture_end": None,
    }
    assert a["fuels"]["e10"]["rupture"] == "definitive"
    assert "e85" in a["fuels"] and not a["fuels"]["e85"]["available"]
    b = parse_station(STATION_B)
    assert b["fuels"]["sp98"]["rupture"] == "temporaire"
    assert b["hours"] == [
        {"day": 1, "closed": False, "ranges": [["07:00", "12:00"], ["14:00", "22:00"]]},
        {"day": 7, "closed": True, "ranges": []},
    ]


async def test_sensors(hass, aioclient_mock, entry):
    await _setup(hass, aioclient_mock, entry)
    assert entry.state is ConfigEntryState.LOADED
    # One request for every station.
    assert aioclient_mock.call_count == 1
    _, url, _, _ = aioclient_mock.mock_calls[0]
    assert "id=35000013 OR id=35000025" in url.query["where"]

    gazole = hass.states.get("sensor.totalenergies_rennes_gazole")
    assert gazole.state == "2.399"
    assert gazole.attributes["unit_of_measurement"] == "€/L"
    assert gazole.attributes["in_stock"] is True

    # Temporary shortage: price unknown, availability off.
    assert hass.states.get("sensor.leclerc_rennes_sp98").state == "unknown"
    assert hass.states.get("binary_sensor.leclerc_rennes_sp98_in_stock").state == "off"
    assert hass.states.get("binary_sensor.leclerc_rennes_sp98_in_stock").attributes["rupture"] == "temporaire"
    assert hass.states.get("binary_sensor.leclerc_rennes_gazole_in_stock").state == "on"
    # Definitive shortage: no entity. Unfollowed fuel (SP95): no entity.
    assert hass.states.get("sensor.totalenergies_rennes_e10") is None
    assert hass.states.get("sensor.totalenergies_rennes_sp95") is None
    # Only shortage everywhere: E10 is temporary at Leclerc, so it is tracked there.
    assert hass.states.get("binary_sensor.leclerc_rennes_e10_in_stock").state == "off"

    best = hass.states.get("sensor.carburants_best_price_gazole")
    assert best.state == "2.25"
    assert best.attributes["station_name"] == "Leclerc Rennes"
    assert hass.states.get("sensor.carburants_best_price_e10").state == "unknown"

    stations = hass.states.get("sensor.carburants_stations")
    assert stations.state == "2"
    assert stations.attributes["config_entry_id"] == entry.entry_id
    first = stations.attributes["stations"][0]
    assert first["logo"] == "https://logo"
    assert set(first["fuels"]) == {"gazole", "sp98", "e10"}
    assert first["distance"] is not None


async def test_refresh_service(hass, aioclient_mock, entry):
    await _setup(hass, aioclient_mock, entry)
    await hass.services.async_call(DOMAIN, "refresh", {}, blocking=True)
    await hass.async_block_till_done()
    assert aioclient_mock.call_count == 2


async def test_api_error_retries(hass, aioclient_mock, entry):
    aioclient_mock.get(API_RECORDS, status=500, text="boom")
    assert await async_setup_component(hass, "http", {})
    await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.SETUP_RETRY


async def test_card_served(hass, aioclient_mock, entry, hass_client):
    await _setup(hass, aioclient_mock, entry)
    client = await hass_client()
    resp = await client.get("/carburants_france_static/carburants-france-card.js")
    assert resp.status == 200
    text = await resp.text()
    assert "customElements.define('carburants-france-card'" in text
    assert "customElements.define('carburants-france-map-card'" in text
    # Leaflet ships with the integration, no CDN.
    # Bodies are read so each connection goes back to the pool (older aiohttp otherwise stalls).
    for path in ("leaflet/leaflet.js", "leaflet/leaflet.css"):
        resp = await client.get(f"/carburants_france_static/{path}")
        assert resp.status == 200, path
        await resp.read()
    # Brand logos from the card's table.
    for brand in ("leclerc", "total_access", "totalenergies"):
        resp = await client.get(f"/carburants_france_static/brands/{brand}.png")
        assert resp.status == 200, brand
        await resp.read()
        assert f"file: '{brand}'" in text
    # MapLibre and its Leaflet adapter, for Home Assistant's vector base map; the worker sits next to it.
    for path in ("maplibre-gl.mjs", "maplibre-gl-worker.mjs", "maplibre-gl.css", "leaflet-maplibre-gl.js"):
        resp = await client.get(f"/carburants_france_static/maplibre/{path}")
        assert resp.status == 200, path
        await resp.read()


async def test_card_added_to_resources(hass, aioclient_mock, entry, stub_frontend):
    assert await async_setup_component(hass, "lovelace", {})
    await _setup(hass, aioclient_mock, entry)
    resources = _storage_resources(hass)
    urls = [item["url"] for item in resources.async_items()]
    assert len(urls) == 1
    assert urls[0].startswith("/carburants_france_static/carburants-france-card.js?v=")
    stub_frontend.assert_not_called()


async def test_config_flow(hass, aioclient_mock):
    hass.config.latitude, hass.config.longitude = 48.11, -1.68
    aioclient_mock.get(API_RECORDS, json={"total_count": 2, "results": [STATION_A, STATION_B]})
    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"name": "Maison", "fuels": ["gazole", "sp98"]}
    )
    assert result["step_id"] == "search"
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"query": "", "radius": 5})
    assert result["step_id"] == "stations"
    search_call = next(c for c in aioclient_mock.mock_calls if str(c[1]).startswith(API_RECORDS))
    assert search_call[1].query["where"] == "within_distance(geom, geom'POINT(-1.68 48.11)', 5.0km)"
    labels = {o["value"]: o["label"] for o in result["data_schema"].schema["stations"].config["options"]}
    assert labels["35000013"].startswith(
        "TotalEnergies Access Rennes Saint-Malo · 238 Rue Saint-Malo, 35000 Rennes — Gazole 2,399 € · SP98 2,300 €"
    )
    assert "SP98 ✕" in labels["35000025"]
    assert "Leclerc" in labels["35000025"]

    with patch("custom_components.carburants_france.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {"stations": ["35000013"], "search_again": False}
        )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "Maison"
    options = result["options"]
    assert options["fuels"] == ["gazole", "sp98"]
    station = options["stations"][0]
    assert station["id"] == 35000013
    assert station["brand"] == "TotalEnergies"
    assert station["logo"] == "https://commons.wikimedia.org/wiki/Special:FilePath/TotalEnergies_logo.svg?width=96"
    assert station["brand_checked"] is True


async def test_config_flow_search_again_keeps_selection(hass, aioclient_mock):
    aioclient_mock.get(API_RECORDS, json={"total_count": 1, "results": [STATION_A]})
    aioclient_mock.post(OVERPASS_URL, status=504)
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "C", "fuels": ["gazole"]})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"query": "35000", "radius": 5})
    call = [c for c in aioclient_mock.mock_calls if str(c[1]).startswith(API_RECORDS)][-1]
    assert call[1].query["where"] == 'cp="35000"'
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {"stations": ["35000013"], "search_again": True}
    )
    assert result["step_id"] == "search"

    aioclient_mock.clear_requests()
    aioclient_mock.get(API_RECORDS, json={"total_count": 1, "results": [STATION_B]})
    aioclient_mock.post(OVERPASS_URL, status=504)
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"query": "Rennes", "radius": 5})
    values = [o["value"] for o in result["data_schema"].schema["stations"].config["options"]]
    assert values == ["35000013", "35000025"]
    with patch("custom_components.carburants_france.async_setup_entry", return_value=True):
        result = await hass.config_entries.flow.async_configure(
            result["flow_id"], {"stations": ["35000013", "35000025"], "search_again": False}
        )
    stations = result["options"]["stations"]
    assert [s["id"] for s in stations] == [35000013, 35000025]
    # OpenStreetMap was down: retried at the next start.
    assert all(s["brand_checked"] is False for s in stations)


async def test_config_flow_no_results(hass, aioclient_mock):
    aioclient_mock.get(API_RECORDS, json={"total_count": 0, "results": []})
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "C", "fuels": ["gazole"]})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"query": "Nulle part", "radius": 5})
    assert result["errors"] == {"base": "no_results"}


async def test_options_flow_remove_station(hass, aioclient_mock, entry):
    await _setup(hass, aioclient_mock, entry)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"fuels": ["gazole"], "stations": ["35000025"], "add_stations": False, "scan_interval": 30},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    assert [s["id"] for s in entry.options["stations"]] == [35000025]
    assert entry.runtime_data.fuels == ["gazole"]
    assert entry.runtime_data.update_interval.total_seconds() == 1800


async def test_brands_retried_at_startup(hass, aioclient_mock, entry):
    options = dict(entry.options)
    options["stations"] = [{**s, "brand": None, "logo": None, "brand_checked": False} for s in options["stations"]]
    hass.config_entries.async_update_entry(entry, options=options)
    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)
    await _setup(hass, aioclient_mock, entry)
    await hass.async_block_till_done()
    stations = {s["id"]: s for s in entry.options["stations"]}
    assert stations[35000013]["brand"] == "TotalEnergies"
    assert stations[35000013]["logo"].endswith("TotalEnergies_logo.svg?width=96")
    # Not tagged with the feed id, but the nearest branded station.
    assert stations[35000025]["brand"] == "Leclerc"
    assert stations[35000025]["logo"] is None
    assert all(s["brand_checked"] for s in stations.values())


async def test_config_flow_unexpected_error(hass, aioclient_mock):
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": "user"})
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {"name": "C", "fuels": ["gazole"]})
    with patch(
        "custom_components.carburants_france.config_flow.CarburantsApi.search", side_effect=RuntimeError("boom")
    ):
        result = await hass.config_entries.flow.async_configure(result["flow_id"], {"query": "x", "radius": 5})
    assert result["errors"] == {"base": "unknown"}


async def test_old_logos_looked_up_again(hass, aioclient_mock, entry):
    options = dict(entry.options)
    options["stations"] = [
        {**options["stations"][0], "wikidata": "Q154037", "logo": "https://old-logo", "logo_version": 1},
        options["stations"][1],
    ]
    hass.config_entries.async_update_entry(entry, options=options)
    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)
    await _setup(hass, aioclient_mock, entry)
    await hass.async_block_till_done()
    total = {s["id"]: s for s in entry.options["stations"]}[35000013]
    assert total["logo"].endswith("/TotalEnergies_logo.svg?width=96")
    assert total["logo_version"] == LOGO_VERSION
    # Done once: no lookup at the next start.
    calls = aioclient_mock.call_count
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert not [c for c in aioclient_mock.mock_calls[calls:] if str(c[1]).startswith(OVERPASS_URL)]


@pytest.mark.parametrize(
    ("osm_name", "brand", "expected"),
    [
        pytest.param(
            "TotalEnergies Access Rennes Saint-Malo",
            "TotalEnergies",
            "TotalEnergies Access Rennes Saint-Malo",
            id="real-name",
        ),
        pytest.param("Station-service", "Esso", "Esso Rennes", id="generic"),
        pytest.param("E. Leclerc", "E.Leclerc", "E.Leclerc Rennes", id="repeats-brand"),
        pytest.param("Total", "TotalEnergies", "TotalEnergies Rennes", id="short-brand"),
        pytest.param("TotalEnergies", "Total", "Total Rennes", id="long-brand"),
        pytest.param("Leclerc", "E.Leclerc", "E.Leclerc Rennes", id="brand-without-initial"),
        pytest.param(None, None, "238 Rue Saint-Malo Rennes", id="nothing-known"),
    ],
)
def test_station_title(osm_name, brand, expected):
    stored = {"address": "238 Rue Saint-Malo", "city": "RENNES", "brand": brand, "osm_name": osm_name}
    assert station_title(stored) == expected
    assert station_title({**stored, "name": "Ma station"}) == "Ma station"
    assert useful_osm_name("  Total Access  ", "TotalEnergies") == "Total Access"


async def test_osm_names_looked_up_for_existing_stations(hass, aioclient_mock, entry):
    """Stations set up before names were kept get their OSM name once, at startup."""
    options = dict(entry.options)
    options["stations"] = [{**s, "logo_version": 2} for s in options["stations"]]
    hass.config_entries.async_update_entry(entry, options=options)
    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)
    await _setup(hass, aioclient_mock, entry)
    await hass.async_block_till_done()
    stations = {s["id"]: s for s in entry.options["stations"]}
    assert stations[35000013]["osm_name"] == "TotalEnergies Access Rennes Saint-Malo"
    state = hass.states.get("sensor.carburants_stations")
    names = {s["station_id"]: s["station_name"] for s in state.attributes["stations"]}
    assert names[35000013] == "TotalEnergies Access Rennes Saint-Malo"
    # OSM only says "Leclerc": brand and town are clearer.
    assert names[35000025] == "Leclerc Rennes"


async def test_options_flow_rename(hass, aioclient_mock, entry):
    await _setup(hass, aioclient_mock, entry)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {
            "fuels": ["gazole"],
            "stations": ["35000013", "35000025"],
            "add_stations": False,
            "rename_stations": True,
            "scan_interval": 15,
        },
    )
    assert result["step_id"] == "names"
    fields = [str(key) for key in result["data_schema"].schema]
    assert fields == [
        "TotalEnergies Rennes — 238 Rue Saint-Malo, Rennes [35000013]",
        "Leclerc Rennes — 19, BD LEON BOURGEOIS, Rennes [35000025]",
    ]
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {fields[0]: "  Total de la rocade  ", fields[1]: ""}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()
    names = {s["id"]: s["name"] for s in entry.options["stations"]}
    assert names == {35000013: "Total de la rocade", 35000025: None}
    stations = hass.states.get("sensor.carburants_stations").attributes["stations"]
    assert {s["station_id"]: s["station_name"] for s in stations} == {
        35000013: "Total de la rocade",
        35000025: "Leclerc Rennes",
    }


async def test_brand_found_250_m_away(hass, aioclient_mock):
    """The feed's coordinates can be a couple hundred metres off the forecourt."""
    from homeassistant.helpers.aiohttp_client import async_get_clientsession

    from custom_components.carburants_france.brands import async_lookup_brands

    aioclient_mock.post(
        OVERPASS_URL,
        json={
            "elements": [
                {
                    "type": "way",
                    "id": 3,
                    "center": {"lat": 48.1050, "lon": -1.7376},
                    "tags": {"amenity": "fuel", "brand": "Intermarché", "name": "Intermarché Vezin-le-Coquet"},
                },
            ]
        },
    )
    found = await async_lookup_brands(
        async_get_clientsession(hass), [{"id": 35132004, "latitude": 48.105, "longitude": -1.741}]
    )
    assert found[35132004]["name"] == "Intermarché Vezin-le-Coquet"
    query = aioclient_mock.mock_calls[0][2]["data"]
    assert "around:300,48.105,-1.741" in query


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        pytest.param("RELAIS LES TROIS MARCHES", "Relais les Trois Marches", id="caps"),
        pytest.param("RELAIS DE VERN SUR SEICHE", "Relais de Vern sur Seiche", id="small-words"),
        pytest.param("STATION D'ARGENTRE RN12", "Station d'Argentre RN12", id="apostrophe-road"),
        pytest.param("SARL ABR - GARAGE MACE", "SARL Abr - Garage Mace", id="company"),
        pytest.param("Total La Brosse", "Total La Brosse", id="already-mixed"),
    ],
)
def test_pretty_name(raw, expected):
    from custom_components.carburants_france.names import pretty_name

    assert pretty_name(raw) == expected


async def test_community_names_first(hass, aioclient_mock, entry, community_names):
    community_names.update(
        {
            "35000013": {"name": "RELAIS SAINT-MALO", "brand": "Total Access"},
            "99999999": {"name": "Ailleurs", "brand": "Esso"},
        }
    )
    await _setup(hass, aioclient_mock, entry)
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000013]["station_name"] == "Relais Saint-Malo"
    # Not in the file: OpenStreetMap / brand + town as before.
    assert stations[35000025]["station_name"] == "Leclerc Rennes"
    # The device follows; entity ids keep the name they were created with.
    from homeassistant.helpers import device_registry as dr

    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_35000013")})
    assert device.name == "Relais Saint-Malo"
    assert hass.states.get("sensor.relais_saint_malo_gazole") is not None


async def test_community_brand_when_osm_has_none(hass, aioclient_mock, entry, community_names):
    options = dict(entry.options)
    stations = [dict(s) for s in options["stations"]]
    stations[1]["brand"] = None
    hass.config_entries.async_update_entry(entry, options={**options, "stations": stations})
    community_names["35000025"] = {"name": "", "brand": "Total"}
    await _setup(hass, aioclient_mock, entry)
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000025]["brand"] == "Total"
    assert stations[35000025]["station_name"] == "Total Rennes"


async def test_custom_name_beats_community(hass, aioclient_mock, entry, community_names):
    options = dict(entry.options)
    stations = [{**s, "name": "Ma station"} if s["id"] == 35000013 else s for s in options["stations"]]
    hass.config_entries.async_update_entry(entry, options={**options, "stations": stations})
    community_names["35000013"] = {"name": "RELAIS SAINT-MALO", "brand": "Total"}
    await _setup(hass, aioclient_mock, entry)
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000013]["station_name"] == "Ma station"


@pytest.mark.real_names_download
async def test_names_downloaded_weekly_and_cached(hass, aioclient_mock, hass_storage):
    """Real download path: GitHub once, then the copy in .storage, also when GitHub is down."""
    from datetime import timedelta

    from freezegun import freeze_time

    from custom_components.carburants_france.names import DATA_NAMES, STATIONS_NAME_URL, async_get_names

    aioclient_mock.get(
        STATIONS_NAME_URL, json={"35132004": {"name": "RELAIS LES TROIS MARCHES", "brand": "Total Access"}, "1": "bad"}
    )
    names = await async_get_names(hass)
    assert names == {"35132004": {"name": "Relais les Trois Marches", "brand": "Total Access"}}
    assert aioclient_mock.call_count == 1
    await hass.async_block_till_done()
    assert hass_storage["carburants_france.stations_name"]["data"]["names"] == names

    # Same week: memory, no download.
    hass.data.pop(DATA_NAMES)
    assert await async_get_names(hass) == names
    assert aioclient_mock.call_count == 1

    # A week later GitHub is down: the cached copy is kept.
    aioclient_mock.clear_requests()
    aioclient_mock.get(STATIONS_NAME_URL, status=503)
    hass.data.pop(DATA_NAMES)
    with freeze_time(dt_util.utcnow() + timedelta(days=8)):
        assert await async_get_names(hass) == names
    assert aioclient_mock.call_count == 1


async def test_community_brand_first(hass, aioclient_mock, entry, community_names):
    """The community file wins over OpenStreetMap for the brand too; the logo stays OSM's."""
    community_names["35000013"] = {"name": "", "brand": "Total Access"}
    await _setup(hass, aioclient_mock, entry)
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000013]["brand"] == "Total Access"
    assert stations[35000013]["station_name"] == "Total Access Rennes"
    assert stations[35000013]["logo"] == "https://logo"


async def test_ai_leftovers_removed(hass, aioclient_mock, entry):
    """0.6.0 to 0.7.1 could store an AI entity and AI names: they are dropped at setup."""
    options = dict(entry.options)
    stations = [{**s, "ai_name": "Nom inventé", "ai_checked": True} for s in options["stations"]]
    hass.config_entries.async_update_entry(
        entry, options={**options, "stations": stations, "ai_task_entity": "ai_task.google_ai_task"}
    )
    await _setup(hass, aioclient_mock, entry)
    assert "ai_task_entity" not in entry.options
    assert not any("ai_name" in s or "ai_checked" in s for s in entry.options["stations"])
    names = {
        s["station_id"]: s["station_name"] for s in hass.states.get("sensor.carburants_stations").attributes["stations"]
    }
    assert names == {35000013: "TotalEnergies Rennes", 35000025: "Leclerc Rennes"}


def test_parse_shortage_just_lifted():
    """Neither price nor flat shortage, but the raw shortage has an end date: kept, with no price."""
    record = {
        **STATION_B,
        "e10_rupture_type": None,
        "e10_rupture_debut": None,
        "rupture": '[{"@nom": "E10", "@id": "5", "@debut": "2026-10-16 18:40:48", "@fin": "2026-10-20 18:05:00", "@type": "temporaire"}]',
    }
    fuel = parse_station(record)["fuels"]["e10"]
    assert fuel == {
        "price": None,
        "updated": None,
        "available": False,
        "rupture": None,
        "rupture_since": None,
        "rupture_end": "2026-10-20T18:05:00+00:00",
    }


async def test_known_fuel_kept_without_price_nor_shortage(hass, aioclient_mock, entry):
    """Relais Barre Thomas, 20 October: SP98 and E10 shortages lifted, no new price yet."""
    await _setup(hass, aioclient_mock, entry)
    assert hass.states.get("binary_sensor.leclerc_rennes_sp98_in_stock").state == "off"

    # Same station, now with no SP98 data at all, and HA restarting with it.
    lifted = {**STATION_B, "sp98_rupture_type": None, "sp98_rupture_debut": None}
    # E10 at TotalEnergies was in definitive shortage, so it never had an entity.
    total = {**STATION_A, "e10_rupture_type": None, "e10_rupture_debut": None}
    aioclient_mock.clear_requests()
    aioclient_mock.get(API_RECORDS, json={"total_count": 2, "results": [total, lifted]})
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()

    assert hass.states.get("sensor.leclerc_rennes_sp98").state == "unknown"
    assert hass.states.get("binary_sensor.leclerc_rennes_sp98_in_stock").state == "unknown"
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000025]["fuels"]["sp98"] == {
        "price": None,
        "updated": None,
        "available": False,
        "rupture": None,
        "rupture_since": None,
        "rupture_end": None,
    }
    # A fuel that never had an entity, with no data, stays absent.
    assert "e10" not in stations[35000013]["fuels"]
    assert hass.states.get("sensor.totalenergies_rennes_e10") is None


async def test_ws_search_nearby(hass, aioclient_mock, entry, hass_ws_client, community_names):
    """Stations around a point, shown by the map card but not followed."""
    community_names["35000025"] = {"name": "E.LECLERC RENNES SUD", "brand": "Leclerc"}
    await _setup(hass, aioclient_mock, entry)
    other = {**STATION_B, "id": 35000099}
    aioclient_mock.clear_requests()
    aioclient_mock.get(API_RECORDS, json={"total_count": 2, "results": [STATION_A, other]})
    client = await hass_ws_client(hass)
    await client.send_json(
        {"id": 1, "type": "carburants_france/search", "latitude": 48.1, "longitude": -1.67, "radius": 10}
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    _, url, _, _ = aioclient_mock.mock_calls[0]
    assert url.query["where"] == "within_distance(geom, geom'POINT(-1.67 48.1)', 10.0km)"
    result = msg["result"]
    assert [f["key"] for f in result["fuels"]] == ["gazole", "sp98", "e10"]
    a, b = result["stations"]
    # Followed: its stored name and logo. Not followed: name from the community file or brand + town.
    assert (a["station_id"], a["followed"], a["logo"]) == (35000013, True, "https://logo")
    assert a["station_name"] == "TotalEnergies Rennes"
    assert (b["station_id"], b["followed"], b["logo"]) == (35000099, False, None)
    assert b["distance"] is not None
    assert set(b["fuels"]) == {"gazole", "sp98", "e10"}
    # Nothing was added to the integration.
    assert [s["id"] for s in entry.options["stations"]] == [35000013, 35000025]


async def test_ws_search_city(hass, aioclient_mock, entry, hass_ws_client):
    await _setup(hass, aioclient_mock, entry)
    aioclient_mock.clear_requests()
    # "RENNES" and "Rennes" are the same town; Saint-Jacques also matches the word, but is left out.
    other_town = {**STATION_B, "id": 35136001, "ville": "Saint-Jacques-de-la-Lande Rennes"}
    aioclient_mock.get(API_RECORDS, json={"total_count": 3, "results": [STATION_A, other_town, STATION_B]})
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "carburants_france/search", "query": "rennes"})
    msg = await client.receive_json()
    assert msg["success"], msg
    assert msg["result"]["place"] == "Rennes"
    assert [s["station_id"] for s in msg["result"]["stations"]] == [35000013, 35000025]
    _, url, _, _ = aioclient_mock.mock_calls[0]
    # The town name only: a "Rue de Rennes" elsewhere would pull the map away.
    assert url.query["where"] == 'search(ville, "rennes")'
    # Nearest to home first.
    assert url.query["order_by"] == "distance(geom, geom'POINT(-1.68 48.11)')"

    await client.send_json({"id": 2, "type": "carburants_france/search"})
    msg = await client.receive_json()
    assert not msg["success"] and msg["error"]["code"] == "invalid_format"

    aioclient_mock.clear_requests()
    aioclient_mock.get(API_RECORDS, status=500, text="boom")
    await client.send_json({"id": 3, "type": "carburants_france/search", "query": "35000"})
    msg = await client.receive_json()
    assert not msg["success"] and msg["error"]["code"] == "api_error"


def _v1_entry(hass, title="Carburants", stations=None):
    entry = MockConfigEntry(
        domain=DOMAIN,
        title=title,
        data={},
        version=1,
        minor_version=1,
        options={
            "fuels": ["gazole", "sp98", "e10"],
            "stations": stations
            or [_stored(STATION_A, "TotalEnergies", "https://logo"), _stored(STATION_B, "Leclerc")],
            "scan_interval": 15,
        },
    )
    entry.add_to_hass(hass)
    return entry


def _v1_registry(hass, entry, station_id, name, fuels=("gazole",)):
    """Device and entities as 1.5.2 and earlier registered them: ids without the entry."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id, identifiers={(DOMAIN, str(station_id))}, name=name
    )
    entity_ids = []
    for fuel in fuels:
        for domain, kind, suffix in (("sensor", "price", ""), ("binary_sensor", "in_stock", "_in_stock")):
            reg = er.async_get(hass).async_get_or_create(
                domain,
                DOMAIN,
                f"{station_id}_{fuel}_{kind}",
                config_entry=entry,
                device_id=device.id,
                suggested_object_id=f"{name.lower().replace(' ', '_')}_{fuel}{suffix}",
            )
            entity_ids.append(reg.entity_id)
    return device, entity_ids


async def test_migration_keeps_entity_ids(hass, aioclient_mock):
    """1.1 entries: unique_ids and devices get the entry id, entity ids and devices are kept."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    entry = _v1_entry(hass)
    old_device, entity_ids = _v1_registry(hass, entry, 35000013, "My Total", ("gazole", "sp98"))
    assert "sensor.my_total_gazole" in entity_ids
    ent_reg = er.async_get(hass)
    best = ent_reg.async_get_or_create("sensor", DOMAIN, f"{entry.entry_id}_gazole_best", config_entry=entry)

    await _setup(hass, aioclient_mock, entry)
    assert entry.state is ConfigEntryState.LOADED
    assert (entry.version, entry.minor_version) == (1, 2)

    for entity_id in entity_ids:
        reg = ent_reg.async_get(entity_id)
        assert reg is not None, entity_id
        assert reg.unique_id.startswith(f"{entry.entry_id}_35000013_")
        assert reg.device_id == old_device.id
        assert hass.states.get(entity_id) is not None, entity_id
    assert ent_reg.async_get("sensor.my_total_gazole").unique_id == f"{entry.entry_id}_35000013_gazole_price"
    assert hass.states.get("sensor.my_total_gazole").state == "2.399"
    # The entry's own sensors already had the entry id: untouched.
    assert ent_reg.async_get(best.entity_id).unique_id == f"{entry.entry_id}_gazole_best"

    # Same device, new identifier, no duplicate created next to it.
    dev_reg = dr.async_get(hass)
    device = dev_reg.async_get(old_device.id)
    assert device.identifiers == {(DOMAIN, f"{entry.entry_id}_35000013")}
    assert dev_reg.async_get_device(identifiers={(DOMAIN, "35000013")}) is None
    devices = [
        d for d in dr.async_entries_for_config_entry(dev_reg, entry.entry_id) if "35000013" in str(d.identifiers)
    ]
    assert [d.id for d in devices] == [old_device.id]
    # No "_2" entity: every station entity of the entry is unique.
    station_entities = [
        e.entity_id for e in er.async_entries_for_config_entry(ent_reg, entry.entry_id) if "35000013" in e.unique_id
    ]
    assert sorted(station_entities) == sorted(entity_ids)
    assert not [e for e in station_entities if e.endswith("_2")]

    # Done once: a reload changes nothing.
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert ent_reg.async_get("sensor.my_total_gazole").unique_id == f"{entry.entry_id}_35000013_gazole_price"


async def test_migration_shared_station_device(hass, aioclient_mock):
    """Two 1.1 entries following one station shared its device; the second had no entity (duplicate ids)."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    first = _v1_entry(hass, "Maison")
    second = _v1_entry(hass, "Trajet", [_stored(STATION_A, "TotalEnergies", "https://logo")])
    old_device, _ = _v1_registry(hass, first, 35000013, "My Total")
    dev_reg = dr.async_get(hass)
    dev_reg.async_get_or_create(config_entry_id=second.entry_id, identifiers={(DOMAIN, "35000013")})
    assert dev_reg.async_get(old_device.id).config_entries == {first.entry_id, second.entry_id}

    await _setup(hass, aioclient_mock, first)
    assert second.state is ConfigEntryState.LOADED
    ent_reg = er.async_get(hass)
    # The first entry keeps its device and entities.
    assert dev_reg.async_get(old_device.id).config_entries == {first.entry_id}
    assert ent_reg.async_get("sensor.my_total_gazole").device_id == old_device.id
    # The second gets its own device and entities for the same station.
    own = dev_reg.async_get_device(identifiers={(DOMAIN, f"{second.entry_id}_35000013")})
    assert own is not None and own.id != old_device.id
    second_entities = [
        e for e in er.async_entries_for_config_entry(ent_reg, second.entry_id) if "35000013" in e.unique_id
    ]
    assert second_entities and all(e.device_id == own.id for e in second_entities)
    assert all(hass.states.get(e.entity_id) is not None for e in second_entities)


async def test_two_entries_same_station(hass, aioclient_mock, entry):
    """Each entry gets its own device and entities for a station both follow."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    other = MockConfigEntry(
        domain=DOMAIN,
        title="Trajet",
        data={},
        options={"fuels": ["gazole"], "stations": [_stored(STATION_A, "TotalEnergies")], "scan_interval": 15},
    )
    other.add_to_hass(hass)
    await _setup(hass, aioclient_mock, entry)
    assert other.state is ConfigEntryState.LOADED
    ent_reg = er.async_get(hass)
    ids = {
        e.entity_id
        for e in ent_reg.entities.values()
        if e.platform == DOMAIN and e.unique_id.endswith("_35000013_gazole_price")
    }
    assert len(ids) == 2
    assert all(hass.states.get(i).state == "2.399" for i in ids)
    dev_reg = dr.async_get(hass)
    for config_entry in (entry, other):
        device = dev_reg.async_get_device(identifiers={(DOMAIN, f"{config_entry.entry_id}_35000013")})
        assert device.config_entries == {config_entry.entry_id}


async def test_unfollowed_station_and_fuel_removed(hass, aioclient_mock, entry):
    """Unticking a station or a fuel removes its entities and device, not just leaves them orphaned."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    await _setup(hass, aioclient_mock, entry)
    ent_reg = er.async_get(hass)
    dev_reg = dr.async_get(hass)
    assert ent_reg.async_get("sensor.totalenergies_rennes_sp98") is not None
    result = await hass.config_entries.options.async_init(entry.entry_id)
    await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"fuels": ["gazole"], "stations": ["35000025"], "add_stations": False, "scan_interval": 15},
    )
    await hass.async_block_till_done()
    assert ent_reg.async_get("sensor.totalenergies_rennes_gazole") is None
    assert ent_reg.async_get("binary_sensor.totalenergies_rennes_gazole_in_stock") is None
    assert ent_reg.async_get("sensor.leclerc_rennes_sp98") is None
    assert ent_reg.async_get("sensor.carburants_best_price_sp98") is None
    assert ent_reg.async_get("sensor.leclerc_rennes_gazole") is not None
    assert ent_reg.async_get("sensor.carburants_best_price_gazole") is not None
    assert dev_reg.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_35000013")}) is None
    assert dev_reg.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_35000025")}) is not None
    assert dev_reg.async_get_device(identifiers={(DOMAIN, entry.entry_id)}) is not None


async def test_entities_for_station_missing_at_startup(hass, aioclient_mock, entry):
    """A station absent from the first answer keeps its entities; a newly sold fuel gets them without reload."""
    await _setup(hass, aioclient_mock, entry)
    assert hass.states.get("sensor.totalenergies_rennes_gazole").state == "2.399"

    # Restart while the feed omits the station.
    aioclient_mock.clear_requests()
    aioclient_mock.get(API_RECORDS, json={"total_count": 1, "results": [STATION_B]})
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get("sensor.totalenergies_rennes_gazole").state == "unavailable"

    # It comes back, now also selling E10 (was in definitive shortage): entities appear at the next poll.
    total = {**STATION_A, "e10_rupture_type": None, "e10_rupture_debut": None, "e10_prix": 1.799}
    aioclient_mock.clear_requests()
    aioclient_mock.get(API_RECORDS, json={"total_count": 2, "results": [total, STATION_B]})
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
    assert hass.states.get("sensor.totalenergies_rennes_gazole").state == "2.399"
    assert hass.states.get("sensor.totalenergies_rennes_e10").state == "1.799"
    assert hass.states.get("binary_sensor.totalenergies_rennes_e10_in_stock").state == "on"


async def test_brand_lookup_does_not_reload(hass, aioclient_mock, entry):
    """The background brand lookup updates names in place, without a second API call or a reload."""
    from homeassistant.helpers import device_registry as dr

    options = dict(entry.options)
    options["stations"] = [{**s, "brand": None, "logo": None, "brand_checked": False} for s in options["stations"]]
    hass.config_entries.async_update_entry(entry, options=options)
    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)
    await _setup(hass, aioclient_mock, entry)
    await hass.async_block_till_done()
    assert entry.options["stations"][0]["brand_checked"] is True
    api_calls = [c for c in aioclient_mock.mock_calls if str(c[1]).startswith(API_RECORDS)]
    assert len(api_calls) == 1
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000013]["station_name"] == "TotalEnergies Access Rennes Saint-Malo"
    assert stations[35000013]["logo"].endswith("TotalEnergies_logo.svg?width=96")
    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_35000013")})
    assert device.name == "TotalEnergies Access Rennes Saint-Malo"
    assert device.manufacturer == "TotalEnergies"


async def test_migration_shared_device_both_with_entities(hass, aioclient_mock):
    """Two 1.1 entries following one station for different fuels: both had entities on the shared device."""
    from homeassistant.helpers import device_registry as dr
    from homeassistant.helpers import entity_registry as er

    first = _v1_entry(hass, "Maison", [_stored(STATION_A, "TotalEnergies")])
    second = _v1_entry(hass, "Trajet", [_stored(STATION_A, "TotalEnergies")])
    hass.config_entries.async_update_entry(first, options={**first.options, "fuels": ["gazole"]})
    hass.config_entries.async_update_entry(second, options={**second.options, "fuels": ["sp98"]})
    old_device, first_ids = _v1_registry(hass, first, 35000013, "Total Gazole", ("gazole",))
    dev_reg = dr.async_get(hass)
    ent_reg = er.async_get(hass)
    dev_reg.async_get_or_create(config_entry_id=second.entry_id, identifiers={(DOMAIN, "35000013")})
    second_ids = []
    for domain, kind in (("sensor", "price"), ("binary_sensor", "in_stock")):
        reg = ent_reg.async_get_or_create(
            domain, DOMAIN, f"35000013_sp98_{kind}", config_entry=second, device_id=old_device.id
        )
        second_ids.append(reg.entity_id)

    await _setup(hass, aioclient_mock, first)
    assert second.state is ConfigEntryState.LOADED
    for config_entry, entity_ids in ((first, first_ids), (second, second_ids)):
        device = dev_reg.async_get_device(identifiers={(DOMAIN, f"{config_entry.entry_id}_35000013")})
        assert device is not None and device.config_entries == {config_entry.entry_id}
        for entity_id in entity_ids:
            reg = ent_reg.async_get(entity_id)
            assert reg is not None, entity_id
            assert reg.unique_id.startswith(f"{config_entry.entry_id}_35000013_")
            assert reg.device_id == device.id
            assert hass.states.get(entity_id).state != "unavailable"
    # The old shared device is gone once both entries left it, or (depending on which entry
    # migrates first) it was taken over as the own device of the entry holding all its entities.
    old = dev_reg.async_get(old_device.id)
    assert (
        old is None
        or not old.config_entries
        or any(old.identifiers == {(DOMAIN, f"{e.entry_id}_35000013")} for e in (first, second))
    )
    assert not [e for e in ent_reg.entities.values() if e.platform == DOMAIN and e.entity_id.endswith("_2")]


async def test_unload_entry(hass, aioclient_mock, entry):
    await _setup(hass, aioclient_mock, entry)
    assert await hass.config_entries.async_unload(entry.entry_id)
    await hass.async_block_till_done()
    assert entry.state is ConfigEntryState.NOT_LOADED
    assert hass.states.get("sensor.carburants_stations").state == "unavailable"


async def test_card_resource_removed_with_last_entry(hass, aioclient_mock, entry, stub_frontend):
    """The dashboard resource goes with the last entry, and comes back with a new one."""
    assert await async_setup_component(hass, "lovelace", {})
    other = MockConfigEntry(
        domain=DOMAIN,
        title="Trajet",
        data={},
        options={"fuels": ["gazole"], "stations": [_stored(STATION_A, "TotalEnergies")], "scan_interval": 15},
    )
    other.add_to_hass(hass)
    await _setup(hass, aioclient_mock, entry)
    resources = _storage_resources(hass)

    def card_urls():
        return [i["url"] for i in resources.async_items() if "carburants-france-card.js" in i["url"]]

    assert len(card_urls()) == 1
    await hass.config_entries.async_remove(other.entry_id)
    await hass.async_block_till_done()
    assert len(card_urls()) == 1
    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert card_urls() == []

    again = MockConfigEntry(domain=DOMAIN, title="Carburants", data={}, options=dict(entry.options))
    again.add_to_hass(hass)
    assert await hass.config_entries.async_setup(again.entry_id)
    await hass.async_block_till_done()
    assert len(card_urls()) == 1


async def test_options_flow_error_keeps_input(hass, aioclient_mock, entry):
    """The form shown again after an error keeps what was entered, not the stored options."""
    await _setup(hass, aioclient_mock, entry)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"fuels": ["e10"], "stations": [], "add_stations": False, "rename_stations": True, "scan_interval": 45},
    )
    assert result["errors"] == {"base": "no_station"}
    defaults = {str(key): key.default() for key in result["data_schema"].schema}
    assert defaults == {
        "fuels": ["e10"],
        "stations": [],
        "add_stations": False,
        "rename_stations": True,
        "scan_interval": 45,
    }
    result = await hass.config_entries.options.async_configure(
        result["flow_id"],
        {"fuels": [], "stations": ["35000025"], "add_stations": False, "rename_stations": False, "scan_interval": 45},
    )
    assert result["errors"] == {"fuels": "no_fuel"}
    defaults = {str(key): key.default() for key in result["data_schema"].schema}
    assert defaults["fuels"] == []
    assert defaults["stations"] == ["35000025"]


async def test_rename_during_brand_lookup_kept(hass, aioclient_mock, entry):
    """A station renamed while the background brand lookup runs keeps its new name."""
    import asyncio

    from custom_components.carburants_france import brands

    options = dict(entry.options)
    options["stations"] = [{**s, "brand": None, "logo": None, "brand_checked": False} for s in options["stations"]]
    hass.config_entries.async_update_entry(entry, options=options)
    started, release = asyncio.Event(), asyncio.Event()
    real_enrich = brands.async_enrich

    async def slow_enrich(session, stations, with_logos=True):
        started.set()
        await release.wait()
        return await real_enrich(session, stations, with_logos)

    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)
    with patch("custom_components.carburants_france.async_enrich", side_effect=slow_enrich):
        await _setup(hass, aioclient_mock, entry)
        await started.wait()
        renamed = [{**s, "name": "Ma station"} if s["id"] == 35000013 else s for s in entry.options["stations"]]
        hass.config_entries.async_update_entry(entry, options={**entry.options, "stations": renamed})
        await hass.async_block_till_done()
        release.set()
        await hass.async_block_till_done()
    stations = {s["id"]: s for s in entry.options["stations"]}
    assert stations[35000013].get("name") == "Ma station"
    assert stations[35000013]["brand"] == "TotalEnergies"
    assert all(s["brand_checked"] for s in stations.values())


async def test_entry_rename_renames_device(hass, aioclient_mock, entry):
    """Renaming the entry renames its device and the entities named after it, without a reload."""
    from homeassistant.helpers import device_registry as dr

    await _setup(hass, aioclient_mock, entry)
    calls = len(aioclient_mock.mock_calls)
    hass.config_entries.async_update_entry(entry, title="Maison")
    await hass.async_block_till_done()
    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, entry.entry_id)})
    assert device.name == "Maison"
    assert hass.states.get("sensor.carburants_stations").attributes["friendly_name"] == "Maison Stations"
    assert len(aioclient_mock.mock_calls) == calls

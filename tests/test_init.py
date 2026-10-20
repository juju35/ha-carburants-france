"""Tests for the Carburants France integration."""

from unittest.mock import patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util

from custom_components.carburants_france.api import parse_station
from custom_components.carburants_france.coordinator import station_title, useful_osm_name
from custom_components.carburants_france.const import API_RECORDS, DOMAIN, LOGO_VERSION, OVERPASS_URL, WIKIDATA_URL

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
    "id": 35000013, "latitude": "4812600", "longitude": "-168500", "cp": "35000", "pop": "R",
    "adresse": "238 Rue Saint-Malo", "ville": "Rennes", "horaires": HOURS_24,
    "geom": {"lon": -1.685, "lat": 48.126},
    "gazole_maj": "2026-09-25T08:23:31+00:00", "gazole_prix": 2.399,
    "sp95_maj": "2026-09-25T08:23:31+00:00", "sp95_prix": 2.251,
    "e85_prix": None, "gplc_prix": None, "e10_prix": None,
    "sp98_maj": "2026-09-25T08:23:31+00:00", "sp98_prix": 2.3,
    "e10_rupture_debut": "2021-02-02T08:32:57+00:00", "e10_rupture_type": "definitive",
    "e85_rupture_debut": "2021-02-02T08:33:34+00:00", "e85_rupture_type": "definitive",
    "gplc_rupture_debut": "2021-02-02T08:33:34+00:00", "gplc_rupture_type": "definitive",
    "gazole_rupture_type": None, "sp95_rupture_type": None, "sp98_rupture_type": None,
    "horaires_automate_24_24": "Oui", "services_service": ["Station de gonflage", "Lavage manuel"],
}
STATION_B = {
    "id": 35000025, "latitude": "4809890.2183757", "longitude": "-165400.71882227", "cp": "35000", "pop": "R",
    "adresse": "19, BD LEON BOURGEOIS", "ville": "RENNES", "horaires": HOURS_DAY,
    "geom": {"lon": -1.6540071882226999, "lat": 48.098902183757},
    "gazole_maj": "2026-10-16T19:40:07+00:00", "gazole_prix": 2.25,
    "sp95_prix": None, "sp98_prix": None, "e10_prix": None,
    "e10_rupture_debut": "2026-10-16T18:40:48+00:00", "e10_rupture_type": "temporaire",
    "sp98_rupture_debut": "2026-10-17T16:32:46+00:00", "sp98_rupture_type": "temporaire",
    "sp95_rupture_debut": "2026-03-27T18:43:44+00:00", "sp95_rupture_type": "definitive",
    "horaires_automate_24_24": "Oui", "services_service": ["Relais colis"],
}
OVERPASS = {
    "elements": [
        {"type": "node", "id": 1, "lat": 48.12601, "lon": -1.68502,
         "tags": {"amenity": "fuel", "brand": "TotalEnergies", "brand:wikidata": "Q154037",
                  "name": "TotalEnergies Access Rennes Saint-Malo", "ref:FR:prix-carburants": "35000013"}},
        {"type": "way", "id": 2, "center": {"lat": 48.0989, "lon": -1.6541},
         "tags": {"amenity": "fuel", "brand": "Leclerc", "name": "Leclerc", "brand:wikidata": "Q1273376"}},
    ]
}
WIKIDATA = {
    "entities": {
        # The old logo stays listed, with an end time.
        "Q154037": {"claims": {"P154": [
            {"rank": "normal", "mainsnak": {"datavalue": {"value": "Total logo.svg"}},
             "qualifiers": {"P582": [{"datavalue": {"value": {"time": "+2021-05-28T00:00:00Z"}}}]}},
            {"rank": "normal", "mainsnak": {"datavalue": {"value": "TotalEnergies logo.svg"}}},
        ]}},
        "Q1273376": {"claims": {}},
    }
}


def _stored(record, brand=None, logo=None):
    s = parse_station(record)
    return {
        "id": s["id"], "address": s["address"], "postcode": s["postcode"], "city": s["city"],
        "latitude": s["latitude"], "longitude": s["longitude"],
        "brand": brand, "wikidata": None, "logo": logo, "brand_checked": True, "logo_version": LOGO_VERSION,
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
        "price": 2.399, "updated": "2026-09-25T08:23:31+00:00", "available": True,
        "rupture": None, "rupture_since": None, "rupture_end": None,
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
    resp = await client.get("/carburants_france_static/leaflet/leaflet.js")
    assert resp.status == 200
    resp = await client.get("/carburants_france_static/leaflet/leaflet.css")
    assert resp.status == 200


async def test_card_added_to_resources(hass, aioclient_mock, entry, stub_frontend):
    assert await async_setup_component(hass, "lovelace", {})
    await _setup(hass, aioclient_mock, entry)
    resources = hass.data["lovelace"].resources
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
    search_call = [c for c in aioclient_mock.mock_calls if str(c[1]).startswith(API_RECORDS)][0]
    assert "within_distance(geom, geom'POINT(-1.68 48.11)', 5.0km)" == search_call[1].query["where"]
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
        pytest.param("TotalEnergies Access Rennes Saint-Malo", "TotalEnergies", "TotalEnergies Access Rennes Saint-Malo", id="real-name"),
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
        {"fuels": ["gazole"], "stations": ["35000013", "35000025"], "add_stations": False,
         "rename_stations": True, "scan_interval": 15},
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
    from custom_components.carburants_france.brands import async_lookup_brands
    from homeassistant.helpers.aiohttp_client import async_get_clientsession

    aioclient_mock.post(OVERPASS_URL, json={"elements": [
        {"type": "way", "id": 3, "center": {"lat": 48.1050, "lon": -1.7376},
         "tags": {"amenity": "fuel", "brand": "Intermarché", "name": "Intermarché Vezin-le-Coquet"}},
    ]})
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
    community_names.update({
        "35000013": {"name": "RELAIS SAINT-MALO", "brand": "Total Access"},
        "99999999": {"name": "Ailleurs", "brand": "Esso"},
    })
    await _setup(hass, aioclient_mock, entry)
    stations = {s["station_id"]: s for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert stations[35000013]["station_name"] == "Relais Saint-Malo"
    # Not in the file: OpenStreetMap / brand + town as before.
    assert stations[35000025]["station_name"] == "Leclerc Rennes"
    # The device follows; entity ids keep the name they were created with.
    from homeassistant.helpers import device_registry as dr

    device = dr.async_get(hass).async_get_device(identifiers={(DOMAIN, "35000013")})
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
    names = {s["station_id"]: s["station_name"] for s in hass.states.get("sensor.carburants_stations").attributes["stations"]}
    assert names == {35000013: "TotalEnergies Rennes", 35000025: "Leclerc Rennes"}



def test_parse_shortage_just_lifted():
    """Neither price nor flat shortage, but the raw shortage has an end date: kept, with no price."""
    record = {
        **STATION_B,
        "e10_rupture_type": None, "e10_rupture_debut": None,
        "rupture": '[{"@nom": "E10", "@id": "5", "@debut": "2026-10-16 18:40:48", "@fin": "2026-10-20 18:05:00", "@type": "temporaire"}]',
    }
    fuel = parse_station(record)["fuels"]["e10"]
    assert fuel == {
        "price": None, "updated": None, "available": False, "rupture": None, "rupture_since": None,
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
        "price": None, "updated": None, "available": False, "rupture": None, "rupture_since": None, "rupture_end": None,
    }
    # A fuel that never had an entity, with no data, stays absent.
    assert "e10" not in stations[35000013]["fuels"]
    assert hass.states.get("sensor.totalenergies_rennes_e10") is None

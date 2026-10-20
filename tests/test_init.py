"""Tests for the Carburants France integration."""

from unittest.mock import patch

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.setup import async_setup_component

from custom_components.carburants_france.api import parse_station
from custom_components.carburants_france.const import API_RECORDS, DOMAIN, OVERPASS_URL, WIKIDATA_URL

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
                  "ref:FR:prix-carburants": "35000013"}},
        {"type": "way", "id": 2, "center": {"lat": 48.0989, "lon": -1.6541},
         "tags": {"amenity": "fuel", "brand": "Leclerc", "brand:wikidata": "Q1273376"}},
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
        "brand": brand, "wikidata": None, "logo": logo, "brand_checked": True,
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
        "rupture": None, "rupture_since": None,
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
    assert labels["35000013"].startswith("TotalEnergies · 238 Rue Saint-Malo, 35000 Rennes — Gazole 2,399 € · SP98 2,300 €")
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
        {**options["stations"][0], "wikidata": "Q154037", "logo": "https://old-logo"},
        options["stations"][1],
    ]
    hass.config_entries.async_update_entry(entry, options=options)
    aioclient_mock.post(OVERPASS_URL, json=OVERPASS)
    aioclient_mock.get(WIKIDATA_URL, json=WIKIDATA)
    await _setup(hass, aioclient_mock, entry)
    await hass.async_block_till_done()
    total = {s["id"]: s for s in entry.options["stations"]}[35000013]
    assert total["logo"].endswith("/TotalEnergies_logo.svg?width=96")
    assert total["logo_version"] == 2
    # Done once: no lookup at the next start.
    calls = aioclient_mock.call_count
    await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert not [c for c in aioclient_mock.mock_calls[calls:] if str(c[1]).startswith(OVERPASS_URL)]

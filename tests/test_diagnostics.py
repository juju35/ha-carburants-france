"""Tests for the Carburants France diagnostics."""

import json

from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.carburants_france.const import DOMAIN
from custom_components.carburants_france.diagnostics import async_get_config_entry_diagnostics

from .test_init import STATION_A, STATION_B, _setup, _stored


async def test_diagnostics_redacts_positions(hass, aioclient_mock):
    entry = MockConfigEntry(
        domain=DOMAIN,
        title="Carburants",
        data={},
        options={
            "fuels": ["gazole", "sp98"],
            "stations": [_stored(STATION_A, "TotalEnergies"), _stored(STATION_B, "Leclerc")],
            "scan_interval": 15,
            # Not stored today: redacted if an option ever holds it.
            "query": "12 rue de la Maison, Rennes",
            "api_key": "secret-key",
        },
    )
    entry.add_to_hass(hass)
    await _setup(hass, aioclient_mock, entry)

    diag = await async_get_config_entry_diagnostics(hass, entry)

    options = diag["entry"]["options"]
    assert options["fuels"] == ["gazole", "sp98"]
    assert options["query"] == "**REDACTED**"
    assert options["api_key"] == "**REDACTED**"
    stored = options["stations"][0]
    assert stored["id"] == 35000013
    assert stored["brand"] == "TotalEnergies"
    for key in ("address", "latitude", "longitude"):
        assert stored[key] == "**REDACTED**"

    coordinator = diag["coordinator"]
    assert coordinator["last_update_success"] is True
    station = coordinator["data"]["35000013"]
    assert station["fuels"]["gazole"]["price"] == 2.399
    for key in ("address", "latitude", "longitude", "distance"):
        assert station[key] == "**REDACTED**"

    # Nothing gives the home or the secrets away, anywhere in the dump.
    dump = json.dumps(diag, default=str)
    for secret in ("238 Rue Saint-Malo", "48.126", "-1.685", "secret-key", "rue de la Maison"):
        assert secret not in dump

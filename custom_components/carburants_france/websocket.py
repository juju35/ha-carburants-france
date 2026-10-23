"""Websocket command for the map card: stations around a point or in a town, shown but not followed."""

from __future__ import annotations

import re
import unicodedata
from collections import Counter
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import CarburantsApi, CarburantsError, sold_fuels
from .const import DEFAULT_RADIUS, DOMAIN, FUELS, MAX_SEARCH_RADIUS, ST_LOGO
from .coordinator import pretty_city, station_brand, station_title
from .names import async_get_names
from .sensor import card_station

WS_SEARCH = f"{DOMAIN}/search"


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_search)


def _followed(hass: HomeAssistant) -> tuple[dict[int, dict[str, Any]], list[str]]:
    """Stations followed by the loaded entries ({id: stored}), and their fuels."""
    stations: dict[int, dict[str, Any]] = {}
    fuels: list[str] = []
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is not ConfigEntryState.LOADED:
            continue
        coordinator = entry.runtime_data
        stations.update(coordinator.stations)
        fuels += [f for f in coordinator.fuels if f not in fuels]
    return stations, fuels


def _fold(text: str) -> str:
    """Lower case, no accents, words only: "Saint-Grégoire" and "ST GREGOIRE" stay apart, "RENNES" == "Rennes"."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode().lower()
    return " ".join(re.findall(r"[a-z0-9]+", text))


def _town(stations: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    """Keep one town, so the map focuses on it: the one named exactly, else the one starting
    with the query, else the one with the most stations."""
    wanted = _fold(query)
    towns = Counter(_fold(s["city"]) for s in stations if s["city"])
    if not towns:
        return stations
    town = (
        wanted
        if wanted in towns
        else next((t for t, _ in towns.most_common() if t.startswith(wanted)), towns.most_common(1)[0][0])
    )
    return [s for s in stations if _fold(s["city"]) == town]


@websocket_api.websocket_command(
    {
        vol.Required("type"): WS_SEARCH,
        vol.Optional("query", default=""): str,
        vol.Inclusive("latitude", "point"): vol.All(vol.Coerce(float), vol.Range(min=-90, max=90)),
        vol.Inclusive("longitude", "point"): vol.All(vol.Coerce(float), vol.Range(min=-180, max=180)),
        vol.Optional("radius", default=DEFAULT_RADIUS): vol.All(
            vol.Coerce(float), vol.Range(min=0.5, max=MAX_SEARCH_RADIUS)
        ),
        vol.Optional("fuels"): [vol.In(list(FUELS))],
    }
)
@websocket_api.async_response
async def ws_search(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Search the feed like the config flow does; nothing is stored.

    With a point and no query: stations within the radius, nearest first. With a town name: the
    stations of that town (one town, its name in "place"). A postcode or a department works too.
    """
    query = msg["query"].strip()
    latitude, longitude = msg.get("latitude"), msg.get("longitude")
    if not query and latitude is None:
        connection.send_error(msg["id"], "invalid_format", "A query or a position is needed")
        return
    if latitude is None:
        latitude, longitude = hass.config.latitude, hass.config.longitude

    followed, followed_fuels = _followed(hass)
    fuels = msg.get("fuels") or followed_fuels or list(FUELS)
    try:
        found = await CarburantsApi(async_get_clientsession(hass)).search(
            query, latitude, longitude, msg["radius"], towns_only=True
        )
    except CarburantsError as err:
        connection.send_error(msg["id"], "api_error", str(err))
        return

    place = None
    if query and not re.fullmatch(r"\d{2,8}|2[AB]", query, re.IGNORECASE):
        found = _town(found, query)
        place = pretty_city(found[0]["city"]) if found else None

    names = await async_get_names(hass)
    stations = []
    for station in found:
        # A station without any of the fuels would only be an empty marker.
        if not any(f in fuels for f in sold_fuels(station)):
            continue
        stored = followed.get(station["id"])
        station["name"] = station_title(stored or station, names)
        station["brand"] = station_brand(stored or station, names)
        station["logo"] = (stored or {}).get(ST_LOGO)
        stations.append({**card_station(station, fuels), "followed": stored is not None})

    connection.send_result(
        msg["id"],
        {
            "place": place,
            "latitude": latitude,
            "longitude": longitude,
            "fuels": [{"key": k, "name": FUELS[k]} for k in fuels],
            "stations": stations,
        },
    )

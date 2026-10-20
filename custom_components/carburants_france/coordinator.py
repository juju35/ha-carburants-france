"""Data update coordinator for Carburants France."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CarburantsApi, CarburantsError, distance_km
from .const import (
    CONF_FUELS,
    CONF_SCAN_INTERVAL,
    CONF_STATIONS,
    DEFAULT_FUELS,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    MIN_SCAN_INTERVAL,
    ST_BRAND,
    ST_ID,
    ST_LOGO,
    ST_NAME,
    ST_OSM_NAME,
)

_LOGGER = logging.getLogger(__name__)

type CarburantsConfigEntry = ConfigEntry[CarburantsCoordinator]


def pretty_city(city: str) -> str:
    """The feed mixes "Rennes" and "RENNES"."""
    return city.title() if city.isupper() else city


GENERIC_NAMES = {"station", "station service", "stationservice", "carburant", "carburants", "essence", "fuel"}


def _key(text: str) -> str:
    return "".join(ch for ch in text.lower() if ch.isalnum() or ch == " ").replace("  ", " ").strip()


def useful_osm_name(name: str | None, brand: str | None) -> str | None:
    """The OpenStreetMap name, unless it only repeats the brand or says "Station-service"."""
    if not name:
        return None
    key = _key(name.replace("-", " "))
    if key in GENERIC_NAMES or (brand and key.replace(" ", "") == _key(brand.replace("-", " ")).replace(" ", "")):
        return None
    return name.strip()


def station_title(stored: dict[str, Any]) -> str:
    """Name shown for a station: custom name, else its OSM name, else brand + town, else address."""
    if stored.get(ST_NAME):
        return stored[ST_NAME]
    if osm_name := useful_osm_name(stored.get(ST_OSM_NAME), stored.get(ST_BRAND)):
        return osm_name
    city = pretty_city(stored.get("city") or "")
    if stored.get(ST_BRAND):
        return f"{stored[ST_BRAND]} {city}".strip()
    return f"{stored.get('address') or 'Station'} {city}".strip()


class CarburantsCoordinator(DataUpdateCoordinator[dict[int, dict[str, Any]]]):
    """Fetch every followed station in one request."""

    config_entry: CarburantsConfigEntry

    def __init__(self, hass: HomeAssistant, entry: CarburantsConfigEntry, api: CarburantsApi) -> None:
        minutes = max(MIN_SCAN_INTERVAL, int(entry.options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)))
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=timedelta(minutes=minutes),
        )
        self.api = api
        self.fuels: list[str] = list(entry.options.get(CONF_FUELS, DEFAULT_FUELS))
        self.stations: dict[int, dict[str, Any]] = {
            int(s[ST_ID]): s for s in entry.options.get(CONF_STATIONS, [])
        }

    async def _async_update_data(self) -> dict[int, dict[str, Any]]:
        if not self.stations:
            return {}
        try:
            data = await self.api.get_stations(list(self.stations))
        except CarburantsError as err:
            raise UpdateFailed(str(err)) from err
        home = (self.hass.config.latitude, self.hass.config.longitude)
        for station_id, station in data.items():
            station["distance"] = distance_km(home[0], home[1], station["latitude"], station["longitude"])
            stored = self.stations.get(station_id, {})
            station["name"] = station_title(stored or station)
            station["brand"] = stored.get(ST_BRAND)
            station["logo"] = stored.get(ST_LOGO)
        return data

    def best(self, fuel: str) -> dict[str, Any] | None:
        """The followed station selling this fuel cheapest right now."""
        offers = [
            (s["fuels"][fuel]["price"], s)
            for s in (self.data or {}).values()
            if fuel in s["fuels"] and s["fuels"][fuel]["available"]
        ]
        if not offers:
            return None
        return min(offers, key=lambda o: (o[0], o[1].get("distance") or 0))[1]

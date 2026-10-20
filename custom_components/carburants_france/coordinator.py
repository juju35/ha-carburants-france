"""Data update coordinator for Carburants France."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CarburantsApi, CarburantsError, distance_km, empty_fuel
from .const import (
    CONF_FUELS,
    CONF_SCAN_INTERVAL,
    CONF_STATIONS,
    DEFAULT_FUELS,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    FUELS,
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


def community_entry(station: dict[str, Any], names: dict[str, dict[str, str]] | None) -> dict[str, str]:
    """The station's line in the community names file (see names.py), or {}."""
    return (names or {}).get(str(station.get(ST_ID, station.get("station_id", ""))), {})


def station_brand(stored: dict[str, Any], names: dict[str, dict[str, str]] | None = None) -> str | None:
    """Brand from the community file, the main source, else from OpenStreetMap."""
    return community_entry(stored, names).get("brand") or stored.get(ST_BRAND) or None


def station_title(stored: dict[str, Any], names: dict[str, dict[str, str]] | None = None) -> str:
    """Name shown: custom, community file, OpenStreetMap, then brand + town, then address."""
    if stored.get(ST_NAME):
        return stored[ST_NAME]
    if community_name := community_entry(stored, names).get("name"):
        return community_name
    if osm_name := useful_osm_name(stored.get(ST_OSM_NAME), stored.get(ST_BRAND)):
        return osm_name
    city = pretty_city(stored.get("city") or "")
    if brand := station_brand(stored, names):
        return f"{brand} {city}".strip()
    return f"{stored.get('address') or 'Station'} {city}".strip()


class CarburantsCoordinator(DataUpdateCoordinator[dict[int, dict[str, Any]]]):
    """Fetch every followed station in one request."""

    config_entry: CarburantsConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: CarburantsConfigEntry,
        api: CarburantsApi,
        names: dict[str, dict[str, str]] | None = None,
    ) -> None:
        minutes = max(MIN_SCAN_INTERVAL, int(entry.options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)))
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=DOMAIN,
            update_interval=timedelta(minutes=minutes),
        )
        self.api = api
        # Community station names, {id: {name, brand}} (names.py).
        self.names = names or {}
        self.fuels: list[str] = list(entry.options.get(CONF_FUELS, DEFAULT_FUELS))
        self.stations: dict[int, dict[str, Any]] = {
            int(s[ST_ID]): s for s in entry.options.get(CONF_STATIONS, [])
        }
        # (station id, fuel) pairs sold at some point: those with an entity, plus those seen since.
        # A fuel can briefly have neither price nor shortage in the feed (shortage just lifted,
        # no new price yet); it must not vanish from the card nor lose its entities.
        self.known_fuels: set[tuple[int, str]] = self._registered_fuels()

    def _registered_fuels(self) -> set[tuple[int, str]]:
        known = set()
        for reg_entry in er.async_entries_for_config_entry(er.async_get(self.hass), self.config_entry.entry_id):
            parts = (reg_entry.unique_id or "").split("_")
            if len(parts) >= 3 and parts[0].isdigit() and parts[1] in FUELS:
                known.add((int(parts[0]), parts[1]))
        return known

    async def _async_update_data(self) -> dict[int, dict[str, Any]]:
        if not self.stations:
            return {}
        try:
            data = await self.api.get_stations(list(self.stations))
        except CarburantsError as err:
            raise UpdateFailed(str(err)) from err
        home = (self.hass.config.latitude, self.hass.config.longitude)
        for station_id, station in data.items():
            for fuel in self.fuels:
                if fuel in station["fuels"]:
                    self.known_fuels.add((station_id, fuel))
                elif (station_id, fuel) in self.known_fuels:
                    station["fuels"][fuel] = empty_fuel()
            station["distance"] = distance_km(home[0], home[1], station["latitude"], station["longitude"])
            stored = self.stations.get(station_id, {})
            station["name"] = station_title(stored or station, self.names)
            station["brand"] = station_brand(stored or station, self.names)
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

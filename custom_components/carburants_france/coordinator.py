"""Data update coordinator for Carburants France."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CarburantsApi, CarburantsError, distance_km, empty_fuel, sold_fuels
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
from .registry_compat import get_device

_LOGGER = logging.getLogger(__name__)

type CarburantsConfigEntry = ConfigEntry[CarburantsCoordinator]


def station_device_id(entry_id: str, station_id: int | str) -> str:
    """Device identifier, and unique_id prefix, of a station in one entry."""
    return f"{entry_id}_{station_id}"


def parse_station_unique_id(entry_id: str, unique_id: str | None) -> tuple[int, str, str] | None:
    """(station id, fuel, kind) from a station entity's unique_id, or None for the entry's own sensors."""
    prefix = f"{entry_id}_"
    if not unique_id or not unique_id.startswith(prefix):
        return None
    parts = unique_id[len(prefix) :].split("_", 2)
    if len(parts) == 3 and parts[0].isdigit() and parts[1] in FUELS:
        return int(parts[0]), parts[1], parts[2]
    return None


def pretty_city(city: str) -> str:
    """The feed mixes "Rennes" and "RENNES"."""
    return city.title() if city.isupper() else city


GENERIC_NAMES = {"station", "station service", "stationservice", "carburant", "carburants", "essence", "fuel"}


def _key(text: str) -> str:
    return "".join(ch for ch in text.lower() if ch.isalnum() or ch == " ").replace("  ", " ").strip()


def useful_osm_name(name: str | None, brand: str | None) -> str | None:
    """The OpenStreetMap name, unless it says "Station-service" or is just the brand.

    "Just the brand" includes a short or long form of it: "Total" for TotalEnergies,
    "TotalEnergies" for Total, "E. Leclerc" for Leclerc.
    """
    if not name:
        return None
    key = _key(name.replace("-", " "))
    if key in GENERIC_NAMES:
        return None
    if brand:
        compact = key.replace(" ", "")
        brand_compact = _key(brand.replace("-", " ")).replace(" ", "")
        # Shorter than the brand, or the brand plus a few letters ("Energies", an initial).
        if (
            compact
            and brand_compact
            and (compact in brand_compact or (brand_compact in compact and len(compact) - len(brand_compact) <= 8))
        ):
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
        self.stations: dict[int, dict[str, Any]] = {int(s[ST_ID]): s for s in entry.options.get(CONF_STATIONS, [])}
        # (station id, fuel) pairs sold at some point: those with an entity, plus those seen since.
        # A fuel can briefly have neither price nor shortage in the feed (shortage just lifted,
        # no new price yet); it must not vanish from the card nor lose its entities.
        # Fuels, station ids and interval the entry was set up with (see _async_reload).
        self.options_key: tuple = ()
        self.registered_fuels: set[tuple[int, str]] = self._registered_fuels()
        self.known_fuels: set[tuple[int, str]] = set(self.registered_fuels)

    def _registered_fuels(self) -> set[tuple[int, str]]:
        known = set()
        entry_id = self.config_entry.entry_id
        for reg_entry in er.async_entries_for_config_entry(er.async_get(self.hass), entry_id):
            if parsed := parse_station_unique_id(entry_id, reg_entry.unique_id):
                known.add(parsed[:2])
        return known

    def entity_pairs(self) -> list[tuple[int, str]]:
        """(station id, fuel) pairs that get entities: followed fuels the station sells.

        A followed station missing from the last answer keeps the pairs it had entities for.
        """
        pairs = []
        data = self.data or {}
        for station_id in self.stations:
            station = data.get(station_id)
            if station is not None:
                pairs += [(station_id, fuel) for fuel in sold_fuels(station) if fuel in self.fuels]
            else:
                pairs += [(station_id, fuel) for fuel in self.fuels if (station_id, fuel) in self.registered_fuels]
        return pairs

    @callback
    def async_set_stations(self, stations: list[dict[str, Any]]) -> None:
        """New brands, names or logos for the followed stations: applied without reloading the entry."""
        self.stations = {int(s[ST_ID]): s for s in stations}
        for station_id, station in (self.data or {}).items():
            self._apply_stored(station_id, station)
        device_registry = dr.async_get(self.hass)
        for station_id, stored in self.stations.items():
            entry_id = self.config_entry.entry_id
            device = get_device(device_registry, (DOMAIN, station_device_id(entry_id, station_id)), entry_id)
            if device:
                live = (self.data or {}).get(station_id, {})
                device_registry.async_update_device(
                    device.id,
                    name=station_title(stored or live, self.names),
                    manufacturer=station_brand(stored or live, self.names) or "Station-service",
                )
        self.async_update_listeners()

    def _apply_stored(self, station_id: int, station: dict[str, Any]) -> None:
        stored = self.stations.get(station_id, {})
        station["name"] = station_title(stored or station, self.names)
        station["brand"] = station_brand(stored or station, self.names)
        station["logo"] = stored.get(ST_LOGO)

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
            self._apply_stored(station_id, station)
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

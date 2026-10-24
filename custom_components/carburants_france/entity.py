"""Base entities for Carburants France."""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

from homeassistant.core import callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, FUELS
from .coordinator import (
    CarburantsConfigEntry,
    CarburantsCoordinator,
    pretty_city,
    station_brand,
    station_device_id,
    station_title,
)


def entry_device(coordinator: CarburantsCoordinator) -> DeviceInfo:
    entry = coordinator.config_entry
    return DeviceInfo(
        identifiers={(DOMAIN, entry.entry_id)},
        name=entry.title,
        manufacturer="data.economie.gouv.fr",
        entry_type=DeviceEntryType.SERVICE,
        configuration_url="https://www.prix-carburants.gouv.fr",
    )


def station_device(coordinator: CarburantsCoordinator, station_id: int) -> DeviceInfo:
    """The station's device, one per entry: two entries may follow the same station."""
    stored = coordinator.stations.get(station_id, {})
    live = (coordinator.data or {}).get(station_id, {})
    address = stored.get("address") or live.get("address") or ""
    city = pretty_city(stored.get("city") or live.get("city") or "")
    return DeviceInfo(
        identifiers={(DOMAIN, station_device_id(coordinator.config_entry.entry_id, station_id))},
        name=station_title(stored or live, coordinator.names),
        manufacturer=station_brand(stored or live, coordinator.names) or "Station-service",
        model=f"{address}, {stored.get('postcode') or live.get('postcode') or ''} {city}".strip(", "),
        serial_number=str(station_id),
    )


@callback
def async_track_station_entities(
    entry: CarburantsConfigEntry,
    async_add_entities: Callable[[list[Entity]], None],
    factory: Callable[[CarburantsCoordinator, int, str], Entity],
) -> None:
    """Add one entity per followed station and fuel, now and whenever a new pair shows up.

    Built from the followed stations and the known fuels, not only from the first answer:
    a station missing from the feed at startup keeps its entities (unavailable), and a fuel
    a station starts selling gets its entities at the next update, without a reload.
    """
    coordinator = entry.runtime_data
    added: set[tuple[int, str]] = set()

    @callback
    def add_new() -> None:
        new = [pair for pair in coordinator.entity_pairs() if pair not in added]
        if new:
            added.update(new)
            async_add_entities([factory(coordinator, station_id, fuel) for station_id, fuel in new])

    add_new()
    entry.async_on_unload(coordinator.async_add_listener(add_new))


class StationFuelEntity(CoordinatorEntity[CarburantsCoordinator]):
    """An entity about one fuel at one station; the station is the device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: CarburantsCoordinator, station_id: int, fuel: str, kind: str) -> None:
        super().__init__(coordinator)
        self.station_id = station_id
        self.fuel = fuel
        # Prefixed with the entry: two entries may follow the same station (migrated in 1.2).
        self._attr_unique_id = f"{station_device_id(coordinator.config_entry.entry_id, station_id)}_{fuel}_{kind}"
        self._attr_translation_placeholders = {"fuel": FUELS[fuel]}
        self._attr_device_info = station_device(coordinator, station_id)

    @property
    def station(self) -> dict[str, Any] | None:
        return (self.coordinator.data or {}).get(self.station_id)

    @property
    def fuel_data(self) -> dict[str, Any] | None:
        station = self.station
        return station["fuels"].get(self.fuel) if station else None

    @property
    def available(self) -> bool:
        return super().available and self.station is not None

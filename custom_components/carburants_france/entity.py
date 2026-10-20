"""Base entities for Carburants France."""

from __future__ import annotations

from typing import Any

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, FUELS
from .coordinator import CarburantsCoordinator, pretty_city, station_brand, station_title


def entry_device(coordinator: CarburantsCoordinator) -> DeviceInfo:
    entry = coordinator.config_entry
    return DeviceInfo(
        identifiers={(DOMAIN, entry.entry_id)},
        name=entry.title,
        manufacturer="data.economie.gouv.fr",
        entry_type=DeviceEntryType.SERVICE,
        configuration_url="https://www.prix-carburants.gouv.fr",
    )


class StationFuelEntity(CoordinatorEntity[CarburantsCoordinator]):
    """An entity about one fuel at one station; the station is the device."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: CarburantsCoordinator, station_id: int, fuel: str, kind: str) -> None:
        super().__init__(coordinator)
        self.station_id = station_id
        self.fuel = fuel
        stored = coordinator.stations.get(station_id, {})
        live = (coordinator.data or {}).get(station_id, {})
        self._attr_unique_id = f"{station_id}_{fuel}_{kind}"
        self._attr_translation_placeholders = {"fuel": FUELS[fuel]}
        address = stored.get("address") or live.get("address") or ""
        city = pretty_city(stored.get("city") or live.get("city") or "")
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, str(station_id))},
            name=station_title(stored or live, coordinator.names),
            manufacturer=station_brand(stored or live, coordinator.names) or "Station-service",
            model=f"{address}, {stored.get('postcode') or live.get('postcode') or ''} {city}".strip(", "),
            serial_number=str(station_id),
        )

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

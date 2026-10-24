"""Availability of each followed fuel at each station."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant

from .coordinator import CarburantsConfigEntry, CarburantsCoordinator
from .entity import StationFuelEntity, async_track_station_entities

if TYPE_CHECKING:
    # Home Assistant 2025.2+; annotation only, so 2024.12 still loads the platform.
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback


async def async_setup_entry(
    hass: HomeAssistant, entry: CarburantsConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_track_station_entities(entry, async_add_entities, FuelAvailableSensor)


class FuelAvailableSensor(StationFuelEntity, BinarySensorEntity):
    """On when the fuel is in stock, off during a shortage."""

    _attr_translation_key = "in_stock"

    def __init__(self, coordinator: CarburantsCoordinator, station_id: int, fuel: str) -> None:
        super().__init__(coordinator, station_id, fuel, "in_stock")

    @property
    def is_on(self) -> bool | None:
        fuel = self.fuel_data
        if not fuel:
            return False
        if fuel["price"] is None and not fuel["rupture"]:
            return None  # No price published and no shortage: unknown.
        return bool(fuel["available"])

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        fuel = self.fuel_data or {}
        return {
            "rupture": fuel.get("rupture"),
            "rupture_since": fuel.get("rupture_since"),
            "rupture_end": fuel.get("rupture_end"),
        }

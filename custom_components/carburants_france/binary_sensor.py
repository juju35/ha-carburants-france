"""Availability of each followed fuel at each station."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .api import sold_fuels
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator
from .entity import StationFuelEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: CarburantsConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = entry.runtime_data
    async_add_entities(
        FuelAvailableSensor(coordinator, station_id, fuel)
        for station_id, station in (coordinator.data or {}).items()
        for fuel in sold_fuels(station)
        if fuel in coordinator.fuels
    )


class FuelAvailableSensor(StationFuelEntity, BinarySensorEntity):
    """On when the fuel is in stock, off during a shortage."""

    _attr_translation_key = "in_stock"

    def __init__(self, coordinator: CarburantsCoordinator, station_id: int, fuel: str) -> None:
        super().__init__(coordinator, station_id, fuel, "in_stock")

    @property
    def is_on(self) -> bool | None:
        fuel = self.fuel_data
        return bool(fuel["available"]) if fuel else False

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        fuel = self.fuel_data or {}
        return {"rupture": fuel.get("rupture"), "rupture_since": fuel.get("rupture_since")}

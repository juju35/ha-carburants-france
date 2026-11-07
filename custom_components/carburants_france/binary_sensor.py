"""Availability of each followed fuel at each station."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import FUELS
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator
from .entity import StationFuelEntity, async_track_station_entities, entry_device

if TYPE_CHECKING:
    # Home Assistant 2025.2+; annotation only, so 2024.12 still loads the platform.
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback


async def async_setup_entry(
    hass: HomeAssistant, entry: CarburantsConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities(LowPriceSensor(entry.runtime_data, fuel) for fuel in entry.runtime_data.fuels)
    async_track_station_entities(entry, async_add_entities, FuelAvailableSensor)


class LowPriceSensor(CoordinatorEntity[CarburantsCoordinator], BinarySensorEntity):
    """On while the best price of the fuel is at or below its target price (off without a target)."""

    _attr_has_entity_name = True
    _attr_translation_key = "low_price"

    def __init__(self, coordinator: CarburantsCoordinator, fuel: str) -> None:
        super().__init__(coordinator)
        self.fuel = fuel
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_{fuel}_low_price"
        self._attr_translation_placeholders = {"fuel": FUELS[fuel]}
        self._attr_device_info = entry_device(coordinator)

    def _best(self) -> tuple[float | None, dict[str, Any] | None]:
        best = self.coordinator.best(self.fuel)
        return (best["fuels"][self.fuel]["price"] if best else None), best

    @property
    def is_on(self) -> bool:
        price, _ = self._best()
        target = self.coordinator.targets.get(self.fuel)
        return price is not None and target is not None and price <= target

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        price, best = self._best()
        return {
            "target": self.coordinator.targets.get(self.fuel),
            "price": price,
            "station_name": best.get("name") if best else None,
            "station_id": best.get("id") if best else None,
        }


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

"""Price sensors for Carburants France."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import FUELS
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator
from .entity import StationFuelEntity, async_track_station_entities, entry_device

PRICE_UNIT = "€/L"


async def async_setup_entry(
    hass: HomeAssistant, entry: CarburantsConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator = entry.runtime_data
    entities: list[SensorEntity] = [StationsSensor(coordinator)]
    entities += [BestPriceSensor(coordinator, fuel) for fuel in coordinator.fuels]
    async_add_entities(entities)
    async_track_station_entities(entry, async_add_entities, FuelPriceSensor)


def _station_attributes(station: dict[str, Any]) -> dict[str, Any]:
    return {
        "station_id": station["id"],
        "station_name": station.get("name"),
        "brand": station.get("brand"),
        "address": station.get("address"),
        "postcode": station.get("postcode"),
        "city": station.get("city"),
        "distance": station.get("distance"),
        "latitude": station.get("latitude"),
        "longitude": station.get("longitude"),
    }


def card_station(station: dict[str, Any], fuels: list[str]) -> dict[str, Any]:
    """A station as the cards read it (Stations sensor, nearby search)."""
    return {
        **_station_attributes(station),
        "logo": station.get("logo"),
        "highway": station.get("highway"),
        "automate_24_24": station.get("automate_24_24"),
        "hours": station.get("hours"),
        "services": station.get("services"),
        "fuels": {k: v for k, v in station["fuels"].items() if k in fuels},
    }


class FuelPriceSensor(StationFuelEntity, SensorEntity):
    """Price of one fuel at one station. Unknown while the fuel is out of stock."""

    _attr_translation_key = "price"
    _attr_native_unit_of_measurement = PRICE_UNIT
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 3

    def __init__(self, coordinator: CarburantsCoordinator, station_id: int, fuel: str) -> None:
        super().__init__(coordinator, station_id, fuel, "price")

    @property
    def native_value(self) -> float | None:
        fuel = self.fuel_data
        return fuel["price"] if fuel and fuel["available"] else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        fuel = self.fuel_data or {}
        return {
            "fuel": FUELS[self.fuel],
            "updated": fuel.get("updated"),
            "in_stock": bool(fuel.get("available")),
            "rupture": fuel.get("rupture"),
            "rupture_since": fuel.get("rupture_since"),
            "rupture_end": fuel.get("rupture_end"),
            **_station_attributes(self.station or {"id": self.station_id}),
        }


class BestPriceSensor(CoordinatorEntity[CarburantsCoordinator], SensorEntity):
    """Cheapest followed station for one fuel, among those that have it in stock."""

    _attr_has_entity_name = True
    _attr_translation_key = "best_price"
    _attr_native_unit_of_measurement = PRICE_UNIT
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_suggested_display_precision = 3

    def __init__(self, coordinator: CarburantsCoordinator, fuel: str) -> None:
        super().__init__(coordinator)
        self.fuel = fuel
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_{fuel}_best"
        self._attr_translation_placeholders = {"fuel": FUELS[fuel]}
        self._attr_device_info = entry_device(coordinator)

    @property
    def native_value(self) -> float | None:
        best = self.coordinator.best(self.fuel)
        return best["fuels"][self.fuel]["price"] if best else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        best = self.coordinator.best(self.fuel)
        if not best:
            return {"fuel": FUELS[self.fuel]}
        return {"fuel": FUELS[self.fuel], "updated": best["fuels"][self.fuel]["updated"], **_station_attributes(best)}


class StationsSensor(CoordinatorEntity[CarburantsCoordinator], SensorEntity):
    """Number of followed stations, with all of them in the attributes for the card."""

    _attr_has_entity_name = True
    _attr_translation_key = "stations"
    # The list changes on every poll and can be large: keep it out of the recorder.
    _unrecorded_attributes = frozenset({"stations", "fuels"})

    def __init__(self, coordinator: CarburantsCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_stations"
        self._attr_device_info = entry_device(coordinator)

    @property
    def native_value(self) -> int:
        return len(self.coordinator.data or {})

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        fuels = self.coordinator.fuels
        stations = []
        for station_id in self.coordinator.stations:
            station = (self.coordinator.data or {}).get(station_id)
            if station:
                stations.append(card_station(station, fuels))
        return {
            "config_entry_id": self.coordinator.config_entry.entry_id,
            "fuels": [{"key": k, "name": FUELS[k]} for k in fuels],
            "stations": stations,
        }

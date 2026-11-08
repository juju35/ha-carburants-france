"""Price sensors for Carburants France."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.update_coordinator import CoordinatorEntity
from homeassistant.util import dt as dt_util

from .const import DOMAIN, FUELS
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator, is_stale, price_age_days
from .entity import StationFuelEntity, async_track_station_entities, entry_device

if TYPE_CHECKING:
    # Home Assistant 2025.2+; annotation only, so 2024.12 still loads the platform.
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

PRICE_UNIT = "€/L"
TREND_DAYS = 30
TREND_REFRESH = timedelta(hours=6)


async def async_trend(hass: HomeAssistant, entity_id: str | None) -> dict[str, float | None]:
    """Average, lowest and highest best price of the last 30 days, from the recorder's daily statistics."""
    if not entity_id or "recorder" not in hass.config.components:
        return {}
    from homeassistant.components.recorder import get_instance  # noqa: PLC0415 - optional dependency
    from homeassistant.components.recorder.statistics import statistics_during_period  # noqa: PLC0415

    start = dt_util.utcnow() - timedelta(days=TREND_DAYS)
    try:
        stats = await get_instance(hass).async_add_executor_job(
            statistics_during_period, hass, start, None, {entity_id}, "day", None, {"mean", "min", "max"}
        )
    except Exception:  # noqa: BLE001 - the trend is a nicety, never an error
        return {}
    rows = [r for r in stats.get(entity_id, []) if r.get("mean") is not None]
    if not rows:
        return {}
    lows = [r["min"] for r in rows if r.get("min") is not None] or [r["mean"] for r in rows]
    highs = [r["max"] for r in rows if r.get("max") is not None] or [r["mean"] for r in rows]
    return {
        "average_30d": round(sum(r["mean"] for r in rows) / len(rows), 3),
        "lowest_30d": round(min(lows), 3),
        "highest_30d": round(max(highs), 3),
    }


async def async_setup_entry(
    hass: HomeAssistant, entry: CarburantsConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
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


def _age_days(fuel: dict[str, Any]) -> int | None:
    """Whole days since the price was last updated."""
    age = price_age_days(fuel)
    return None if age is None else int(age)


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
            "age_days": _age_days(fuel),
            # Older than the "maximum price age" option: left out of the best price.
            "stale": is_stale(fuel, self.coordinator.max_price_age),
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
        self._trend: dict[str, float | None] = {}

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        # The 30-day figures come from the recorder's daily statistics of this sensor: read now, then every 6 hours.
        self.async_on_remove(async_track_time_interval(self.hass, self._async_read_trend, TREND_REFRESH))
        self.hass.async_create_background_task(self._async_read_trend(), f"{DOMAIN}_trend_{self.fuel}")

    async def _async_read_trend(self, _now: datetime | None = None) -> None:
        trend = await async_trend(self.hass, self.entity_id)
        if trend != self._trend:
            self._trend = trend
            self.async_write_ha_state()

    @property
    def native_value(self) -> float | None:
        best = self.coordinator.best(self.fuel)
        return best["fuels"][self.fuel]["price"] if best else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        best = self.coordinator.best(self.fuel)
        trend = dict(self._trend)
        price = best["fuels"][self.fuel]["price"] if best else None
        if price is not None and trend.get("average_30d") is not None:
            # Today's best price against the month: negative = cheaper than usual.
            trend["change_30d"] = round(price - trend["average_30d"], 3)
        if not best:
            return {"fuel": FUELS[self.fuel], **trend}
        return {
            "fuel": FUELS[self.fuel],
            "updated": best["fuels"][self.fuel]["updated"],
            "age_days": _age_days(best["fuels"][self.fuel]),
            **_station_attributes(best),
            **trend,
        }


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

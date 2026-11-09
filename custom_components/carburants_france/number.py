"""Target price per fuel (the Low price binary sensor turns on at or below it), and the tank capacity."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.number import NumberDeviceClass, NumberMode, RestoreNumber
from homeassistant.const import EntityCategory, UnitOfVolume
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import FUELS
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator
from .entity import entry_device

if TYPE_CHECKING:
    from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

PRICE_UNIT = "€/L"


async def async_setup_entry(
    hass: HomeAssistant, entry: CarburantsConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    coordinator = entry.runtime_data
    targets = [TargetPriceNumber(coordinator, fuel) for fuel in coordinator.fuels]
    async_add_entities([TankCapacityNumber(coordinator), *targets])


class _SettingNumber(CoordinatorEntity[CarburantsCoordinator], RestoreNumber):
    """A user setting kept across restarts (restored into the coordinator), settable while the feed is down."""

    _attr_has_entity_name = True
    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX

    def _store(self, value: float) -> None:
        raise NotImplementedError

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if (last := await self.async_get_last_number_data()) is not None and last.native_value is not None:
            self._store(float(last.native_value))
            # The entities reading it may be set up already: they read the restored value now.
            self.coordinator.async_update_listeners()

    @property
    def available(self) -> bool:
        """A user setting, not feed data: stays settable while the price feed is down."""
        return True

    async def async_set_native_value(self, value: float) -> None:
        self._store(float(value))
        # The sensors reading it follow at once.
        self.coordinator.async_update_listeners()


class TargetPriceNumber(_SettingNumber):
    """The price under which the fuel counts as cheap. Unknown (no alert) until set; kept across restarts."""

    _attr_translation_key = "target_price"
    _attr_native_min_value = 0.0
    _attr_native_max_value = 5.0
    _attr_native_step = 0.001
    _attr_native_unit_of_measurement = PRICE_UNIT

    def __init__(self, coordinator: CarburantsCoordinator, fuel: str) -> None:
        super().__init__(coordinator)
        self.fuel = fuel
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_{fuel}_target"
        self._attr_translation_placeholders = {"fuel": FUELS[fuel]}
        self._attr_device_info = entry_device(coordinator)

    def _store(self, value: float) -> None:
        self.coordinator.targets[self.fuel] = round(value, 3)

    @property
    def native_value(self) -> float | None:
        return self.coordinator.targets.get(self.fuel)


class TankCapacityNumber(_SettingNumber):
    """The vehicle's tank capacity, for the Full tank sensors. Unknown (no full tank cost) until set; 0 clears it."""

    _attr_translation_key = "tank_capacity"
    _attr_native_min_value = 0.0
    _attr_native_max_value = 200.0
    _attr_native_step = 1.0
    _attr_native_unit_of_measurement = UnitOfVolume.LITERS
    _attr_device_class = NumberDeviceClass.VOLUME_STORAGE

    def __init__(self, coordinator: CarburantsCoordinator) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_tank_capacity"
        self._attr_device_info = entry_device(coordinator)

    def _store(self, value: float) -> None:
        self.coordinator.tank_capacity = value or None

    @property
    def native_value(self) -> float | None:
        return self.coordinator.tank_capacity

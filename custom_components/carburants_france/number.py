"""Target price per fuel: the Low price binary sensor turns on when the best price is at or below it."""

from __future__ import annotations

from typing import TYPE_CHECKING

from homeassistant.components.number import NumberMode, RestoreNumber
from homeassistant.const import EntityCategory
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
    async_add_entities(TargetPriceNumber(coordinator, fuel) for fuel in coordinator.fuels)


class TargetPriceNumber(CoordinatorEntity[CarburantsCoordinator], RestoreNumber):
    """The price under which the fuel counts as cheap. Unknown (no alert) until set; kept across restarts."""

    _attr_has_entity_name = True
    _attr_translation_key = "target_price"
    _attr_entity_category = EntityCategory.CONFIG
    _attr_mode = NumberMode.BOX
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

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if (last := await self.async_get_last_number_data()) is not None and last.native_value is not None:
            self.coordinator.targets[self.fuel] = float(last.native_value)
            # The Low price sensors may be set up already: they read the restored target now.
            self.coordinator.async_update_listeners()

    @property
    def available(self) -> bool:
        """A user setting, not feed data: stays settable while the price feed is down."""
        return True

    @property
    def native_value(self) -> float | None:
        return self.coordinator.targets.get(self.fuel)

    async def async_set_native_value(self, value: float) -> None:
        self.coordinator.targets[self.fuel] = round(float(value), 3)
        # The Low price binary sensors follow at once.
        self.coordinator.async_update_listeners()

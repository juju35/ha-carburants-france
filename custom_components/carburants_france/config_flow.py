"""Config flow for Carburants France: pick fuels, then search and pick stations."""

from __future__ import annotations

import logging
import re
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.const import CONF_NAME
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .api import CarburantsApi, CarburantsError
from .brands import BrandLookupError, async_enrich, async_lookup_logos
from .const import (
    CONF_ADD_STATIONS,
    CONF_FUELS,
    CONF_QUERY,
    CONF_RADIUS,
    CONF_RENAME_STATIONS,
    CONF_SCAN_INTERVAL,
    CONF_SEARCH_AGAIN,
    CONF_STATIONS,
    DEFAULT_FUELS,
    DEFAULT_RADIUS,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    FUELS,
    MIN_SCAN_INTERVAL,
    ST_BRAND,
    ST_BRAND_CHECKED,
    ST_ID,
    ST_LOGO,
    ST_LOGO_VERSION,
    ST_NAME,
    ST_OSM_NAME,
    LOGO_VERSION,
)
from .coordinator import pretty_city, station_title
from .names import async_get_names

_LOGGER = logging.getLogger(__name__)

STORED_KEYS = ("address", "postcode", "city", "latitude", "longitude")


def _fuels_selector() -> SelectSelector:
    return SelectSelector(
        SelectSelectorConfig(
            options=[SelectOptionDict(value=k, label=v) for k, v in FUELS.items()],
            multiple=True,
            mode=SelectSelectorMode.LIST,
        )
    )


def _price(value: float) -> str:
    return f"{value:.3f}".replace(".", ",") + " €"


class StationPickerMixin:
    """Search and selection steps shared by the config and options flows."""

    hass: Any
    _fuels: list[str]
    _selected: dict[int, dict[str, Any]]
    _found: dict[int, dict[str, Any]]
    _query: str = ""
    _radius: float = DEFAULT_RADIUS

    _names: dict[str, dict[str, str]] | None = None

    def _init_picker(self, fuels: list[str], selected: list[dict[str, Any]]) -> None:
        self._fuels = fuels
        self._selected = {int(s[ST_ID]): dict(s) for s in selected}
        self._found = {}

    async def async_step_search(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            self._query = (user_input.get(CONF_QUERY) or "").strip()
            self._radius = float(user_input.get(CONF_RADIUS, DEFAULT_RADIUS))
            session = async_get_clientsession(self.hass)
            self._names = await async_get_names(self.hass)
            try:
                found = await CarburantsApi(session).search(
                    self._query, self.hass.config.latitude, self.hass.config.longitude, self._radius
                )
            except CarburantsError as err:
                _LOGGER.warning("Station search failed: %s", err)
                errors["base"] = "cannot_connect"
            except Exception:
                _LOGGER.exception("Unexpected error while searching stations for %r", self._query)
                errors["base"] = "unknown"
            else:
                if not found:
                    errors["base"] = "no_results"
                else:
                    checked = await async_enrich(session, found, with_logos=False)
                    for station in found:
                        station[ST_BRAND_CHECKED] = checked
                    self._found = {s["id"]: s for s in found}
                    return await self.async_step_stations()

        schema = vol.Schema(
            {
                vol.Optional(CONF_QUERY, description={"suggested_value": self._query}): TextSelector(),
                vol.Required(CONF_RADIUS, default=self._radius): NumberSelector(
                    NumberSelectorConfig(min=1, max=50, step=1, unit_of_measurement="km", mode=NumberSelectorMode.SLIDER)
                ),
            }
        )
        return self.async_show_form(step_id="search", data_schema=schema, errors=errors)

    def _label(self, station: dict[str, Any]) -> str:
        head = station_title({**station, ST_NAME: None, "city": ""}, self._names)
        place = f"{station.get('address', '')}, {station.get('postcode', '')} {pretty_city(station.get('city', ''))}"
        parts = [f"{head} · {place.strip(', ')}"]
        prices = []
        for key in self._fuels:
            fuel = station.get("fuels", {}).get(key)
            if not fuel:
                continue
            prices.append(f"{FUELS[key]} {_price(fuel['price'])}" if fuel["available"] else f"{FUELS[key]} ✕")
        if prices:
            parts.append(" · ".join(prices))
        if station.get("distance") is not None:
            parts.append(f"{station['distance']:.1f} km".replace(".", ","))
        return " — ".join(parts)

    async def async_step_stations(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            chosen = {int(v) for v in user_input.get(CONF_STATIONS, [])}
            # Stations from earlier searches stay unless unticked here.
            selected = {i: s for i, s in self._selected.items() if i in chosen}
            for station_id in chosen:
                if station_id in self._found and station_id not in selected:
                    found = self._found[station_id]
                    stored = {ST_ID: station_id, **{k: found.get(k) for k in STORED_KEYS}}
                    stored[ST_BRAND] = found.get(ST_BRAND)
                    stored[ST_OSM_NAME] = found.get(ST_OSM_NAME)
                    stored["wikidata"] = found.get("wikidata")
                    stored[ST_LOGO] = None
                    stored[ST_BRAND_CHECKED] = found.get(ST_BRAND_CHECKED, False)
                    if stored[ST_BRAND_CHECKED]:
                        stored[ST_LOGO_VERSION] = LOGO_VERSION
                    selected[station_id] = stored
            self._selected = selected
            if user_input.get(CONF_SEARCH_AGAIN):
                return await self.async_step_search()
            if not self._selected:
                errors["base"] = "no_station"
            else:
                await self._async_add_logos()
                return await self._async_finish()

        options: list[SelectOptionDict] = []
        for station_id, stored in self._selected.items():
            if station_id not in self._found:
                options.append(SelectOptionDict(value=str(station_id), label=self._label(stored)))
        for station_id, station in self._found.items():
            options.append(SelectOptionDict(value=str(station_id), label=self._label(station)))
        schema = vol.Schema(
            {
                vol.Optional(CONF_STATIONS, default=[str(i) for i in self._selected]): SelectSelector(
                    SelectSelectorConfig(options=options, multiple=True, mode=SelectSelectorMode.LIST)
                ),
                vol.Optional(CONF_SEARCH_AGAIN, default=False): BooleanSelector(),
            }
        )
        return self.async_show_form(
            step_id="stations",
            data_schema=schema,
            errors=errors,
            description_placeholders={"count": str(len(self._found))},
        )

    async def _async_add_logos(self) -> None:
        """Logos are only looked up for the stations kept, once the choice is made."""
        missing = [s for s in self._selected.values() if not s.get(ST_LOGO) and s.get("wikidata")]
        if not missing:
            return
        try:
            logos = await async_lookup_logos(
                async_get_clientsession(self.hass), {s["wikidata"] for s in missing}
            )
        except BrandLookupError:
            return
        for station in missing:
            station[ST_LOGO] = logos.get(station["wikidata"])
            station[ST_LOGO_VERSION] = LOGO_VERSION

    async def _async_finish(self) -> ConfigFlowResult:
        raise NotImplementedError


class CarburantsConfigFlow(StationPickerMixin, ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Carburants France."""

    VERSION = 1

    def __init__(self) -> None:
        self._name = "Carburants"
        self._init_picker(list(DEFAULT_FUELS), [])

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            self._name = user_input.get(CONF_NAME) or self._name
            self._fuels = [f for f in user_input.get(CONF_FUELS, []) if f in FUELS]
            if self._fuels:
                return await self.async_step_search()
            errors[CONF_FUELS] = "no_fuel"

        schema = vol.Schema(
            {
                vol.Required(CONF_NAME, default=self._name): TextSelector(),
                vol.Required(CONF_FUELS, default=self._fuels): _fuels_selector(),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def _async_finish(self) -> ConfigFlowResult:
        return self.async_create_entry(
            title=self._name,
            data={},
            options={
                CONF_FUELS: self._fuels,
                CONF_STATIONS: list(self._selected.values()),
                CONF_SCAN_INTERVAL: DEFAULT_SCAN_INTERVAL,
            },
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return CarburantsOptionsFlow()


class CarburantsOptionsFlow(StationPickerMixin, OptionsFlow):
    """Change fuels, remove, add or rename stations, polling interval."""

    _scan_interval: int = DEFAULT_SCAN_INTERVAL
    _rename: bool = False

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        self._names = await async_get_names(self.hass)
        options = self.config_entry.options
        current = list(options.get(CONF_STATIONS, []))
        errors: dict[str, str] = {}
        if user_input is not None:
            fuels = [f for f in user_input.get(CONF_FUELS, []) if f in FUELS]
            kept = {int(v) for v in user_input.get(CONF_STATIONS, [])}
            self._scan_interval = int(user_input[CONF_SCAN_INTERVAL])
            self._rename = bool(user_input.get(CONF_RENAME_STATIONS))
            self._init_picker(fuels, [s for s in current if int(s[ST_ID]) in kept])
            if not fuels:
                errors[CONF_FUELS] = "no_fuel"
            elif user_input.get(CONF_ADD_STATIONS):
                return await self.async_step_search()
            elif not kept:
                errors["base"] = "no_station"
            else:
                return await self._async_finish()

        self._init_picker(list(options.get(CONF_FUELS, DEFAULT_FUELS)), current)
        station_options = [SelectOptionDict(value=str(s[ST_ID]), label=self._label(s)) for s in current]
        schema = vol.Schema(
            {
                vol.Required(CONF_FUELS, default=self._fuels): _fuels_selector(),
                vol.Optional(CONF_STATIONS, default=[str(s[ST_ID]) for s in current]): SelectSelector(
                    SelectSelectorConfig(options=station_options, multiple=True, mode=SelectSelectorMode.LIST)
                ),
                vol.Optional(CONF_ADD_STATIONS, default=False): BooleanSelector(),
                vol.Optional(CONF_RENAME_STATIONS, default=False): BooleanSelector(),
                vol.Required(
                    CONF_SCAN_INTERVAL, default=options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL)
                ): NumberSelector(
                    NumberSelectorConfig(
                        min=MIN_SCAN_INTERVAL, max=240, step=1, unit_of_measurement="min", mode=NumberSelectorMode.BOX
                    )
                ),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)

    def _name_field(self, station: dict[str, Any]) -> str:
        """Form field for one station: the field name is its label, the station id ends it."""
        automatic = station_title({**station, ST_NAME: None}, self._names)
        place = f"{station.get('address') or ''}, {pretty_city(station.get('city') or '')}".strip(", ")
        return f"{automatic} — {place} [{station[ST_ID]}]"

    async def async_step_names(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """One text field per station; empty keeps the automatic name."""
        if user_input is not None:
            for field, value in user_input.items():
                if match := re.search(r"\[(\d+)\]$", field):
                    station = self._selected.get(int(match.group(1)))
                    if station is not None:
                        station[ST_NAME] = (value or "").strip() or None
            self._rename = False
            return await self._async_finish()

        schema = vol.Schema(
            {
                vol.Optional(
                    self._name_field(station), description={"suggested_value": station.get(ST_NAME) or ""}
                ): TextSelector()
                for station in self._selected.values()
            }
        )
        return self.async_show_form(step_id="names", data_schema=schema)

    async def _async_finish(self) -> ConfigFlowResult:
        if self._rename:
            return await self.async_step_names()
        return self.async_create_entry(
            data={
                CONF_FUELS: self._fuels,
                CONF_STATIONS: list(self._selected.values()),
                CONF_SCAN_INTERVAL: self._scan_interval,
            }
        )

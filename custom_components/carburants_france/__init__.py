"""Carburants France: fuel prices and availability from the French government open data."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import Event, HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import CarburantsApi
from .brands import async_enrich
from .const import (
    ATTR_CONFIG_ENTRY_ID,
    CARD_FILENAME,
    CONF_STATIONS,
    DOMAIN,
    FRONTEND_URL,
    SERVICE_REFRESH,
    ST_BRAND_CHECKED,
)
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR]
CARD_PATH = Path(__file__).parent / "frontend" / CARD_FILENAME
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
REFRESH_SCHEMA = vol.Schema({vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string})


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the Lovelace card and register the refresh action once."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(FRONTEND_URL, str(CARD_PATH.parent), True)]
    )
    await _async_register_card(hass)

    async def refresh(call: ServiceCall) -> None:
        entry_id = call.data.get(ATTR_CONFIG_ENTRY_ID)
        entries = [
            e
            for e in hass.config_entries.async_entries(DOMAIN)
            if e.state is ConfigEntryState.LOADED and entry_id in (None, e.entry_id)
        ]
        if not entries:
            raise ServiceValidationError("No Carburants France entry is loaded")
        for entry in entries:
            await entry.runtime_data.async_request_refresh()

    hass.services.async_register(DOMAIN, SERVICE_REFRESH, refresh, REFRESH_SCHEMA)
    return True


async def _async_register_card(hass: HomeAssistant) -> None:
    """Add the card to the dashboard resources, as ha-parcel does.

    The file hash in the URL makes browsers fetch the new card after an update.
    """
    digest = await hass.async_add_executor_job(lambda: hashlib.md5(CARD_PATH.read_bytes()).hexdigest()[:8])
    base_url = f"{FRONTEND_URL}/{CARD_FILENAME}"
    url = f"{base_url}?v={digest}"

    async def register(_event: Event | None = None) -> None:
        lovelace = hass.data.get("lovelace")
        resources = getattr(lovelace, "resources", None)
        if resources is None or getattr(lovelace, "resource_mode", "storage") != "storage":
            # Dashboards in YAML mode: resources can't be edited, load the card on every page.
            add_extra_js_url(hass, url)
            return
        try:
            if not resources.loaded:
                await resources.async_load()
                resources.loaded = True
            existing = [item for item in resources.async_items() if item.get("url", "").split("?")[0] == base_url]
            if not existing:
                await resources.async_create_item({"res_type": "module", "url": url})
                _LOGGER.info("Carburants France card added to dashboard resources: %s", url)
            elif existing[0].get("url") != url:
                await resources.async_update_item(existing[0]["id"], {"res_type": "module", "url": url})
                _LOGGER.info("Carburants France card resource updated: %s", url)
            for duplicate in existing[1:]:
                await resources.async_delete_item(duplicate["id"])
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning(
                "Could not add the Carburants France card to dashboard resources (%s). Add %s manually "
                "in Settings > Dashboards > Resources (JavaScript module)",
                err,
                url,
            )
            add_extra_js_url(hass, url)

    if hass.is_running:
        await register()
    else:
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, register)


async def async_setup_entry(hass: HomeAssistant, entry: CarburantsConfigEntry) -> bool:
    coordinator = CarburantsCoordinator(hass, entry, CarburantsApi(async_get_clientsession(hass)))
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    if any(not s.get(ST_BRAND_CHECKED) for s in entry.options.get(CONF_STATIONS, [])):
        entry.async_create_background_task(hass, _async_retry_brands(hass, entry), "carburants_france_brands")
    return True


async def _async_retry_brands(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    """Look up brands and logos that OpenStreetMap could not give during setup."""
    stations = [dict(s) for s in entry.options.get(CONF_STATIONS, [])]
    pending = [s for s in stations if not s.get(ST_BRAND_CHECKED)]
    if not await async_enrich(async_get_clientsession(hass), pending, with_logos=True):
        return  # Still unreachable: try again at the next start.
    for station in pending:
        station[ST_BRAND_CHECKED] = True
    hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_STATIONS: stations})


async def async_unload_entry(hass: HomeAssistant, entry: CarburantsConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _async_reload(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)

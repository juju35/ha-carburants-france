"""Carburants France: fuel prices and availability from the French government open data."""

from __future__ import annotations

import asyncio
import hashlib
import logging
from pathlib import Path

import voluptuous as vol

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import Event, HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import CarburantsApi
from .ai_naming import ai_available, async_name_stations
from .brands import async_enrich
from .const import (
    ATTR_CONFIG_ENTRY_ID,
    CARD_FILENAME,
    CONF_AI_TASK_ENTITY,
    CONF_STATIONS,
    DOMAIN,
    FRONTEND_URL,
    SERVICE_REFRESH,
    ST_AI_CHECKED,
    ST_BRAND,
    ST_BRAND_CHECKED,
    ST_LOGO_VERSION,
    ST_NAME,
    ST_OSM_NAME,
    LOGO_VERSION,
)
from .coordinator import CarburantsConfigEntry, CarburantsCoordinator, community_entry, useful_osm_name
from .names import async_get_names

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
    names = await async_get_names(hass)
    coordinator = CarburantsCoordinator(hass, entry, CarburantsApi(async_get_clientsession(hass)), names)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    stations = entry.options.get(CONF_STATIONS, [])
    if any(_needs_brand_lookup(s) for s in stations) or any(_needs_ai_name(entry, s, names) for s in stations):
        entry.async_create_background_task(hass, _async_lookup_names(hass, entry), "carburants_france_names")
    return True


def _needs_brand_lookup(station: dict) -> bool:
    """OpenStreetMap was unreachable at setup, or the stored data predates the current lookup."""
    return not station.get(ST_BRAND_CHECKED) or station.get(ST_LOGO_VERSION) != LOGO_VERSION


def _needs_ai_name(entry: CarburantsConfigEntry, station: dict, names: dict) -> bool:
    """An AI is set and no name is known: not the user's, the community file's or OpenStreetMap's."""
    return (
        bool(entry.options.get(CONF_AI_TASK_ENTITY))
        and not station.get(ST_AI_CHECKED)
        and not station.get(ST_NAME)
        and not community_entry(station, names).get("name")
        and station.get(ST_BRAND_CHECKED)
        and not useful_osm_name(station.get(ST_OSM_NAME), station.get(ST_BRAND))
    )


async def _async_lookup_names(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    """OpenStreetMap first (brand, name, logo), then the AI for the names still missing.

    Saved once at the end, as saving reloads the entry. What fails is retried at the next start.
    """
    stations = [dict(s) for s in entry.options.get(CONF_STATIONS, [])]
    changed = False

    pending = [s for s in stations if _needs_brand_lookup(s)]
    if pending and await async_enrich(async_get_clientsession(hass), pending, with_logos=True):
        for station in pending:
            station[ST_BRAND_CHECKED] = True
            station[ST_LOGO_VERSION] = LOGO_VERSION
        changed = True

    ai_entity = entry.options.get(CONF_AI_TASK_ENTITY)
    unnamed = [s for s in stations if _needs_ai_name(entry, s, entry.runtime_data.names)]
    if unnamed and not hass.is_running:
        # The AI integration may still be loading.
        await _async_wait_started(hass)
    if unnamed and ai_available(hass, ai_entity):
        await async_name_stations(hass, ai_entity, unnamed)
        changed = changed or any(s.get(ST_AI_CHECKED) for s in unnamed)

    if changed:
        hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_STATIONS: stations})


async def _async_wait_started(hass: HomeAssistant) -> None:
    started = asyncio.Event()

    @callback
    def _started(_event: Event) -> None:
        started.set()

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, _started)
    await started.wait()


async def async_unload_entry(hass: HomeAssistant, entry: CarburantsConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _async_reload(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)

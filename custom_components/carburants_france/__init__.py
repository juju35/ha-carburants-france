"""Carburants France: fuel prices and availability from the French government open data."""

from __future__ import annotations

import hashlib
import logging
from pathlib import Path
from typing import Any

import voluptuous as vol
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED, Platform
from homeassistant.core import Event, HomeAssistant, ServiceCall
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import CarburantsApi
from .brands import async_enrich
from .const import (
    ATTR_CONFIG_ENTRY_ID,
    CARD_FILENAME,
    CONF_FUELS,
    CONF_SCAN_INTERVAL,
    CONF_STATIONS,
    DEFAULT_FUELS,
    DEFAULT_SCAN_INTERVAL,
    DOMAIN,
    FRONTEND_URL,
    FUELS,
    LEGACY_AI_KEYS,
    LEGACY_AI_OPTION,
    LOGO_VERSION,
    SERVICE_REFRESH,
    ST_BRAND,
    ST_BRAND_CHECKED,
    ST_ID,
    ST_LOGO,
    ST_LOGO_VERSION,
    ST_OSM_NAME,
)
from .coordinator import (
    CarburantsConfigEntry,
    CarburantsCoordinator,
    parse_station_unique_id,
    station_device_id,
)
from .names import async_get_names
from .websocket import async_register_websocket

_LOGGER = logging.getLogger(__name__)

PLATFORMS = [Platform.SENSOR, Platform.BINARY_SENSOR]
CARD_PATH = Path(__file__).parent / "frontend" / CARD_FILENAME
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
CARD_REMOVED = f"{DOMAIN}_card_removed"
REFRESH_SCHEMA = vol.Schema({vol.Optional(ATTR_CONFIG_ENTRY_ID): cv.string})


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the Lovelace card and register the refresh action once."""
    await hass.http.async_register_static_paths([StaticPathConfig(FRONTEND_URL, str(CARD_PATH.parent), True)])
    await _async_register_card(hass)
    async_register_websocket(hass)

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


def _lovelace_resources(lovelace: Any) -> tuple[Any, str]:
    """Lovelace resources collection and its mode, whatever the Home Assistant version.

    hass.data["lovelace"] is a dict before 2025.2, then a dataclass whose `mode` field became `resource_mode` in 2025.4.
    """
    if isinstance(lovelace, dict):
        return lovelace.get("resources"), lovelace.get("resource_mode", lovelace.get("mode", "storage"))
    return getattr(lovelace, "resources", None), getattr(
        lovelace, "resource_mode", getattr(lovelace, "mode", "storage")
    )


def _storage_resources(hass: HomeAssistant):
    """The dashboard resources collection when it can be edited (storage mode), else None."""
    resources, mode = _lovelace_resources(hass.data.get("lovelace"))
    return resources if mode == "storage" else None


async def _async_register_card(hass: HomeAssistant) -> None:
    """Add the card to the dashboard resources, as ha-parcel does.

    The file hash in the URL makes browsers fetch the new card after an update.
    """
    digest = await hass.async_add_executor_job(lambda: hashlib.md5(CARD_PATH.read_bytes()).hexdigest()[:8])
    base_url = f"{FRONTEND_URL}/{CARD_FILENAME}"
    url = f"{base_url}?v={digest}"

    async def register(_event: Event | None = None) -> None:
        resources = _storage_resources(hass)
        if resources is None:
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


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Last entry deleted: take the card out of the dashboard resources."""
    # Older Home Assistant releases (2024.12 at least) still list the entry being removed here.
    if any(e.entry_id != entry.entry_id for e in hass.config_entries.async_entries(DOMAIN)):
        return
    resources = _storage_resources(hass)
    if resources is None:
        return
    base_url = f"{FRONTEND_URL}/{CARD_FILENAME}"
    try:
        if not resources.loaded:
            await resources.async_load()
            resources.loaded = True
        for item in [i for i in resources.async_items() if i.get("url", "").split("?")[0] == base_url]:
            await resources.async_delete_item(item["id"])
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Could not remove the Carburants France card from dashboard resources: %s", err)
        return
    # async_setup does not run again for an entry added before the next restart: add it back then.
    hass.data[CARD_REMOVED] = True


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """1.1 -> 1.2: station entities and devices get the entry id in their ids.

    Before, two entries following the same station clashed. Entity ids and history are kept:
    only the registry ids change.
    """
    if entry.version > 1:
        return False
    if entry.minor_version < 2:
        await _async_migrate_station_ids(hass, entry)
        hass.config_entries.async_update_entry(entry, minor_version=2)
    return True


async def _async_migrate_station_ids(hass: HomeAssistant, entry: ConfigEntry) -> None:
    entry_id = entry.entry_id
    entity_registry = er.async_get(hass)

    def new_unique_id(reg_entry: er.RegistryEntry) -> dict[str, str] | None:
        parts = (reg_entry.unique_id or "").split("_", 2)
        if len(parts) == 3 and parts[0].isdigit() and parts[1] in FUELS:
            return {"new_unique_id": f"{station_device_id(entry_id, parts[0])}_{parts[1]}_{parts[2]}"}
        return None

    await er.async_migrate_entries(hass, entry_id, new_unique_id)

    device_registry = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(device_registry, entry_id):
        old = next((v for d, v in device.identifiers if d == DOMAIN and v.isdigit()), None)
        if old is None:
            continue
        owners = {e.config_entry_id for e in er.async_entries_for_device(entity_registry, device.id, True)}
        if entry_id not in owners:
            # Station device of another entry following the same station, linked to this one too.
            device_registry.async_update_device(device.id, remove_config_entry_id=entry_id)
            continue
        new_id = (DOMAIN, station_device_id(entry_id, old))
        if owners != {entry_id} or device_registry.async_get_device(identifiers={new_id}):
            # Shared with another entry's entities: this entry's entities move to their own
            # device at setup, the other entry takes this one over when it migrates.
            continue
        identifiers = {i for i in device.identifiers if i[0] != DOMAIN} | {new_id}
        device_registry.async_update_device(device.id, new_identifiers=identifiers)
        # Other entries linked to it have no entity on it: they get their own device.
        for other_id in device.config_entries - {entry_id}:
            device_registry.async_update_device(device.id, remove_config_entry_id=other_id)


async def async_setup_entry(hass: HomeAssistant, entry: CarburantsConfigEntry) -> bool:
    if hass.data.pop(CARD_REMOVED, False):
        await _async_register_card(hass)
    _async_drop_ai_options(hass, entry)
    names = await async_get_names(hass)
    coordinator = CarburantsCoordinator(hass, entry, CarburantsApi(async_get_clientsession(hass)), names)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    coordinator.options_key = _options_key(entry.options)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    # After the platforms: entities have moved to their current device by then.
    _async_remove_orphans(hass, entry)
    entry.async_on_unload(entry.add_update_listener(_async_reload))
    if any(_needs_brand_lookup(s) for s in entry.options.get(CONF_STATIONS, [])):
        entry.async_create_background_task(hass, _async_retry_brands(hass, entry), "carburants_france_brands")
    return True


def _async_drop_ai_options(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    """0.6.0 to 0.7.1 could ask an AI for names: drop its option and the names it stored.

    Done before the update listener is added, so it does not reload the entry.
    """
    stations = entry.options.get(CONF_STATIONS, [])
    if LEGACY_AI_OPTION not in entry.options and not any(k in s for s in stations for k in LEGACY_AI_KEYS):
        return
    options = {k: v for k, v in entry.options.items() if k != LEGACY_AI_OPTION}
    options[CONF_STATIONS] = [{k: v for k, v in s.items() if k not in LEGACY_AI_KEYS} for s in stations]
    hass.config_entries.async_update_entry(entry, options=options)


def _async_remove_orphans(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    """Drop the entities and devices of stations and fuels no longer followed."""
    entry_id = entry.entry_id
    stations = {int(s[ST_ID]) for s in entry.options.get(CONF_STATIONS, [])}
    fuels = set(entry.options.get(CONF_FUELS, DEFAULT_FUELS))
    entity_registry = er.async_get(hass)
    for reg_entry in er.async_entries_for_config_entry(entity_registry, entry_id):
        parsed = parse_station_unique_id(entry_id, reg_entry.unique_id)
        if parsed:
            orphan = parsed[0] not in stations or parsed[1] not in fuels
        else:
            orphan = any(reg_entry.unique_id == f"{entry_id}_{fuel}_best" for fuel in set(FUELS) - fuels)
        if orphan:
            entity_registry.async_remove(reg_entry.entity_id)
    device_registry = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(device_registry, entry_id):
        # A device still holding entities of this entry is left alone: unlinking it would delete them.
        if not _is_followed_device(entry, device) and not any(
            e.config_entry_id == entry_id for e in er.async_entries_for_device(entity_registry, device.id, True)
        ):
            device_registry.async_update_device(device.id, remove_config_entry_id=entry_id)


def _is_followed_device(entry: ConfigEntry, device: dr.DeviceEntry) -> bool:
    """The entry's own device, or the device of a station it follows."""
    wanted = {entry.entry_id} | {
        station_device_id(entry.entry_id, s[ST_ID]) for s in entry.options.get(CONF_STATIONS, [])
    }
    return any(domain == DOMAIN and value in wanted for domain, value in device.identifiers)


async def async_remove_config_entry_device(
    hass: HomeAssistant, entry: CarburantsConfigEntry, device: dr.DeviceEntry
) -> bool:
    """A station device can be deleted from the UI once the station is no longer followed."""
    return not _is_followed_device(entry, device)


def _options_key(options: dict) -> tuple:
    """What needs a reload when it changes: fuels, followed stations, polling interval."""
    return (
        list(options.get(CONF_FUELS, DEFAULT_FUELS)),
        [int(s[ST_ID]) for s in options.get(CONF_STATIONS, [])],
        options.get(CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL),
    )


# Station fields written by the background brand lookup; everything else belongs to the user.
ENRICHED_KEYS = (ST_BRAND, ST_OSM_NAME, "wikidata", ST_LOGO, ST_BRAND_CHECKED, ST_LOGO_VERSION)


def _needs_brand_lookup(station: dict) -> bool:
    """OpenStreetMap was unreachable at setup, or the stored data predates the current lookup."""
    return not station.get(ST_BRAND_CHECKED) or station.get(ST_LOGO_VERSION) != LOGO_VERSION


async def _async_retry_brands(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    """Look up the brands, names and logos OpenStreetMap could not give before; retried at each start."""
    pending = [dict(s) for s in entry.options.get(CONF_STATIONS, []) if _needs_brand_lookup(s)]
    if not await async_enrich(async_get_clientsession(hass), pending, with_logos=True):
        return
    for station in pending:
        station[ST_BRAND_CHECKED] = True
        station[ST_LOGO_VERSION] = LOGO_VERSION
    # The lookup can take a while and a rename does not reload the entry (so does not cancel this
    # task): merge into the current options and only touch the lookup's own fields.
    found = {s[ST_ID]: s for s in pending}
    stations = [
        {**s, **{k: found[s[ST_ID]][k] for k in ENRICHED_KEYS if k in found[s[ST_ID]]}} if s[ST_ID] in found else s
        for s in entry.options.get(CONF_STATIONS, [])
    ]
    hass.config_entries.async_update_entry(entry, options={**entry.options, CONF_STATIONS: stations})


async def async_unload_entry(hass: HomeAssistant, entry: CarburantsConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def _async_reload(hass: HomeAssistant, entry: CarburantsConfigEntry) -> None:
    """Reload when fuels, stations or the interval change; names, brands, logos and the title apply in place.

    The background brand lookup only fills names and logos: it must not reload the entry
    (new API call, every entity recreated).
    """
    coordinator = getattr(entry, "runtime_data", None)
    if coordinator is not None and coordinator.options_key == _options_key(entry.options):
        # Also called when only the entry title changed: the entry device (and the entities
        # named after it) take the new title.
        device_registry = dr.async_get(hass)
        device = device_registry.async_get_device(identifiers={(DOMAIN, entry.entry_id)})
        if device and device.name != entry.title:
            device_registry.async_update_device(device.id, name=entry.title)
        coordinator.async_set_stations(entry.options.get(CONF_STATIONS, []))
        return
    await hass.config_entries.async_reload(entry.entry_id)

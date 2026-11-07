"""Diagnostics for Carburants France."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_API_KEY, CONF_LATITUDE, CONF_LONGITUDE, CONF_PASSWORD, CONF_TOKEN
from homeassistant.core import HomeAssistant

from .const import CONF_QUERY
from .coordinator import CarburantsConfigEntry

# Positions and addresses (with the distances to each station, they would give away the home),
# the search text, and any key or token a future option could hold.
TO_REDACT = {
    CONF_LATITUDE,
    CONF_LONGITUDE,
    "address",
    "distance",
    CONF_QUERY,
    CONF_API_KEY,
    CONF_TOKEN,
    CONF_PASSWORD,
}


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: CarburantsConfigEntry) -> dict[str, Any]:
    """Entry options and the last data of the coordinator, without positions or secrets."""
    coordinator = entry.runtime_data
    return {
        "entry": {
            "title": entry.title,
            "version": entry.version,
            "minor_version": entry.minor_version,
            "data": async_redact_data(dict(entry.data), TO_REDACT),
            "options": async_redact_data(dict(entry.options), TO_REDACT),
        },
        "coordinator": {
            "last_update_success": coordinator.last_update_success,
            "update_interval": str(coordinator.update_interval),
            "fuels": coordinator.fuels,
            "targets": coordinator.targets,
            "community_names": len(coordinator.names),
            "data": async_redact_data({str(k): v for k, v in (coordinator.data or {}).items()}, TO_REDACT),
        },
    }

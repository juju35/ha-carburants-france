"""Device registry calls that work before and after Home Assistant 2026.8.

2026.8 gives a device a single config entry (`DeviceEntry.config_entry_id`) and deprecates
`DeviceEntry.config_entries`, `DeviceRegistry.async_get_device` and the
`add_/remove_config_entry_id` arguments of `async_update_device` (removed from 2027.8). The
minimum version in hacs.json predates the new API, so each helper uses the one the running
version has. Detection looks at the class, never at the deprecated attribute: reading it is
what reports the deprecation.
"""

from __future__ import annotations

from homeassistant.helpers import device_registry as dr


def _single_entry(device: dr.DeviceEntry) -> bool:
    """2026.8+: the device belongs to exactly one config entry."""
    return hasattr(type(device), "config_entry_id")


def device_entry_ids(device: dr.DeviceEntry) -> set[str]:
    """Config entries the device belongs to."""
    if _single_entry(device):
        return {device.config_entry_id}
    return set(device.config_entries)


def get_device(registry: dr.DeviceRegistry, identifier: tuple[str, str], config_entry_id: str) -> dr.DeviceEntry | None:
    """The device with this identifier (2026.8+: the one owned by the config entry)."""
    if hasattr(type(registry), "async_get_device_by_identifier"):
        return registry.async_get_device_by_identifier(identifier, config_entry_id)
    return registry.async_get_device(identifiers={identifier})


def unlink_device(registry: dr.DeviceRegistry, device: dr.DeviceEntry, config_entry_id: str) -> None:
    """Detach the config entry from the device, which is deleted once no entry is left.

    2026.8+ has no shared device: the entry's own device is removed.
    """
    if not _single_entry(device):
        registry.async_update_device(device.id, remove_config_entry_id=config_entry_id)
    elif device.config_entry_id == config_entry_id:
        registry.async_remove_device(device.id)

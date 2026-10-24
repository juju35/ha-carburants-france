"""registry_compat on both device registry APIs, with fakes (the real one depends on the HA version)."""

import pytest

from custom_components.carburants_france.const import DOMAIN
from custom_components.carburants_france.registry_compat import device_entry_ids, get_device, unlink_device


class NewDevice:
    """2026.8+ device: one config entry; reading the deprecated set is an error here.

    Slots like the real attrs class, so config_entry_id is a class attribute too.
    """

    __slots__ = ("config_entry_id", "id")

    def __init__(self, entry_id: str) -> None:
        self.id = "dev"
        self.config_entry_id = entry_id

    @property
    def config_entries(self) -> set[str]:
        raise AssertionError("deprecated DeviceEntry.config_entries read")


class OldDevice:
    """Pre-2026.8 device: a set of config entries, no config_entry_id."""

    def __init__(self, *entry_ids: str) -> None:
        self.id = "dev"
        self.config_entries = set(entry_ids)


class OldRegistry:
    """Pre-2026.8 registry: no async_get_device_by_identifier."""

    def __init__(self) -> None:
        self.calls: list[tuple] = []

    def async_get_device(self, **kwargs):
        self.calls.append(("async_get_device", kwargs))
        return "found"

    def async_update_device(self, device_id, **kwargs):
        self.calls.append(("async_update_device", device_id, kwargs))

    def async_remove_device(self, device_id):
        self.calls.append(("async_remove_device", device_id))


class NewRegistry(OldRegistry):
    """2026.8+ registry: calling the deprecated lookup is an error here."""

    def async_get_device(self, **kwargs):
        raise AssertionError("deprecated DeviceRegistry.async_get_device called")

    def async_get_device_by_identifier(self, identifier, config_entry_id):
        self.calls.append(("async_get_device_by_identifier", identifier, config_entry_id))
        return "found"


def test_new_api_device_entry_ids():
    assert device_entry_ids(NewDevice("a")) == {"a"}


def test_old_api_device_entry_ids():
    assert device_entry_ids(OldDevice("a", "b")) == {"a", "b"}


def test_new_api_get_device():
    registry = NewRegistry()
    assert get_device(registry, (DOMAIN, "x"), "a") == "found"
    assert registry.calls == [("async_get_device_by_identifier", (DOMAIN, "x"), "a")]


def test_old_api_get_device():
    registry = OldRegistry()
    assert get_device(registry, (DOMAIN, "x"), "a") == "found"
    assert registry.calls == [("async_get_device", {"identifiers": {(DOMAIN, "x")}})]


@pytest.mark.parametrize(("entry_id", "calls"), [("a", [("async_remove_device", "dev")]), ("b", [])])
def test_new_api_unlink_removes_own_device(entry_id, calls):
    """2026.8+: no remove_config_entry_id; the entry's own device is removed, another's left alone."""
    registry = NewRegistry()
    unlink_device(registry, NewDevice("a"), entry_id)
    assert registry.calls == calls


def test_old_api_unlink_removes_config_entry():
    registry = OldRegistry()
    unlink_device(registry, OldDevice("a", "b"), "b")
    assert registry.calls == [("async_update_device", "dev", {"remove_config_entry_id": "b"})]

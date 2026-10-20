"""Fixtures for Carburants France tests."""

from unittest.mock import patch

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Load custom_components/ in every test."""
    yield


@pytest.fixture(autouse=True)
def stub_frontend():
    """The real frontend needs the hass_frontend package, which tests don't install."""
    with (
        patch("homeassistant.components.frontend.async_setup", return_value=True),
        patch("custom_components.carburants_france.add_extra_js_url") as add_js,
    ):
        yield add_js


@pytest.fixture(autouse=True)
def community_names(request):
    """The community station names file; empty unless a test fills it."""
    names: dict = {}
    if request.node.get_closest_marker("real_names_download"):
        yield names
        return

    async def download(hass):
        from custom_components.carburants_france.names import _parse

        return _parse(names)

    with patch("custom_components.carburants_france.names._async_download", side_effect=download):
        yield names

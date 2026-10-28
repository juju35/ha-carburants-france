"""Station names from the community file of the hass-prixcarburant project.

The government feed has no station name. Aohzan/hass-prixcarburant keeps
`stations_name.json` ({id: {name, brand}}, ~9,000 stations, Apache-2.0), updated
weekly and corrected by its users through pull requests. It is downloaded at most
once a week and kept in .storage, so a GitHub outage only means the cached copy.
"""

from __future__ import annotations

import logging
import re
from datetime import timedelta
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN, USER_AGENT

_LOGGER = logging.getLogger(__name__)

STATIONS_NAME_URL = (
    "https://raw.githubusercontent.com/Aohzan/hass-prixcarburant/refs/heads/master/"
    "custom_components/prix_carburant/stations_name.json"
)
REFRESH = timedelta(days=7)
# A failed download with nothing cached is retried after this delay, not kept a whole week.
EMPTY_RETRY = timedelta(hours=1)
TIMEOUT = aiohttp.ClientTimeout(total=30)
STORAGE_KEY = f"{DOMAIN}.stations_name"
DATA_NAMES = f"{DOMAIN}_names"

# Words left in lower case when an all-caps name is put in title case, except first.
SMALL_WORDS = {"de", "du", "des", "la", "le", "les", "et", "sur", "sous", "en", "aux", "au", "d", "l"}
# Kept as written: road numbers, "SARL", "ZA"...
UPPER_WORDS = re.compile(r"^(?:[A-Z]{1,3}\d+[A-Z]?|RN|RD|ZA|ZI|ZAC|SA|SAS|SARL|SNC|EURL|BP|E\.?\s?LECLERC)$")


def pretty_name(name: str) -> str:
    """Names in the file are often in capitals: "RELAIS LES TROIS MARCHES" -> "Relais les Trois Marches"."""
    name = " ".join(name.split())
    if not name or not name.isupper():
        return name
    words = []
    for index, word in enumerate(name.split(" ")):
        if UPPER_WORDS.match(word):
            words.append(word)
            continue
        parts = re.split(r"([-'’])", word.lower())
        parts = [
            p if p in "-'’" or (p in SMALL_WORDS and (index or n)) else p[:1].upper() + p[1:]
            for n, p in enumerate(parts)
        ]
        words.append("".join(parts))
    return " ".join(words)


def _parse(data: Any) -> dict[str, dict[str, str]]:
    if not isinstance(data, dict):
        raise ValueError("unexpected format")
    names: dict[str, dict[str, str]] = {}
    for station_id, info in data.items():
        if not isinstance(info, dict):
            continue
        name = str(info.get("name") or "").strip()
        brand = str(info.get("brand") or "").strip()
        if name or brand:
            names[str(station_id)] = {"name": pretty_name(name), "brand": brand}
    return names


async def _async_download(hass: HomeAssistant) -> dict[str, dict[str, str]]:
    session = async_get_clientsession(hass)
    async with session.get(STATIONS_NAME_URL, timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}) as resp:
        if resp.status != 200:
            raise aiohttp.ClientError(f"HTTP {resp.status}")
        return _parse(await resp.json(content_type=None))


async def async_get_names(hass: HomeAssistant) -> dict[str, dict[str, str]]:
    """{station id: {name, brand}}, from memory, .storage or GitHub. Never raises."""
    loaded = hass.data.get(DATA_NAMES)
    if loaded and dt_util.utcnow() - loaded[0] < (REFRESH if loaded[1] else EMPTY_RETRY):
        return loaded[1]
    store: Store[dict[str, Any]] = Store(hass, 1, STORAGE_KEY)
    cached = await store.async_load() or {}
    names: dict[str, dict[str, str]] = cached.get("names") or {}
    fetched = dt_util.parse_datetime(cached.get("fetched") or "")
    if not names or fetched is None or dt_util.utcnow() - fetched > REFRESH:
        try:
            names = await _async_download(hass)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            _LOGGER.warning(
                "Could not download the station names (%s); %s",
                err,
                "using the cached copy" if names else "names will come from OpenStreetMap only",
            )
        else:
            await store.async_save({"fetched": dt_util.utcnow().isoformat(), "names": names})
            _LOGGER.debug("Downloaded %d station names", len(names))
    # Also cached on failure, so a long outage does not mean a download attempt per call
    # (retried after EMPTY_RETRY when the failure left no names at all).
    hass.data[DATA_NAMES] = (dt_util.utcnow(), names)
    return names

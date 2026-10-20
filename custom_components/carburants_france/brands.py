"""Station brand and logo lookup.

The government feed has no brand. OpenStreetMap does: fuel stations carry the
feed's id in `ref:FR:prix-carburants`, plus `brand` and `brand:wikidata`. The
logo is the brand's Wikidata "logo image" (P154), served by Wikimedia Commons.
Everything here is best effort: a failure only means no logo.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import quote

import aiohttp

from .api import distance_km
from .const import COMMONS_FILE_URL, OVERPASS_URL, USER_AGENT, WIKIDATA_URL

_LOGGER = logging.getLogger(__name__)

TIMEOUT = aiohttp.ClientTimeout(total=40)
NEARBY_METERS = 120
HEADERS = {"User-Agent": USER_AGENT}


class BrandLookupError(Exception):
    """OpenStreetMap or Wikidata could not be reached."""


def _overpass_query(stations: list[dict[str, Any]]) -> str:
    parts = "".join(
        f'nwr["amenity"="fuel"](around:{NEARBY_METERS},{s["latitude"]},{s["longitude"]});'
        for s in stations
        if s.get("latitude") is not None
    )
    return f"[out:json][timeout:30];({parts});out tags center;"


def _match(station: dict[str, Any], elements: list[dict[str, Any]]) -> dict[str, Any] | None:
    """The OSM station carrying this feed id, else the nearest branded one."""
    sid = str(station["id"])
    nearest, best = None, None
    for element in elements:
        tags = element.get("tags") or {}
        refs = str(tags.get("ref:FR:prix-carburants", "")).replace(" ", "").split(";")
        if sid in refs:
            return tags
        if not (tags.get("brand") or tags.get("name")):
            continue
        lat = element.get("lat", (element.get("center") or {}).get("lat"))
        lon = element.get("lon", (element.get("center") or {}).get("lon"))
        dist = distance_km(station["latitude"], station["longitude"], lat, lon)
        if dist is not None and (best is None or dist < best):
            nearest, best = tags, dist
    return nearest


async def async_lookup_brands(
    session: aiohttp.ClientSession, stations: list[dict[str, Any]]
) -> dict[int, dict[str, str | None]]:
    """Return {station id: {brand, name, wikidata}} for the stations found in OSM."""
    located = [s for s in stations if s.get("latitude") is not None]
    if not located:
        return {}
    try:
        async with session.post(
            OVERPASS_URL, data={"data": _overpass_query(located)}, timeout=TIMEOUT, headers=HEADERS
        ) as resp:
            if resp.status != 200:
                raise BrandLookupError(f"Overpass HTTP {resp.status}")
            data = await resp.json(content_type=None)
    except (aiohttp.ClientError, TimeoutError, ValueError) as err:
        raise BrandLookupError(f"Cannot reach OpenStreetMap: {err}") from err

    elements = [e for e in (data or {}).get("elements", []) if isinstance(e, dict)]
    result: dict[int, dict[str, str | None]] = {}
    for station in located:
        tags = _match(station, elements)
        if tags:
            result[station["id"]] = {
                "brand": tags.get("brand") or tags.get("name"),
                "name": tags.get("name"),
                "wikidata": tags.get("brand:wikidata"),
            }
    return result


async def async_lookup_logos(session: aiohttp.ClientSession, qids: set[str]) -> dict[str, str]:
    """Return {wikidata id: logo URL} for the brands that have a logo image."""
    qids = {q for q in qids if q and q.startswith("Q")}
    logos: dict[str, str] = {}
    ordered = sorted(qids)
    for start in range(0, len(ordered), 50):
        params = {
            "action": "wbgetentities",
            "ids": "|".join(ordered[start : start + 50]),
            "props": "claims",
            "format": "json",
        }
        try:
            async with session.get(WIKIDATA_URL, params=params, timeout=TIMEOUT, headers=HEADERS) as resp:
                if resp.status != 200:
                    raise BrandLookupError(f"Wikidata HTTP {resp.status}")
                data = await resp.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            raise BrandLookupError(f"Cannot reach Wikidata: {err}") from err
        for qid, entity in ((data or {}).get("entities") or {}).items():
            try:
                filename = entity["claims"]["P154"][0]["mainsnak"]["datavalue"]["value"]
            except (KeyError, IndexError, TypeError):
                continue
            logos[qid] = f"{COMMONS_FILE_URL}{quote(filename.replace(' ', '_'))}?width=96"
    return logos


async def async_enrich(
    session: aiohttp.ClientSession, stations: list[dict[str, Any]], with_logos: bool = True
) -> bool:
    """Add brand, name and logo to the stations in place. Return False if a lookup failed."""
    ok = True
    try:
        brands = await async_lookup_brands(session, stations)
    except BrandLookupError as err:
        _LOGGER.debug("Brand lookup failed: %s", err)
        return False
    logos: dict[str, str] = {}
    if with_logos:
        try:
            logos = await async_lookup_logos(session, {b["wikidata"] for b in brands.values() if b.get("wikidata")})
        except BrandLookupError as err:
            _LOGGER.debug("Logo lookup failed: %s", err)
            ok = False
    for station in stations:
        info = brands.get(station["id"])
        if not info:
            continue
        station["brand"] = info["brand"]
        station["wikidata"] = info.get("wikidata")
        if info.get("wikidata") in logos:
            station["logo"] = logos[info["wikidata"]]
    return ok

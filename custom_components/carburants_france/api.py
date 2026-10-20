"""Client for the "Prix des carburants en France - Flux instantané v2" open data API."""

from __future__ import annotations

import json
import math
import re
from typing import Any

import aiohttp

from .const import (
    API_PAGE_SIZE,
    API_RECORDS,
    FUELS,
    MAX_RESULTS,
    RUPTURE_DEFINITIVE,
    USER_AGENT,
)

TIMEOUT = aiohttp.ClientTimeout(total=30)


class CarburantsError(Exception):
    """The API could not be reached or answered with an error."""


class CarburantsApi:
    """Read stations and prices from data.economie.gouv.fr (no key needed)."""

    def __init__(self, session: aiohttp.ClientSession) -> None:
        self._session = session

    async def _records(self, where: str, order_by: str | None = None, limit: int = API_PAGE_SIZE) -> list[dict[str, Any]]:
        params = {"where": where, "limit": str(limit)}
        if order_by:
            params["order_by"] = order_by
        try:
            async with self._session.get(
                API_RECORDS, params=params, timeout=TIMEOUT, headers={"User-Agent": USER_AGENT}
            ) as resp:
                if resp.status != 200:
                    raise CarburantsError(f"HTTP {resp.status}: {(await resp.text())[:200]}")
                data = await resp.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            raise CarburantsError(f"Cannot reach the fuel prices API: {err}") from err
        results = data.get("results") if isinstance(data, dict) else None
        if not isinstance(results, list):
            raise CarburantsError("Unexpected response from the fuel prices API")
        return [r for r in results if isinstance(r, dict)]

    async def get_stations(self, ids: list[int]) -> dict[int, dict[str, Any]]:
        """Return the given stations, keyed by id. Missing stations are left out."""
        stations: dict[int, dict[str, Any]] = {}
        for start in range(0, len(ids), API_PAGE_SIZE):
            chunk = ids[start : start + API_PAGE_SIZE]
            where = " OR ".join(f"id={int(i)}" for i in chunk)
            for record in await self._records(where, limit=len(chunk)):
                station = parse_station(record)
                if station:
                    stations[station["id"]] = station
        return stations

    async def search(
        self, query: str, latitude: float | None, longitude: float | None, radius_km: float
    ) -> list[dict[str, Any]]:
        """Search stations by postcode, station id, town or around a point.

        An empty query searches around the given point. Results are sorted by
        distance from that point when it is known.
        """
        query = re.sub(r"[\"'\\]", " ", query or "").strip()
        point = None
        if latitude is not None and longitude is not None:
            point = f"geom'POINT({float(longitude)} {float(latitude)})'"

        if not query:
            if point is None:
                return []
            where = f"within_distance(geom, {point}, {float(radius_km)}km)"
        elif re.fullmatch(r"\d{8}", query):
            where = f"id={int(query)}"
        elif re.fullmatch(r"\d{5}", query):
            where = f'cp="{query}"'
        elif re.fullmatch(r"\d{2}|2[AB]", query, re.IGNORECASE):
            where = f'code_departement="{query.upper()}"'
        else:
            where = f'search(ville, "{query}") OR search(adresse, "{query}")'

        records = await self._records(
            where, order_by=f"distance(geom, {point})" if point else None, limit=MAX_RESULTS
        )
        stations = [s for s in (parse_station(r) for r in records) if s]
        if latitude is not None and longitude is not None:
            for station in stations:
                station["distance"] = distance_km(latitude, longitude, station["latitude"], station["longitude"])
        return stations


def distance_km(lat1: float | None, lon1: float | None, lat2: float | None, lon2: float | None) -> float | None:
    """Great-circle distance in km, rounded to 100 m."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(6371 * 2 * math.asin(math.sqrt(a)), 1)


def _coordinates(record: dict[str, Any]) -> tuple[float | None, float | None]:
    geom = record.get("geom")
    if isinstance(geom, dict) and geom.get("lat") is not None:
        return float(geom["lat"]), float(geom["lon"])
    # Fallback: the raw feed stores degrees * 100000 as strings.
    try:
        return float(record["latitude"]) / 100000, float(record["longitude"]) / 100000
    except (KeyError, TypeError, ValueError):
        return None, None


def _parse_hours(raw: Any) -> list[dict[str, Any]]:
    """Turn the "horaires" JSON string into [{day: 1..7, closed, ranges: [[open, close]]}]."""
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            return []
    if not isinstance(raw, dict):
        return []
    days = raw.get("jour") or []
    if isinstance(days, dict):
        days = [days]
    hours = []
    for day in days:
        if not isinstance(day, dict):
            continue
        try:
            number = int(day.get("@id"))
        except (TypeError, ValueError):
            continue
        ranges_raw = day.get("horaire") or []
        if isinstance(ranges_raw, dict):
            ranges_raw = [ranges_raw]
        ranges = [
            [str(r.get("@ouverture", "")).replace(".", ":"), str(r.get("@fermeture", "")).replace(".", ":")]
            for r in ranges_raw
            if isinstance(r, dict) and r.get("@ouverture") and r.get("@fermeture")
        ]
        hours.append({"day": number, "closed": str(day.get("@ferme") or "") == "1", "ranges": ranges})
    return sorted(hours, key=lambda d: d["day"])


def _services(record: dict[str, Any]) -> list[str]:
    services = record.get("services_service")
    if isinstance(services, list):
        return [str(s) for s in services]
    return []


def _raw_time(value: Any) -> str:
    """"2026-10-20 18:05:00" -> ISO. The flat fields show these raw times are UTC."""
    value = str(value or "").strip()
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?", value):
        return ""
    return value.replace(" ", "T") + "+00:00"


def _raw_ruptures(raw: Any) -> dict[str, dict[str, str]]:
    """The "rupture" JSON string, by fuel key: {type, debut, fin}. Keeps ruptures that have ended."""
    if isinstance(raw, str):
        try:
            raw = json.loads(raw)
        except ValueError:
            return {}
    if isinstance(raw, dict):
        raw = [raw]
    if not isinstance(raw, list):
        return {}
    keys = {name.lower(): key for key, name in FUELS.items()}
    ruptures: dict[str, dict[str, str]] = {}
    for item in raw:
        if isinstance(item, dict) and (key := keys.get(str(item.get("@nom", "")).lower())):
            ruptures[key] = {
                "type": str(item.get("@type") or ""),
                "debut": _raw_time(item.get("@debut")),
                "fin": _raw_time(item.get("@fin")),
            }
    return ruptures


def empty_fuel() -> dict[str, Any]:
    """A fuel the station sells but has no price nor shortage for right now."""
    return {"price": None, "updated": None, "available": False, "rupture": None, "rupture_since": None, "rupture_end": None}


def parse_station(record: dict[str, Any]) -> dict[str, Any] | None:
    """Normalise one API record. Prices come from the flat {fuel}_prix fields.

    A fuel with a price is available, one with a shortage is not. A fuel with
    neither, but listed in the raw shortages with an end date, is back from a
    shortage with no price published yet: kept, with no price.
    """
    try:
        station_id = int(record["id"])
    except (KeyError, TypeError, ValueError):
        return None
    latitude, longitude = _coordinates(record)
    raw_ruptures = _raw_ruptures(record.get("rupture"))

    fuels: dict[str, dict[str, Any]] = {}
    for key in FUELS:
        price = record.get(f"{key}_prix")
        rupture = record.get(f"{key}_rupture_type")
        ended = raw_ruptures.get(key, {}).get("fin") or None
        if price is None and not rupture and not ended:
            continue  # Not sold here, as far as this record says.
        fuels[key] = {
            "price": round(float(price), 3) if price is not None else None,
            "updated": record.get(f"{key}_maj"),
            "available": price is not None and not rupture,
            "rupture": rupture or None,
            "rupture_since": record.get(f"{key}_rupture_debut") if rupture else None,
            "rupture_end": ended if price is None and not rupture else None,
        }

    return {
        "id": station_id,
        "address": str(record.get("adresse") or "").strip(),
        "postcode": str(record.get("cp") or ""),
        "city": str(record.get("ville") or "").strip(),
        "latitude": latitude,
        "longitude": longitude,
        "highway": record.get("pop") == "A",
        "automate_24_24": record.get("horaires_automate_24_24") == "Oui",
        "hours": _parse_hours(record.get("horaires")),
        "services": _services(record),
        "fuels": fuels,
    }


def sold_fuels(station: dict[str, Any]) -> list[str]:
    """Fuels still sold: present, and not in definitive shortage."""
    return [k for k, f in station.get("fuels", {}).items() if f.get("rupture") != RUPTURE_DEFINITIVE]

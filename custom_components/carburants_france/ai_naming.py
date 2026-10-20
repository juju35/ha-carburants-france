"""Ask a Home Assistant AI Task entity (Gemini or another) for station names OSM does not have.

Plain text rather than a structured answer: Gemini cannot combine a response
schema with its Google Search tool, and searching is what makes the name reliable.
"""

from __future__ import annotations

import logging
import re
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError

from .coordinator import pretty_city

_LOGGER = logging.getLogger(__name__)

AI_TASK_DOMAIN = "ai_task"
SERVICE_GENERATE_DATA = "generate_data"
UNKNOWN = "INCONNU"
MAX_NAME_LENGTH = 60
# Answers that are a refusal or an explanation, not a name.
NOT_A_NAME = re.compile(
    r"inconnu|unknown|je ne|i don|désolé|sorry|impossible|aucune information|pas d'information|n/a",
    re.IGNORECASE,
)


def ai_available(hass: HomeAssistant, entity_id: str | None) -> bool:
    return bool(entity_id) and hass.services.has_service(AI_TASK_DOMAIN, SERVICE_GENERATE_DATA)


def _instructions(station: dict[str, Any]) -> str:
    place = f"{station.get('address') or ''}, {station.get('postcode') or ''} {pretty_city(station.get('city') or '')}"
    lines = [
        "Trouve le nom de cette station-service française, tel qu'il apparaît sur Google Maps ou sur le site de l'enseigne.",
        f"Adresse : {place.strip(', ')}",
        f"Coordonnées : {station.get('latitude')}, {station.get('longitude')}",
        f"Identifiant prix-carburants.gouv.fr : {station['id']}",
    ]
    if station.get("brand"):
        lines.append(f"Enseigne connue : {station['brand']}")
    lines += [
        "",
        "Réponds uniquement par le nom, sur une seule ligne, sans phrase ni guillemets "
        "(par exemple « Intermarché Vezin-le-Coquet » ou « TotalEnergies Access Rennes Route de Nantes »).",
        f"Si tu n'es pas certain, réponds exactement {UNKNOWN}. N'invente jamais de nom.",
    ]
    return "\n".join(lines)


def clean_answer(answer: Any) -> str | None:
    """The name from the AI's answer, or None when it is unsure or answered with a sentence."""
    if not isinstance(answer, str):
        return None
    lines = [line.strip() for line in answer.strip().splitlines() if line.strip()]
    if len(lines) != 1:
        return None
    name = lines[0].strip(" \"'«»“”*.")
    if not name or len(name) > MAX_NAME_LENGTH or NOT_A_NAME.search(name):
        return None
    return name


async def async_ai_name(hass: HomeAssistant, entity_id: str, station: dict[str, Any]) -> str | None:
    """Ask the AI for one station's name. Raises HomeAssistantError when the AI could not be called."""
    response = await hass.services.async_call(
        AI_TASK_DOMAIN,
        SERVICE_GENERATE_DATA,
        {
            "task_name": f"Nom de la station-service {station['id']}",
            "instructions": _instructions(station),
            "entity_id": entity_id,
        },
        blocking=True,
        return_response=True,
    )
    name = clean_answer((response or {}).get("data"))
    _LOGGER.debug("AI name for station %s: %r", station["id"], name)
    return name


async def async_name_stations(hass: HomeAssistant, entity_id: str, stations: list[dict[str, Any]]) -> bool:
    """Name the stations in place (ai_name). Return False if the AI could not be reached."""
    for station in stations:
        try:
            station["ai_name"] = await async_ai_name(hass, entity_id, station)
        except (HomeAssistantError, ValueError) as err:
            _LOGGER.warning("Could not ask %s for the name of station %s: %s", entity_id, station["id"], err)
            return False
        station["ai_checked"] = True
    return True

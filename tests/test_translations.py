"""Every translation file has exactly the keys and placeholders of the English one."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

TRANSLATIONS = Path(__file__).parent.parent / "custom_components" / "carburants_france" / "translations"
PLACEHOLDER = re.compile(r"\{(\w+)\}")


def _flatten(data: dict, prefix: str = "") -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in data.items():
        path = f"{prefix}{key}"
        if isinstance(value, dict):
            out.update(_flatten(value, f"{path}."))
        else:
            out[path] = value
    return out


def _load(lang: str) -> dict[str, str]:
    return _flatten(json.loads((TRANSLATIONS / f"{lang}.json").read_text(encoding="utf-8")))


def test_languages() -> None:
    """English, French, German, Spanish, Italian, Dutch, Portuguese (pt, and pt-BR as a copy), Polish, Romanian, Danish, Swedish,
    Bulgarian, Russian, Ukrainian, Hungarian, Irish, Slovak, Czech, Slovenian, Maltese, Latvian, Greek and Serbian (both scripts)
    are shipped."""
    assert {p.stem for p in TRANSLATIONS.glob("*.json")} == {
        "en",
        "fr",
        "de",
        "es",
        "it",
        "nl",
        "pt",
        "pt-BR",
        "pl",
        "ro",
        "da",
        "sv",
        "bg",
        "ru",
        "uk",
        "hu",
        "ga",
        "sk",
        "cs",
        "sl",
        "mt",
        "lv",
        "el",
        "sr",
        "sr-Latn",
    }


@pytest.mark.parametrize("lang", sorted(p.stem for p in TRANSLATIONS.glob("*.json") if p.stem != "en"))
def test_parity(lang: str) -> None:
    """Same keys as English, same placeholders in every string, no empty string."""
    en, other = _load("en"), _load(lang)
    assert sorted(other) == sorted(en)
    for key, text in en.items():
        assert other[key].strip(), f"{lang}: {key} is empty"
        assert sorted(PLACEHOLDER.findall(other[key])) == sorted(PLACEHOLDER.findall(text)), f"{lang}: {key}"


# Serbian Cyrillic letter by letter, then its Latin spelling (љ, њ and џ take two letters).
_SERBIAN = "аaбbвvгgдdђđеeжžзzиiјjкkлlљljмmнnњnjоoпpрrсsтtћćуuфfхhцcчčџdžшš"
_TO_LATIN = dict(re.findall(r"([а-џ])([^а-џ]+)", _SERBIAN))
_TO_LATIN |= {c.upper(): lat.capitalize() for c, lat in _TO_LATIN.items()}
# Names left in the Latin script in the Cyrillic file.
_LATIN_NAMES = re.compile(r"Home Assistant|Carburants France|OpenStreetMap|data\.economie\.gouv\.fr|API|ID|\{\w+\}")


def test_serbian_scripts_match() -> None:
    """The Cyrillic and Latin Serbian files say the same thing, letter for letter."""
    cyrillic, latin = _load("sr"), _load("sr-Latn")
    for key, text in cyrillic.items():
        assert "".join(_TO_LATIN.get(ch, ch) for ch in text) == latin[key], key


def test_serbian_cyrillic_has_no_latin_word() -> None:
    """Only names and placeholders stay in the Latin script in the Cyrillic file."""
    for key, text in _load("sr").items():
        assert not re.search(r"[A-Za-z]", _LATIN_NAMES.sub("", text)), key


def test_brazilian_portuguese_is_the_european_text() -> None:
    """pt-BR.json is an exact copy of pt.json: Home Assistant does not fall back from pt-BR to pt by itself."""
    assert (TRANSLATIONS / "pt-BR.json").read_bytes() == (TRANSLATIONS / "pt.json").read_bytes()


@pytest.mark.parametrize("lang", ["bg", "ru", "uk", "el"])
def test_cyrillic_and_greek_have_no_latin_word(lang: str) -> None:
    """Bulgarian, Russian, Ukrainian and Greek keep only names and placeholders in the Latin script."""
    for key, text in _load(lang).items():
        assert not re.search(r"[A-Za-z]", _LATIN_NAMES.sub("", text)), f"{lang}: {key}"

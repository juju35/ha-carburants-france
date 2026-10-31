"""The README screenshots come in strict light/dark twins made by scripts/screenshots.py.

Read from the script's source (no Playwright needed): each light shot `X` has a dark twin `X-dark`
showing exactly the same state, and every README image is one the script produces.
"""

import ast
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ast.parse((ROOT / "scripts/screenshots.py").read_text())
README = (ROOT / "README.md").read_text()


def _shots(name):
    """The shot dicts of the list SHOTS or MAP_SHOTS: {file: (theme, {other key: AST dump})}."""
    node = next(
        n.value
        for n in SCRIPT.body
        if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in n.targets)
    )
    shots = {}
    for item in node.elts:
        fields = {ast.literal_eval(k): v for k, v in zip(item.keys, item.values, strict=True)}
        file = ast.literal_eval(fields.pop("file"))
        theme = ast.literal_eval(fields.pop("theme"))
        shots[file] = (theme, {k: ast.dump(v) for k, v in fields.items()})
    return shots


def _animations():
    """The GIF names of the `for theme, file in (("light", …), ("dark", …))` loops."""
    names = {}
    for node in ast.walk(SCRIPT):
        if isinstance(node, ast.Tuple) and len(node.elts) == 2:
            try:
                theme, file = ast.literal_eval(node)
            except (ValueError, TypeError):
                continue
            if theme in ("light", "dark") and isinstance(file, str):
                names[file] = theme
    return names


def _check_twins(shots):
    for file, (theme, settings) in shots.items():
        if theme == "light":
            assert not file.endswith(("-dark", "-light")), f"{file}: a light shot is named X, its twin X-dark"
            twin = f"{file}-dark"
            assert twin in shots, f"{file}: no dark twin {twin}"
            assert shots[twin][0] == "dark", f"{twin}: not dark"
            assert shots[twin][1] == settings, f"{file} and {twin} show different states"
        else:
            assert theme == "dark", f"{file}: unknown theme {theme}"
            assert file.endswith("-dark"), f"{file}: a dark shot is named X-dark"
            assert shots.get(file.removesuffix("-dark"), ("",))[0] == "light", f"{file}: no light twin"


def test_list_card_shots_are_strict_twins():
    _check_twins(_shots("SHOTS"))


def test_map_card_shots_are_strict_twins():
    _check_twins(_shots("MAP_SHOTS"))


def test_animations_are_twins():
    gifs = _animations()
    for file, theme in gifs.items():
        if theme == "light":
            assert gifs.get(f"{file}-dark") == "dark", f"{file}: no dark twin"
        else:
            assert gifs.get(file.removesuffix("-dark")) == "light", f"{file}: no light twin"


def test_readme_images_are_made_by_the_script():
    made = {f"{f}.png" for f in (*_shots("SHOTS"), *_shots("MAP_SHOTS"))} | {f"{f}.gif" for f in _animations()}
    used = set(re.findall(r"screenshots/([\w.-]+\.(?:png|gif))", README))
    assert used, "no screenshot in the README"
    assert used <= made, f"README images the script does not make: {sorted(used - made)}"
    # Every shot is shown, in both themes.
    assert made <= used, f"screenshots missing from the README: {sorted(made - used)}"


def test_readme_rows_pair_light_with_its_dark_twin():
    rows = re.findall(
        r"^\| !\[[^\]]*\]\(screenshots/([\w.-]+)\) \| !\[[^\]]*\]\(screenshots/([\w.-]+)\) \|$", README, re.MULTILINE
    )
    assert rows
    for light, dark in rows:
        stem, ext = light.rsplit(".", 1)
        assert dark == f"{stem}-dark.{ext}", f"{light} is paired with {dark}"

"""The README screenshots come in strict light/dark twins made by scripts/screenshots.py.

Read from the script's source (no Playwright needed): each light shot `X` has a dark twin `X-dark`
showing exactly the same state, and every README image is one the script produces.
"""

import ast
import re
import shutil
from pathlib import Path

import pytest

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


def _function(name):
    """A top-level function of the script, compiled alone (the script itself needs Playwright)."""
    node = next(n for n in SCRIPT.body if isinstance(n, ast.FunctionDef) and n.name == name)
    namespace = {}
    exec(compile(ast.Module(body=[node], type_ignores=[]), "screenshots.py", "exec"), namespace)  # noqa: S102
    return node, namespace[name]


def test_every_png_shot_is_shrunk_to_a_palette(tmp_path):
    """framed_shot (list and map stills) rewrites each PNG as a 256-colour palette, much smaller, the same each time."""
    framed, _ = _function("framed_shot")
    calls = [n.func.id for n in ast.walk(framed) if isinstance(n, ast.Call) and isinstance(n.func, ast.Name)]
    assert "shrink_png" in calls
    image_module = pytest.importorskip("PIL.Image")
    _, shrink_png = _function("shrink_png")
    # A card-like picture with gradients (many colours), as Chromium saves it.
    source = image_module.new("RGB", (300, 200))
    source.putdata([(x % 256, (x * y) % 256, y % 256) for y in range(200) for x in range(300)])
    first, second = tmp_path / "a.png", tmp_path / "b.png"
    source.save(first)
    source.save(second)
    before = first.stat().st_size
    shrink_png(first)
    shrink_png(second)
    with image_module.open(first) as shrunk:
        assert shrunk.mode == "P"
        assert shrunk.size == (300, 200)
    assert first.stat().st_size < before
    assert first.read_bytes() == second.read_bytes()


def test_same_pixels_compares_every_colour_channel(tmp_path):
    """replace_if_changed keeps a screenshot only when its decoded pixels are the same: two opaque images that
    differ in colour must not count as the same (comparing RGBA with getbbox() only looks at the alpha channel)."""
    image_module = pytest.importorskip("PIL.Image")
    node = next(n for n in SCRIPT.body if isinstance(n, ast.FunctionDef) and n.name == "same_pixels")
    namespace = {"Path": Path}
    exec(compile(ast.Module(body=[node], type_ignores=[]), "screenshots.py", "exec"), namespace)  # noqa: S102
    same_pixels = namespace["same_pixels"]
    white = image_module.new("RGB", (40, 30), (255, 255, 255))
    tinted = white.copy()
    tinted.putpixel((10, 10), (254, 255, 255))
    white.save(tmp_path / "white.png")
    tinted.save(tmp_path / "tinted.png")
    # The same pixels in another encoding (palette PNG): the same image.
    white.quantize(colors=4).save(tmp_path / "white-palette.png")
    assert same_pixels(tmp_path / "white.png", tmp_path / "white-palette.png")
    assert not same_pixels(tmp_path / "white.png", tmp_path / "tinted.png")
    assert not same_pixels(tmp_path / "white.png", tmp_path / "missing.png")
    # GIF: one frame of colour changed among two.
    black = image_module.new("RGB", (40, 30), (0, 0, 0))
    white.save(tmp_path / "a.gif", save_all=True, append_images=[black])
    white.save(tmp_path / "b.gif", save_all=True, append_images=[black])
    white.save(tmp_path / "c.gif", save_all=True, append_images=[image_module.new("RGB", (40, 30), (0, 0, 128))])
    assert same_pixels(tmp_path / "a.gif", tmp_path / "b.gif")
    assert not same_pixels(tmp_path / "a.gif", tmp_path / "c.gif")


def _script_functions(*names):
    """Some top-level definitions of scripts/screenshots.py, run on their own (no Playwright import needed)."""
    nodes = [
        n
        for n in SCRIPT.body
        if (isinstance(n, ast.FunctionDef) and n.name in names)
        or (isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id in names for t in n.targets))
    ]
    import subprocess  # noqa: PLC0415

    namespace = {"Path": Path, "subprocess": subprocess}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), "screenshots.py", "exec"), namespace)  # noqa: S102
    return namespace


def test_gif_frames_step_every_animation_of_the_shadow_roots():
    """The spinner and the pulse run in the cards' shadow roots, which document.getAnimations() does not see: left
    running, each render caught them at another point and the GIFs changed on every CI run. The stepping must
    freeze them (two screenshots at the same t are the same pixels) and fail loudly when nothing is animated."""
    sync_api = pytest.importorskip("playwright.sync_api")
    step_animations = _script_functions("STEP_ANIMATIONS", "step_animations")["step_animations"]
    html = """<!doctype html><style>body{margin:0}</style><div id="host"></div><script>
      const root = document.getElementById("host").attachShadow({mode: "open"});
      root.innerHTML = `<style>@keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 50% { opacity: .3; } }
        .s { width: 60px; height: 20px; background: #c00; animation: spin 1s linear infinite; }
        .p { width: 60px; height: 20px; background: #00c; animation: pulse 1s ease-in-out infinite; }
        .t { width: 60px; height: 20px; background: #0c0; transition: opacity 5s; }</style>
        <div class="s"></div><div class="p"></div><div class="t"></div>`;
      </script>"""
    with sync_api.sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception as err:  # noqa: BLE001
            pytest.skip(f"no Chromium: {err}")
        page = browser.new_page(viewport={"width": 100, "height": 80})
        page.set_content(html)
        page.evaluate("""() => { const t = document.getElementById("host").shadowRoot.querySelector(".t");
                                 t.getBoundingClientRect(); t.style.opacity = "0.2"; }""")
        clip = {"x": 0, "y": 0, "width": 100, "height": 80}
        assert step_animations(page, 250) == 2
        first = page.screenshot(clip=clip)
        page.wait_for_timeout(400)
        assert step_animations(page, 250) == 2
        again = page.screenshot(clip=clip)
        states = page.evaluate(
            """() => document.getElementById("host").shadowRoot.getAnimations().map((a) => a.playState)"""
        )
        page.set_content("<p>still</p>")
        assert step_animations(page, 0) == 0
        browser.close()
    assert states == ["paused", "paused"]  # the transition was finished (and dropped), the loops paused
    assert first == again


def test_gif_encoding_is_deterministic(tmp_path):
    """The same frames always give the same GIF file: palette computed from the frames, ordered (Bayer) dithering,
    one thread (no error diffusion, no random dithering, no timestamps)."""
    image_module = pytest.importorskip("PIL.Image")
    if not shutil.which("ffmpeg"):
        pytest.skip("no ffmpeg")
    encode_gif = _script_functions("encode_gif")["encode_gif"]
    for i in range(4):
        frame = image_module.radial_gradient("L").resize((80, 60)).convert("RGB")
        frame.putpixel((i, i), (255, 0, 0))
        frame.save(tmp_path / f"f{i:03d}.png")
    encode_gif(tmp_path, 20, 80, tmp_path / "a.gif")
    encode_gif(tmp_path, 20, 80, tmp_path / "b.gif")
    assert (tmp_path / "a.gif").read_bytes() == (tmp_path / "b.gif").read_bytes()
    source = ast.unparse(next(n for n in SCRIPT.body if isinstance(n, ast.FunctionDef) and n.name == "encode_gif"))
    assert "dither=bayer" in source
    assert not re.search(r"dither=(sierra|floyd|heckbert)", source)

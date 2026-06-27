from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)


def sheet(cols, rows, cell):
    image = Image.new("RGBA", (cols * cell, rows * cell), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def rect(draw, x, y, w, h, fill):
    draw.rectangle((x, y, x + w - 1, y + h - 1), fill=fill)


def line(draw, points, fill, width=1):
    draw.line(points, fill=fill, width=width)


def poly(draw, points, fill, outline=None):
    draw.polygon(points, fill=fill, outline=outline)


def save_tiles():
    image, draw = sheet(10, 1, 32)
    palette = {
        "dark": "#11151a",
        "ground": "#b97943",
        "ground2": "#d19255",
        "edge": "#07090c",
        "steel": "#414a51",
        "steel2": "#6c747a",
        "rust": "#7b5237",
        "sand": "#8b7856",
        "green": "#37c08d",
        "cyan": "#79e3ff",
        "yellow": "#e8c14a",
    }

    def base(ox, fill):
        rect(draw, ox, 0, 32, 32, fill)
        rect(draw, ox, 31, 32, 1, "#5d3825")
        rect(draw, ox + 31, 0, 1, 32, "#5d3825")

    # Desert ground
    ox = 0
    base(ox, "#c8844c")
    for px, py, color in [(5, 7, "#e0a766"), (18, 4, "#935a36"), (24, 21, "#7c482d"), (10, 25, "#e2ac6b"), (3, 19, "#a7673c")]:
        rect(draw, ox + px, py, 4, 2, color)
    line(draw, [(ox + 2, 3), (ox + 11, 2), (ox + 19, 7), (ox + 31, 6)], "#dca161", 1)

    # Canyon cliff wall
    ox = 32
    base(ox, "#6f4328")
    rect(draw, ox, 0, 32, 5, "#e0a15d")
    for x in [2, 7, 12, 18, 24, 28]:
        poly(draw, [(ox + x, 4), (ox + x + 5, 9), (ox + x + 2, 31), (ox + x - 3, 31)], "#9b6035", "#4d2d1d")
    rect(draw, ox, 29, 32, 3, "#3a2117")

    # Rock and cactus patch
    ox = 64
    base(ox, "#c8844c")
    poly(draw, [(ox + 5, 23), (ox + 14, 9), (ox + 25, 24)], "#e0b06d", "#6a3e25")
    rect(draw, ox + 20, 17, 6, 5, "#9e6138")
    rect(draw, ox + 4, 10, 5, 12, "#3fbf68")
    rect(draw, ox + 3, 8, 7, 4, "#65d685")
    rect(draw, ox + 5, 20, 3, 4, "#287a45")

    # Lab base pad
    ox = 96
    base(ox, "#8f9fc7")
    rect(draw, ox + 2, 2, 28, 28, "#b8c7e8")
    rect(draw, ox + 7, 5, 18, 22, "#55dfff")
    line(draw, [(ox + 11, 25), (ox + 23, 7)], "#eaffff", 2)
    rect(draw, ox + 6, 27, 20, 3, "#313846")

    # Repair terminal
    ox = 128
    base(ox, "#9ba9cf")
    rect(draw, ox + 4, 5, 24, 22, "#edf7ff")
    rect(draw, ox + 8, 8, 16, 5, "#54dcff")
    rect(draw, ox + 9, 17, 4, 5, "#ff7548")
    rect(draw, ox + 15, 17, 4, 5, "#f0c84b")
    rect(draw, ox + 21, 17, 4, 5, "#42d6a4")

    # Lab floor
    ox = 160
    base(ox, "#8996bf")
    rect(draw, ox + 1, 1, 30, 30, "#96a4cc")
    line(draw, [(ox, 16), (ox + 32, 16)], "#6e7aa4", 1)
    line(draw, [(ox + 16, 0), (ox + 16, 32)], "#6e7aa4", 1)
    rect(draw, ox + 12, 12, 8, 8, "#76edff")
    rect(draw, ox + 14, 14, 4, 4, "#eaffff")

    # Supply crate
    ox = 192
    base(ox, "#1a2329")
    rect(draw, ox + 6, 10, 20, 14, "#8d5c34")
    rect(draw, ox + 8, 8, 16, 4, "#c7904e")
    line(draw, [(ox + 16, 8), (ox + 16, 24)], "#4c2f1d", 2)
    line(draw, [(ox + 7, 16), (ox + 25, 16)], "#4c2f1d", 2)

    # Lab gate
    ox = 224
    base(ox, "#101318")
    rect(draw, ox + 3, 5, 26, 23, "#3b4650")
    rect(draw, ox + 7, 10, 18, 18, "#07090c")
    rect(draw, ox + 9, 7, 14, 3, palette["cyan"])
    rect(draw, ox + 13, 13, 6, 15, "#162431")

    # Lab window/water
    ox = 256
    base(ox, "#101719")
    rect(draw, ox + 4, 9, 24, 12, "#0b2629")
    rect(draw, ox + 7, 11, 7, 2, "#1d6a6e")
    rect(draw, ox + 18, 17, 6, 2, "#174e55")

    # Canyon edge transition
    ox = 288
    base(ox, "#c8844c")
    rect(draw, ox, 18, 32, 14, "#6f4328")
    for x in [1, 6, 12, 18, 24]:
        poly(draw, [(ox + x, 18), (ox + x + 6, 23), (ox + x + 3, 32)], "#9b6035", "#4d2d1d")

    image.save(ASSETS / "tiles.png")


def draw_map_mech(draw, ox, primary, accent, heavy=False):
    outline = "#06080a"
    rect(draw, ox + 10, 3, 12, 6, outline)
    rect(draw, ox + 11, 4, 10, 4, primary)
    rect(draw, ox + 8, 10, 16, 13, outline)
    rect(draw, ox + 10, 11, 12, 11, primary)
    rect(draw, ox + 3, 12, 8, 11, outline)
    rect(draw, ox + 21, 12, 8, 11, outline)
    rect(draw, ox + 5, 13, 5, 9, primary)
    rect(draw, ox + 22, 13, 5, 9, primary)
    rect(draw, ox + 9, 23, 5, 7, outline)
    rect(draw, ox + 18, 23, 5, 7, outline)
    rect(draw, ox + 10, 23, 4, 6, accent)
    rect(draw, ox + 18, 23, 4, 6, accent)
    if heavy:
        rect(draw, ox + 6, 9, 20, 4, accent)
    rect(draw, ox + 13, 6, 6, 2, "#d8fff4")


def save_map_mechs():
    image, draw = sheet(6, 1, 32)
    specs = [
        ("#2fe0a1", "#60a8ff", False),
        ("#ff6545", "#ffd35e", False),
        ("#e5bd42", "#7bd389", True),
        ("#61a5ff", "#fff08f", False),
        ("#ad70ff", "#ff624e", True),
        ("#d8dce2", "#9ee9ff", False),
    ]
    for index, spec in enumerate(specs):
        draw_map_mech(draw, index * 32, *spec)
    image.save(ASSETS / "map-mechs.png")


def save_characters():
    image, draw = sheet(5, 1, 32)

    def character(ox, suit, hair, visor, skin="#d9a06f"):
        rect(draw, ox + 10, 4, 12, 5, "#05070a")
        rect(draw, ox + 11, 4, 10, 5, hair)
        rect(draw, ox + 8, 9, 16, 10, "#05070a")
        rect(draw, ox + 10, 10, 12, 8, skin)
        rect(draw, ox + 12, 12, 8, 3, visor)
        rect(draw, ox + 7, 19, 18, 10, "#05070a")
        rect(draw, ox + 9, 20, 14, 8, suit)
        rect(draw, ox + 4, 21, 5, 8, "#26313a")
        rect(draw, ox + 23, 21, 5, 8, "#26313a")
        rect(draw, ox + 10, 28, 5, 4, "#101820")
        rect(draw, ox + 17, 28, 5, 4, "#101820")
        rect(draw, ox + 10, 24, 12, 2, "#e6edf1")

    specs = [
        ("#2fba8f", "#1b2730", "#d8fff4"),
        ("#56616b", "#d5d7da", "#f0c84b", "#bf8c62"),
        ("#bd8b45", "#2a2220", "#42d6a4"),
        ("#7a4bb3", "#141016", "#ff6e4a", "#c88a72"),
        ("#415a77", "#2d2018", "#68a7ff"),
    ]
    for index, spec in enumerate(specs):
        character(index * 32, *spec)
    image.save(ASSETS / "characters.png")


def save_portraits():
    image, draw = sheet(5, 1, 64)

    def portrait(ox, suit, hair, visor, skin="#d9a06f"):
        rect(draw, ox + 4, 4, 56, 56, "#05070a")
        rect(draw, ox + 7, 7, 50, 50, "#18212a")
        rect(draw, ox + 10, 48, 44, 10, suit)
        poly(draw, [(ox + 18, 16), (ox + 46, 16), (ox + 50, 31), (ox + 43, 45), (ox + 21, 45), (ox + 14, 31)], "#05070a")
        rect(draw, ox + 20, 14, 24, 14, hair)
        rect(draw, ox + 17, 26, 30, 20, skin)
        rect(draw, ox + 21, 31, 22, 5, visor)
        rect(draw, ox + 24, 40, 16, 2, "#7e4f3b")
        rect(draw, ox + 13, 10, 38, 3, suit)
        rect(draw, ox + 14, 52, 36, 3, "#e6edf1")
        rect(draw, ox + 8, 8, 48, 2, "#5c6b75")

    specs = [
        ("#2fba8f", "#1b2730", "#d8fff4"),
        ("#56616b", "#d5d7da", "#f0c84b", "#bf8c62"),
        ("#bd8b45", "#2a2220", "#42d6a4"),
        ("#7a4bb3", "#141016", "#ff6e4a", "#c88a72"),
        ("#415a77", "#2d2018", "#68a7ff"),
    ]
    for index, spec in enumerate(specs):
        portrait(index * 64, *spec)
    image.save(ASSETS / "portraits.png")


def save_effects():
    image, draw = sheet(8, 1, 64)

    def fx(i, kind):
        ox = i * 64
        if kind == "muzzle":
            poly(draw, [(ox + 3, 30), (ox + 46, 24), (ox + 58, 32), (ox + 46, 40)], "#ffef98")
            rect(draw, ox + 37, 24, 14, 16, "#ff6e4a")
            rect(draw, ox + 52, 29, 8, 6, "#ffffff")
        elif kind == "slash":
            for n in range(7):
                line(draw, [(ox + 8 + n * 5, 49 - n * 5), (ox + 27 + n * 5, 37 - n * 5)], "#aefcff", 3)
            line(draw, [(ox + 16, 48), (ox + 50, 17)], "#ffffff", 2)
        elif kind == "missile":
            rect(draw, ox + 9, 29, 34, 7, "#c7d0d8")
            poly(draw, [(ox + 43, 25), (ox + 59, 32), (ox + 43, 39)], "#ff6e4a")
            poly(draw, [(ox + 3, 32), (ox + 12, 24), (ox + 12, 40)], "#f0c84b")
        elif kind == "explosion":
            poly(draw, [(ox + 32, 6), (ox + 42, 24), (ox + 60, 18), (ox + 48, 34), (ox + 59, 52), (ox + 37, 44), (ox + 25, 60), (ox + 23, 40), (ox + 5, 48), (ox + 17, 31), (ox + 8, 13), (ox + 28, 21)], "#ff6e4a")
            poly(draw, [(ox + 32, 18), (ox + 42, 30), (ox + 36, 46), (ox + 24, 39), (ox + 18, 28)], "#f0c84b")
            rect(draw, ox + 28, 27, 9, 9, "#ffffff")
        elif kind == "shield":
            line(draw, [(ox + 32, 6), (ox + 52, 18), (ox + 48, 48), (ox + 32, 58), (ox + 16, 48), (ox + 12, 18), (ox + 32, 6)], "#68a7ff", 4)
            rect(draw, ox + 22, 22, 20, 22, "#42d6a4")
        elif kind == "repair":
            rect(draw, ox + 29, 10, 6, 44, "#42d6a4")
            rect(draw, ox + 10, 29, 44, 6, "#42d6a4")
            rect(draw, ox + 23, 23, 18, 18, "#d8fff4")
        elif kind == "rail":
            line(draw, [(ox + 4, 32), (ox + 60, 32)], "#ffffff", 3)
            line(draw, [(ox + 9, 26), (ox + 55, 38)], "#68a7ff", 2)
            line(draw, [(ox + 12, 39), (ox + 52, 23)], "#aefcff", 2)
        elif kind == "hit":
            poly(draw, [(ox + 31, 11), (ox + 38, 27), (ox + 55, 23), (ox + 42, 35), (ox + 50, 52), (ox + 32, 42), (ox + 16, 53), (ox + 22, 35), (ox + 9, 24), (ox + 26, 27)], "#ffffff")
            rect(draw, ox + 18, 30, 28, 5, "#ff6e4a")

    for index, kind in enumerate(["muzzle", "slash", "missile", "explosion", "shield", "repair", "rail", "hit"]):
        fx(index, kind)
    image.save(ASSETS / "effects.png")


def save_battle_background():
    image = Image.new("RGBA", (640, 284), "#0d1018")
    draw = ImageDraw.Draw(image)

    # Dark checker/grid void like old emulator screenshots.
    for y in range(0, 284, 32):
        for x in range(0, 640, 32):
            fill = "#151922" if (x // 32 + y // 32) % 2 else "#0f131a"
            rect(draw, x, y, 32, 32, fill)
    for x in range(-120, 720, 80):
        line(draw, [(x, 0), (x + 220, 284)], "#252b3a", 1)
        line(draw, [(x + 220, 0), (x, 284)], "#202637", 1)

    # Far canyon layer.
    poly(draw, [(0, 122), (80, 98), (160, 132), (250, 103), (360, 126), (460, 96), (570, 123), (640, 108), (640, 284), (0, 284)], "#5c3928", "#2c1710")
    rect(draw, 0, 130, 640, 20, "#8b5936")
    for x in range(0, 640, 28):
        poly(draw, [(x, 130), (x + 16, 150), (x + 6, 150)], "#c0834c", "#4d2b1d")

    # Main platform.
    rect(draw, 0, 196, 640, 18, "#a7693f")
    rect(draw, 0, 214, 640, 70, "#5b3826")
    for x in range(-8, 640, 26):
        poly(draw, [(x, 196), (x + 18, 214), (x + 8, 284), (x - 8, 284)], "#75482d", "#311a12")
    line(draw, [(0, 195), (640, 195)], "#e0a15d", 3)
    line(draw, [(0, 213), (640, 213)], "#2d1710", 2)

    # Small foreground rocks.
    for x, y, w in [(68, 225, 34), (250, 231, 26), (510, 224, 42), (590, 239, 22)]:
        poly(draw, [(x, y + 16), (x + w // 2, y), (x + w, y + 18)], "#8b5734", "#2c1710")

    image.save(ASSETS / "battle-bg.png")


def save_ui_icons():
    image, draw = sheet(8, 1, 24)
    colors = ["#ffef98", "#aefcff", "#f0c84b", "#68a7ff", "#42d6a4", "#ff6e4a", "#b983ff", "#d6dbe0"]
    for i, color in enumerate(colors):
        ox = i * 24
        rect(draw, ox + 2, 2, 20, 20, "#05070a")
        rect(draw, ox + 4, 4, 16, 16, "#25303a")
        rect(draw, ox + 7, 7, 10, 10, color)
        if i == 0:
            rect(draw, ox + 14, 10, 8, 3, color)
        elif i == 1:
            line(draw, [(ox + 6, 18), (ox + 19, 5)], "#ffffff", 2)
        elif i == 2:
            rect(draw, ox + 4, 10, 16, 4, "#ffffff")
        elif i == 3:
            line(draw, [(ox + 12, 3), (ox + 20, 12), (ox + 12, 21), (ox + 4, 12), (ox + 12, 3)], "#d8fff4", 2)
        elif i == 4:
            rect(draw, ox + 11, 4, 2, 16, "#ffffff")
            rect(draw, ox + 4, 11, 16, 2, "#ffffff")
    image.save(ASSETS / "ui-icons.png")


def save_readme():
    text = """# Demo Asset Pack

Retro Java-phone inspired pixel assets for the small mecha RPG demo. These are original local sprites, generated to match the era's low-resolution style rather than copying any source art.

- `tiles.png`: 10 tiles at 32x32. Ground, wall, rubble, base, repair, road, crate, gate, oil, warning floor.
- `map-mechs.png`: 6 map mech pieces at 32x32.
- `characters.png`: 5 map characters at 32x32.
- `portraits.png`: 5 comms portraits at 64x64.
- `effects.png`: 8 attack/support effects at 64x64.
- `ui-icons.png`: 8 icons at 24x24.
- `battle-bg.png`: 640x284 side-view canyon battle background.

Run `python scripts/generate_demo_assets.py` to regenerate the whole pack.
"""
    (ASSETS / "README.md").write_text(text, encoding="utf-8")


def main():
    save_tiles()
    save_map_mechs()
    save_characters()
    save_portraits()
    save_effects()
    save_battle_background()
    save_ui_icons()
    save_readme()
    print("Generated retro Java-phone inspired demo asset pack in assets/")


if __name__ == "__main__":
    main()

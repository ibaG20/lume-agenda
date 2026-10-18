"""Rasterize the Lume mark into PWA PNG icons. Run with Pillow installed."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TEAL = (10, 85, 88, 255)
MINT = (243, 255, 254, 255)
SAND = (215, 196, 163, 255)
PAPER = (243, 247, 247, 255)


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def stroke_arc(
    draw: ImageDraw.ImageDraw,
    box: tuple[int, int, int, int],
    start: float,
    end: float,
    color: tuple[int, int, int, int],
    width: int,
) -> None:
    draw.arc(box, start=start, end=end, fill=color, width=width)


def render(size: int, maskable: bool) -> Image.Image:
    image = Image.new("RGBA", (size, size), PAPER if maskable else (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    inset = int(size * (0.12 if maskable else 0))
    radius = int((size - inset * 2) * 0.25)
    draw.rounded_rectangle(
        (inset, inset, size - 1 - inset, size - 1 - inset),
        radius=radius,
        fill=TEAL,
    )
    pad = int(size * (0.28 if maskable else 0.22))
    box = (pad, pad, size - pad, size - pad)
    width = max(4, size // 14)
    stroke_arc(draw, box, start=200, end=20, color=MINT, width=width)
    stroke_arc(draw, box, start=20, end=200, color=SAND, width=width)
    if not maskable:
        image.putalpha(rounded_mask(size, radius))
    return image


def main() -> None:
    icons = ROOT / "public" / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    render(192, False).save(icons / "icon-192.png")
    render(512, False).save(icons / "icon-512.png")
    render(512, True).save(icons / "icon-maskable-512.png")
    render(180, False).save(ROOT / "app" / "apple-icon.png")


if __name__ == "__main__":
    main()

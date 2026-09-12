from pathlib import Path
from PIL import Image, ImageDraw

out = Path(__file__).resolve().parents[1] / "client/public/icons"
out.mkdir(parents=True, exist_ok=True)
for size in (192, 512):
    image = Image.new("RGBA", (size, size), (47, 111, 104, 255))
    draw = ImageDraw.Draw(image)
    radius = size // 4
    pad = size * 0.22
    roof = [(size * 0.16, size * 0.5), (size * 0.5, size * 0.22), (size * 0.84, size * 0.5)]
    draw.polygon(roof, fill=(247, 245, 239, 255))
    draw.rounded_rectangle((pad, size * 0.45, size - pad, size * 0.84), radius=radius // 3, fill=(247, 245, 239, 255))
    door = (size * 0.4, size * 0.62, size * 0.6, size * 0.84)
    draw.rectangle(door, fill=(229, 185, 93, 255))
    image.save(out / f"home-icon-{size}.png", optimize=True)
